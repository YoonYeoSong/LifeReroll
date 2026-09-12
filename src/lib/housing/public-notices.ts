import type { HousingNotice } from "./types";

const LH_NOTICE_ENDPOINT = "https://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1";
const NOTICE_PAGE_SIZE = 20;
const SALE_HOUSING_TYPE_CODE = "05";
const regionCodes: Record<string, string> = {
  "서울특별시": "11", "부산광역시": "26", "대구광역시": "27", "인천광역시": "28", "광주광역시": "29", "대전광역시": "30", "울산광역시": "31", "세종특별자치시": "36",
  "경기도": "41", "강원특별자치도": "42", "충청북도": "43", "충청남도": "44", "전북특별자치도": "45", "전라남도": "46", "경상북도": "47", "경상남도": "48", "제주특별자치도": "50",
};

export type NoticeFeedMode = "live" | "fixture" | "fallback";
export type NoticeFeedStatus = "live" | "missing_key" | "upstream_error" | "empty";

export interface PublicNoticeFeed {
  mode: NoticeFeedMode;
  status: NoticeFeedStatus;
  notices: HousingNotice[];
  updatedAt: string;
  message?: string;
}

export interface PublicNoticeFeedInput {
  region?: string;
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function firstString(item: UnknownRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = asString(item[key]);
    if (value) return value;
  }
}

function toIsoDate(value: string | undefined): string {
  if (!value) return "";
  const compact = value.replace(/[^0-9]/g, "");
  if (/^\d{8}$/.test(compact)) {
    return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
  }
  return value;
}

function findItems(value: unknown): UnknownRecord[] {
  if (Array.isArray(value)) return value.flatMap(findItems);
  const record = asRecord(value);
  if (!record) return [];

  const ownItem = firstString(record, ["PAN_ID", "panId", "noticeId", "id"]);
  if (ownItem) return [record];

  return Object.values(record).flatMap(findItems);
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function numberFromText(value: string): number {
  const normalized = value.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return normalized ? Number(normalized[0]) : 0;
}

function htmlText(value: string): string {
  return decodeXml(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function buildLhDetailPageUrl(noticeId: string, supplyTypeCode = SALE_HOUSING_TYPE_CODE, customerSystemCode = "02", upperSupplyTypeCode = SALE_HOUSING_TYPE_CODE): string {
  const url = new URL("https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancInfo.do");
  url.searchParams.set("aisTpCd", supplyTypeCode);
  url.searchParams.set("ccrCnntSysDsCd", customerSystemCode);
  url.searchParams.set("mi", "1027");
  url.searchParams.set("panId", noticeId);
  url.searchParams.set("uppAisTpCd", upperSupplyTypeCode);
  return url.toString();
}

export function parseLhSaleHousingTypes(html: string): HousingNotice["housingTypes"] {
  const headingIndex = html.indexOf("주택형 안내");
  if (headingIndex < 0) return [];
  const section = html.slice(headingIndex, headingIndex + 120_000);
  const table = section.match(/<table\b[\s\S]*?<\/table>/i)?.[0];
  if (!table) return [];

  return [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].flatMap((row) => {
    const cells = [...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => htmlText(cell[1]));
    if (cells.length < 5 || cells[0].includes("주택형")) return [];
    const exclusiveArea = numberFromText(cells[1]);
    const supplyCount = Math.round(numberFromText(cells[3]));
    const price = Math.round(numberFromText(cells[4]));
    if (!cells[0] || !exclusiveArea || !price) return [];
    return [{ typeName: cells[0], exclusiveArea, supplyCount, price, estimatedTotalCost: Math.round(price * 1.04 / 10_000) * 10_000, specialSupplyCount: 0, generalSupplyCount: supplyCount }];
  });
}

function itemsFromXml(xml: string): UnknownRecord[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => {
    const item: UnknownRecord = {};
    for (const field of match[1].matchAll(/<([A-Za-z0-9_]+)>([\s\S]*?)<\/\1>/g)) {
      item[field[1]] = decodeXml(field[2].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim());
    }
    return item;
  });
}

function mapLhItem(item: UnknownRecord): HousingNotice | undefined {
  const noticeId = firstString(item, ["PAN_ID", "panId", "noticeId", "id"]);
  const title = firstString(item, ["PAN_NM", "panNm", "noticeName", "title"]);
  if (!noticeId || !title) return undefined;

  const region = firstString(item, ["CNP_CD_NM", "cnpCdNm", "regionName"]) ?? "지역 확인 필요";
  const noticeDate = toIsoDate(firstString(item, ["PAN_DT", "panDt", "noticeDate"]));
  const applicationStartDate = toIsoDate(firstString(item, ["PAN_NT_ST_DT", "panNtStDt", "applicationStartDate"]));
  const applicationEndDate = toIsoDate(firstString(item, ["PAN_NT_ET_DT", "panNtEtDt", "applicationEndDate", "CLSG_DT", "clsgDt"]));
  const detailUrl = firstString(item, ["DTL_URL", "dtlUrl", "detailUrl"]);
  const supplyTypeCode = firstString(item, ["AIS_TP_CD", "aisTpCd", "supplyTypeCode"]) ?? SALE_HOUSING_TYPE_CODE;
  const customerSystemCode = firstString(item, ["CCR_CNNT_SYS_DS_CD", "ccrCnntSysDsCd", "customerSystemCode"]) ?? "02";
  const upperSupplyTypeCode = firstString(item, ["UPP_AIS_TP_CD", "uppAisTpCd", "upperSupplyTypeCode"]) ?? SALE_HOUSING_TYPE_CODE;

  return {
    noticeId: `lh-${noticeId}`,
    title,
    provider: "한국토지주택공사 (LH)",
    region,
    city: "",
    district: "",
    noticeDate,
    applicationStartDate,
    applicationEndDate,
    housingCategory: firstString(item, ["AIS_TP_CD_NM", "aisTpCdNm", "housingCategory"]) ?? "유형 확인 필요",
    supplyType: "공식 공고문 확인 필요",
    newHomeType: "공식 공고문 확인 필요",
    residencyRequirements: { regions: [], minMonths: undefined },
    subscriptionRequirements: { minimumMonths: 0, minimumPayments: 0, acceptedAccountTypes: [] },
    specialSupplyTypes: [],
    sourceUrl: detailUrl ?? buildLhDetailPageUrl(noticeId, supplyTypeCode, customerSystemCode, upperSupplyTypeCode),
    sourceName: "LH 분양임대공고문 조회 서비스",
    sourceDate: noticeDate || new Date().toISOString().slice(0, 10),
    housingTypes: [],
  };
}

async function enrichLhSaleNotice(notice: HousingNotice): Promise<HousingNotice> {
  if (!notice.sourceUrl.includes("apply.lh.or.kr")) return notice;
  try {
    const response = await fetch(notice.sourceUrl, { headers: { Accept: "text/html" }, next: { revalidate: 60 * 60 } });
    if (!response.ok) return notice;
    const housingTypes = parseLhSaleHousingTypes(await response.text());
    return housingTypes.length ? { ...notice, housingTypes } : notice;
  } catch {
    return notice;
  }
}

export function parseLhNoticeResponse(body: string, contentType = ""): HousingNotice[] {
  const rawItems = contentType.includes("json")
    ? findItems(JSON.parse(body))
    : itemsFromXml(body);
  return rawItems.map(mapLhItem).filter((notice): notice is HousingNotice => Boolean(notice));
}

function fixtureFeed(mode: Extract<NoticeFeedMode, "fixture" | "fallback">): PublicNoticeFeed {
  return {
    mode,
    status: mode === "fixture" ? "missing_key" : "upstream_error",
    // Do not substitute sample listings for unavailable official data. A blank
    // response makes the source state clear and prevents stale examples from
    // looking like applications users can make.
    notices: [],
    updatedAt: new Date().toISOString(),
    message: mode === "fixture" ? "LH API 키가 배포 환경에 설정되지 않았습니다." : "LH 공고 서비스를 지금 불러오지 못했습니다.",
  };
}

export function buildLhNoticeUrl(serviceKey: string, input: PublicNoticeFeedInput = {}): URL {
  const url = new URL(process.env.LH_HOUSING_NOTICES_URL ?? LH_NOTICE_ENDPOINT);
  // data.go.kr shows both encoded and decoded keys. Normalize either form before URLSearchParams encodes it.
  let decodedServiceKey = serviceKey;
  try {
    decodedServiceKey = decodeURIComponent(serviceKey);
  } catch {
    // Keep the original value; the provider will return a safe fixture fallback if it is invalid.
  }
  url.searchParams.set("serviceKey", decodedServiceKey);
  url.searchParams.set("PG_SZ", String(NOTICE_PAGE_SIZE));
  url.searchParams.set("PAGE", "1");
  url.searchParams.set("UPP_AIS_TP_CD", SALE_HOUSING_TYPE_CODE);
  const regionCode = input.region ? regionCodes[input.region] : undefined;
  if (regionCode) url.searchParams.set("CNP_CD", regionCode);
  return url;
}

export async function getPublicHousingNoticeFeed(input: PublicNoticeFeedInput = {}): Promise<PublicNoticeFeed> {
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!serviceKey) return fixtureFeed("fixture");

  const url = buildLhNoticeUrl(serviceKey, input);

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json, application/xml;q=0.9, text/xml;q=0.8" },
      next: { revalidate: 60 * 5 },
    });
    if (!response.ok) throw new Error(`LH API responded with ${response.status}`);

    const notices = parseLhNoticeResponse(await response.text(), response.headers.get("content-type") ?? "");
    if (!notices.length) {
      return {
        mode: "live",
        status: "empty",
        notices: [],
        updatedAt: new Date().toISOString(),
        message: "LH에서 현재 조회 조건에 맞는 공공분양 공고를 반환하지 않았습니다.",
      };
    }

    return { mode: "live", status: "live", notices: await Promise.all(notices.map(enrichLhSaleNotice)), updatedAt: new Date().toISOString() };
  } catch (error) {
    console.error("LH notice feed unavailable", error instanceof Error ? error.message : "unknown error");
    return fixtureFeed("fallback");
  }
}

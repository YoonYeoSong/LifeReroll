import { housingNotices } from "../../data/housing/notices";
import type { HousingNotice } from "./types";

const LH_NOTICE_ENDPOINT = "https://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1";
const SMALL_TEST_PAGE_SIZE = 3;

export type NoticeFeedMode = "live" | "fixture" | "fallback";

export interface PublicNoticeFeed {
  mode: NoticeFeedMode;
  notices: HousingNotice[];
  updatedAt: string;
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
    sourceUrl: detailUrl ?? "https://apply.lh.or.kr",
    sourceName: "LH 분양임대공고문 조회 서비스",
    sourceDate: noticeDate || new Date().toISOString().slice(0, 10),
    housingTypes: [],
  };
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
    notices: housingNotices.filter((notice) => !notice.isHistorical),
    updatedAt: new Date().toISOString(),
  };
}

export async function getPublicHousingNoticeFeed(): Promise<PublicNoticeFeed> {
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!serviceKey) return fixtureFeed("fixture");

  const url = new URL(process.env.LH_HOUSING_NOTICES_URL ?? LH_NOTICE_ENDPOINT);
  // data.go.kr shows both encoded and decoded keys. Normalize either form before URLSearchParams encodes it.
  let decodedServiceKey = serviceKey;
  try {
    decodedServiceKey = decodeURIComponent(serviceKey);
  } catch {
    // Keep the original value; the provider will return a safe fixture fallback if it is invalid.
  }
  url.searchParams.set("serviceKey", decodedServiceKey);
  url.searchParams.set("PG_SZ", String(SMALL_TEST_PAGE_SIZE));
  url.searchParams.set("PAGE", "1");

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json, application/xml;q=0.9, text/xml;q=0.8" },
      next: { revalidate: 60 * 60 },
    });
    if (!response.ok) throw new Error(`LH API responded with ${response.status}`);

    const notices = parseLhNoticeResponse(await response.text(), response.headers.get("content-type") ?? "");
    if (!notices.length) throw new Error("LH API returned no readable notice items");

    return { mode: "live", notices, updatedAt: new Date().toISOString() };
  } catch (error) {
    console.error("LH notice feed unavailable", error instanceof Error ? error.message : "unknown error");
    return fixtureFeed("fallback");
  }
}

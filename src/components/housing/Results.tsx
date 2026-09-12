"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatWon } from "@/lib/housing/format";
import { recommend } from "@/lib/housing/recommendation";
import type { FundingStatus, HousingNotice, Recommendation, UserProfile } from "@/lib/housing/types";

const STORAGE_KEY = "cheongyak-fit-profile-v1";
const eligibilityLabels = { STRONG_MATCH: "조건 적합", POSSIBLE: "검토 가능", REVIEW_REQUIRED: "확인 필요", DIFFICULT: "확인 필요", INELIGIBLE: "조건 미충족" };
const fundingLabels: Record<FundingStatus, string> = { sufficient: "예상 자금 계획 충족", possible: "심사·자금 확인 필요", additional_funds_needed: "추가 자금 필요", insufficient: "예상 자금 부족" };

interface LiveNoticeResponse { mode: "live" | "fixture" | "fallback"; status: "live" | "missing_key" | "upstream_error" | "empty"; notices: HousingNotice[]; updatedAt: string; message?: string; }

export function Results() {
  const [liveItems, setLiveItems] = useState<Recommendation[]>([]);
  const [liveNotices, setLiveNotices] = useState<HousingNotice[]>([]);
  const [liveFeed, setLiveFeed] = useState<LiveNoticeResponse>();
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const profile: UserProfile = JSON.parse(stored);
      const selectedRegions = [...new Set(profile.preferences.preferredRegions)];
      const allRegionsSelected = selectedRegions.length === 17;
      queueMicrotask(() => setHasProfile(true));
      const params = new URLSearchParams();
      if (!allRegionsSelected) {
        for (const region of selectedRegions.length ? selectedRegions : [profile.residenceRegion]) {
          if (region) params.append("region", region);
        }
      }
      fetch(`/api/housing/notices?${params.toString()}`).then((response) => response.ok ? response.json() as Promise<LiveNoticeResponse> : undefined).then((feed) => {
        if (!feed) return;
        setLiveFeed(feed);
        if (feed.mode === "live") {
          setLiveNotices(feed.notices);
          setLiveItems(recommend(profile, feed.notices));
        }
      }).catch(() => setLiveFeed({ mode: "fallback", status: "upstream_error", notices: [], updatedAt: new Date().toISOString(), message: "공고 조회 요청에 연결하지 못했습니다." }));
    } catch { localStorage.removeItem(STORAGE_KEY); }
  }, []);

  if (!hasProfile) return <div className="housing-card empty-results"><h2>먼저 자금 계획을 입력해 주세요</h2><p>입력한 소득·자금으로 예상 대출 범위와 추가 필요자금을 참고용으로 계산합니다.</p><Link className="housing-primary" href="/housing/profile">내 조건 입력하기</Link></div>;

  const plans = [
    { key: "low", title: "예상 자금 계획이 맞는 분양", description: "입력 자금과 참고용 대출 예상치를 합산했을 때 총 예상비용을 충당하는 경우", items: liveItems.filter((item) => item.funding.status === "sufficient") },
    { key: "review", title: "대출 심사·자금 확인이 필요한 분양", description: "금융기관의 실제 심사, 계약 조건 또는 일부 자금 조정이 필요한 경우", items: liveItems.filter((item) => ["possible", "additional_funds_needed"].includes(item.funding.status)) },
    { key: "risk", title: "추가 자금 계획이 큰 분양", description: "참고용 예상 대출을 반영해도 자금 차이가 큰 경우", items: liveItems.filter((item) => item.funding.status === "insufficient") },
  ].filter((plan) => plan.items.length);

  return <main className="analysis-main">
    <section className="plan-intro housing-card"><p className="housing-kicker">ESTIMATED FINANCING PLAN</p><h2>공고별 타입으로 보는 예상 대출·자금 플랜</h2><p>LH 공식 공고에서 읽어온 주택형·평균 분양가를 적용해 타입별 예상 대출 범위와 부족자금을 계산합니다. 청약 조건은 신청 전 별도로 확인할 보조 정보입니다.</p><p className="estimate-warning"><b>중요:</b> 공식 공고의 평균 분양가를 제외한 총비용·대출 가능성·대출 한도는 모두 참고용 추정치입니다. 실제 대출은 소득, DSR·LTV, 신용, 담보, 기존 부채, 은행 상품과 심사 시점에 따라 달라지며 승인이나 한도를 보장하지 않습니다.</p></section>
    <LiveNoticeStatus feed={liveFeed} notices={liveNotices} />
    {plans.map((plan) => <section className={`plan-section plan-${plan.key}`} key={plan.key}><div className="plan-heading"><div><h2>{plan.title}</h2><p>{plan.description}</p></div><span>{plan.items.length}개 타입</span></div><div className="result-list">{groupNoticeItems(plan.items).map((noticeItems) => <NoticeTypeSwitcher items={noticeItems} key={noticeItems[0].notice.noticeId} />)}</div></section>)}
    {!plans.length && <div className="housing-card"><h2>표시할 공식 공고가 없어요</h2><p>현재 조회 조건에 맞는 LH 공고가 없거나, 공고의 주택형·분양가 정보를 아직 읽어오지 못했습니다.</p><Link href="/housing/profile">조건 수정하기</Link></div>}
  </main>;
}

function LiveNoticeStatus({ feed, notices }: { feed: LiveNoticeResponse | undefined; notices: HousingNotice[] }) {
  if (!feed) return <section className="housing-card live-feed-status"><p className="housing-kicker">LH LIVE CHECK</p><h2>LH 공고를 확인하는 중입니다</h2><p>공식 공공분양 공고와 주택형 정보를 불러오고 있습니다.</p></section>;
  if (feed.status === "empty") return <section className="housing-card live-feed-status"><p className="housing-kicker">LH LIVE CHECK</p><h2>현재 조회된 LH 공공분양 공고가 없습니다</h2><p>{feed.message}</p><p className="source-line">확인 시각 {new Date(feed.updatedAt).toLocaleString("ko-KR")}</p></section>;
  if (feed.mode !== "live" || feed.status !== "live") return <section className="housing-card live-feed-status is-warning"><p className="housing-kicker">LH LIVE CHECK</p><h2>LH 실시간 공고를 표시하지 못했습니다</h2><p>{feed.message ?? "LH 공고 조회 상태를 확인해 주세요."}</p><p className="source-line">상태: {feed.status} · 확인 시각 {new Date(feed.updatedAt).toLocaleString("ko-KR")}</p></section>;
  return <section className="housing-card live-feed-status"><p className="housing-kicker">LH LIVE CHECK</p><h2>LH 공공분양 공고 {notices.length}건을 조회했습니다</h2><p className="source-line">확인 시각 {new Date(feed.updatedAt).toLocaleString("ko-KR")} · 주택형·분양가가 읽힌 공고만 아래 자금 플랜에 반영됩니다.</p>{notices.length > 0 && <div className="live-notice-list">{notices.map(notice => <article key={notice.noticeId}><div><strong>{notice.title}</strong><p>{notice.region} · 접수 {notice.applicationStartDate || "일정 확인 필요"} ~ {notice.applicationEndDate || "일정 확인 필요"}</p></div><a href={notice.sourceUrl} target="_blank" rel="noreferrer">원문 보기</a></article>)}</div>}</section>;
}

function formatHousingType(item: Recommendation): string {
  const rawType = item.housingType.typeName.replace(/\s/g, "");
  if (rawType.includes("㎡")) return rawType;
  const suffix = rawType.replace(/^\d+(?:\.\d+)?/, "");
  const area = Number.isInteger(item.housingType.exclusiveArea) ? item.housingType.exclusiveArea.toString() : item.housingType.exclusiveArea.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return `${area}㎡${suffix ? ` ${suffix}형` : ""}`;
}

function groupNoticeItems(items: Recommendation[]): Recommendation[][] {
  const grouped = new Map<string, Recommendation[]>();
  for (const item of items) grouped.set(item.notice.noticeId, [...(grouped.get(item.notice.noticeId) ?? []), item]);
  return [...grouped.values()];
}

function NoticeTypeSwitcher({ items }: { items: Recommendation[] }) {
  const [selectedType, setSelectedType] = useState(items[0].housingType.typeName);
  const selectedItem = items.find((item) => item.housingType.typeName === selectedType) ?? items[0];
  return <section className="notice-type-switcher" aria-label={`${selectedItem.notice.title} 주택형 선택`}><div className="type-switcher-heading"><div><p>주택형 선택</p><strong>{selectedItem.notice.title}</strong></div><span>{items.length}개 타입</span></div><div className="type-switcher-buttons" role="group" aria-label="주택형"><span className="type-switcher-hint">원하는 타입을 누르면 해당 가격과 대출 예상치가 바뀝니다.</span>{items.map((item) => <button type="button" className={item.housingType.typeName === selectedItem.housingType.typeName ? "is-selected" : ""} aria-pressed={item.housingType.typeName === selectedItem.housingType.typeName} key={item.housingType.typeName} onClick={() => setSelectedType(item.housingType.typeName)}>{formatHousingType(item)}</button>)}</div><div className="type-switcher-panel" key={selectedItem.housingType.typeName}><PlanCard item={selectedItem} /></div></section>;
}

function PlanCard({ item }: { item: Recommendation }) {
  const personalFunds = item.funding.ownFunds + item.funding.leaseDepositReturnFunds + item.funding.giftFunds + item.funding.familyLoanFunds;
  const plannedCreditLoan = item.funding.estimatedLoans.plannedCreditLoan;
  const totalLoans = item.funding.estimatedLoans.mortgage + plannedCreditLoan;
  const loanRange = `${formatWon(item.funding.estimatedFinancing.min)} ~ ${formatWon(item.funding.estimatedFinancing.max)}`;
  const typeLabel = formatHousingType(item);
  const supplyText = item.housingType.supplyCount > 0 ? ` · ${item.housingType.supplyCount.toLocaleString("ko-KR")}세대` : "";
  const priceLabel = "공고상 평균 분양가";

  return <article className="housing-card result-card">
    <div className="result-title"><div><p className="housing-kicker">LH OFFICIAL SALE · {item.notice.region} {item.notice.city}</p><h3>{item.notice.title}</h3><p className="application-date">타입 {typeLabel}{supplyText} · 접수 {item.notice.applicationStartDate} ~ {item.notice.applicationEndDate}</p></div><span className={`status status-${item.status.toLowerCase()}`}>{fundingLabels[item.funding.status]}</span></div>
    <section className="type-price-summary" aria-label={`${typeLabel} 가격 정보`}><div><p>이 타입</p><strong>{typeLabel}</strong></div><div><p>{priceLabel}</p><strong>{formatWon(item.housingType.price)}</strong></div></section>
    <section className="loan-summary" aria-label="예상 대출 요약"><p>{typeLabel} 기준 참고용 예상 주택담보대출 범위</p><strong>{loanRange}</strong><span>기준 예상 {formatWon(item.funding.estimatedLoans.mortgage)} · 실제 승인 한도 아님</span></section>
    <dl className="result-detail"><div><dt>{priceLabel}</dt><dd>{formatWon(item.housingType.price)}</dd></div><div><dt>참고용 총비용</dt><dd>{formatWon(item.housingType.estimatedTotalCost)}</dd></div><div><dt>입력 자금·지원</dt><dd>{formatWon(personalFunds)}</dd></div><div><dt>예상 추가자금</dt><dd>{item.funding.shortfall ? formatWon(item.funding.shortfall) : "없음"}</dd></div></dl>
    <section className="financing-breakdown" aria-label="예상 자금 구성"><div><h4>참고용 자금 구성</h4><span>전부 예상치</span></div><dl><div><dt>예상 담보대출</dt><dd>{formatWon(item.funding.estimatedLoans.mortgage)}</dd></div>{plannedCreditLoan > 0 && <div><dt>입력한 신용대출 계획</dt><dd>{formatWon(plannedCreditLoan)}</dd></div>}<div><dt>예상 대출 합계</dt><dd>{formatWon(totalLoans)}</dd></div></dl><p>담보대출 범위는 {priceLabel}·입력 자금·기존 부채를 단순 반영한 계산입니다. 신용대출은 사용자가 직접 입력한 계획 금액일 뿐, 대출 가능 금액으로 판단하지 않습니다.</p></section>
    <details className="eligibility-details"><summary>청약 조건 참고 보기 · {eligibilityLabels[item.status]}</summary><ul className="reason-list">{item.reasons.length ? item.reasons.slice(0, 3).map((reason) => <li key={reason}>{reason}</li>) : <li>입력한 기본 조건을 기준으로 추가 확인 항목이 없습니다.</li>}</ul><p>청약 자격과 공급 조건은 반드시 공식 공고문에서 최종 확인하세요.</p></details>
    <p className="source-line">공고상 평균 분양가를 읽어온 <b>참고용 대출 시뮬레이션</b>입니다. 실제 공고·분양가·대출 조건은 <a href={item.notice.sourceUrl} target="_blank" rel="noreferrer">공식 자료</a>와 금융기관에서 확인하세요.</p>
  </article>;
}

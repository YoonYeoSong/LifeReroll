"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { housingNotices } from "@/data/housing/notices";
import { formatWon } from "@/lib/housing/format";
import { recommend } from "@/lib/housing/recommendation";
import type { FundingStatus, HousingNotice, Recommendation, UserProfile } from "@/lib/housing/types";
import styles from "./Results.module.css";

const STORAGE_KEY = "cheongyak-fit-profile-v1";
const eligibilityLabels = { STRONG_MATCH: "조건 적합", POSSIBLE: "검토 가능", REVIEW_REQUIRED: "확인 필요", DIFFICULT: "확인 필요", INELIGIBLE: "조건 미충족" };
const fundingLabels: Record<FundingStatus, string> = { sufficient: "예상 자금 계획 충족", possible: "심사·자금 확인 필요", additional_funds_needed: "추가 자금 필요", insufficient: "예상 자금 부족" };

interface LiveNoticeResponse { mode: "live" | "fixture" | "fallback"; notices: HousingNotice[]; }

export function Results() {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [history, setHistory] = useState<Recommendation[]>([]);
  const [liveNotices, setLiveNotices] = useState<HousingNotice[]>([]);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const profile: UserProfile = JSON.parse(stored);
      const region = profile.preferences.preferredRegions[0] || profile.residenceRegion;
      const historicalNotices = housingNotices.filter((notice) => notice.isHistorical).map((notice) => ({ ...notice, isHistorical: false }));
      queueMicrotask(() => { setItems(recommend(profile, housingNotices)); setHistory(recommend(profile, historicalNotices)); setHasProfile(true); });
      const params = new URLSearchParams();
      if (region) params.set("region", region);
      fetch(`/api/housing/notices?${params.toString()}`).then((response) => response.ok ? response.json() as Promise<LiveNoticeResponse> : undefined).then((feed) => { if (feed?.mode === "live") setLiveNotices(feed.notices); }).catch(() => { /* Live notices are optional and never replace local simulations. */ });
    } catch { localStorage.removeItem(STORAGE_KEY); }
  }, []);

  if (!hasProfile) return <div className="housing-card empty-results"><h2>먼저 자금 계획을 입력해 주세요</h2><p>입력한 소득·자금으로 예상 대출 범위와 추가 필요자금을 참고용으로 계산합니다.</p><Link className="housing-primary" href="/housing/profile">내 조건 입력하기</Link></div>;

  const plans = [
    { key: "low", title: "예상 자금 계획이 맞는 분양", description: "입력 자금과 참고용 대출 예상치를 합산했을 때 총 예상비용을 충당하는 경우", items: items.filter((item) => item.funding.status === "sufficient") },
    { key: "review", title: "대출 심사·자금 확인이 필요한 분양", description: "금융기관의 실제 심사, 계약 조건 또는 일부 자금 조정이 필요한 경우", items: items.filter((item) => ["possible", "additional_funds_needed"].includes(item.funding.status)) },
    { key: "risk", title: "추가 자금 계획이 큰 분양", description: "참고용 예상 대출을 반영해도 자금 차이가 큰 경우", items: items.filter((item) => item.funding.status === "insufficient") },
  ].filter((plan) => plan.items.length);

  return <div className="analysis-layout"><main className="analysis-main">
    <section className="plan-intro housing-card"><p className="housing-kicker">ESTIMATED FINANCING PLAN</p><h2>먼저 보는 예상 대출·자금 플랜</h2><p>예시 분양 정보와 입력한 자금을 바탕으로 분양가, 부대비용, 예상 대출 범위와 부족자금을 함께 계산합니다. 청약 조건은 신청 전 별도로 확인할 보조 정보입니다.</p><p className="estimate-warning"><b>중요:</b> 화면의 분양가·총비용·대출 가능성·대출 한도는 모두 참고용 추정치입니다. 실제 대출은 소득, DSR·LTV, 신용, 담보, 기존 부채, 은행 상품과 심사 시점에 따라 달라지며 승인이나 한도를 보장하지 않습니다.</p></section>
    {liveNotices.length > 0 && <section className="plan-section plan-review"><div className="plan-heading"><div><h2>관련 최신 분양 공고</h2><p>희망 지역을 기준으로 찾은 LH 공고입니다. 아래 목록에는 자금·대출 판정에 필요한 가격 정보가 없으므로 원문에서 확인해 주세요.</p></div><span>{liveNotices.length}건</span></div><div className={styles.liveNoticeList}>{liveNotices.map((notice) => <LiveNoticeCard notice={notice} key={notice.noticeId} />)}</div></section>}
    {plans.map((plan) => <section className={`plan-section plan-${plan.key}`} key={plan.key}><div className="plan-heading"><div><h2>{plan.title}</h2><p>{plan.description}</p></div><span>{plan.items.length}건</span></div><div className="result-list">{plan.items.map((item) => <PlanCard item={item} key={`${item.notice.noticeId}-${item.housingType.typeName}`} />)}</div></section>)}
    {!plans.length && <div className="housing-card"><h2>계산할 예시 분양 정보가 없어요</h2><p>희망 지역 또는 자금 입력값을 조정하면 예상 대출·자금 시뮬레이션을 다시 볼 수 있습니다.</p><Link href="/housing/profile">조건 수정하기</Link></div>}
  </main><aside className="history-aside"><section className="historical-reference housing-card"><p className="housing-kicker">PAST SALE SIMULATION</p><h2>과거 분양에도 자금 계획을 대입해 보세요</h2><p>당시 분양가에 현재 입력 자금과 참고용 대출 추정치를 적용한 시뮬레이션입니다. 실제 과거 대출·자격·당첨 결과가 아닙니다.</p>{history.length ? history.map((item) => <article className="past-card" key={`${item.notice.noticeId}-${item.housingType.typeName}`}><p>{item.notice.noticeDate} · {item.notice.region}</p><h3>{item.notice.title} {item.housingType.typeName}</h3><strong>당시 분양가 {formatWon(item.housingType.price)}</strong><span className={`status status-${item.status.toLowerCase()}`}>{fundingLabels[item.funding.status]}</span><ul><li>참고용 예상 담보대출 {formatWon(item.funding.estimatedLoans.mortgage)}</li>{item.funding.shortfall > 0 && <li>예상 추가자금 {formatWon(item.funding.shortfall)}</li>}</ul></article>) : <p>선택한 지역에 비교할 과거 사례가 없습니다.</p>}</section></aside></div>;
}

function LiveNoticeCard({ notice }: { notice: HousingNotice }) {
  const dates = [notice.noticeDate && `공고 ${notice.noticeDate}`, notice.applicationEndDate && `마감 ${notice.applicationEndDate}`].filter(Boolean);
  return <article className={styles.liveNoticeCard}><div className={styles.liveNoticeTopline}><span>{notice.housingCategory}</span><span>LH 공식 공고</span></div><h3>{notice.title}</h3><p className={styles.liveNoticeRegion}>{notice.region || "지역 확인 필요"}</p>{dates.length > 0 && <p className={styles.liveNoticeDates}>{dates.join(" · ")}</p>}<a className={styles.liveNoticeLink} href={notice.sourceUrl} target="_blank" rel="noreferrer">원문 공고 보기 <span aria-hidden="true">→</span></a></article>;
}

function PlanCard({ item }: { item: Recommendation }) {
  const personalFunds = item.funding.ownFunds + item.funding.leaseDepositReturnFunds + item.funding.giftFunds + item.funding.familyLoanFunds;
  const plannedCreditLoan = item.funding.estimatedLoans.plannedCreditLoan;
  const totalLoans = item.funding.estimatedLoans.mortgage + plannedCreditLoan;
  const loanRange = `${formatWon(item.funding.estimatedFinancing.min)} ~ ${formatWon(item.funding.estimatedFinancing.max)}`;
  return <article className="housing-card result-card"><div className="result-title"><div><p className="housing-kicker">EXAMPLE SALE · {item.notice.region} {item.notice.city}</p><h3>{item.notice.title}</h3><p className="application-date">예시 면적 {item.housingType.typeName} · 접수 {item.notice.applicationStartDate} ~ {item.notice.applicationEndDate}</p></div><span className={`status status-${item.status.toLowerCase()}`}>{fundingLabels[item.funding.status]}</span></div><section className="loan-summary" aria-label="예상 대출 요약"><p>참고용 예상 주택담보대출 범위</p><strong>{loanRange}</strong><span>기준 예상 {formatWon(item.funding.estimatedLoans.mortgage)} · 실제 승인 한도 아님</span></section><dl className="result-detail"><div><dt>예상 분양가</dt><dd>{formatWon(item.housingType.price)}</dd></div><div><dt>예상 총비용</dt><dd>{formatWon(item.housingType.estimatedTotalCost)}</dd></div><div><dt>입력 자금·지원</dt><dd>{formatWon(personalFunds)}</dd></div><div><dt>예상 추가자금</dt><dd>{item.funding.shortfall ? formatWon(item.funding.shortfall) : "없음"}</dd></div></dl><section className="financing-breakdown" aria-label="예상 자금 구성"><div><h4>참고용 자금 구성</h4><span>전부 예상치</span></div><dl><div><dt>예상 담보대출</dt><dd>{formatWon(item.funding.estimatedLoans.mortgage)}</dd></div>{plannedCreditLoan > 0 && <div><dt>입력한 신용대출 계획</dt><dd>{formatWon(plannedCreditLoan)}</dd></div>}<div><dt>예상 대출 합계</dt><dd>{formatWon(totalLoans)}</dd></div></dl><p>담보대출 범위는 예시 분양가·입력 자금·기존 부채를 단순 반영한 계산입니다. 신용대출은 사용자가 직접 입력한 계획 금액일 뿐, 대출 가능 금액으로 판단하지 않습니다.</p></section><details className="eligibility-details"><summary>청약 조건 참고 보기 · {eligibilityLabels[item.status]}</summary><ul className="reason-list">{item.reasons.length ? item.reasons.slice(0, 3).map((reason) => <li key={reason}>{reason}</li>) : <li>입력한 기본 조건을 기준으로 추가 확인 항목이 없습니다.</li>}</ul><p>청약 자격과 공급 조건은 반드시 공식 공고문에서 최종 확인하세요.</p></details><p className="source-line">이 카드는 <b>예시 분양 정보에 대한 시뮬레이션</b>입니다. 실제 공고·분양가·대출 조건은 <a href={item.notice.sourceUrl} target="_blank" rel="noreferrer">공식 자료</a>와 금융기관에서 확인하세요.</p></article>;
}

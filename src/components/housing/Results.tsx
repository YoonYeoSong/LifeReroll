"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { housingNotices } from "@/data/housing/notices";
import { formatWon } from "@/lib/housing/format";
import { recommend } from "@/lib/housing/recommendation";
import type { HousingNotice, Recommendation, UserProfile } from "@/lib/housing/types";
import styles from "./Results.module.css";

const STORAGE_KEY = "cheongyak-fit-profile-v1";
const labels = { STRONG_MATCH: "조건 적합", POSSIBLE: "검토 가능", REVIEW_REQUIRED: "확인 필요", DIFFICULT: "부담 큼", INELIGIBLE: "조건 미충족" };

interface LiveNoticeResponse {
  mode: "live" | "fixture" | "fallback";
  notices: HousingNotice[];
}

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

      queueMicrotask(() => {
        setItems(recommend(profile, housingNotices));
        setHistory(recommend(profile, historicalNotices));
        setHasProfile(true);
      });

      const params = new URLSearchParams();
      if (region) params.set("region", region);
      fetch(`/api/housing/notices?${params.toString()}`)
        .then((response) => response.ok ? response.json() as Promise<LiveNoticeResponse> : undefined)
        .then((feed) => { if (feed?.mode === "live") setLiveNotices(feed.notices); })
        .catch(() => { /* Live notices are optional and never replace local analysis fixtures. */ });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  if (!hasProfile) return <div className="housing-card empty-results"><h2>먼저 조건을 입력해 주세요</h2><p>입력한 조건을 바탕으로 가능한 공고와 자금 부담을 함께 정리해 드립니다.</p><Link className="housing-primary" href="/housing/profile">조건 입력하기</Link></div>;

  const isLowRisk = (item: Recommendation) => item.funding.shortfall === 0 && ["STRONG_MATCH", "POSSIBLE"].includes(item.status);
  const isHighRisk = (item: Recommendation) => item.status === "INELIGIBLE" || item.status === "DIFFICULT" || item.funding.status === "insufficient";
  const plans = [
    { key: "low", title: "부담이 낮은 선택지", description: "추가 필요자금이 없고 현재 조건에서 비교적 무난한 경우", items: items.filter(isLowRisk) },
    { key: "review", title: "조율하면 검토할 선택지", description: "자격·통장·자금 중 확인하거나 보완할 항목이 있는 경우", items: items.filter((item) => !isLowRisk(item) && !isHighRisk(item)) },
    { key: "risk", title: "부담 또는 리스크가 큰 선택지", description: "현재 조건에서 자금 부담이 크거나 요건을 충족하지 못한 경우", items: items.filter(isHighRisk) },
  ].filter((plan) => plan.items.length);

  return <div className="analysis-layout"><main className="analysis-main">
    <section className="plan-intro housing-card"><p className="housing-kicker">YOUR SUBSCRIPTION PLAN</p><h2>선택과 집중을 위한 맞춤 플랜</h2><p>공고를 나열하지 않고, 입력한 조건을 바탕으로 부담 수준과 확인할 포인트를 먼저 정리했습니다. 최종 신청은 본인의 선택이며, 공식 공고문 확인이 필요합니다.</p></section>
    {liveNotices.length > 0 && <section className="plan-section plan-review"><div className="plan-heading"><div><h2>관련 최신 분양 공고</h2><p>희망 지역을 기준으로 찾은 LH 공고입니다. 자격·가격 정보는 원문 공고에서 확인해 주세요.</p></div><span>{liveNotices.length}건</span></div><div className={styles.liveNoticeList}>{liveNotices.map((notice) => <LiveNoticeCard notice={notice} key={notice.noticeId} />)}</div></section>}
    {plans.map((plan) => <section className={`plan-section plan-${plan.key}`} key={plan.key}><div className="plan-heading"><div><h2>{plan.title}</h2><p>{plan.description}</p></div><span>{plan.items.length}건</span></div><div className="result-list">{plan.items.map((item) => <PlanCard item={item} key={`${item.notice.noticeId}-${item.housingType.typeName}`} />)}</div></section>)}
    {!plans.length && <div className="housing-card"><h2>조건에 맞춰 추릴 공고가 없어요</h2><p>희망 지역, 청약통장, 소득 또는 자금 정보를 조정하면 다시 분석할 수 있습니다.</p><Link href="/housing/profile">조건 수정하기</Link></div>}
  </main><aside className="history-aside"><section className="historical-reference housing-card"><p className="housing-kicker">PAST SALE REFERENCE</p><h2>과거 분양, 이렇게 비교해 보세요</h2><p>당시 가격과 조건에 현재 입력값을 적용한 참고 사례입니다. 실제 당시 자격·당첨 결과를 뜻하지 않습니다.</p>{history.length ? history.map((item) => <article className="past-card" key={`${item.notice.noticeId}-${item.housingType.typeName}`}><p>{item.notice.noticeDate} · {item.notice.region}</p><h3>{item.notice.title} {item.housingType.typeName}</h3><strong>당시 분양가 {formatWon(item.housingType.price)}</strong><span className={`status status-${item.status.toLowerCase()}`}>{labels[item.status]}</span><ul>{item.reasons.slice(0, 2).map((reason) => <li key={reason}>{reason}</li>)}</ul></article>) : <p>선택한 지역에 비교할 과거 사례가 없습니다.</p>}</section></aside></div>;
}

function LiveNoticeCard({ notice }: { notice: HousingNotice }) {
  const dates = [notice.noticeDate && `공고 ${notice.noticeDate}`, notice.applicationEndDate && `마감 ${notice.applicationEndDate}`].filter(Boolean);
  return <article className={styles.liveNoticeCard}><div className={styles.liveNoticeTopline}><span>{notice.housingCategory}</span><span>LH 공식 공고</span></div><h3>{notice.title}</h3><p className={styles.liveNoticeRegion}>{notice.region || "지역 확인 필요"}</p>{dates.length > 0 && <p className={styles.liveNoticeDates}>{dates.join(" · ")}</p>}<a className={styles.liveNoticeLink} href={notice.sourceUrl} target="_blank" rel="noreferrer">원문 공고 보기 <span aria-hidden="true">→</span></a></article>;
}

function PlanCard({ item }: { item: Recommendation }) {
  const personalFunds = item.funding.ownFunds + item.funding.leaseDepositReturnFunds + item.funding.giftFunds + item.funding.familyLoanFunds;
  const plannedCreditLoan = item.funding.estimatedLoans.plannedCreditLoan;
  const totalLoans = item.funding.estimatedLoans.mortgage + plannedCreditLoan;
  return <article className="housing-card result-card"><div className="result-title"><div><p className="housing-kicker">{item.notice.housingCategory} · {item.notice.region} {item.notice.city}</p><h3>{item.notice.title}</h3><p className="application-date">가능 면적 {item.housingType.typeName} · 접수 {item.notice.applicationStartDate} ~ {item.notice.applicationEndDate}</p></div><span className={`status status-${item.status.toLowerCase()}`}>{labels[item.status]}</span></div><dl className="result-detail"><div><dt>분양가</dt><dd>{formatWon(item.housingType.price)}</dd></div><div><dt>총 예상비용</dt><dd>{formatWon(item.housingType.estimatedTotalCost)}</dd></div><div><dt>내 자금·지원</dt><dd>{formatWon(personalFunds)}</dd></div><div><dt>추가 필요자금</dt><dd>{item.funding.shortfall ? formatWon(item.funding.shortfall) : "없음"}</dd></div></dl><section className="financing-breakdown" aria-label="예상 대출 구성"><div><h4>예상 대출 구성</h4><span>참고용 예상치</span></div><dl><div><dt>주택담보대출</dt><dd>{formatWon(item.funding.estimatedLoans.mortgage)}</dd></div>{plannedCreditLoan > 0 && <div><dt>일반 신용대출</dt><dd>{formatWon(plannedCreditLoan)}</dd></div>}<div><dt>대출 합계</dt><dd>{formatWon(totalLoans)}</dd></div></dl><p>주택담보대출은 입력 정보와 공고 가격을 바탕으로 한 추정치입니다. 일반 신용대출은 사용자가 직접 입력한 계획 금액만 반영하며, 실제 대출 가능 여부·한도·금리는 금융기관 심사와 승인 결과에 따라 달라집니다.</p></section><ul className="reason-list">{item.reasons.length ? item.reasons.slice(0, 3).map((reason) => <li key={reason}>{reason}</li>) : <li>입력한 기본 조건을 기준으로 추가 확인 항목이 없습니다.</li>}</ul><p className="source-line">신청 전 <a href={item.notice.sourceUrl} target="_blank" rel="noreferrer">원문 공고</a>에서 최종 요건을 확인하세요.</p></article>;
}

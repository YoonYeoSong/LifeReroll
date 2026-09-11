"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatWon } from "@/lib/housing/format";
import type { HousingNotice } from "@/lib/housing/types";
import type { NoticeFeedMode } from "@/lib/housing/public-notices";

interface NoticeFeed {
  mode: NoticeFeedMode;
  notices: HousingNotice[];
}

export function NoticesClient() {
  const [feed, setFeed] = useState<NoticeFeed>();
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    fetch("/api/housing/notices")
      .then((response) => response.ok ? response.json() as Promise<NoticeFeed> : Promise.reject(new Error("notice feed unavailable")))
      .then(setFeed)
      .catch(() => setLoadFailed(true));
  }, []);

  if (!feed && !loadFailed) return <p className="housing-card">공고 정보를 불러오는 중입니다.</p>;
  if (loadFailed) return <p className="housing-card">공고 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>;

  const live = feed?.mode === "live";
  const notices = feed?.notices ?? [];
  return <>
    <p className="source-line">{live ? "LH 공식 공고에서 소량 조회한 테스트 데이터입니다. 세부 자격·공급 조건은 원문 공고문으로 확인해 주세요." : "현재는 엔진 검증을 위한 테스트 fixture 공고입니다. 공식 공고 데이터가 아닙니다."}</p>
    <div className="notice-list">{notices.map((notice) => <article className="housing-card notice-card" key={notice.noticeId}><div><p className="housing-kicker">{notice.housingCategory} · {notice.region} {notice.city}</p><h2>{notice.title}</h2><p>{notice.provider} · 접수 {notice.applicationStartDate || "일정 확인 필요"} ~ {notice.applicationEndDate || "일정 확인 필요"}</p></div>{notice.housingTypes.length > 0 && <div className="type-list">{notice.housingTypes.map((type) => <div key={type.typeName}><strong>가능 면적 {type.typeName}</strong><span>분양가 {formatWon(type.price)} · {type.supplyCount}세대</span></div>)}</div>}<p className="source-line">출처: {notice.sourceName} · 기준일 {notice.sourceDate || "확인 필요"} · <a href={notice.sourceUrl} target="_blank" rel="noreferrer">원문 공고 링크</a></p></article>)}</div>
    <div className="housing-actions"><Link className="housing-primary" href="/housing/profile">내 조건으로 분석하기</Link></div>
  </>;
}

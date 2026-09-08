"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { generateReroll } from "@/lib/lotto";
import { randomGame } from "@/lib/lotto/random";
import type { GeneratedGames, PickMethod } from "@/lib/lotto/types";
import { LottoGameList } from "./LottoGameList";

const gameMethods: PickMethod[] = ["Historical Pick", "Historical Pick", "Pattern Pick", "Pattern Pick", "Coverage Pick", "Pure Random", "Balanced Pick", "Countertrend Pick", "Pair Avoidance Pick", "Ensemble Pick"];

function createRollingGames(): GeneratedGames {
  return {
    games: gameMethods.map((method) => ({ method, numbers: randomGame() })),
  };
}

export function Generator() {
  const [displayResult, setDisplayResult] = useState<GeneratedGames | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCaptureNotice, setShowCaptureNotice] = useState(false);
  const timer = useRef<number | null>(null);
  const interval = useRef<number | null>(null);
  const clearRoulette = () => {
    if (timer.current) window.clearTimeout(timer.current);
    if (interval.current) window.clearInterval(interval.current);
    timer.current = null;
    interval.current = null;
  };
  useEffect(() => clearRoulette, []);

  const reroll = () => {
    if (isGenerating) return;
    clearRoulette();
    setShowCaptureNotice(false);
    const finalResult = generateReroll();
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setDisplayResult(finalResult);
      setShowCaptureNotice(true);
      return;
    }
    setIsGenerating(true);
    setDisplayResult(createRollingGames());
    interval.current = window.setInterval(() => setDisplayResult(createRollingGames()), 75);
    timer.current = window.setTimeout(() => {
      clearRoulette();
      setDisplayResult(finalResult);
      setIsGenerating(false);
      setShowCaptureNotice(true);
    }, 3000);
  };

  return <><button className="reroll-button" type="button" onClick={reroll} disabled={isGenerating}>{isGenerating ? "번호 뽑는 중…" : displayResult ? "다시 현생 리롤 드가자!" : "현생 리롤 드가자!"}</button>{displayResult && <section className="results" aria-live="polite"><section className="pick-card full-pick-card"><span className="pick-meta">10 GAMES · ₩10,000</span><h2>이번 주 리롤 픽</h2><p className="pick-description">통계, 분산, 순수 랜덤, 균형 기준을 함께 사용해 성격이 다른 10개 조합을 만듭니다.</p><LottoGameList games={displayResult.games} isRolling={isGenerating} /></section><div className="total"><div><span>TOTAL</span><strong>10 GAMES</strong></div><strong>₩10,000</strong></div><p className="disclaimer">통계는 선택의 재미를 더할 뿐이며 당첨번호를 예측하거나 각 게임의 당첨 확률을 높이지 않습니다. <Link href="/about">How it works</Link>에서 계산 방식을 확인하세요.</p></section>}{showCaptureNotice && <div className="capture-notice-backdrop" role="presentation"><section className="capture-notice" role="dialog" aria-modal="true" aria-labelledby="capture-notice-title"><span className="capture-notice-sparkle" aria-hidden="true">✦</span><p className="pick-meta">RESULT READY!</p><h2 id="capture-notice-title">번호를 캡처해 주세요</h2><p>현재 결과는 저장되지 않아요.<br/>구매할 번호라면 지금 화면을 스크린샷으로 남겨 두세요!</p><button type="button" className="capture-notice-button" onClick={() => setShowCaptureNotice(false)}>확인했어요 📸</button></section></div>}</>;
}

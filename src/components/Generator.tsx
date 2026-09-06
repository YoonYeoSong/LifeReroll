"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { generateReroll } from "@/lib/lotto";
import { randomGame } from "@/lib/lotto/random";
import type { GeneratedGames } from "@/lib/lotto/types";
import { LottoGameList } from "./LottoGameList";
function createRollingGames(): GeneratedGames {
  return {
    historical: Array.from({ length: 5 }, () => randomGame()),
    pattern: Array.from({ length: 5 }, () => randomGame()),
  };
}

function PickCard({ title, description, games, isRolling }: { title: string; description: string; games: number[][]; isRolling: boolean }) {
  return <section className="pick-card"><span className="pick-meta">5 GAMES · ₩5,000</span><h2>{title}</h2><p className="pick-description">{description}</p><LottoGameList games={games} isRolling={isRolling} /></section>;
}

export function Generator() {
  const [displayResult, setDisplayResult] = useState<GeneratedGames | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
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
    const finalResult = generateReroll();
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setDisplayResult(finalResult);
      return;
    }
    setIsGenerating(true);
    setDisplayResult(createRollingGames());
    interval.current = window.setInterval(() => setDisplayResult(createRollingGames()), 75);
    timer.current = window.setTimeout(() => {
      clearRoulette();
      setDisplayResult(finalResult);
      setIsGenerating(false);
    }, 3000);
  };

  return <><button className="reroll-button" type="button" onClick={reroll} disabled={isGenerating}>{isGenerating ? "DRAWING…" : displayResult ? "DRAW AGAIN" : "DRAW MY LUCK"}</button>{displayResult && <section className="results" aria-live="polite"><div className="pick-grid"><PickCard title="Historical Pick" description="전체 당첨번호 출현빈도를 가중치로 사용해 생성한 조합입니다." games={displayResult.historical} isRolling={isGenerating} /><PickCard title="Pattern Pick" description="전체 빈도, 최근 흐름, 번호 Pair, 조합 특성을 종합 평가한 조합입니다." games={displayResult.pattern} isRolling={isGenerating} /></div><div className="total"><div><span>TOTAL</span><strong>10 GAMES</strong></div><strong>₩10,000</strong></div><p className="disclaimer">통계는 선택의 재미를 더할 뿐입니다. <Link href="/about">How it works</Link>에서 계산 방식을 확인하세요.</p></section>}</>;
}

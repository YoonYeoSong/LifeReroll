"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { generateReroll } from "@/lib/lotto";
import { randomGame } from "@/lib/lotto/random";
import type { GeneratedGames, PickMethod } from "@/lib/lotto/types";
import { createWeeklyResult, formatKstDateTime, getWeeklyPeriod, readWeeklyResult, WEEKLY_STORAGE_KEY, type WeeklyLottoResult } from "@/lib/lotto/weekly";
import { LottoGameList } from "./LottoGameList";

const gameMethods: PickMethod[] = ["Pattern Pick", "Historical Pick", "Ensemble", "Coverage", "Pure Random"];

function createRollingGames(): GeneratedGames {
  return {
    games: gameMethods.map((method) => ({ method, numbers: randomGame() })),
  };
}

export function Generator() {
  const [weeklyResult, setWeeklyResult] = useState<WeeklyLottoResult | null>(null);
  const [rollingGames, setRollingGames] = useState<GeneratedGames | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [period, setPeriod] = useState(() => getWeeklyPeriod());
  const timer = useRef<number | null>(null);
  const interval = useRef<number | null>(null);
  const clearRoulette = () => {
    if (timer.current) window.clearTimeout(timer.current);
    if (interval.current) window.clearInterval(interval.current);
    timer.current = null;
    interval.current = null;
  };
  const refreshWeeklyState = () => {
    const nextPeriod = getWeeklyPeriod();
    setPeriod(nextPeriod);
    setWeeklyResult(readWeeklyResult(window.localStorage, nextPeriod.weekKey));
    setRollingGames(null);
    setIsReady(true);
  };

  useEffect(() => {
    const loadTimer = window.setTimeout(refreshWeeklyState, 0);
    const handleVisibility = () => { if (document.visibilityState === "visible") refreshWeeklyState(); };
    const handleStorage = (event: StorageEvent) => { if (event.key === WEEKLY_STORAGE_KEY) refreshWeeklyState(); };
    const wait = Math.max(0, getWeeklyPeriod().nextResetAt.getTime() - Date.now() + 100);
    const resetTimer = window.setTimeout(refreshWeeklyState, wait);
    window.addEventListener("focus", refreshWeeklyState);
    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearRoulette();
      window.clearTimeout(loadTimer);
      window.clearTimeout(resetTimer);
      window.removeEventListener("focus", refreshWeeklyState);
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const reroll = () => {
    if (isGenerating || weeklyResult) return;
    clearRoulette();
    setStorageError(null);
    const currentPeriod = getWeeklyPeriod();
    const stored = readWeeklyResult(window.localStorage, currentPeriod.weekKey);
    if (stored) {
      setPeriod(currentPeriod);
      setWeeklyResult(stored);
      return;
    }
    let finalResult: WeeklyLottoResult;
    try {
      finalResult = createWeeklyResult(generateReroll());
    } catch {
      setStorageError("분석 데이터를 불러오지 못해 이번 주 번호를 생성할 수 없습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const save = () => {
      const latestPeriod = getWeeklyPeriod();
      if (latestPeriod.weekKey !== finalResult.weekKey) {
        setPeriod(latestPeriod);
        setWeeklyResult(readWeeklyResult(window.localStorage, latestPeriod.weekKey));
        setIsGenerating(false);
        return;
      }
      try {
        const existing = readWeeklyResult(window.localStorage, latestPeriod.weekKey);
        if (existing) {
          setWeeklyResult(existing);
        } else {
          window.localStorage.setItem(WEEKLY_STORAGE_KEY, JSON.stringify(finalResult));
          const saved = readWeeklyResult(window.localStorage, latestPeriod.weekKey);
          if (!saved) throw new Error("Storage verification failed");
          setWeeklyResult(saved);
        }
        setPeriod(latestPeriod);
      } catch {
        setStorageError("브라우저에 번호를 저장하지 못했습니다. 저장 공간 또는 개인정보 보호 설정을 확인한 뒤 다시 시도해 주세요.");
        setWeeklyResult(null);
      }
      setIsGenerating(false);
    };
    if (prefersReducedMotion) {
      save();
      return;
    }
    setIsGenerating(true);
    setRollingGames(createRollingGames());
    interval.current = window.setInterval(() => setRollingGames(createRollingGames()), 75);
    timer.current = window.setTimeout(() => {
      clearRoulette();
      setRollingGames(null);
      save();
    }, 3000);
  };

  const nextReset = formatKstDateTime(period.nextResetAt);
  const visibleGames = isGenerating ? rollingGames : weeklyResult;
  return <><button className="reroll-button" type="button" onClick={reroll} disabled={!isReady || isGenerating || Boolean(weeklyResult)}>{isGenerating ? "번호 뽑는 중…" : weeklyResult ? "이번 주 번호 확정 완료" : "이번 주 번호 생성하기"}</button>{!weeklyResult && !isGenerating && isReady && <p className="weekly-status">이번 주 로또 번호를 생성해 보세요.<br/>다음 초기화: {nextReset} (KST)</p>}{storageError && <p className="weekly-status is-error" role="alert">{storageError}</p>}{visibleGames && <section className="results" aria-live="polite"><section className="pick-card full-pick-card"><span className="pick-meta">5 GAMES · ₩5,000</span><h2>이번 주 로또 추천번호</h2>{weeklyResult ? <p className="pick-description">이번 주 생성 완료 · 최초 생성: {formatKstDateTime(weeklyResult.generatedAt)} (KST)<br/>다음 초기화: {nextReset} (KST)</p> : <p className="pick-description">5가지 전략으로 이번 주 조합을 준비하고 있습니다.</p>}<LottoGameList games={visibleGames.games} isRolling={isGenerating} /></section><div className="total"><div><span>TOTAL</span><strong>5 GAMES</strong></div><strong>₩5,000</strong></div><p className="disclaimer">통계는 선택의 재미를 더할 뿐이며 당첨번호를 예측하거나 각 게임의 당첨 확률을 높이지 않습니다. <Link href="/about">How it works</Link>에서 계산 방식을 확인하세요.</p></section>}</>;
}

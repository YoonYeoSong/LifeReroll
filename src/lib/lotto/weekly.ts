import type { GeneratedGames, PickMethod } from "./types";
import { isValidGame } from "./utils";

export const WEEKLY_STORAGE_KEY = "lifereroll.weekly-lotto.v2";
export const WEEKLY_ALGORITHM_VERSION = "v2-five-strategy";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const weeklyMethods: PickMethod[] = ["Pattern Pick", "Historical Pick", "Ensemble", "Coverage", "Pure Random"];

export type WeeklyLottoResult = GeneratedGames & {
  weekKey: string;
  generatedAt: string;
  algorithmVersion: typeof WEEKLY_ALGORITHM_VERSION;
};

type WeeklyPeriod = {
  weekKey: string;
  startsAt: Date;
  nextResetAt: Date;
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatKst(date: Date): string {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  return `${kst.getUTCFullYear()}-${pad(kst.getUTCMonth() + 1)}-${pad(kst.getUTCDate())}T${pad(kst.getUTCHours())}:${pad(kst.getUTCMinutes())}:${pad(kst.getUTCSeconds())}+09:00`;
}

/** The weekly boundary is Monday 06:00:00 in Asia/Seoul, independent of browser locale. */
export function getWeeklyPeriod(now: Date = new Date()): WeeklyPeriod {
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  const weekday = kst.getUTCDay();
  const daysSinceMonday = (weekday + 6) % 7;
  let startWallClockMs = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate() - daysSinceMonday, 6, 0, 0);
  if (weekday === 1 && kst.getUTCHours() < 6) startWallClockMs -= WEEK_MS;
  const startsAt = new Date(startWallClockMs - KST_OFFSET_MS);
  return { weekKey: formatKst(startsAt), startsAt, nextResetAt: new Date(startsAt.getTime() + WEEK_MS) };
}

export function formatKstDateTime(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
}

export function createWeeklyResult(games: GeneratedGames, now: Date = new Date()): WeeklyLottoResult {
  return { ...games, weekKey: getWeeklyPeriod(now).weekKey, generatedAt: formatKst(now), algorithmVersion: WEEKLY_ALGORITHM_VERSION };
}

export function isValidWeeklyResult(value: unknown, weekKey?: string): value is WeeklyLottoResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<WeeklyLottoResult>;
  return result.weekKey === (weekKey ?? result.weekKey)
    && typeof result.weekKey === "string"
    && typeof result.generatedAt === "string"
    && !Number.isNaN(new Date(result.generatedAt).getTime())
    && result.algorithmVersion === WEEKLY_ALGORITHM_VERSION
    && Array.isArray(result.games)
    && result.games.length === weeklyMethods.length
    && result.games.every((game, index) => game?.method === weeklyMethods[index] && Array.isArray(game.numbers) && isValidGame(game.numbers))
    && new Set(result.games.map((game) => game.numbers.join("-"))).size === weeklyMethods.length;
}

export function readWeeklyResult(storage: Storage, weekKey: string): WeeklyLottoResult | null {
  try {
    const raw = storage.getItem(WEEKLY_STORAGE_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    return isValidWeeklyResult(value, weekKey) ? value : null;
  } catch {
    return null;
  }
}

import { COUNTERTREND_CANDIDATE_COUNT } from "./constants";
import { fourthUsePenalty } from "./coverage";
import { randomGame, secureRandom, type RandomSource } from "./random";
import { normalizedCount } from "./statistics";
import type { LottoStats } from "./types";
import { gameKey } from "./utils";

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

/** A low-frequency perspective for variety, not a prediction of a future draw. */
export function countertrendScore(game: number[], stats: LottoStats, existingGames: number[][]): number {
  const lowFrequency = average(game.map((number) => 1 - (normalizedCount(stats.overallCounts, number) * 0.6 + normalizedCount(stats.recentCounts, number) * 0.4)));
  return lowFrequency * 0.85 + (1 - fourthUsePenalty(game, existingGames)) * 0.15;
}

export function generateCountertrendGame(stats: LottoStats, existingGames: number[][], excluded: Set<string>, random: RandomSource = secureRandom): number[] {
  let best: number[] | undefined;
  let bestScore = -1;
  for (let index = 0; index < COUNTERTREND_CANDIDATE_COUNT; index += 1) {
    const candidate = randomGame(random);
    if (excluded.has(gameKey(candidate))) continue;
    const score = countertrendScore(candidate, stats, existingGames);
    if (score > bestScore) { best = candidate; bestScore = score; }
  }
  if (!best) throw new Error("Unable to generate a Countertrend Pick.");
  excluded.add(gameKey(best));
  return best;
}

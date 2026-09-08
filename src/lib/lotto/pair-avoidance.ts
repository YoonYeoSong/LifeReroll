import { PAIR_AVOIDANCE_CANDIDATE_COUNT } from "./constants";
import { fourthUsePenalty } from "./coverage";
import { randomGame, secureRandom, type RandomSource } from "./random";
import { pairKey } from "./statistics";
import type { LottoStats } from "./types";
import { gameKey } from "./utils";

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

/** Favors less-common historical pairs to offer the opposite perspective of Pattern Pick. */
export function pairAvoidanceScore(game: number[], stats: LottoStats, existingGames: number[][]): number {
  const pairMaximum = Math.max(1, ...Object.values(stats.pairCounts));
  const pairValues: number[] = [];
  for (let left = 0; left < game.length; left += 1) for (let right = left + 1; right < game.length; right += 1) pairValues.push((stats.pairCounts[pairKey(game[left], game[right])] ?? 0) / pairMaximum);
  return (1 - average(pairValues)) * 0.85 + (1 - fourthUsePenalty(game, existingGames)) * 0.15;
}

export function generatePairAvoidanceGame(stats: LottoStats, existingGames: number[][], excluded: Set<string>, random: RandomSource = secureRandom): number[] {
  let best: number[] | undefined;
  let bestScore = -1;
  for (let index = 0; index < PAIR_AVOIDANCE_CANDIDATE_COUNT; index += 1) {
    const candidate = randomGame(random);
    if (excluded.has(gameKey(candidate))) continue;
    const score = pairAvoidanceScore(candidate, stats, existingGames);
    if (score > bestScore) { best = candidate; bestScore = score; }
  }
  if (!best) throw new Error("Unable to generate a Pair Avoidance Pick.");
  excluded.add(gameKey(best));
  return best;
}

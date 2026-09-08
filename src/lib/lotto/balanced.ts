import { BALANCED_CANDIDATE_COUNT } from "./constants";
import { randomGame, secureRandom, type RandomSource } from "./random";
import type { LottoStats } from "./types";
import { gameKey } from "./utils";

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

/** Uses historical shape only to avoid extremes; it does not predict outcomes. */
export function balanceScore(game: number[], stats: LottoStats): number {
  const oddCount = game.filter((number) => number % 2 !== 0).length;
  const oddEven = oddCount === 3 || oddCount === 4 ? 1 : Math.max(0, 1 - Math.abs(oddCount - 3.5) / 3);
  const lowCount = game.filter((number) => number <= 22).length;
  const lowHigh = lowCount === 3 || lowCount === 4 ? 1 : Math.max(0, 1 - Math.abs(lowCount - 3.5) / 3);
  const buckets = [0, 0, 0, 0, 0];
  game.forEach((number) => { buckets[Math.min(4, Math.floor((number - 1) / 10))] += 1; });
  const spread = Math.max(...buckets) <= 3 ? 1 : 0.35;
  const sum = game.reduce((total, number) => total + number, 0);
  const sumScore = Math.max(0, 1 - Math.abs(sum - stats.shape.averageSum) / (stats.shape.sumDeviation * 3));
  const consecutive = game.slice(1).filter((number, index) => number - game[index] === 1).length;
  const consecutiveScore = consecutive <= 2 ? 1 : 0.4;
  return average([oddEven, lowHigh, spread, sumScore, consecutiveScore]);
}

export function generateBalancedGame(stats: LottoStats, excluded: Set<string>, random: RandomSource = secureRandom): number[] {
  let best: number[] | undefined;
  let bestScore = -1;
  for (let index = 0; index < BALANCED_CANDIDATE_COUNT; index += 1) {
    const candidate = randomGame(random);
    if (excluded.has(gameKey(candidate))) continue;
    const score = balanceScore(candidate, stats);
    if (score > bestScore) { best = candidate; bestScore = score; }
  }
  if (!best) throw new Error("Unable to generate a Balanced Pick.");
  excluded.add(gameKey(best));
  return best;
}

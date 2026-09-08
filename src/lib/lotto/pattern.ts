import { MAX_SHARED_NUMBERS, PATTERN_CANDIDATE_COUNT, PATTERN_GAME_COUNT, PATTERN_WEIGHTS } from "./constants";
import { gameKey, randomGame, secureRandom, sharedNumberCount, type RandomSource } from "./random";
import { normalizedCount, pairKey } from "./statistics";
import type { LottoStats } from "./types";

function average(values: number[]): number { return values.reduce((sum, value) => sum + value, 0) / values.length; }

export function combinationShapeScore(game: number[], stats: LottoStats): number {
  const oddCount = game.filter((number) => number % 2 !== 0).length;
  const oddEven = 1 - Math.abs(oddCount - 3) / 3;
  const sum = game.reduce((total, number) => total + number, 0);
  const sumScore = Math.max(0, 1 - Math.abs(sum - stats.shape.averageSum) / (stats.shape.sumDeviation * 3));
  const gaps = game.slice(1).map((number, index) => number - game[index]);
  const gapScore = Math.max(0, 1 - Math.abs(average(gaps) - stats.shape.averageGap) / stats.shape.averageGap);
  const consecutive = gaps.filter((gap) => gap === 1).length;
  const consecutiveScore = consecutive <= 2 ? 1 : 0.45;
  const bucketCounts = [0, 0, 0, 0, 0];
  const endings: Record<number, number> = {};
  game.forEach((number) => { bucketCounts[Math.min(4, Math.floor((number - 1) / 10))] += 1; endings[number % 10] = (endings[number % 10] ?? 0) + 1; });
  const spreadScore = Math.max(...bucketCounts) <= 3 ? 1 : 0.45;
  const endingScore = Math.max(...Object.values(endings)) <= 2 ? 1 : 0.5;
  return average([oddEven, sumScore, gapScore, consecutiveScore, spreadScore, endingScore]);
}

export function patternScore(game: number[], stats: LottoStats): number {
  const overall = average(game.map((number) => normalizedCount(stats.overallCounts, number)));
  const recent = average(game.map((number) => normalizedCount(stats.recentCounts, number)));
  const pairValues: number[] = [];
  const pairMaximum = Math.max(1, ...Object.values(stats.pairCounts));
  for (let left = 0; left < game.length; left += 1) for (let right = left + 1; right < game.length; right += 1) pairValues.push((stats.pairCounts[pairKey(game[left], game[right])] ?? 0) / pairMaximum);
  const pair = average(pairValues);
  return overall * PATTERN_WEIGHTS.overall + recent * PATTERN_WEIGHTS.recent + pair * PATTERN_WEIGHTS.pair + combinationShapeScore(game, stats) * PATTERN_WEIGHTS.shape;
}

export function generatePatternGames(stats: LottoStats, excluded = new Set<string>(), random: RandomSource = secureRandom, count = PATTERN_GAME_COUNT): number[][] {
  const candidates = new Map<string, { game: number[]; score: number }>();
  for (let index = 0; index < PATTERN_CANDIDATE_COUNT; index += 1) {
    const game = randomGame(random);
    const key = gameKey(game);
    if (!excluded.has(key) && !candidates.has(key)) candidates.set(key, { game, score: patternScore(game, stats) });
  }
  const ranked = [...candidates.values()].sort((left, right) => right.score - left.score);
  const picked: number[][] = [];
  for (const candidate of ranked) {
    if (picked.length === count) break;
    if (picked.every((game) => sharedNumberCount(game, candidate.game) <= MAX_SHARED_NUMBERS)) {
      picked.push(candidate.game);
      excluded.add(gameKey(candidate.game));
    }
  }
  return picked;
}

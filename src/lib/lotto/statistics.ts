import { LOTTO_MAX, LOTTO_MIN, RECENT_DRAW_LIMIT } from "./constants";
import type { LottoDraw, LottoStats, NumberCounts } from "./types";

export function pairKey(left: number, right: number): string {
  return left < right ? `${left}-${right}` : `${right}-${left}`;
}

export function createEmptyCounts(): NumberCounts {
  return Object.fromEntries(Array.from({ length: LOTTO_MAX }, (_, index) => [index + LOTTO_MIN, 0]));
}

export function calculateStatistics(draws: LottoDraw[]): LottoStats {
  const overallCounts = createEmptyCounts();
  const recentCounts = createEmptyCounts();
  const pairCounts: Record<string, number> = {};
  const recentDraws = draws.slice(-RECENT_DRAW_LIMIT);

  draws.forEach((draw) => {
    draw.numbers.forEach((number) => {
      overallCounts[number] += 1;
    });
    for (let left = 0; left < draw.numbers.length; left += 1) {
      for (let right = left + 1; right < draw.numbers.length; right += 1) {
        const key = pairKey(draw.numbers[left], draw.numbers[right]);
        pairCounts[key] = (pairCounts[key] ?? 0) + 1;
      }
    }
  });

  recentDraws.forEach((draw) => draw.numbers.forEach((number) => { recentCounts[number] += 1; }));
  const sums = draws.map((draw) => draw.numbers.reduce((sum, number) => sum + number, 0));
  const averageSum = sums.reduce((sum, value) => sum + value, 0) / sums.length;
  const sumDeviation = Math.sqrt(sums.reduce((sum, value) => sum + (value - averageSum) ** 2, 0) / sums.length) || 1;
  const averageGap = draws.reduce((total, draw) => total + draw.numbers.slice(1).reduce((sum, value, index) => sum + value - draw.numbers[index], 0) / 5, 0) / draws.length;

  return { draws, overallCounts, recentCounts, pairCounts, recentDrawCount: recentDraws.length, shape: { averageSum, sumDeviation, averageGap } };
}

export function normalizedCount(counts: NumberCounts, number: number): number {
  const values = Object.values(counts);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  return maximum === minimum ? 0.5 : (counts[number] - minimum) / (maximum - minimum);
}

export function rankedNumbers(counts: NumberCounts, direction: "desc" | "asc" = "desc") {
  return Object.entries(counts)
    .map(([number, count]) => ({ number: Number(number), count }))
    .sort((left, right) => direction === "desc" ? right.count - left.count || left.number - right.number : left.count - right.count || left.number - right.number);
}

export function rankedPairs(pairCounts: Record<string, number>) {
  return Object.entries(pairCounts)
    .map(([key, count]) => ({ numbers: key.split("-").map(Number) as [number, number], count }))
    .sort((left, right) => right.count - left.count || left.numbers[0] - right.numbers[0] || left.numbers[1] - right.numbers[1]);
}

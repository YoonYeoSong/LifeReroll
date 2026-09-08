import { COVERAGE_CANDIDATE_COUNT } from "./constants";
import { randomGame, secureRandom, type RandomSource } from "./random";
import { gameKey, sharedNumberCount } from "./utils";

function gameNumberUseCounts(games: number[][]): Map<number, number> {
  const counts = new Map<number, number>();
  games.flat().forEach((number) => counts.set(number, (counts.get(number) ?? 0) + 1));
  return counts;
}

/** Applies only a soft penalty when a candidate would use a number for the fourth time. */
export function fourthUsePenalty(game: number[], existingGames: number[][]): number {
  const uses = gameNumberUseCounts(existingGames);
  return game.reduce((sum, number) => sum + Math.max(0, (uses.get(number) ?? 0) - 2) / 3, 0) / game.length;
}

/** A diversity score only: it rewards less overlap and broader number coverage. */
export function coverageScore(game: number[], existingGames: number[][]): number {
  if (existingGames.length === 0) return 1;
  const overlaps = existingGames.map((existing) => sharedNumberCount(game, existing));
  const averageOverlap = overlaps.reduce((sum, value) => sum + value, 0) / overlaps.length;
  const maximumOverlap = Math.max(...overlaps);
  const uses = gameNumberUseCounts(existingGames);
  const maximumUse = Math.max(1, ...uses.values());
  const repeatPenalty = game.reduce((sum, number) => sum + (uses.get(number) ?? 0) / maximumUse, 0) / game.length;
  const fourthUse = fourthUsePenalty(game, existingGames);
  const distinctCoverage = new Set([...existingGames.flat(), ...game]).size / 45;
  const overlapPenalty = (averageOverlap / 6) * 0.65 + (maximumOverlap / 6) * 0.35;
  return Math.max(0, Math.min(1, (1 - overlapPenalty) * 0.65 + (1 - repeatPenalty) * 0.15 + distinctCoverage * 0.1 + (1 - fourthUse) * 0.1));
}

export function generateCoverageGame(existingGames: number[][], excluded: Set<string>, random: RandomSource = secureRandom): number[] {
  let best: number[] | undefined;
  let bestScore = -1;
  for (let index = 0; index < COVERAGE_CANDIDATE_COUNT; index += 1) {
    const candidate = randomGame(random);
    if (excluded.has(gameKey(candidate))) continue;
    const score = coverageScore(candidate, existingGames);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  if (!best) throw new Error("Unable to generate a Coverage Pick.");
  excluded.add(gameKey(best));
  return best;
}

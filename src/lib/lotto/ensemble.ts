import { ENSEMBLE_CANDIDATE_COUNT } from "./constants";
import { balanceScore } from "./balanced";
import { coverageScore } from "./coverage";
import { patternScore } from "./pattern";
import { randomGame, secureRandom, type RandomSource } from "./random";
import { normalizedCount } from "./statistics";
import type { LottoStats } from "./types";
import { gameKey, normalizeScores } from "./utils";

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

export function historicalScore(game: number[], stats: LottoStats): number {
  return average(game.map((number) => normalizedCount(stats.overallCounts, number)));
}

export type EnsembleCandidate = { game: number[]; historical: number; pattern: number; coverage: number; balance: number; score?: number };

/** Normalizes each component over this candidate set before weighted summation. */
export function scoreEnsembleCandidates(candidates: EnsembleCandidate[]): EnsembleCandidate[] {
  const historical = normalizeScores(candidates.map((candidate) => candidate.historical));
  const pattern = normalizeScores(candidates.map((candidate) => candidate.pattern));
  const coverage = normalizeScores(candidates.map((candidate) => candidate.coverage));
  const balance = normalizeScores(candidates.map((candidate) => candidate.balance));
  return candidates.map((candidate, index) => ({ ...candidate, score: historical[index] * 0.25 + pattern[index] * 0.25 + coverage[index] * 0.3 + balance[index] * 0.2 }));
}

export function generateEnsembleGame(stats: LottoStats, existingGames: number[][], excluded: Set<string>, random: RandomSource = secureRandom): number[] {
  const candidates: EnsembleCandidate[] = [];
  const candidateKeys = new Set<string>();
  for (let index = 0; index < ENSEMBLE_CANDIDATE_COUNT; index += 1) {
    const game = randomGame(random);
    const key = gameKey(game);
    if (excluded.has(key) || candidateKeys.has(key)) continue;
    candidateKeys.add(key);
    candidates.push({ game, historical: historicalScore(game, stats), pattern: patternScore(game, stats), coverage: coverageScore(game, existingGames), balance: balanceScore(game, stats) });
  }
  const winner = scoreEnsembleCandidates(candidates).sort((left, right) => (right.score ?? 0) - (left.score ?? 0))[0];
  if (!winner) throw new Error("Unable to generate an Ensemble Pick.");
  excluded.add(gameKey(winner.game));
  return winner.game;
}

import { describe, expect, it } from "vitest";
import { balanceScore, generateBalancedGame } from "./balanced";
import { coverageScore, generateCoverageGame } from "./coverage";
import { scoreEnsembleCandidates } from "./ensemble";
import { historicalWeights, generateHistoricalGames } from "./historical";
import { generateRerollFromStats } from "./generator";
import { generatePatternGames, patternScore } from "./pattern";
import { randomGame } from "./random";
import { calculateStatistics, pairKey } from "./statistics";
import { gameKey, isValidGame, normalizeGame } from "./utils";
import type { LottoDraw } from "./types";
import { validateLottoHistory } from "./validation";

const draws: LottoDraw[] = Array.from({ length: 110 }, (_, index) => ({ round: index + 1, numbers: [1 + index % 10, 12 + index % 10, 22 + index % 9, 33 + index % 7, 41, 45].sort((a, b) => a - b), bonus: 11 }));
const stats = calculateStatistics(draws);
const assertGame = (game: number[]) => { expect(isValidGame(game)).toBe(true); expect(normalizeGame(game)).toEqual(game); };

describe("lotto generators", () => {
  it("keeps the Historical frequency weights and produces two unique games", () => {
    const weights = historicalWeights(stats);
    expect(weights[40]).toBeGreaterThan(weights[0]);
    const games = generateHistoricalGames(stats);
    expect(games).toHaveLength(2);
    games.forEach(assertGame);
    expect(new Set(games.map(gameKey)).size).toBe(2);
  });

  it("calculates the existing Pattern score and produces two distinct games", () => {
    const games = generatePatternGames(stats);
    expect(games).toHaveLength(2);
    games.forEach(assertGame);
    expect(games.map((game) => patternScore(game, stats)).every((score) => score >= 0 && score <= 1)).toBe(true);
    expect(new Set(games.map(gameKey)).size).toBe(2);
  });

  it("uses a uniform shuffle for Pure Random without statistics", () => {
    const fixedRandom = () => 0.5;
    expect(randomGame(fixedRandom)).toEqual(randomGame(fixedRandom));
    assertGame(randomGame());
  });

  it("prefers Coverage candidates that are not crowded by earlier games", () => {
    const earlyGames = [[1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11, 12], [13, 14, 15, 16, 17, 18], [19, 20, 21, 22, 23, 24]];
    const coverage = generateCoverageGame(earlyGames, new Set(earlyGames.map(gameKey)));
    assertGame(coverage);
    expect(coverageScore(coverage, earlyGames)).toBeGreaterThan(coverageScore([1, 2, 3, 4, 5, 25], earlyGames));
  });

  it("selects a Balanced Pick that avoids extreme shape scores", () => {
    const game = generateBalancedGame(stats, new Set());
    assertGame(game);
    expect(balanceScore(game, stats)).toBeGreaterThan(0.8);
  });

  it("normalizes every Ensemble component before weighted summation", () => {
    const candidates = scoreEnsembleCandidates([
      { game: [1, 2, 3, 4, 5, 6], historical: 0, pattern: 10, coverage: 100, balance: 20 },
      { game: [7, 8, 9, 10, 11, 12], historical: 100, pattern: 20, coverage: 0, balance: 40 },
    ]);
    expect(candidates[0].score).toBe(30);
    expect(candidates[1].score).toBe(70);
  });

  it("produces exactly ten valid, order-independent unique games with every method", () => {
    const result = generateRerollFromStats(stats);
    expect(result.games).toHaveLength(10);
    expect(result.games.map((game) => game.method)).toEqual(["Historical Pick", "Historical Pick", "Pattern Pick", "Pattern Pick", "Coverage Pick", "Coverage Pick", "Pure Random", "Pure Random", "Balanced Pick", "Ensemble Pick"]);
    result.games.forEach((game) => assertGame(game.numbers));
    expect(new Set(result.games.map((game) => gameKey([...game.numbers].reverse()))).size).toBe(10);
  });

  it("creates ten games repeatedly without errors", () => {
    for (let index = 0; index < 10; index += 1) expect(generateRerollFromStats(stats).games).toHaveLength(10);
  });

  it("counts pairs and only uses the most recent 100 draws", () => { expect(stats.recentDrawCount).toBe(100); expect(stats.pairCounts[pairKey(41, 45)]).toBe(110); });
  it("reports invalid history", () => { expect(validateLottoHistory([{ round: 1, numbers: [1, 1, 2], bonus: 50 }])).not.toHaveLength(0); });
});

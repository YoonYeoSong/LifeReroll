import { describe, expect, it } from "vitest";
import { generateHistoricalGames } from "./historical";
import { generatePatternGames } from "./pattern";
import { gameKey, sharedNumberCount } from "./random";
import { calculateStatistics, pairKey } from "./statistics";
import type { LottoDraw } from "./types";
import { validateLottoHistory } from "./validation";

const draws: LottoDraw[] = Array.from({ length: 110 }, (_, index) => ({ round: index + 1, numbers: [1 + index % 10, 12 + index % 10, 22 + index % 9, 33 + index % 7, 41, 45].sort((a, b) => a - b), bonus: 11 }));
const stats = calculateStatistics(draws);
const assertGame = (game: number[]) => { expect(game).toHaveLength(6); expect(new Set(game).size).toBe(6); expect(game.every(number => number >= 1 && number <= 45)).toBe(true); expect([...game].sort((a,b)=>a-b)).toEqual(game); };

describe("lotto generators", () => {
  it("produces five valid, unique Historical games", () => { const games = generateHistoricalGames(stats); expect(games).toHaveLength(5); games.forEach(assertGame); expect(new Set(games.map(gameKey)).size).toBe(5); });
  it("produces five valid, distinct Pattern games", () => { const games = generatePatternGames(stats); expect(games).toHaveLength(5); games.forEach(assertGame); expect(new Set(games.map(gameKey)).size).toBe(5); expect(games.every((game,index)=>games.slice(0,index).every(other=>sharedNumberCount(game,other)<=4))).toBe(true); });
  it("counts pairs and only uses the most recent 100 draws", () => { expect(stats.recentDrawCount).toBe(100); expect(stats.pairCounts[pairKey(41,45)]).toBe(110); });
  it("reports invalid history", () => { expect(validateLottoHistory([{ round: 1, numbers: [1,1,2], bonus: 50 }])).not.toHaveLength(0); });
});

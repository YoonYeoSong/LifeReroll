import { GAME_SIZE, HISTORICAL_GAME_COUNT, LOTTO_MAX, LOTTO_MIN } from "./constants";
import { gameKey, sampleWeightedNumber, secureRandom, type RandomSource } from "./random";
import type { LottoStats } from "./types";

export function historicalWeights(stats: LottoStats): number[] {
  return Array.from({ length: LOTTO_MAX }, (_, index) => stats.overallCounts[index + LOTTO_MIN] + 1);
}

export function generateHistoricalGames(stats: LottoStats, excluded = new Set<string>(), random: RandomSource = secureRandom, count = HISTORICAL_GAME_COUNT): number[][] {
  const games: number[][] = [];
  const numbers = Array.from({ length: LOTTO_MAX }, (_, index) => index + LOTTO_MIN);
  let attempts = 0;

  while (games.length < count && attempts < 200) {
    attempts += 1;
    const available = [...numbers];
    const game: number[] = [];
    while (game.length < GAME_SIZE) {
      const weights = available.map((number) => stats.overallCounts[number] + 1);
      const picked = sampleWeightedNumber(available, weights, random);
      game.push(picked);
      available.splice(available.indexOf(picked), 1);
    }
    game.sort((left, right) => left - right);
    const key = gameKey(game);
    if (!excluded.has(key)) {
      excluded.add(key);
      games.push(game);
    }
  }
  return games;
}

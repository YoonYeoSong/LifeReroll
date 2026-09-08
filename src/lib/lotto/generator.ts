import { generateBalancedGame } from "./balanced";
import { COVERAGE_GAME_COUNT, RANDOM_GAME_COUNT, TOTAL_GAME_COUNT } from "./constants";
import { generateCoverageGame } from "./coverage";
import { generateCountertrendGame } from "./countertrend";
import { generateEnsembleGame } from "./ensemble";
import { generateHistoricalGames } from "./historical";
import { generatePatternGames } from "./pattern";
import { generatePairAvoidanceGame } from "./pair-avoidance";
import { randomGame, type RandomSource, secureRandom } from "./random";
import type { GeneratedGame, GeneratedGames, LottoStats, PickMethod } from "./types";
import { assertUniqueGames, gameKey } from "./utils";

function addGames(games: GeneratedGame[], numbers: number[][], method: PickMethod): void {
  numbers.forEach((game) => games.push({ method, numbers: game }));
}

function generateUniqueRandomGame(excluded: Set<string>, random: RandomSource): number[] {
  for (let attempts = 0; attempts < 200; attempts += 1) {
    const game = randomGame(random);
    const key = gameKey(game);
    if (!excluded.has(key)) {
      excluded.add(key);
      return game;
    }
  }
  throw new Error("Unable to generate a unique Pure Random Pick.");
}

/** Creates all ten games from an already-loaded statistics snapshot. */
export function generateRerollFromStats(stats: LottoStats, random: RandomSource = secureRandom): GeneratedGames {
  const used = new Set<string>();
  const games: GeneratedGame[] = [];
  addGames(games, generateHistoricalGames(stats, used, random), "Historical Pick");
  addGames(games, generatePatternGames(stats, used, random), "Pattern Pick");
  for (let index = 0; index < COVERAGE_GAME_COUNT; index += 1) games.push({ method: "Coverage Pick", numbers: generateCoverageGame(games.map((game) => game.numbers), used, random) });
  for (let index = 0; index < RANDOM_GAME_COUNT; index += 1) games.push({ method: "Pure Random", numbers: generateUniqueRandomGame(used, random) });
  games.push({ method: "Balanced Pick", numbers: generateBalancedGame(stats, used, random) });
  games.push({ method: "Countertrend Pick", numbers: generateCountertrendGame(stats, games.map((game) => game.numbers), used, random) });
  games.push({ method: "Pair Avoidance Pick", numbers: generatePairAvoidanceGame(stats, games.map((game) => game.numbers), used, random) });
  games.push({ method: "Ensemble Pick", numbers: generateEnsembleGame(stats, games.map((game) => game.numbers), used, random) });
  assertUniqueGames(games.map((game) => game.numbers), TOTAL_GAME_COUNT);
  return { games };
}

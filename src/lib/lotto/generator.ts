import { TOTAL_GAME_COUNT } from "./constants";
import { generateCoverageGame } from "./coverage";
import { generateEnsembleGame } from "./ensemble";
import { generateHistoricalGames } from "./historical";
import { generatePatternGames } from "./pattern";
import { randomGame, type RandomSource, secureRandom } from "./random";
import type { GeneratedGame, GeneratedGames, LottoStats } from "./types";
import { assertUniqueGames, gameKey } from "./utils";

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

/** Creates the five weekly strategies from an already-loaded statistics snapshot. */
export function generateRerollFromStats(stats: LottoStats, random: RandomSource = secureRandom): GeneratedGames {
  const used = new Set<string>();
  const games: GeneratedGame[] = [];
  games.push({ method: "Pattern Pick", numbers: generatePatternGames(stats, used, random)[0] });
  games.push({ method: "Historical Pick", numbers: generateHistoricalGames(stats, used, random)[0] });
  games.push({ method: "Ensemble", numbers: generateEnsembleGame(stats, games.map((game) => game.numbers), used, random) });
  games.push({ method: "Coverage", numbers: generateCoverageGame(games.map((game) => game.numbers), used, random) });
  games.push({ method: "Pure Random", numbers: generateUniqueRandomGame(used, random) });
  assertUniqueGames(games.map((game) => game.numbers), TOTAL_GAME_COUNT);
  return { games };
}

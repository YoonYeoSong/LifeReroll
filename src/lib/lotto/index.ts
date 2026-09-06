import history from "@/data/lotto-history.json";
import { generateHistoricalGames } from "./historical";
import { generatePatternGames } from "./pattern";
import { gameKey } from "./random";
import { calculateStatistics } from "./statistics";
import type { GeneratedGames, LottoDraw } from "./types";
import { validateLottoHistory } from "./validation";

export const LOTTO_HISTORY = history as LottoDraw[];
const historyErrors = validateLottoHistory(LOTTO_HISTORY);
if (historyErrors.length > 0) throw new Error(`Invalid lotto history: ${historyErrors.join(" ")}`);
export const LOTTO_STATS = calculateStatistics(LOTTO_HISTORY);
export const FIRST_ROUND = LOTTO_HISTORY[0].round;
export const LATEST_ROUND = LOTTO_HISTORY[LOTTO_HISTORY.length - 1].round;

export function generateReroll(): GeneratedGames {
  const used = new Set<string>();
  const historical = generateHistoricalGames(LOTTO_STATS, used);
  const pattern = generatePatternGames(LOTTO_STATS, used);
  if (historical.length !== 5 || pattern.length !== 5 || new Set([...historical, ...pattern].map(gameKey)).size !== 10) {
    throw new Error("Unable to produce a complete unique reroll.");
  }
  return { historical, pattern };
}

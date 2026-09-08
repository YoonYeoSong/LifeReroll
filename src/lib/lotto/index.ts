import history from "@/data/lotto-history.json";
import { generateRerollFromStats } from "./generator";
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
  return generateRerollFromStats(LOTTO_STATS);
}

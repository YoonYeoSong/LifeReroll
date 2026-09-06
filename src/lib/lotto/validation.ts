import { GAME_SIZE, LOTTO_MAX, LOTTO_MIN } from "./constants";
import type { LottoDraw } from "./types";

export function validateLottoHistory(draws: LottoDraw[]): string[] {
  const errors: string[] = [];
  const rounds = new Set<number>();

  draws.forEach((draw, index) => {
    const label = `Draw at index ${index}`;
    if (!Number.isInteger(draw.round) || draw.round < 1) errors.push(`${label} has an invalid round.`);
    if (rounds.has(draw.round)) errors.push(`${label} duplicates round ${draw.round}.`);
    rounds.add(draw.round);
    if (draw.numbers.length !== GAME_SIZE) errors.push(`${label} must have exactly six numbers.`);
    if (new Set(draw.numbers).size !== draw.numbers.length) errors.push(`${label} has duplicate winning numbers.`);
    if (draw.numbers.some((number) => !Number.isInteger(number) || number < LOTTO_MIN || number > LOTTO_MAX)) {
      errors.push(`${label} has a number outside 1–45.`);
    }
    if (!Number.isInteger(draw.bonus) || draw.bonus < LOTTO_MIN || draw.bonus > LOTTO_MAX) {
      errors.push(`${label} has an invalid bonus number.`);
    }
  });

  return errors;
}

import { LOTTO_MAX, LOTTO_MIN } from "./constants";

export { gameKey, sharedNumberCount } from "./utils";

export type RandomSource = () => number;

export const secureRandom: RandomSource = () => {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0] / 4_294_967_296;
  }
  return Math.random();
};

export function sampleWeightedNumber(numbers: number[], weights: number[], random: RandomSource = secureRandom): number {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = random() * total;
  for (let index = 0; index < numbers.length; index += 1) {
    cursor -= weights[index];
    if (cursor <= 0) return numbers[index];
  }
  return numbers[numbers.length - 1];
}

export function randomGame(random: RandomSource = secureRandom): number[] {
  const pool = Array.from({ length: LOTTO_MAX }, (_, index) => index + LOTTO_MIN);
  for (let index = 0; index < 6; index += 1) {
    const swapIndex = index + Math.floor(random() * (pool.length - index));
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }
  return pool.slice(0, 6).sort((left, right) => left - right);
}

import { GAME_SIZE, LOTTO_MAX, LOTTO_MIN } from "./constants";

/** Sorts a game into its canonical order, used for order-independent comparisons. */
export function normalizeGame(game: number[]): number[] {
  return [...game].sort((left, right) => left - right);
}

export function gameKey(game: number[]): string {
  return normalizeGame(game).join("-");
}

export function sharedNumberCount(left: number[], right: number[]): number {
  const rightNumbers = new Set(right);
  return left.filter((number) => rightNumbers.has(number)).length;
}

export function isValidGame(game: number[]): boolean {
  return game.length === GAME_SIZE
    && new Set(game).size === GAME_SIZE
    && game.every((number) => Number.isInteger(number) && number >= LOTTO_MIN && number <= LOTTO_MAX);
}

export function assertUniqueGames(games: number[][], expectedCount: number): void {
  if (games.length !== expectedCount || games.some((game) => !isValidGame(game)) || new Set(games.map(gameKey)).size !== expectedCount) {
    throw new Error("Unable to produce complete, valid, unique lotto games.");
  }
}

/** Converts values with any shared scale to a comparable 0–100 range. */
export function normalizeScores(values: number[]): number[] {
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  if (maximum === minimum) return values.map(() => 50);
  return values.map((value) => ((value - minimum) / (maximum - minimum)) * 100);
}

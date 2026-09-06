export const LOTTO_MIN = 1;
export const LOTTO_MAX = 45;
export const GAME_SIZE = 6;
export const GAMES_PER_METHOD = 5;
export const RECENT_DRAW_LIMIT = 100;
export const PATTERN_CANDIDATE_COUNT = 3_000;
export const MAX_SHARED_NUMBERS = 4;

export const PATTERN_WEIGHTS = {
  overall: 0.35,
  recent: 0.25,
  pair: 0.25,
  shape: 0.15,
} as const;

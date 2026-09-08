export const LOTTO_MIN = 1;
export const LOTTO_MAX = 45;
export const GAME_SIZE = 6;
export const HISTORICAL_GAME_COUNT = 2;
export const PATTERN_GAME_COUNT = 2;
export const COVERAGE_GAME_COUNT = 1;
export const RANDOM_GAME_COUNT = 1;
export const TOTAL_GAME_COUNT = 10;
export const RECENT_DRAW_LIMIT = 100;
export const PATTERN_CANDIDATE_COUNT = 3_000;
export const MAX_SHARED_NUMBERS = 4;
export const COVERAGE_CANDIDATE_COUNT = 700;
export const BALANCED_CANDIDATE_COUNT = 1_200;
export const ENSEMBLE_CANDIDATE_COUNT = 1_500;
export const COUNTERTREND_CANDIDATE_COUNT = 700;
export const PAIR_AVOIDANCE_CANDIDATE_COUNT = 700;

export const PATTERN_WEIGHTS = {
  overall: 0.35,
  recent: 0.25,
  pair: 0.25,
  shape: 0.15,
} as const;

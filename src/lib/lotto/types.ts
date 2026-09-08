export type LottoDraw = {
  round: number;
  numbers: number[];
  bonus: number;
};

export type NumberCounts = Record<number, number>;

export type LottoStats = {
  draws: LottoDraw[];
  overallCounts: NumberCounts;
  recentCounts: NumberCounts;
  pairCounts: Record<string, number>;
  recentDrawCount: number;
  shape: {
    averageSum: number;
    sumDeviation: number;
    averageGap: number;
  };
};

export type PickMethod = "Historical Pick" | "Pattern Pick" | "Coverage Pick" | "Pure Random" | "Balanced Pick" | "Countertrend Pick" | "Pair Avoidance Pick" | "Ensemble Pick";

export type GeneratedGame = {
  method: PickMethod;
  numbers: number[];
};

export type GeneratedGames = {
  games: GeneratedGame[];
};

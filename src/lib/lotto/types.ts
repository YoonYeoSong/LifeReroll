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

export type GeneratedGames = {
  historical: number[][];
  pattern: number[][];
};

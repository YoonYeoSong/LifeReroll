import { LottoBall } from "./LottoBall";
import type { GeneratedGame } from "@/lib/lotto/types";

const methodDescriptions = {
  "Historical Pick": "전체 출현 빈도를 가중치로 조합",
  "Pattern Pick": "빈도·최근·Pair·형태 점수를 조합",
  "Coverage Pick": "게임 간 겹침을 줄인 분산 조합",
  "Pure Random": "통계를 쓰지 않는 균등 무작위 조합",
  "Balanced Pick": "극단을 피한 균형 분포 조합",
  "Countertrend Pick": "상대적으로 낮은 출현 빈도 관점 조합",
  "Pair Avoidance Pick": "낮은 동반 출현 번호쌍 관점 조합",
  "Ensemble Pick": "여러 점수를 정규화한 종합 조합",
} as const;

const methodLabels = {
  "Historical Pick": "출현 빈도 픽",
  "Pattern Pick": "패턴 분석 픽",
  "Coverage Pick": "분산 조합 픽",
  "Pure Random": "순수 랜덤 픽",
  "Balanced Pick": "균형 분포 픽",
  "Countertrend Pick": "저빈도 관점 픽",
  "Pair Avoidance Pick": "동반출현 회피 픽",
  "Ensemble Pick": "종합 분석 픽",
} as const;

export function LottoGameList({ games, isRolling = false }: { games: GeneratedGame[]; isRolling?: boolean }) {
  return <ol className={`game-list${isRolling ? " is-rolling" : ""}`}>{games.map((game, index) => <li className="game-row" key={index}><span className="game-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><span className="game-method">{methodLabels[game.method]}</span><div className="balls" aria-label={isRolling ? `Game ${index + 1}: 번호 룰렛 진행 중` : `Game ${index + 1} ${methodLabels[game.method]}: ${game.numbers.join(", ")}`}>{game.numbers.map((number, ballIndex) => <LottoBall key={ballIndex} number={number} />)}</div><span className="game-description">{methodDescriptions[game.method]}</span></li>)}</ol>;
}

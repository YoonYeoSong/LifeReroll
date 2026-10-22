import { LottoBall } from "./LottoBall";
import type { GeneratedGame } from "@/lib/lotto/types";

const methodDescriptions = {
  "Historical Pick": "전체 출현 빈도를 가중치로 조합",
  "Pattern Pick": "빈도·최근·Pair·형태 점수를 조합",
  "Ensemble": "패턴·역대 빈도 신호를 정규화해 결합",
  "Coverage": "앞선 게임의 번호 분포를 참고한 분산 조합",
  "Pure Random": "통계를 쓰지 않는 균등 무작위 조합",
} as const;

const methodLabels = {
  "Historical Pick": "출현 빈도 픽",
  "Pattern Pick": "패턴 분석 픽",
  "Ensemble": "앙상블 픽",
  "Coverage": "커버리지 픽",
  "Pure Random": "순수 랜덤 픽",
} as const;

export function LottoGameList({ games, isRolling = false }: { games: GeneratedGame[]; isRolling?: boolean }) {
  return <ol className={`game-list${isRolling ? " is-rolling" : ""}`}>{games.map((game, index) => <li className="game-row" key={index}><span className="game-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><span className="game-method">{methodLabels[game.method]}</span><div className="balls" aria-label={isRolling ? `Game ${index + 1}: 번호 룰렛 진행 중` : `Game ${index + 1} ${methodLabels[game.method]}: ${game.numbers.join(", ")}`}>{game.numbers.map((number, ballIndex) => <LottoBall key={ballIndex} number={number} />)}</div><span className="game-description">{methodDescriptions[game.method]}</span></li>)}</ol>;
}

import { LottoBall } from "./LottoBall";
import type { GeneratedGame } from "@/lib/lotto/types";

export function LottoGameList({ games, isRolling = false }: { games: GeneratedGame[]; isRolling?: boolean }) {
  return <ol className={`game-list${isRolling ? " is-rolling" : ""}`}>{games.map((game, index) => <li className="game-row" key={index}><span className="game-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><span className="game-method">{game.method}</span><div className="balls" aria-label={isRolling ? `Game ${index + 1}: 번호 룰렛 진행 중` : `Game ${index + 1} ${game.method}: ${game.numbers.join(", ")}`}>{game.numbers.map((number, ballIndex) => <LottoBall key={ballIndex} number={number} />)}</div></li>)}</ol>;
}

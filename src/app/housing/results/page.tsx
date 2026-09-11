import { Disclaimers } from "@/components/housing/Disclaimers";
import { HousingNav } from "@/components/housing/HousingNav";
import { Results } from "@/components/housing/Results";
export const metadata = { title: "맞춤 청약 플랜 | 청약핏" };
export default function ResultsPage() { return <div className="shell housing-page"><HousingNav /><header className="housing-heading"><p className="housing-kicker">ESTIMATED FINANCING PLAN</p><h1>분양 자금·대출 예상 플랜</h1><p>예시 분양 정보를 기준으로 예상 대출 범위와 추가 필요자금을 먼저 비교하는 참고용 시뮬레이션입니다.</p></header><Results /><Disclaimers historical /></div>; }

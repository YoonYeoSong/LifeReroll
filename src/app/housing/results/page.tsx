import { Disclaimers } from "@/components/housing/Disclaimers";
import { HousingNav } from "@/components/housing/HousingNav";
import { Results } from "@/components/housing/Results";
export const metadata = { title: "맞춤 청약 플랜 | 청약핏" };
export default function ResultsPage() { return <div className="shell housing-page"><HousingNav /><header className="housing-heading"><p className="housing-kicker">CHEONGYAK FIT PLAN</p><h1>내 조건 기반 청약 플랜</h1><p>가능한 공고를 추리고, 자금 부담과 리스크를 먼저 비교하는 참고 분석입니다.</p></header><Results /><Disclaimers historical /></div>; }

import { Disclaimers } from "@/components/housing/Disclaimers";
import { HousingNav } from "@/components/housing/HousingNav";
import { Results } from "@/components/housing/Results";
export const metadata = { title: "맞춤 청약 결과 | 청약핏" };
export default function ResultsPage() { return <div className="shell housing-page"><HousingNav /><header className="housing-heading"><p className="housing-kicker">CHEONGYAK FIT RESULTS</p><h1>맞춤 청약 결과</h1><p>현재 입력 프로필을 테스트용 공공분양 공고에 적용한 참고 분석입니다.</p></header><Results /><Disclaimers /></div>; }

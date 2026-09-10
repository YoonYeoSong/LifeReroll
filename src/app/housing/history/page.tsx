import { Disclaimers } from "@/components/housing/Disclaimers";
import { HistoricalResults } from "@/components/housing/HistoricalResults";
import { HousingNav } from "@/components/housing/HousingNav";
export const metadata = { title: "과거 청약 | 청약핏" };
export default function HistoryPage() { return <div className="shell housing-page"><HousingNav /><header className="housing-heading"><p className="housing-kicker">HISTORICAL REFERENCE</p><h1>과거 청약 참고 분석</h1><p>현재 프로필을 과거 테스트 공고에 적용해 살펴볼 수 있습니다.</p></header><HistoricalResults /><Disclaimers historical /></div>; }

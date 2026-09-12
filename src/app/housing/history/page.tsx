import { Disclaimers } from "@/components/housing/Disclaimers";
import { HistoricalResults } from "@/components/housing/HistoricalResults";
import { HousingNav } from "@/components/housing/HousingNav";
export const metadata = { title: "과거 청약 | 청약핏" };
export default function HistoryPage() { return <div className="shell housing-page"><HousingNav /><header className="housing-heading"><p className="housing-kicker">HISTORICAL REFERENCE</p><h1>과거 청약 참고 분석</h1><p>검증된 실제 과거 공고만 표시합니다.</p></header><HistoricalResults /><Disclaimers historical /></div>; }

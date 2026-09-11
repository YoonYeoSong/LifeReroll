import { Disclaimers } from "@/components/housing/Disclaimers";
import { HousingNav } from "@/components/housing/HousingNav";
import { NoticesClient } from "@/components/housing/NoticesClient";
export const metadata = { title: "청약 공고 | 청약핏" };
export default function NoticesPage() { return <div className="shell housing-page"><HousingNav /><header className="housing-heading"><p className="housing-kicker">NOTICE FEED</p><h1>청약 공고</h1><NoticesClient /></header><Disclaimers /></div>; }

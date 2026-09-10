import { Disclaimers } from "@/components/housing/Disclaimers";
import { HousingNav } from "@/components/housing/HousingNav";
import { ProfileWizard } from "@/components/housing/ProfileWizard";
export const metadata = { title: "내 청약 프로필 | 청약핏" };
export default function ProfilePage() { return <div className="shell housing-page"><HousingNav /><header className="housing-heading"><p className="housing-kicker">CHEONGYAK FIT PROFILE</p><h1>내 청약 프로필</h1><p>필요한 판단 정보만 입력합니다. 입력값은 서버나 데이터베이스에 저장되지 않습니다.</p></header><ProfileWizard /><Disclaimers /></div>; }

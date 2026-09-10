import Link from "next/link";
const links = [{ href: "/housing", label: "홈" }, { href: "/housing/profile", label: "내 청약 프로필" }, { href: "/housing/results", label: "맞춤 결과" }, { href: "/housing/notices", label: "청약 공고" }, { href: "/housing/history", label: "과거 청약" }, { href: "/housing/about", label: "서비스 안내" }];
export function HousingNav() { return <nav className="housing-nav" aria-label="청약핏 메뉴">{links.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav>; }

import Link from "next/link";
const links = [{ href: "/housing", label: "홈" }, { href: "/housing/profile", label: "내 자금 입력" }, { href: "/housing/results", label: "대출·자금 플랜" }, { href: "/housing/about", label: "서비스 안내" }];
export function HousingNav() { return <nav className="housing-nav" aria-label="청약핏 메뉴">{links.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav>; }

"use client";
import Link from "next/link"; import { usePathname } from "next/navigation";
const links=[{href:"/",label:"Reroll"},{href:"/housing",label:"청약핏"},{href:"/statistics",label:"Statistics"},{href:"/about",label:"About"}];
export function Header(){const pathname=usePathname();return <header className="header"><div className="shell header-inner"><Link className="brand" href="/" aria-label="LifeReroll home">Life<span className="brand-mark">Reroll</span></Link><nav className="nav" aria-label="Main navigation">{links.map(link=><Link key={link.href} href={link.href} aria-current={pathname===link.href?"page":undefined}>{link.label}</Link>)}</nav></div></header>}

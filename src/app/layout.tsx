import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "LifeReroll - Lotto Number Generator",
  description: "과거 로또 6/45 데이터를 기반으로 Historical Pick과 Pattern Pick을 생성하는 무료 로또 번호 생성 서비스.",
  openGraph: { title: "LifeReroll - Lotto Number Generator", description: "현생은 리롤이 안 되지만, 번호는 리롤할 수 있습니다.", type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko"><body><Header /><main>{children}</main><Footer /></body></html>;
}

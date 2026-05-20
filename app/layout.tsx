import type { Metadata } from "next";
import "./globals.css";
import SiteShell from "@/components/SiteShell";

export const metadata: Metadata = {
  title: "고운빛한의원 — 한 첩의 위로와 회복",
  description:
    "전통 한의학의 지혜와 현대 의학의 정밀함을 함께 담아, 당신의 건강한 일상을 처방합니다.",
  openGraph: {
    title: "고운빛한의원 — 한 첩의 위로와 회복",
    description: "전통 한의학의 지혜로 당신의 건강한 일상을 처방합니다.",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body suppressHydrationWarning>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}

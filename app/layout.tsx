import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import JsonLd from "@/components/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gowoonbit-kmc.com";
const SITE_NAME = "고운빛한의원";
const SITE_DESCRIPTION =
  "여의도 고운빛한의원 — 전통 한의학의 지혜와 현대 의학의 정밀함을 함께 담아, 당신의 건강한 일상을 처방합니다. 통증치료, 자동차보험, 다이어트, 추나요법, 점빼기, 리프팅, 레이저 시술 전문.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — 한 첩의 위로와 회복`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "여의도한의원", "고운빛한의원", "여의도점빼기", "여의도리프팅", "여의도레이저",
    "통증치료", "추나요법", "자동차보험한의원", "다이어트한의원", "한방치료",
    "침치료", "한약", "여의도피부시술", "한의원점빼기", "한의원리프팅",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    title: `${SITE_NAME} — 한 첩의 위로와 회복`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "ko_KR",
    alternateLocale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - 전통 한의학의 지혜로 건강한 일상을 처방합니다`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — 한 첩의 위로와 회복`,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    google: "YOUR_GOOGLE_VERIFICATION_CODE",
    other: {
      "naver-site-verification": "YOUR_NAVER_VERIFICATION_CODE",
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2C2620",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <JsonLd />
      </head>
      <body suppressHydrationWarning>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}

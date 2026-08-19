import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "시술 안내",
  description:
    "고운빛한의원의 시술 종류와 가격을 한눈에 확인하세요. 분류별 시술 안내와 진행 중인 할인가를 함께 안내해 드립니다.",
  openGraph: {
    title: "시술 안내 | 고운빛한의원",
    description:
      "고운빛한의원의 시술 종류와 가격을 한눈에 확인하세요.",
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

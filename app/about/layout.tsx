import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "한의원 소개",
  description:
    "고운빛한의원의 진료 철학과 대표원장을 소개합니다. 전통 한의학의 지혜와 현대 의학의 정밀함으로 환자 중심 치료를 실천합니다.",
  openGraph: {
    title: "한의원 소개 | 고운빛한의원",
    description:
      "고운빛한의원의 진료 철학과 대표원장을 소개합니다.",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}

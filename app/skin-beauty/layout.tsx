import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "피부미용",
  description: "고운빛한의원의 리프팅, 레이저, 스킨부스터 등 피부미용 시술을 소개합니다.",
  openGraph: {
    title: "피부미용 | 고운빛한의원",
    description: "고운빛한의원의 리프팅, 레이저, 스킨부스터 등 피부미용 시술을 소개합니다.",
  },
};

export default function SkinBeautyLayout({ children }: { children: React.ReactNode }) {
  return children;
}

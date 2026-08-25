import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "한방치료",
  description: "고운빛한의원의 통증치료, 교통사고 후유증, 한약클리닉, 추나치료, 약침치료를 소개합니다.",
  openGraph: {
    title: "한방치료 | 고운빛한의원",
    description: "고운빛한의원의 통증치료, 교통사고 후유증, 한약클리닉, 추나치료, 약침치료를 소개합니다.",
  },
};

export default function KoreanTreatmentLayout({ children }: { children: React.ReactNode }) {
  return children;
}

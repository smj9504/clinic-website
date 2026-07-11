import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "자주 묻는 질문",
  description:
    "고운빛한의원에 대해 자주 묻는 질문과 답변을 확인하세요. 진료 예약, 치료 과정, 보험 적용 등 궁금한 사항을 안내합니다.",
  openGraph: {
    title: "자주 묻는 질문 | 고운빛한의원",
    description:
      "고운빛한의원에 대해 자주 묻는 질문과 답변을 확인하세요.",
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이벤트",
  description:
    "고운빛한의원에서 진행 중인 이벤트와 프로모션 정보를 확인하세요. 다양한 한방 치료 할인 및 특별 프로그램을 만나보실 수 있습니다.",
  openGraph: {
    title: "이벤트 | 고운빛한의원",
    description:
      "고운빛한의원에서 진행 중인 이벤트와 프로모션 정보를 확인하세요.",
  },
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

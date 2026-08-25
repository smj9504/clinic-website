import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "예약 신청",
  description:
    "고운빛한의원 방문 상담·예약을 신청하세요. 접수 후 담당자가 확인하여 안내드립니다.",
  openGraph: {
    title: "예약 신청 | 고운빛한의원",
    description: "고운빛한의원 방문 상담·예약을 신청하세요.",
  },
};

export default function ReservationLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "공지사항",
  description:
    "고운빛한의원의 최신 공지사항과 병원 소식을 확인하세요. 진료 일정 변경, 휴진 안내 등 중요한 정보를 전달합니다.",
  openGraph: {
    title: "공지사항 | 고운빛한의원",
    description:
      "고운빛한의원의 최신 공지사항과 병원 소식을 확인하세요.",
  },
};

export default function NoticeLayout({ children }: { children: React.ReactNode }) {
  return children;
}

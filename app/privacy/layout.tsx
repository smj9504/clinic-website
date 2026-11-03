import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "홈페이지 개인정보 처리방침",
  description: "고운빛한의원 홈페이지의 개인정보 처리방침입니다. 상담 신청 시 처리하는 개인정보의 항목, 목적, 보유기간과 정보주체의 권리를 안내합니다.",
  openGraph: {
    title: "홈페이지 개인정보 처리방침 | 고운빛한의원",
    description: "고운빛한의원 홈페이지의 개인정보 처리방침입니다.",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}

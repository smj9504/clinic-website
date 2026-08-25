import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "시술 안내",
  description: "고운빛한의원의 피부미용·한방치료 세부 시술 안내를 확인하세요.",
  openGraph: {
    title: "시술 안내 | 고운빛한의원",
    description: "고운빛한의원의 피부미용·한방치료 세부 시술 안내를 확인하세요.",
  },
};

export default function SubPagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

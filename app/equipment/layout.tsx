import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "장비소개",
  description: "고운빛한의원이 보유한 시술 장비를 소개합니다.",
  openGraph: {
    title: "장비소개 | 고운빛한의원",
    description: "고운빛한의원이 보유한 시술 장비를 소개합니다.",
  },
};

export default function EquipmentLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "진료 안내",
  description:
    "고운빛한의원의 진료 과목을 안내합니다. 통증치료, 자동차보험치료, 다이어트, 추나요법, 한방 내과 등 다양한 한방 치료를 제공합니다.",
  openGraph: {
    title: "진료 안내 | 고운빛한의원",
    description:
      "통증치료, 자동차보험치료, 다이어트, 추나요법 등 다양한 한방 치료를 제공합니다.",
  },
};

export default function TreatmentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";
import AdminLayout from "@/components/admin/AdminLayout";

/**
 * 관리자 화면은 검색 결과에 나오지 않게 한다.
 * robots.txt의 Disallow는 "수집하지 말라"는 뜻일 뿐, 다른 곳에 링크가 걸리면 주소가
 * 검색 결과에 남을 수 있다. noindex는 next.config.mjs의 X-Robots-Tag와 함께 건다.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}

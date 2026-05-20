"use client";

import Link from "next/link";
import { useSiteDataForLocale } from "@/lib/useSiteData";
import { useAdminLocale } from "@/lib/adminLocale";
import { PageHeader, Card } from "@/components/admin/ui";

export default function AdminDashboard() {
  const { editingLocale } = useAdminLocale();
  const data = useSiteDataForLocale(editingLocale);

  const stats = [
    { label: "활성 메뉴", value: data.menus.filter((m) => !m.isHidden).length, href: "/admin/menus" },
    { label: "히어로 슬라이드", value: data.heroSlides.length, href: "/admin/settings" },
    { label: "이벤트", value: data.events.length, href: "/admin/events" },
    { label: "공지사항", value: data.notices.length, href: "/admin/notices" },
    { label: "FAQ", value: data.faqs.length, href: "/admin/faqs" },
    { label: "팝업", value: data.popup.isActive ? "활성" : "비활성", href: "/admin/popups" },
  ];

  return (
    <>
      <PageHeader
        title="대시보드"
        description="한의원 홈페이지의 모든 콘텐츠를 한 곳에서 관리하세요."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="block bg-surface border border-line rounded-lg p-5 hover:border-accent transition-colors"
          >
            <div
              className="text-xs text-ink-muted uppercase mb-2"
              style={{ letterSpacing: "0.15em" }}
            >
              {s.label}
            </div>
            <div
              className="font-display"
              style={{
                fontSize: "1.875rem",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1,
              }}
            >
              {s.value}
            </div>
          </Link>
        ))}
      </div>

      <Card>
        <h2
          className="font-display mb-4"
          style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.03em" }}
        >
          빠른 가이드
        </h2>
        <ul className="space-y-3 text-sm text-ink-soft" style={{ lineHeight: 1.8 }}>
          <li>
            <strong className="text-ink">메뉴 관리</strong> — 상단 네비게이션의 메뉴 이름·순서·표시 여부를 변경할 수 있습니다.
          </li>
          <li>
            <strong className="text-ink">이벤트·공지사항·FAQ</strong> — 추가/수정/삭제 및 순서 변경이 가능합니다.
          </li>
          <li>
            <strong className="text-ink">대표원장 / 사이트 설정</strong> — 한의원 정보, 히어로 슬라이드, 진료 안내까지 모두 편집 가능합니다.
          </li>
          <li>
            <strong className="text-ink">팝업</strong> — 이달의 이벤트 팝업의 내용·이미지·활성화 여부를 설정할 수 있습니다.
          </li>
          <li>
            모든 변경사항은 <strong className="text-ink">즉시 사이트에 반영</strong>됩니다. 우측 상단의 &ldquo;사이트 미리보기&rdquo;로 확인하세요.
          </li>
        </ul>
      </Card>
    </>
  );
}

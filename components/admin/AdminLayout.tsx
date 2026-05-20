"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isLoggedIn, logout, resetSiteData, translateAndSyncToEnglish } from "@/lib/storage";
import { AdminLocaleProvider, useAdminLocale } from "@/lib/adminLocale";
import { Toast } from "@/components/admin/ui";
import type { Locale } from "@/lib/i18n";

const adminMenu = [
  { href: "/admin", label: "대시보드", icon: "◎" },
  { href: "/admin/menus", label: "메뉴 관리", icon: "≡" },
  { href: "/admin/events", label: "이벤트", icon: "◆" },
  { href: "/admin/director", label: "대표원장", icon: "◉" },
  { href: "/admin/notices", label: "공지사항", icon: "▤" },
  { href: "/admin/faqs", label: "FAQ", icon: "?" },
  { href: "/admin/popups", label: "이벤트 팝업", icon: "◫" },
  { href: "/admin/schedule", label: "진료일정 팝업", icon: "▦" },
  { href: "/admin/settings", label: "사이트 설정", icon: "⚙" },
];

function LocaleToggle() {
  const { editingLocale, setEditingLocale } = useAdminLocale();
  const [translating, setTranslating] = useState(false);
  const [translateMsg, setTranslateMsg] = useState<string | null>(null);

  const handleAutoTranslate = async () => {
    if (!confirm("한국어 콘텐츠를 영어로 자동 번역합니다.\n기존 영어 콘텐츠가 덮어씌워집니다.\n\n계속하시겠습니까?")) return;
    setTranslating(true);
    setTranslateMsg(null);
    const result = await translateAndSyncToEnglish();
    setTranslating(false);
    if (result.success) {
      setTranslateMsg("번역 완료!");
      setTimeout(() => setTranslateMsg(null), 3000);
    } else {
      setTranslateMsg("번역 실패: " + (result.error || "알 수 없는 오류"));
      setTimeout(() => setTranslateMsg(null), 5000);
    }
  };

  return (
    <div className="px-6 py-3 border-b border-white/10">
      <div className="text-[0.65rem] uppercase text-white/40 mb-2" style={{ letterSpacing: "0.15em" }}>
        편집 언어
      </div>
      <div className="flex gap-1">
        {(["ko", "en"] as Locale[]).map((l) => (
          <button
            key={l}
            onClick={() => setEditingLocale(l)}
            className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${
              editingLocale === l
                ? "bg-accent text-ink-inverse"
                : "bg-white/10 text-white/60 hover:bg-white/15"
            }`}
          >
            {l === "ko" ? "한국어" : "English"}
          </button>
        ))}
      </div>
      <button
        onClick={handleAutoTranslate}
        disabled={translating}
        className="w-full mt-2 py-1.5 text-[0.7rem] font-semibold rounded bg-white/10 text-white/70 hover:bg-white/15 hover:text-white transition-colors disabled:opacity-50"
      >
        {translating ? "번역 중..." : "한국어 → 영어 자동 번역"}
      </button>
      {translateMsg && (
        <div className={`mt-1.5 text-[0.65rem] ${translateMsg.includes("실패") ? "text-red-400" : "text-green-400"}`}>
          {translateMsg}
        </div>
      )}
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onError = (e: Event) => {
      setSaveError((e as CustomEvent).detail ?? "저장에 실패했습니다.");
    };
    window.addEventListener("siteDataSaveError", onError);
    return () => window.removeEventListener("siteDataSaveError", onError);
  }, []);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setReady(true);
      return;
    }
    if (!isLoggedIn()) {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-ink-muted">불러오는 중...</div>
      </div>
    );
  }

  if (pathname === "/admin/login") return <>{children}</>;

  const onLogout = () => {
    logout();
    router.replace("/admin/login");
  };

  const onReset = () => {
    if (
      confirm(
        "모든 콘텐츠가 초기 상태로 되돌아갑니다.\n(데모용 기능 - 실 운영에서는 사용하지 마세요)\n\n계속하시겠습니까?"
      )
    ) {
      resetSiteData();
      alert("초기화 완료. 페이지를 새로고침합니다.");
      location.reload();
    }
  };

  return (
    <AdminLocaleProvider>
      {saveError && <Toast message={saveError} onClose={() => setSaveError(null)} variant="error" />}
      <div className="min-h-screen flex bg-[#FAFAFA]">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`w-64 bg-surface-dark text-ink-inverse flex flex-col fixed h-screen z-30 transition-transform duration-200 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="p-6 border-b border-white/10">
            <Link href="/admin" className="block">
              <div
                className="font-display font-bold mb-1"
                style={{ fontSize: "1.25rem", letterSpacing: "-0.03em" }}
              >
                고운빛한의원
              </div>
              <div className="text-xs opacity-60" style={{ letterSpacing: "0.1em" }}>
                ADMIN PANEL
              </div>
            </Link>
          </div>

          <LocaleToggle />

          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            {adminMenu.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm mb-1 transition-colors ${
                    active
                      ? "bg-white/15 text-ink-inverse"
                      : "text-white/70 hover:bg-white/5 hover:text-ink-inverse"
                  }`}
                  style={{ letterSpacing: "-0.02em" }}
                >
                  <span className="w-5 text-center opacity-70">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-white/10 space-y-1">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-white/70 hover:bg-white/5 hover:text-ink-inverse transition-colors"
              style={{ letterSpacing: "-0.02em" }}
            >
              <span className="w-5 text-center opacity-70">↗</span>
              <span>사이트 미리보기</span>
            </Link>
            <button
              onClick={onReset}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-white/70 hover:bg-white/5 hover:text-ink-inverse transition-colors text-left"
              style={{ letterSpacing: "-0.02em" }}
            >
              <span className="w-5 text-center opacity-70">↺</span>
              <span>데모 초기화</span>
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-white/70 hover:bg-white/5 hover:text-ink-inverse transition-colors text-left"
              style={{ letterSpacing: "-0.02em" }}
            >
              <span className="w-5 text-center opacity-70">⏻</span>
              <span>로그아웃</span>
            </button>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 md:ml-64 min-w-0">
          {/* Mobile top bar */}
          <div className="md:hidden sticky top-0 z-10 bg-surface border-b border-line flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded hover:bg-bg-alt transition-colors text-xl leading-none"
              aria-label="메뉴 열기"
            >
              ☰
            </button>
            <span className="font-semibold text-sm" style={{ letterSpacing: "-0.02em" }}>
              고운빛한의원 관리자
            </span>
          </div>
          <div className="p-4 md:p-10 max-w-6xl">{children}</div>
        </div>
      </div>
    </AdminLocaleProvider>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSiteData } from "@/lib/useSiteData";
import { useLocale, useT } from "@/lib/i18n";
import type { MenuItem } from "@/lib/storage";

function isItemActive(item: MenuItem, pathname: string): boolean {
  const matches = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  if (matches(item.href)) return true;
  return (item.children ?? []).some((c) => matches(c.href));
}

export default function Nav() {
  const { menus, clinicInfo } = useSiteData();
  const { locale, setLocale } = useLocale();
  const t = useT();
  const pathname = usePathname() || "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [mobileExpandedId, setMobileExpandedId] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const visibleMenus = [...menus]
    .filter((m) => !m.isHidden)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((m) => ({
      ...m,
      children: (m.children ?? [])
        .filter((c) => !c.isHidden)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }));

  const openDropdown = (id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenId(id);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenId(null), 150);
  };

  const closeMobile = () => {
    setMobileOpen(false);
    setMobileExpandedId(null);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-line transition-all duration-300 ease-out ${
        scrolled ? "h-16" : "h-20"
      }`}
      style={{ background: "rgba(251, 250, 247, 0.85)" }}
    >
      <div className="h-full flex items-center justify-between container-wide">
        <Link
          href="/"
          className="font-display font-bold text-xl text-accent"
          style={{ letterSpacing: "-0.04em" }}
        >
          {clinicInfo.name}
        </Link>

        <ul className="hidden lg:flex gap-10 list-none">
          {visibleMenus.map((item) => {
            const isActive = isItemActive(item, pathname);
            const hasChildren = item.children.length > 0;
            return (
              <li
                key={item.id}
                className="relative"
                onMouseEnter={() => hasChildren && openDropdown(item.id)}
                onMouseLeave={() => hasChildren && scheduleClose()}
              >
                <Link
                  href={item.href}
                  className={`text-base font-medium transition-colors relative group inline-block ${
                    isActive ? "text-accent" : "hover:text-accent"
                  }`}
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-2 left-0 h-px bg-accent transition-all duration-300 ease-out ${
                      isActive ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>

                {hasChildren && (
                  <div
                    className={`nav-dropdown absolute left-0 top-full pt-4 ${
                      openId === item.id ? "open" : ""
                    }`}
                  >
                    <ul
                      className="list-none bg-bg border border-line rounded-lg shadow-lg py-2"
                      style={{ minWidth: "200px" }}
                    >
                      {item.children.map((child) => (
                        <li key={child.id}>
                          <Link
                            href={child.href}
                            onClick={() => {
                              // setOpenId(null)을 동기 실행하면 드롭다운이 즉시 pointer-events:none이
                              // 되면서 Next.js Link의 클라이언트 라우팅 클릭 핸들러보다 먼저 클릭을
                              // 무효화하는 레이스가 생긴다. 네비게이션이 시작된 뒤 닫히도록 지연시킨다.
                              setTimeout(() => setOpenId(null), 0);
                            }}
                            className={`block px-5 py-2.5 text-sm whitespace-nowrap transition-colors ${
                              pathname.startsWith(child.href)
                                ? "text-accent font-semibold"
                                : "text-ink-soft hover:text-accent hover:bg-bg-alt"
                            }`}
                            style={{ letterSpacing: "-0.01em" }}
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="flex items-center border border-line rounded-full overflow-hidden text-xs font-semibold">
            <button
              onClick={() => setLocale("ko")}
              className={`px-3 py-3.5 transition-colors ${
                locale === "ko"
                  ? "bg-ink text-ink-inverse"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              KO
            </button>
            <button
              onClick={() => setLocale("en")}
              className={`px-3 py-3.5 transition-colors ${
                locale === "en"
                  ? "bg-ink text-ink-inverse"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              EN
            </button>
          </div>

          <Link
            href="/reservation"
            className="hidden md:inline-flex px-4 py-2.5 text-sm font-medium text-ink-soft hover:text-accent transition-colors"
            style={{ letterSpacing: "-0.02em" }}
          >
            {t("nav.reservationRequest")}
          </Link>

          <a
            href={clinicInfo.reservationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex px-5 py-2.5 border border-ink rounded-full text-sm font-medium hover:bg-ink hover:text-ink-inverse transition-all duration-200"
            style={{ letterSpacing: "-0.02em" }}
          >
            {t("nav.reservation")}
          </a>

          <button
            className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={() => (mobileOpen ? closeMobile() : setMobileOpen(true))}
            aria-label={t("nav.menuOpen")}
          >
            <div className="space-y-1.5">
              <div className="w-5 h-px bg-ink" />
              <div className="w-5 h-px bg-ink" />
              <div className="w-5 h-px bg-ink" />
            </div>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-bg border-b border-line max-h-[calc(100dvh-5rem)] overflow-y-auto">
          <ul className="container-default py-6 space-y-1 list-none">
            {visibleMenus.map((item) => {
              const hasChildren = item.children.length > 0;
              const expanded = mobileExpandedId === item.id;
              return (
                <li key={item.id}>
                  <div className="flex items-center">
                    <Link
                      href={item.href}
                      onClick={closeMobile}
                      className="flex-1 block py-3 text-base font-medium"
                      style={{ letterSpacing: "-0.02em" }}
                    >
                      {item.label}
                    </Link>
                    {hasChildren && (
                      <button
                        onClick={() =>
                          setMobileExpandedId(expanded ? null : item.id)
                        }
                        aria-expanded={expanded}
                        aria-label={t("nav.submenuToggle")}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-ink-muted"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`transition-transform duration-300 ${
                            expanded ? "rotate-180" : ""
                          }`}
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {hasChildren && (
                    <div className={`nav-accordion ${expanded ? "open" : ""}`}>
                      <div>
                        <ul className="list-none pl-4 pb-2 space-y-1">
                          {item.children.map((child) => (
                            <li key={child.id}>
                              <Link
                                href={child.href}
                                onClick={closeMobile}
                                className="block py-2 text-sm text-ink-soft"
                                style={{ letterSpacing: "-0.01em" }}
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
            <li className="pt-2 mt-2 border-t border-line">
              <Link
                href="/reservation"
                onClick={closeMobile}
                className="block py-3 text-base font-medium text-accent"
                style={{ letterSpacing: "-0.02em" }}
              >
                {t("nav.reservationRequest")}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}

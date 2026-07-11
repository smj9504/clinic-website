"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSiteData } from "@/lib/useSiteData";
import { useLocale, useT } from "@/lib/i18n";

export default function Nav() {
  const { menus, clinicInfo } = useSiteData();
  const { locale, setLocale } = useLocale();
  const t = useT();
  const pathname = usePathname() || "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const visibleMenus = [...menus]
    .filter((m) => !m.isHidden)
    .sort((a, b) => a.sortOrder - b.sortOrder);

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
          className="font-display font-bold text-xl"
          style={{ letterSpacing: "-0.04em" }}
        >
          {clinicInfo.name}
        </Link>

        <ul className="hidden lg:flex gap-10 list-none">
          {visibleMenus.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`text-sm font-medium transition-colors relative group ${
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
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="flex items-center border border-line rounded-full overflow-hidden text-xs font-semibold">
            <button
              onClick={() => setLocale("ko")}
              className={`px-3 py-1.5 transition-colors ${
                locale === "ko"
                  ? "bg-ink text-ink-inverse"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              KO
            </button>
            <button
              onClick={() => setLocale("en")}
              className={`px-3 py-1.5 transition-colors ${
                locale === "en"
                  ? "bg-ink text-ink-inverse"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              EN
            </button>
          </div>

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
            className="lg:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
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
        <div className="lg:hidden absolute top-full left-0 right-0 bg-bg border-b border-line">
          <ul className="container-default py-6 space-y-4">
            {visibleMenus.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 text-base font-medium"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}

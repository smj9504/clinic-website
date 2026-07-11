"use client";

import Link from "next/link";
import { useSiteData } from "@/lib/useSiteData";
import { useT } from "@/lib/i18n";
import { useScrollReveal, useScrollRevealGroup } from "@/lib/useScrollReveal";
import type { EndedVisibility } from "@/lib/storage";

function isHidden(item: { startDate?: string; endDate?: string }, hideRule?: EndedVisibility) {
  const today = new Date().toISOString().slice(0, 10);
  if (item.startDate && item.startDate > today) return true;
  if (!item.endDate || item.endDate >= today) return false;
  if (hideRule === undefined) return false;
  if (hideRule === "immediately") return true;
  const endDate = new Date(item.endDate);
  endDate.setDate(endDate.getDate() + hideRule);
  return endDate.toISOString().slice(0, 10) <= today;
}

export default function NoticeSection() {
  const { notices, noticeEndedHide } = useSiteData();
  const t = useT();
  const featured = notices.filter((n) => !isHidden(n, noticeEndedHide)).slice(0, 4);
  const headerRef = useScrollReveal<HTMLDivElement>();
  const listRef = useScrollRevealGroup<HTMLDivElement>();

  return (
    <section className="py-20 md:py-36 bg-bg-alt">
      <div className="container-default">
        <div ref={headerRef} className="reveal-fade-up flex flex-wrap items-end justify-between gap-6 mb-16">
          <div>
            <span className="section-label block mb-4">Community</span>
            <h2 className="section-title">{t("section.notices")}</h2>
            <div className="section-divider" />
          </div>
          <Link href="/community/notice" className="more-link">
            {t("section.more")}
          </Link>
        </div>

        <div ref={listRef} className="border-t border-line">
          {featured.map((notice) => (
            <Link
              key={notice.id}
              href={`/community/notice#${notice.id}`}
              className="flex items-center justify-between py-7 border-b border-line cursor-pointer hover:pl-4 transition-all duration-300"
              data-reveal-item
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <span
                  className={`inline-block text-[0.7rem] font-semibold uppercase px-2.5 py-1 rounded-sm whitespace-nowrap ${
                    notice.type === "event"
                      ? "bg-accent text-ink-inverse"
                      : "bg-bg text-ink-soft"
                  }`}
                  style={{ letterSpacing: "0.1em" }}
                >
                  {notice.type === "event" ? t("badge.event") : t("badge.notice")}
                </span>
                <span
                  className="font-medium truncate"
                  style={{ fontSize: "1.05rem", letterSpacing: "-0.025em" }}
                >
                  {notice.title}
                </span>
              </div>
              <span
                className="text-ink-muted text-sm whitespace-nowrap ml-8"
                style={{ letterSpacing: "-0.01em" }}
              >
                {notice.date}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

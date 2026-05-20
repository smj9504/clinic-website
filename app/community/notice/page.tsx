"use client";

import Image from "next/image";
import Link from "next/link";
import { useSiteData } from "@/lib/useSiteData";
import { useT } from "@/lib/i18n";
import { sampleImages } from "@/lib/data";

export default function NoticePage() {
  const { notices, clinicInfo } = useSiteData();
  const t = useT();

  return (
    <>
      <section
        className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2C2620 0%, #4A3A2E 100%)" }}
      >
        <div className="absolute inset-0 opacity-30">
          <Image src={clinicInfo.bannerImages?.community || sampleImages.facility} alt="" fill className="object-cover" sizes="100vw" />
        </div>
        <div className="container-default relative text-ink-inverse">
          <span
            className="text-xs font-semibold uppercase opacity-70 mb-4 block"
            style={{ letterSpacing: "0.2em" }}
          >
            Community
          </span>
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.15,
            }}
          >
            {t("notice.title")}
          </h1>
        </div>
      </section>

      <section className="py-20 md:py-32">
        <div className="container-default">
          <div className="flex gap-8 mb-12 border-b border-line">
            <Link
              href="/community/notice"
              className="pb-4 border-b-2 border-accent text-accent font-semibold"
              style={{ letterSpacing: "-0.02em" }}
            >
              {t("notice.tab")}
            </Link>
            <Link
              href="/community/faq"
              className="pb-4 text-ink-muted hover:text-ink transition-colors"
              style={{ letterSpacing: "-0.02em" }}
            >
              {t("faq.tab")}
            </Link>
          </div>

          <div className="border-t border-line">
            {notices.length === 0 ? (
              <div className="text-center py-20 text-ink-muted">
                {t("notice.empty")}
              </div>
            ) : (
              notices.map((notice) => (
                <div
                  key={notice.id}
                  id={String(notice.id)}
                  className="flex items-center justify-between py-7 border-b border-line hover:pl-2 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span
                      className={`inline-block text-[0.7rem] font-semibold uppercase px-2.5 py-1 rounded-sm whitespace-nowrap ${
                        notice.type === "event"
                          ? "bg-accent text-ink-inverse"
                          : "bg-bg-alt text-ink-soft"
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
                  <span className="text-ink-muted text-sm whitespace-nowrap ml-8">
                    {notice.date}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}

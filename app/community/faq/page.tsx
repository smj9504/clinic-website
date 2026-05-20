"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useSiteData, getBannerImage } from "@/lib/useSiteData";
import { useT } from "@/lib/i18n";

export default function FaqPage() {
  const { faqs, menus } = useSiteData();
  const banner = getBannerImage(menus, "/community/notice");
  const t = useT();
  const [openIdx, setOpenIdx] = useState<string | null>(faqs[0]?.id || null);

  const sorted = [...faqs].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      <section
        className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2C2620 0%, #4A3A2E 100%)" }}
      >
        {banner && (
          <div className="absolute inset-0 opacity-30">
            <Image src={banner} alt="" fill className="object-cover" sizes="100vw" />
          </div>
        )}
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
            {t("faq.title")}
          </h1>
        </div>
      </section>

      <section className="py-20 md:py-32">
        <div className="container-default max-w-3xl">
          <div className="flex gap-8 mb-12 border-b border-line">
            <Link
              href="/community/notice"
              className="pb-4 text-ink-muted hover:text-ink transition-colors"
              style={{ letterSpacing: "-0.02em" }}
            >
              {t("notice.tab")}
            </Link>
            <Link
              href="/community/faq"
              className="pb-4 border-b-2 border-accent text-accent font-semibold"
              style={{ letterSpacing: "-0.02em" }}
            >
              {t("faq.tab")}
            </Link>
          </div>

          {sorted.length === 0 ? (
            <div className="text-center py-20 text-ink-muted">
              {t("faq.empty")}
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((faq) => (
                <div key={faq.id} className="border border-line rounded overflow-hidden bg-bg">
                  <button
                    onClick={() => setOpenIdx(openIdx === faq.id ? null : faq.id)}
                    className="w-full px-6 py-5 flex justify-between items-center text-left hover:bg-bg-alt transition-colors"
                  >
                    <span
                      className="font-semibold"
                      style={{ letterSpacing: "-0.025em", fontSize: "1.05rem" }}
                    >
                      Q. {faq.question}
                    </span>
                    <span
                      className={`text-xl transition-transform duration-300 ${
                        openIdx === faq.id ? "rotate-45" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                  {openIdx === faq.id && (
                    <div
                      className="px-6 pb-6 pt-2 text-ink-soft border-t border-line"
                      style={{
                        fontSize: "0.95rem",
                        lineHeight: 1.85,
                        letterSpacing: "-0.01em",
                        whiteSpace: "pre-line",
                      }}
                    >
                      A. {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

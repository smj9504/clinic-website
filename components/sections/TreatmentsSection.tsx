"use client";

import Link from "next/link";
import { useSiteData } from "@/lib/useSiteData";
import { useT } from "@/lib/i18n";

export default function TreatmentsSection() {
  const { treatments } = useSiteData();
  const t = useT();

  return (
    <section className="py-20 md:py-36 bg-bg-alt">
      <div className="container-default">
        <div className="mb-16">
          <span className="section-label block mb-4">Treatments</span>
          <h2 className="section-title">{t("section.treatments")}</h2>
          <div className="section-divider" />
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-px border"
          style={{ background: "var(--color-line)", borderColor: "var(--color-line)" }}
        >
          {treatments.map((item) => (
            <Link
              key={item.id}
              href={`/treatments#${item.slug}`}
              className="group bg-bg p-10 min-h-[280px] flex flex-col justify-between transition-colors hover:bg-[#F7F2EA]"
            >
              <div>
                <div
                  className="font-display mb-6"
                  style={{
                    fontSize: "2.25rem",
                    fontWeight: 300,
                    color: "var(--color-line-strong)",
                    letterSpacing: "-0.04em",
                  }}
                >
                  {item.number}
                </div>
                <h3
                  className="font-display mb-3"
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 600,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.25,
                    whiteSpace: "pre-line",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-ink-soft"
                  style={{ fontSize: "0.875rem", lineHeight: 1.7 }}
                >
                  {item.description}
                </p>
              </div>
              <span
                className="self-end text-xl text-ink-muted group-hover:text-accent group-hover:translate-x-1 transition-all duration-300"
                aria-hidden
              >
                →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import { useSiteData } from "@/lib/useSiteData";
import { useT } from "@/lib/i18n";
import { useScrollReveal } from "@/lib/useScrollReveal";

export default function DirectorFeature() {
  const { director } = useSiteData();
  const t = useT();
  const headerRef = useScrollReveal<HTMLDivElement>();
  const imageRef = useScrollReveal<HTMLDivElement>({ rootMargin: "0px 0px -80px 0px" });
  const textRef = useScrollReveal<HTMLDivElement>({ rootMargin: "0px 0px -80px 0px" });

  return (
    <section className="py-20 md:py-36">
      <div className="container-default">
        <div ref={headerRef} className="reveal-fade-up mb-16">
          <span className="section-label block mb-4">Director</span>
          <h2 className="section-title">{t("section.director")}</h2>
          <div className="section-divider" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[5fr_6fr] gap-12 md:gap-20 lg:gap-28 items-center">
          <div ref={imageRef} className="reveal-slide-left relative">
            <div
              className="relative aspect-[4/5] overflow-hidden"
              style={{ filter: "saturate(0.9)" }}
            >
              <Image
                src={director.image}
                alt={director.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            </div>
            <div
              className="absolute -z-10 bg-accent"
              style={{
                bottom: "-20px",
                right: "-20px",
                width: "60%",
                height: "60%",
              }}
            />
          </div>

          <div ref={textRef} className="reveal-slide-right relative">
            <div
              className="text-xs font-semibold uppercase text-accent mb-6"
              style={{ letterSpacing: "0.2em" }}
            >
              {director.title}
            </div>

            <h3
              className="font-display"
              style={{
                fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)",
                fontWeight: 700,
                letterSpacing: "-0.05em",
                lineHeight: 1,
                marginBottom: "0.5rem",
              }}
            >
              {director.name}
            </h3>

            <p
              className="text-ink-muted mb-8"
              style={{
                fontSize: "0.95rem",
                letterSpacing: "0.3em",
                fontWeight: 400,
              }}
            >
              {director.nameEn}
            </p>

            <div className="w-12 h-0.5 bg-ink mb-10" />

            <p
              className="font-display mb-10 text-ink"
              style={{
                fontSize: "clamp(1.1rem, 1.7vw, 1.35rem)",
                fontWeight: 500,
                letterSpacing: "-0.025em",
                lineHeight: 1.55,
                whiteSpace: "pre-line",
              }}
            >
              &ldquo;{director.quote}&rdquo;
            </p>

            <ul className="border-t border-line pt-7 space-y-0 list-none">
              {director.bio.map((line, i) => (
                <li
                  key={i}
                  className="text-ink-soft relative pl-5"
                  style={{
                    fontSize: "0.95rem",
                    lineHeight: 1.9,
                    letterSpacing: "-0.01em",
                  }}
                >
                  <span
                    className="absolute left-0 bg-ink-muted"
                    style={{ top: "0.85em", width: "6px", height: "1px" }}
                  />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

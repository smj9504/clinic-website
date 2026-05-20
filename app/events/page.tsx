"use client";

import Image from "next/image";
import Link from "next/link";
import { useSiteData } from "@/lib/useSiteData";
import { useT } from "@/lib/i18n";
import { sampleImages } from "@/lib/data";

export default function EventsPage() {
  const { events, clinicInfo } = useSiteData();
  const t = useT();

  return (
    <>
      <section
        className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2C2620 0%, #4A3A2E 100%)" }}
      >
        <div className="absolute inset-0 opacity-30">
          <Image src={clinicInfo.bannerImages?.events || sampleImages.facility} alt="" fill className="object-cover" sizes="100vw" />
        </div>
        <div className="container-default relative text-ink-inverse">
          <span
            className="text-xs font-semibold uppercase opacity-70 mb-4 block"
            style={{ letterSpacing: "0.2em" }}
          >
            Events
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
            {t("events.title")}
          </h1>
        </div>
      </section>

      <section className="py-20 md:py-32">
        <div className="container-default">
          {events.length === 0 ? (
            <div className="text-center py-20 text-ink-muted">
              {t("events.empty")}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group block"
                >
                  <div className="aspect-[16/10] overflow-hidden rounded mb-6 bg-bg-alt relative">
                    <div className="relative w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.04]">
                      {event.image && (
                        <Image
                          src={event.image}
                          alt={event.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      )}
                    </div>
                  </div>
                  <div
                    className="text-xs font-semibold uppercase text-ink-muted mb-3"
                    style={{ letterSpacing: "0.15em" }}
                  >
                    {event.date}
                  </div>
                  <h2
                    className="font-display mb-4"
                    style={{
                      fontSize: "1.875rem",
                      fontWeight: 600,
                      letterSpacing: "-0.035em",
                      lineHeight: 1.3,
                    }}
                  >
                    {event.title} {event.subtitle}
                  </h2>
                  <p
                    className="text-ink-soft mb-4"
                    style={{ fontSize: "1rem", lineHeight: 1.8 }}
                  >
                    {event.description}
                  </p>
                  <span
                    className="inline-flex items-center gap-2 text-accent font-semibold text-sm group-hover:gap-3 transition-all"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {t("section.detail")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSiteData, getMenuLabel } from "@/lib/useSiteData";
import { useT } from "@/lib/i18n";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMyQzI2MjAiLz48L3N2Zz4=";
const FALLBACK_IMAGE = "/gowoonbit.jpg";

function isEnded(ev: { endDate?: string }) {
  if (!ev.endDate) return false;
  return ev.endDate < new Date().toISOString().slice(0, 10);
}

export default function EventDetailPage() {
  const { id } = useParams();
  const { events, clinicInfo, menus } = useSiteData();
  const t = useT();
  const fallbackImage = clinicInfo.defaultImage || FALLBACK_IMAGE;
  const eventsLabel = getMenuLabel(menus, "/events", t("events.title"));

  const event = events.find((e) => String(e.id) === id);
  const ended = event ? isEnded(event) : false;

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <p className="text-ink-muted text-lg">{t("events.empty")}</p>
        <Link
          href="/events"
          className="text-accent font-semibold text-sm hover:underline"
        >
          &larr; {eventsLabel}
        </Link>
      </div>
    );
  }

  const otherEvents = events.filter((e) => e.id !== event.id).slice(0, 2);

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={event.image || fallbackImage}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
            quality={75}
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(44,38,32,0.75) 0%, rgba(44,38,32,0.90) 100%)",
            }}
          />
        </div>

        <div className="container-default relative text-ink-inverse">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm font-medium opacity-70 hover:opacity-100 transition-opacity mb-10"
          >
            &larr; {eventsLabel}
          </Link>

          {ended && (
            <div className="mb-5">
              <span className="inline-block text-sm font-semibold px-4 py-1.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
                종료된 이벤트
              </span>
            </div>
          )}

          <div
            className="text-xs font-semibold uppercase opacity-60 mb-5"
            style={{ letterSpacing: "0.2em" }}
          >
            {event.date}
          </div>

          <h1
            className="font-display"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.15,
            }}
          >
            {event.title}
          </h1>
          <p
            className="mt-4 text-lg opacity-80"
            style={{ letterSpacing: "-0.01em" }}
          >
            {event.subtitle}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 md:py-32">
        <div className="container-default">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-16 lg:gap-24">
            {/* Main */}
            <div>
              <div className="aspect-[16/10] relative rounded overflow-hidden mb-12 bg-bg-alt">
                <Image
                  src={event.image || fallbackImage}
                  alt={event.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  quality={75}
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                />
              </div>

              <div className="max-w-2xl">
                <h2
                  className="font-display mb-8"
                  style={{
                    fontSize: "clamp(1.5rem, 3vw, 2rem)",
                    fontWeight: 600,
                    letterSpacing: "-0.035em",
                    lineHeight: 1.3,
                  }}
                >
                  {event.title} &mdash; {event.subtitle}
                </h2>

                <div className="w-12 h-0.5 bg-accent mb-10" />

                {event.description.startsWith("<") ? (
                  <div
                    className="prose prose-neutral max-w-none text-ink-soft"
                    style={{ fontSize: "1.05rem", lineHeight: 2, letterSpacing: "-0.01em" }}
                    dangerouslySetInnerHTML={{ __html: event.description }}
                  />
                ) : (
                  <p
                    className="text-ink-soft"
                    style={{
                      fontSize: "1.05rem",
                      lineHeight: 2,
                      letterSpacing: "-0.01em",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {event.description}
                  </p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:pt-4">
              <div
                className="bg-bg-alt rounded p-8 md:p-10 sticky"
                style={{ top: "120px" }}
              >
                <h3
                  className="font-display mb-6"
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 600,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {t("badge.event")}
                </h3>

                <div className="space-y-5 text-sm">
                  <div className="flex justify-between border-b border-line pb-4">
                    <span className="text-ink-muted">{t("events.period")}</span>
                    <span className="font-medium">
                      {event.startDate && event.endDate
                        ? `${event.startDate.replace(/-/g, ".")} – ${event.endDate.replace(/-/g, ".")}`
                        : event.date.replace("EVENT · ", "")}
                    </span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-ink-muted">{t("events.contact")}</span>
                    <span className="font-medium">{clinicInfo.phone}</span>
                  </div>
                </div>

                <a
                  href={clinicInfo.reservationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full mt-8 py-4 bg-accent text-white text-center text-sm font-semibold rounded transition-all hover:brightness-110"
                  style={{ letterSpacing: "0.02em" }}
                >
                  {t("nav.reservation")}
                </a>

                <a
                  href={`tel:${clinicInfo.phone.replace(/-/g, "")}`}
                  className="block w-full mt-3 py-4 border border-line text-ink text-center text-sm font-semibold rounded transition-all hover:bg-bg"
                  style={{ letterSpacing: "0.02em" }}
                >
                  {clinicInfo.phone}
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Other Events */}
      {otherEvents.length > 0 && (
        <section className="py-20 md:py-32 border-t border-line">
          <div className="container-default">
            <div className="mb-14">
              <span className="section-label block mb-4">More Events</span>
              <h2 className="section-title">{t("section.events")}</h2>
              <div className="section-divider" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {otherEvents.map((other) => (
                <Link
                  key={other.id}
                  href={`/events/${other.id}`}
                  className="group block"
                >
                  <div className="aspect-[16/10] overflow-hidden rounded mb-6 bg-bg-alt">
                    <div className="relative w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.04]">
                      <Image
                        src={other.image || fallbackImage}
                        alt={other.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        quality={75}
                        placeholder="blur"
                        blurDataURL={BLUR_PLACEHOLDER}
                      />
                    </div>
                  </div>
                  <div
                    className="text-xs font-semibold uppercase text-ink-muted mb-3"
                    style={{ letterSpacing: "0.15em" }}
                  >
                    {other.date}
                  </div>
                  <h3
                    className="font-display mb-2"
                    style={{
                      fontSize: "1.35rem",
                      fontWeight: 600,
                      letterSpacing: "-0.03em",
                      lineHeight: 1.3,
                    }}
                  >
                    {other.title}{" "}
                    <span className="text-ink-muted font-normal">
                      {other.subtitle}
                    </span>
                  </h3>
                  <span
                    className="inline-flex items-center gap-2 text-accent font-semibold text-sm group-hover:gap-3 transition-all mt-3"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {t("section.detail")}
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    >
                      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

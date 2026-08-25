"use client";

import Link from "next/link";
import EventImage from "@/components/EventImage";
import SlideCarousel from "@/components/sections/SlideCarousel";
import { useSiteData } from "@/lib/useSiteData";
import { useT } from "@/lib/i18n";
import { useScrollReveal } from "@/lib/useScrollReveal";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNFOEU0REYiLz48L3N2Zz4=";
const FALLBACK_IMAGE = "/gowoonbit.jpg";

import type { EndedVisibility } from "@/lib/storage";
import { todayKST, addDays, formatEventPeriod } from "@/lib/date";

function isHidden(ev: { startDate?: string; endDate?: string }, hideRule?: EndedVisibility) {
  const today = todayKST();
  if (ev.startDate && ev.startDate > today) return true;
  if (!ev.endDate || ev.endDate >= today) return false;
  if (hideRule === undefined) return false; // 숨기지 않음
  if (hideRule === "immediately") return true;
  return addDays(ev.endDate, hideRule) <= today;
}

export default function EventsSection() {
  const { events, eventEndedHide, clinicInfo } = useSiteData();
  const t = useT();
  const fallbackImage = clinicInfo.defaultImage || FALLBACK_IMAGE;
  const featured = events.filter((e) => !isHidden(e, eventEndedHide)).slice(0, 8);
  const headerRef = useScrollReveal<HTMLDivElement>();

  if (featured.length === 0) return null;

  const renderCard = (event: (typeof featured)[number]) => (
    <Link
      href={`/events/${event.id}`}
      className="group block h-full card-lift rounded-lg overflow-hidden bg-bg"
    >
      <EventImage
        ratio={16 / 10}
        wrapperClassName="overflow-hidden bg-bg-alt"
        className="transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        src={event.image || fallbackImage}
        alt={event.title}
        sizes="(max-width: 768px) 78vw, (max-width: 1024px) 42vw, 24vw"
        quality={75}
        placeholder="blur"
        blurDataURL={BLUR_PLACEHOLDER}
      >
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </EventImage>
      <div className="p-6">
        <div
          className="text-xs font-semibold uppercase text-ink-muted mb-4"
          style={{ letterSpacing: "0.15em" }}
        >
          {formatEventPeriod(event, t)}
        </div>
        <h3
          className="font-display mb-3"
          style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            letterSpacing: "-0.03em",
            lineHeight: 1.3,
          }}
        >
          {event.title}
          <br />
          {event.subtitle}
        </h3>
        <p
          className="text-ink-soft mb-5 line-clamp-2"
          style={{ fontSize: "0.95rem", lineHeight: 1.7 }}
        >
          {event.description.replace(/<[^>]*>/g, "")}
        </p>
        <span
          className="inline-flex items-center gap-2 text-accent font-semibold text-sm group-hover:gap-3 transition-all"
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
      </div>
    </Link>
  );

  return (
    <section className="py-20 md:py-36 overflow-hidden">
      <div className="container-default">
        <div ref={headerRef} className="reveal-fade-up flex flex-wrap items-end justify-between gap-6 mb-16">
          <div>
            <span className="section-label block mb-4">Events</span>
            <h2 className="section-title">{t("section.events")}</h2>
            <div className="section-divider" />
          </div>
          <Link href="/events" className="more-link">
            {t("section.more")}
          </Link>
        </div>
      </div>

      {featured.length > 1 ? (
        <SlideCarousel
          count={featured.length}
          interval={5000}
          ariaLabelBase={t("section.events")}
          slideWidthClassName="w-[78%] sm:w-[55%] md:w-[42%] xl:w-[24%]"
          renderItem={(i) => renderCard(featured[i])}
        />
      ) : (
        <div className="container-default">
          <div className="max-w-md">{renderCard(featured[0])}</div>
        </div>
      )}
    </section>
  );
}

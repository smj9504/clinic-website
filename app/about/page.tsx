"use client";

import Image from "next/image";
import DirectorFeature from "@/components/sections/DirectorFeature";
import FacilityCarousel from "@/components/sections/FacilityCarousel";
import { useSiteData, getBannerImage, getMenuLabel } from "@/lib/useSiteData";
import { useT } from "@/lib/i18n";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { stripImagePosition, getImageCropStyle } from "@/lib/imagePosition";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMyQzI2MjAiLz48L3N2Zz4=";

export default function AboutPage() {
  const { about, clinicInfo, menus, heroSlides } = useSiteData();
  const banner = getBannerImage(menus, "/about", heroSlides[0]?.image);
  const t = useT();
  const philRef = useScrollReveal<HTMLDivElement>();
  const facilityHeaderRef = useScrollReveal<HTMLDivElement>();
  const hoursRef = useScrollReveal<HTMLDivElement>();

  return (
    <>
      <section
        className="relative pt-32 pb-10 md:pt-44 md:pb-14 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2C2620 0%, #4A3A2E 100%)" }}
      >
        <div className="absolute inset-0 opacity-30">
          <Image
            src={stripImagePosition(banner || about.facilityImages[0] || "/placeholder.svg")}
            alt="고운빛한의원 소개"
            fill
            className="object-cover"
            style={{ ...getImageCropStyle(banner || about.facilityImages[0] || "/placeholder.svg") }}
            sizes="100vw"
            quality={75}
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
          />
        </div>
        <div className="container-default relative text-ink-inverse">
          <span
            className="text-xs font-semibold uppercase opacity-70 mb-4 block"
            style={{ letterSpacing: "0.2em" }}
          >
            About
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
            {getMenuLabel(menus, "/about", t("about.title"))}
          </h1>
        </div>
      </section>

      {/* Philosophy */}
      <section className="pt-10 pb-20 md:pt-16 md:pb-32">
        <div ref={philRef} className="reveal-fade-up container-default max-w-3xl text-center">
          <span
            className="text-xs font-semibold uppercase text-accent mb-4 block"
            style={{ letterSpacing: "0.2em" }}
          >
            Philosophy
          </span>
          <h2
            className="font-display mb-8"
            style={{
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.3,
            }}
          >
            {about.philosophyTitle}
          </h2>
          <div className="w-12 h-0.5 bg-accent mx-auto mb-10" />
          <p
            className="text-ink-soft text-lg"
            style={{ lineHeight: 1.95, letterSpacing: "-0.015em", whiteSpace: "pre-line" }}
          >
            {about.philosophyBody}
          </p>
        </div>
      </section>

      <DirectorFeature />

      {/* Facility */}
      {about.facilityImages.length > 0 && (
        <section className="py-20 md:py-32 bg-bg-alt overflow-hidden">
          <div className="container-default">
            <div ref={facilityHeaderRef} className="reveal-fade-up mb-16">
              <span className="section-label block mb-4">Facility</span>
              <h2 className="section-title">{t("about.facility")}</h2>
              <div className="section-divider" />
            </div>
          </div>
          <FacilityCarousel images={about.facilityImages} altBase={t("about.facility")} />
        </section>
      )}

      {/* Hours */}
      <section className="py-20 md:py-32">
        <div className="container-default max-w-3xl">
          <div ref={hoursRef} className="reveal-fade-up mb-12 text-center">
            <span className="section-label block mb-4">Hours</span>
            <h2 className="section-title">{t("about.hoursTitle")}</h2>
          </div>
          <div className="bg-bg-alt p-10 md:p-14 rounded">
            <div className="space-y-5 text-lg">
              <div className="flex justify-between border-b border-line pb-4">
                <span className="font-semibold" style={{ letterSpacing: "-0.02em" }}>
                  {t("about.weekday")}
                </span>
                <span className="text-ink-soft">
                  {clinicInfo.hours.weekday.replace(/^평일\s*/, "").replace(/^Weekdays\s*/, "")}
                </span>
              </div>
              <div className="flex justify-between border-b border-line pb-4">
                <span className="font-semibold" style={{ letterSpacing: "-0.02em" }}>
                  {t("about.saturday")}
                </span>
                <span className="text-ink-soft">
                  {clinicInfo.hours.saturday.replace(/^토요일\s*/, "").replace(/^Saturday\s*/, "")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold" style={{ letterSpacing: "-0.02em" }}>
                  {t("about.holiday")}
                </span>
                <span className="text-ink-muted">{t("about.closed")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

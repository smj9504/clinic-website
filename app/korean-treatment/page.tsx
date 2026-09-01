"use client";

import Image from "next/image";
import Link from "next/link";
import { useSiteData, getBannerImage, getMenuLabel } from "@/lib/useSiteData";
import { useT } from "@/lib/i18n";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { stripImagePosition, getImageCropStyle } from "@/lib/imagePosition";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMyQzI2MjAiLz48L3N2Zz4=";

type SubPage = NonNullable<ReturnType<typeof useSiteData>["subPages"]>[number];

function TreatmentItem({
  item,
  index,
  moreLabel,
}: {
  item: SubPage;
  index: number;
  moreLabel: string;
}) {
  const textRef = useScrollReveal<HTMLDivElement>();
  const imageRef = useScrollReveal<HTMLDivElement>();
  const bleedRef = useScrollReveal<HTMLDivElement>();
  const reversed = index % 2 === 1;

  return (
    <div>
      <article
        id={item.slug}
        className="container-default grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center"
      >
        <div ref={textRef} className={`reveal-fade-up ${reversed ? "md:order-2" : ""}`}>
          <h2
            className="font-display mb-6"
            style={{
              fontSize: "clamp(1.875rem, 3.5vw, 2.5rem)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.2,
            }}
          >
            {item.title}
          </h2>
          <div className="w-12 h-0.5 bg-accent mb-6" />
          {item.intro && (
            <p
              className="text-ink-soft mb-6"
              style={{
                fontSize: "1.05rem",
                lineHeight: 1.85,
                letterSpacing: "-0.01em",
                whiteSpace: "pre-line",
              }}
            >
              {item.intro}
            </p>
          )}
          <Link
            href={`/subpages/${item.slug}`}
            className="inline-flex items-center gap-2 text-accent font-semibold text-sm hover:gap-3 transition-all"
            style={{ letterSpacing: "-0.02em" }}
          >
            {moreLabel}
          </Link>
        </div>
        <div
          ref={imageRef}
          className={`reveal-slide-${reversed ? "left" : "right"} aspect-[4/3] relative rounded overflow-hidden bg-bg-alt`}
        >
          {item.image ? (
            <Image
              src={stripImagePosition(item.image)}
              alt={item.title}
              fill
              className="object-cover"
              style={{ ...getImageCropStyle(item.image) }}
              sizes="(max-width: 768px) 100vw, 50vw"
              quality={75}
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-muted text-sm">
              {item.title}
            </div>
          )}
        </div>
      </article>

      {item.fullBleedImage && (
        <div
          ref={bleedRef}
          className="reveal-fade relative w-full aspect-[21/9] md:aspect-[3/1] mt-24 bg-bg-alt"
        >
          <Image
            src={stripImagePosition(item.fullBleedImage)}
            alt={item.title}
            fill
            className="object-cover"
            style={{ ...getImageCropStyle(item.fullBleedImage) }}
            sizes="100vw"
            quality={75}
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
          />
        </div>
      )}
    </div>
  );
}

export default function KoreanTreatmentPage() {
  const { subPages, menus, heroSlides } = useSiteData();
  const t = useT();
  const banner = getBannerImage(menus, "/korean-treatment", heroSlides[0]?.image);

  const items = (subPages ?? [])
    .filter((sp) => sp.parentMenuId === "m8" && !sp.isHidden)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      <section
        className="relative pt-32 pb-10 md:pt-44 md:pb-14 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2C2620 0%, #4A3A2E 100%)" }}
      >
        {banner && (
          <div className="absolute inset-0 opacity-30">
            <Image
              src={stripImagePosition(banner)}
              alt="한방치료"
              fill
              className="object-cover"
              style={{ ...getImageCropStyle(banner) }}
              sizes="100vw"
              quality={75}
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
            />
          </div>
        )}
        <div className="container-default relative text-ink-inverse">
          <span
            className="text-xs font-semibold uppercase opacity-70 mb-4 block"
            style={{ letterSpacing: "0.2em" }}
          >
            Korean Medicine Treatment
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
            {getMenuLabel(menus, "/korean-treatment", t("koreanTreatment.title"))}
          </h1>
        </div>
      </section>

      <section className="pt-10 pb-20 md:pt-16 md:pb-32">
        <div className="space-y-24">
          {items.map((item, i) => (
            <TreatmentItem key={item.id} item={item} index={i} moreLabel={t("hub.moreDetail")} />
          ))}
        </div>
      </section>
    </>
  );
}

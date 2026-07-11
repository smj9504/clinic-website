"use client";

import Image from "next/image";
import { useSiteData, getBannerImage, getMenuLabel } from "@/lib/useSiteData";
import { useT } from "@/lib/i18n";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMyQzI2MjAiLz48L3N2Zz4=";

export default function TreatmentsPage() {
  const { treatments, menus, heroSlides } = useSiteData();
  const t = useT();
  const banner = getBannerImage(menus, "/treatments", heroSlides[0]?.image);

  return (
    <>
      <section
        className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2C2620 0%, #4A3A2E 100%)" }}
      >
        {banner && (
          <div className="absolute inset-0 opacity-30">
            <Image src={banner} alt="고운빛한의원 진료 안내" fill className="object-cover" sizes="100vw" quality={75} placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} />
          </div>
        )}
        <div className="container-default relative text-ink-inverse">
          <span
            className="text-xs font-semibold uppercase opacity-70 mb-4 block"
            style={{ letterSpacing: "0.2em" }}
          >
            Treatments
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
            {getMenuLabel(menus, "/treatments", t("treatments.title"))}
          </h1>
        </div>
      </section>

      <section className="py-20 md:py-32">
        <div className="container-default space-y-24">
          {treatments.map((item, i) => (
            <article
              key={item.id}
              id={item.slug}
              className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center"
            >
              <div className={i % 2 === 1 ? "md:order-2" : ""}>
                <div
                  className="font-display mb-4"
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 300,
                    color: "var(--color-line-strong)",
                    letterSpacing: "-0.04em",
                  }}
                >
                  {item.number}
                </div>
                <h2
                  className="font-display mb-6"
                  style={{
                    fontSize: "clamp(1.875rem, 3.5vw, 2.5rem)",
                    fontWeight: 600,
                    letterSpacing: "-0.04em",
                    lineHeight: 1.2,
                    whiteSpace: "pre-line",
                  }}
                >
                  {item.title.replace("\n", " ")}
                </h2>
                <div className="w-12 h-0.5 bg-accent mb-6" />
                <p
                  className="text-ink-soft mb-4"
                  style={{
                    fontSize: "1.05rem",
                    lineHeight: 1.85,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {item.description}
                </p>
              </div>
              <div className="aspect-[4/3] relative rounded overflow-hidden bg-bg-alt">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    quality={75}
                    placeholder="blur"
                    blurDataURL={BLUR_PLACEHOLDER}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-muted text-sm">
                    {item.number}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

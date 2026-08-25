"use client";

import Image from "next/image";
import { useState } from "react";
import { useSiteData } from "@/lib/useSiteData";
import { useLocale, useT } from "@/lib/i18n";
import { useServiceCatalog } from "@/lib/useServices";
import { isServiceVisible, type Service } from "@/lib/services";
import type { Equipment } from "@/lib/data";
import EquipmentServicesModal from "@/components/equipment/EquipmentServicesModal";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNFOEU0REYiLz48L3N2Zz4=";

/** 장비에 연결된 시술 중, 지금 공개 화면에 노출 가능한 것만 골라낸다 */
function resolveLinkedServices(eq: Equipment, services: Service[]): Service[] {
  const ids = new Set(eq.serviceIds ?? []);
  return services.filter((s) => ids.has(s.id) && isServiceVisible(s));
}

export default function EquipmentPage() {
  const { equipment, clinicInfo } = useSiteData();
  const { locale } = useLocale();
  const t = useT();
  const { services } = useServiceCatalog();
  const [openEquipmentId, setOpenEquipmentId] = useState<string | null>(null);
  const fallbackImage = clinicInfo.defaultImage || "/gowoonbit.jpg";

  const items = [...(equipment ?? [])]
    .filter((eq) => !eq.isHidden)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const openEquipment = items.find((eq) => eq.id === openEquipmentId);

  return (
    <>
      <section
        className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2C2620 0%, #4A3A2E 100%)" }}
      >
        <div className="container-default relative text-ink-inverse">
          <span
            className="text-xs font-semibold uppercase opacity-70 mb-4 block"
            style={{ letterSpacing: "0.2em" }}
          >
            Equipment
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
            {t("equipment.title")}
          </h1>
          <p className="mt-4 text-sm opacity-70" style={{ letterSpacing: "-0.01em" }}>
            {t("equipment.intro")}
          </p>
        </div>
      </section>

      <section className="py-20 md:py-32">
        <div className="container-default">
          {items.length === 0 ? (
            <p className="text-center text-ink-muted py-12">{t("equipment.empty")}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {items.map((eq) => {
                const linked = resolveLinkedServices(eq, services);
                const clickable = linked.length > 0;
                return (
                <div
                  key={eq.id}
                  className={`group border border-line rounded p-3 pb-4 bg-surface ${
                    clickable ? "cursor-pointer hover:border-line-strong transition-colors" : ""
                  }`}
                  role={clickable ? "button" : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  onClick={clickable ? () => setOpenEquipmentId(eq.id) : undefined}
                  onKeyDown={
                    clickable
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setOpenEquipmentId(eq.id);
                          }
                        }
                      : undefined
                  }
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-bg-alt mb-4">
                    <Image
                      src={eq.image || fallbackImage}
                      alt={eq.title}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.15]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      quality={75}
                      placeholder="blur"
                      blurDataURL={BLUR_PLACEHOLDER}
                    />
                  </div>
                  <div className="px-1">
                    {eq.subtitle && (
                      <p
                        className="text-ink-muted text-xs uppercase mb-1.5"
                        style={{ letterSpacing: "0.15em" }}
                      >
                        {eq.subtitle}
                      </p>
                    )}
                    <h3
                      className="font-display mb-2"
                      style={{ fontSize: "1.15rem", fontWeight: 600, letterSpacing: "-0.03em" }}
                    >
                      {eq.title}
                    </h3>
                    {eq.tags.length > 0 && (
                      <p className="text-accent text-xs font-medium mb-3">
                        {eq.tags.map((tag) => `#${tag}`).join(" ")}
                      </p>
                    )}
                    <p
                      className="text-ink-soft text-sm"
                      style={{ lineHeight: 1.7, letterSpacing: "-0.01em" }}
                    >
                      {eq.description}
                    </p>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {openEquipment && (
        <EquipmentServicesModal
          equipmentTitle={openEquipment.title}
          services={resolveLinkedServices(openEquipment, services)}
          locale={locale}
          fallbackImage={fallbackImage}
          t={t}
          onClose={() => setOpenEquipmentId(null)}
        />
      )}
    </>
  );
}

"use client";

import { useEffect, useRef } from "react";
import ServiceCard from "@/components/services/ServiceCard";
import type { Service } from "@/lib/services";
import type { Locale } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/translations";

type Props = {
  equipmentTitle: string;
  services: Service[];
  locale: Locale;
  fallbackImage: string;
  t: (key: TranslationKey) => string;
  onClose: () => void;
};

export default function EquipmentServicesModal({
  equipmentTitle,
  services,
  locale,
  fallbackImage,
  t,
  onClose,
}: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
      style={{ background: "rgba(0,0,0,0.4)", animation: "fadeIn 300ms ease" }}
      onClick={onClose}
    >
      <div
        className="bg-bg w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-lg relative p-6 md:p-8"
        style={{ animation: "scaleIn 400ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-bg-alt text-ink flex items-center justify-center hover:bg-line transition-colors"
          aria-label={t("equipment.closeModal")}
        >
          ✕
        </button>

        <p
          className="text-xs font-semibold uppercase text-ink-muted mb-1.5"
          style={{ letterSpacing: "0.15em" }}
        >
          {t("equipment.linkedServicesTitle")}
        </p>
        <h2
          className="font-display mb-6 pr-10"
          style={{ fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.03em" }}
        >
          {equipmentTitle}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              locale={locale}
              fallbackImage={fallbackImage}
              t={t}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useSiteData } from "@/lib/useSiteData";
import { useT } from "@/lib/i18n";
import type { PopupItem } from "@/lib/storage";

const DISMISS_EVENT = "popup_dismissed_event";
const DISMISS_SCHEDULE = "popup_dismissed_schedule";

function usePreloadImages(urls: string[]) {
  useEffect(() => {
    urls.forEach((url) => {
      if (!url) return;
      const img = new window.Image();
      img.src = url;
    });
  }, [urls]);
}

export default function PopupModal() {
  const { popup, schedulePopup } = useSiteData();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"event" | "schedule">("event");
  const [dismissToday, setDismissToday] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  const eventActive = popup?.isActive;
  const scheduleActive = schedulePopup?.isActive;

  // Resolve popup items: use items[] if available, fall back to single legacy fields
  const popupItems: PopupItem[] = useMemo(() => {
    if (popup?.items && popup.items.length > 0) return popup.items;
    if (popup?.title) {
      return [{
        eventId: 0,
        title: popup.title,
        body: popup.body,
        image: popup.image,
        linkUrl: popup.linkUrl,
      }];
    }
    return [];
  }, [popup]);

  // Preload popup images before the modal opens
  const imageUrls = useMemo(() => popupItems.map((item) => item.image).filter(Boolean), [popupItems]);
  usePreloadImages(imageUrls);

  useEffect(() => {
    if (!eventActive && !scheduleActive) return;

    const today = new Date().toISOString().split("T")[0];
    const eventDismissed =
      typeof window !== "undefined"
        ? localStorage.getItem(DISMISS_EVENT) === today
        : true;
    const scheduleDismissed =
      typeof window !== "undefined"
        ? localStorage.getItem(DISMISS_SCHEDULE) === today
        : true;

    const showEvent = eventActive && !eventDismissed && popupItems.length > 0;
    const showSchedule = scheduleActive && !scheduleDismissed;

    if (!showEvent && !showSchedule) return;

    if (showEvent) setTab("event");
    else if (showSchedule) setTab("schedule");

    const timer = setTimeout(() => setOpen(true), 2000);
    return () => clearTimeout(timer);
  }, [eventActive, scheduleActive, popupItems.length]);

  const close = () => {
    if (dismissToday) {
      const today = new Date().toISOString().split("T")[0];
      if (tab === "event") localStorage.setItem(DISMISS_EVENT, today);
      else localStorage.setItem(DISMISS_SCHEDULE, today);
    }
    setOpen(false);
    setDismissToday(false);
    setSlideIndex(0);
  };

  if (!open) return null;

  const showTabs = eventActive && scheduleActive && popupItems.length > 0;
  const currentItem = popupItems[slideIndex] ?? popupItems[0];
  const hasMultiple = popupItems.length > 1;

  const prev = () => setSlideIndex((i) => (i - 1 + popupItems.length) % popupItems.length);
  const next = () => setSlideIndex((i) => (i + 1) % popupItems.length);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
      style={{ background: "rgba(0,0,0,0.4)", animation: "fadeIn 300ms ease" }}
      onClick={close}
    >
      <div
        className="bg-bg w-full max-w-md rounded-lg overflow-hidden relative"
        style={{ animation: "scaleIn 400ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tabs */}
        {showTabs && (
          <div className="flex border-b border-line relative">
            <button
              onClick={() => { setTab("event"); setDismissToday(false); setSlideIndex(0); }}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                tab === "event"
                  ? "text-accent border-b-2 border-accent"
                  : "text-ink-muted hover:text-ink"
              }`}
              style={{ letterSpacing: "-0.02em" }}
            >
              {t("popup.label")}
            </button>
            <button
              onClick={() => { setTab("schedule"); setDismissToday(false); }}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                tab === "schedule"
                  ? "text-accent border-b-2 border-accent"
                  : "text-ink-muted hover:text-ink"
              }`}
              style={{ letterSpacing: "-0.02em" }}
            >
              {t("popup.scheduleLabel")}
            </button>
            <button
              onClick={close}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xl p-2 text-ink-muted hover:text-ink transition-colors"
              aria-label={t("popup.close")}
            >
              ✕
            </button>
          </div>
        )}

        {/* Close button when no tabs */}
        {!showTabs && (
          <button
            onClick={close}
            className="absolute top-4 right-4 text-2xl p-2 z-10"
            style={{ color: tab === "event" ? "white" : "var(--color-ink)" }}
            aria-label={t("popup.close")}
          >
            ✕
          </button>
        )}

        {/* Event Tab Content — multi-slide */}
        {tab === "event" && eventActive && currentItem && (
          <>
            <div className="relative aspect-[4/3] bg-accent">
              <Image
                src={currentItem.image}
                alt={currentItem.title}
                fill
                className="object-cover"
                sizes="480px"
                priority
                quality={75}
              />
              <div
                className="absolute inset-0"
                style={{ background: "rgba(107, 68, 35, 0.3)" }}
              />

              {/* Prev / Next arrows */}
              {hasMultiple && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/50 transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/50 transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </>
              )}

              {/* Dots */}
              {hasMultiple && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {popupItems.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSlideIndex(i)}
                      className="w-2 h-2 rounded-full transition-all"
                      style={{
                        background: i === slideIndex ? "white" : "rgba(255,255,255,0.4)",
                        transform: i === slideIndex ? "scale(1.3)" : "scale(1)",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="p-8">
              {!showTabs && (
                <div
                  className="text-xs font-semibold uppercase text-accent mb-3"
                  style={{ letterSpacing: "0.2em" }}
                >
                  {t("popup.label")}
                  {hasMultiple && (
                    <span className="ml-2 text-ink-muted normal-case" style={{ letterSpacing: "0" }}>
                      {slideIndex + 1} / {popupItems.length}
                    </span>
                  )}
                </div>
              )}
              <h3
                className="font-display mb-6"
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.3,
                  whiteSpace: "pre-line",
                }}
              >
                {currentItem.title}
              </h3>
              <p
                className="text-ink-soft"
                style={{
                  fontSize: "0.95rem",
                  lineHeight: 1.7,
                  whiteSpace: "pre-line",
                }}
              >
                {currentItem.body}
              </p>
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-line">
                <label className="text-sm text-ink-muted flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dismissToday}
                    onChange={(e) => setDismissToday(e.target.checked)}
                    style={{ accentColor: "var(--color-accent)" }}
                  />
                  {t("popup.dismiss")}
                </label>
                <Link
                  href={currentItem.linkUrl}
                  onClick={() => setOpen(false)}
                  className="text-accent text-sm font-semibold inline-flex items-center gap-2"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {t("popup.detail")}
                </Link>
              </div>
            </div>
          </>
        )}

        {/* Schedule Tab Content */}
        {tab === "schedule" && scheduleActive && (
          <div className="p-8">
            {!showTabs && (
              <div
                className="text-xs font-semibold uppercase text-accent mb-3"
                style={{ letterSpacing: "0.2em" }}
              >
                {t("popup.scheduleLabel")}
              </div>
            )}
            <h3
              className="font-display mb-2"
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.3,
              }}
            >
              {schedulePopup.title}
            </h3>
            <div
              className="text-xs text-ink-muted mb-6"
              style={{ letterSpacing: "0.1em" }}
            >
              {schedulePopup.month}
            </div>

            <div className="space-y-0 rounded-lg overflow-hidden border border-line">
              {schedulePopup.rows.map((row, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-5 py-3.5 ${
                    i < schedulePopup.rows.length - 1
                      ? "border-b border-line"
                      : ""
                  } ${row.note ? "bg-bg-alt" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="font-semibold text-sm"
                      style={{ letterSpacing: "-0.02em" }}
                    >
                      {row.day}
                    </span>
                    {row.note && (
                      <span className="text-[0.7rem] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                        {row.note}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      row.hours === "휴진" || row.hours === "Closed"
                        ? "text-red-500 font-semibold"
                        : "text-ink-soft"
                    }`}
                  >
                    {row.hours}
                  </span>
                </div>
              ))}
            </div>

            {schedulePopup.notice && (
              <div
                className="mt-4 text-sm text-ink-muted bg-bg-alt rounded-lg px-5 py-3 text-center"
                style={{ letterSpacing: "-0.01em" }}
              >
                {schedulePopup.notice}
              </div>
            )}

            <div className="flex justify-between items-center mt-6 pt-6 border-t border-line">
              <label className="text-sm text-ink-muted flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dismissToday}
                  onChange={(e) => setDismissToday(e.target.checked)}
                  style={{ accentColor: "var(--color-accent)" }}
                />
                {t("popup.dismiss")}
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

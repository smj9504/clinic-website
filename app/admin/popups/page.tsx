"use client";

import { useEffect, useState } from "react";
import { useSiteDataForLocale } from "@/lib/useSiteData";
import { useAdminLocale } from "@/lib/adminLocale";
import { updateSiteData, syncImages, type Popup, type PopupItem } from "@/lib/storage";
import type { Event } from "@/lib/data";
import {
  PageHeader,
  Button,
  Card,
  Toast,
} from "@/components/admin/ui";

function extractMonth(dateStr: string): string {
  const m = dateStr.match(/(\d{4})[.\-/](\d{2})/);
  return m ? `${m[1]}.${m[2]}` : "";
}

function isCurrentMonth(dateStr: string): boolean {
  const now = new Date();
  const current = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}`;
  return extractMonth(dateStr) === current;
}

function eventToItem(ev: Event): PopupItem {
  return {
    eventId: ev.id,
    title: `${ev.title}\n${ev.subtitle}`,
    body: ev.description,
    image: ev.image,
    linkUrl: `/events/${ev.id}`,
  };
}

export default function PopupAdminPage() {
  const { editingLocale } = useAdminLocale();
  const { popup, events } = useSiteDataForLocale(editingLocale);
  const update = async (fn: (data: import("@/lib/storage").SiteData) => import("@/lib/storage").SiteData) => {
    await updateSiteData(fn, editingLocale);
    await syncImages(editingLocale);
  };
  const [draft, setDraft] = useState<Popup>(popup);
  const [toast, setToast] = useState<string | null>(null);

  const popupStr = JSON.stringify(popup);
  useEffect(() => {
    setDraft(popup);
  }, [popupStr]);

  const selectedIds = new Set((draft.items ?? []).map((it) => it.eventId));

  const toggleEvent = (ev: Event) => {
    setDraft((p) => {
      const current = p.items ?? [];
      const exists = current.some((it) => it.eventId === ev.id);
      let next: PopupItem[];
      if (exists) {
        next = current.filter((it) => it.eventId !== ev.id);
      } else {
        next = [...current, eventToItem(ev)];
      }
      // Also update legacy single fields from first item for backward compat
      const first = next[0];
      return {
        ...p,
        items: next,
        title: first?.title ?? "",
        body: first?.body ?? "",
        image: first?.image ?? "",
        linkUrl: first?.linkUrl ?? "/events",
      };
    });
  };

  const moveItem = (eventId: number, dir: -1 | 1) => {
    setDraft((p) => {
      const list = [...(p.items ?? [])];
      const idx = list.findIndex((it) => it.eventId === eventId);
      const target = idx + dir;
      if (target < 0 || target >= list.length) return p;
      [list[idx], list[target]] = [list[target], list[idx]];
      const first = list[0];
      return {
        ...p,
        items: list,
        title: first?.title ?? "",
        body: first?.body ?? "",
        image: first?.image ?? "",
        linkUrl: first?.linkUrl ?? "/events",
      };
    });
  };

  const save = () => {
    update((d) => ({ ...d, popup: draft }));
    setToast("팝업 설정이 저장되었습니다");
  };

  // Sort: current month first
  const sortedEvents = [...events].sort((a, b) => {
    const aCurrent = isCurrentMonth(a.date) ? 0 : 1;
    const bCurrent = isCurrentMonth(b.date) ? 0 : 1;
    return aCurrent - bCurrent;
  });

  const items = draft.items ?? [];

  return (
    <>
      <PageHeader
        title="이벤트 팝업 관리"
        description="팝업에 표시할 이벤트를 선택하세요. 여러 개 선택 시 좌/우로 넘겨볼 수 있습니다."
        actions={<Button onClick={save}>저장</Button>}
      />

      <Card className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={draft.isActive}
            onChange={(e) => setDraft((p) => ({ ...p, isActive: e.target.checked }))}
            style={{ accentColor: "var(--color-accent)" }}
            className="w-5 h-5"
          />
          <span className="font-semibold" style={{ letterSpacing: "-0.02em" }}>
            팝업 활성화
          </span>
          <span className="text-xs text-ink-muted">
            (체크 해제 시 팝업이 표시되지 않습니다)
          </span>
        </label>
      </Card>

      {/* Event multi-select */}
      <Card className="mb-6">
        <h3 className="font-semibold mb-1" style={{ letterSpacing: "-0.02em" }}>
          이벤트 선택
        </h3>
        <p className="text-xs text-ink-muted mb-4">
          팝업에 표시할 이벤트를 체크하세요. 여러 개 선택 가능합니다.
        </p>

        {sortedEvents.length === 0 ? (
          <p className="text-sm text-ink-muted py-4">
            등록된 이벤트가 없습니다. 이벤트 관리에서 먼저 추가해 주세요.
          </p>
        ) : (
          <div className="space-y-2">
            {sortedEvents.map((ev) => {
              const checked = selectedIds.has(ev.id);
              const current = isCurrentMonth(ev.date);
              return (
                <label
                  key={ev.id}
                  className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all ${
                    checked
                      ? "border-accent bg-[#FFFBF5]"
                      : "border-line hover:border-accent/40"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleEvent(ev)}
                    style={{ accentColor: "var(--color-accent)" }}
                    className="w-4 h-4 flex-shrink-0"
                  />
                  {ev.image && (
                    <div className="w-14 h-10 rounded overflow-hidden flex-shrink-0 bg-bg-alt">
                      <img src={ev.image} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate" style={{ letterSpacing: "-0.02em" }}>
                      {ev.title}
                      {ev.subtitle && (
                        <span className="text-ink-muted font-normal ml-2">{ev.subtitle}</span>
                      )}
                    </div>
                    <div className="text-[0.65rem] text-ink-muted uppercase" style={{ letterSpacing: "0.1em" }}>
                      {ev.date}
                    </div>
                  </div>
                  {current && (
                    <span
                      className="text-[0.6rem] font-bold uppercase bg-accent text-white px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ letterSpacing: "0.05em" }}
                    >
                      이번 달
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </Card>

      {/* Selected order */}
      {items.length > 0 && (
        <Card className="mb-6">
          <h3 className="font-semibold mb-3" style={{ letterSpacing: "-0.02em" }}>
            팝업 표시 순서
          </h3>
          <p className="text-xs text-ink-muted mb-4">
            선택된 {items.length}개 이벤트가 이 순서대로 팝업에 표시됩니다.
          </p>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div
                key={item.eventId}
                className="flex items-center gap-3 p-3 bg-bg-alt rounded-lg"
              >
                <span className="text-xs text-ink-muted font-mono w-6 text-center">
                  {i + 1}
                </span>
                {item.image && (
                  <div className="w-12 h-9 rounded overflow-hidden flex-shrink-0">
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <span
                  className="flex-1 text-sm font-medium truncate"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {item.title.replace("\n", " — ")}
                </span>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => moveItem(item.eventId, -1)}
                    disabled={i === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => moveItem(item.eventId, 1)}
                    disabled={i === items.length - 1}
                  >
                    ↓
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={save}>저장</Button>
      </div>

      <Card className="mt-6 bg-yellow-50 border-yellow-200">
        <p className="text-sm text-yellow-900" style={{ lineHeight: 1.6 }}>
          💡 팝업은 사이트 진입 후 2초 뒤에 표시됩니다.
          {items.length > 1 && " 여러 이벤트 선택 시 좌/우 화살표로 넘겨볼 수 있습니다."}
          {" "}사용자가 &ldquo;오늘 하루 보지 않기&rdquo;를 선택하면 같은 날 다시 보이지 않습니다.
        </p>
      </Card>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

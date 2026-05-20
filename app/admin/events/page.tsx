"use client";

import { useState } from "react";
import { useSiteDataForLocale } from "@/lib/useSiteData";
import { useAdminLocale } from "@/lib/adminLocale";
import { updateSiteData, syncImages } from "@/lib/storage";
import type { Event } from "@/lib/data";
import {
  PageHeader,
  Field,
  TextInput,
  TextArea,
  Button,
  Card,
  ImageInput,
  Toast,
} from "@/components/admin/ui";

const todayStr = () => new Date().toISOString().slice(0, 10);

type StatusFilter = "all" | "active" | "upcoming" | "ended";

function getStatus(item: { startDate?: string; endDate?: string }): "active" | "upcoming" | "ended" {
  const today = todayStr();
  if (item.startDate && item.startDate > today) return "upcoming";
  if (item.endDate && item.endDate < today) return "ended";
  return "active";
}

const statusLabel: Record<string, { text: string; cls: string }> = {
  active: { text: "진행중", cls: "bg-green-100 text-green-800" },
  upcoming: { text: "예정", cls: "bg-blue-100 text-blue-800" },
  ended: { text: "종료", cls: "bg-gray-100 text-gray-500" },
};

const emptyEvent: Omit<Event, "id"> = {
  title: "",
  subtitle: "",
  description: "",
  image: "",
  date: "EVENT · 2026.05",
  startDate: todayStr(),
  endDate: "",
};

export default function EventsAdminPage() {
  const { editingLocale } = useAdminLocale();
  const { events } = useSiteDataForLocale(editingLocale);
  const update: typeof updateSiteData = (fn) => {
    updateSiteData(fn, editingLocale);
    syncImages(editingLocale);
  };
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<Omit<Event, "id">>(emptyEvent);
  const [toast, setToast] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filteredEvents = filter === "all"
    ? events
    : events.filter((e) => getStatus(e) === filter);

  const counts = {
    all: events.length,
    active: events.filter((e) => getStatus(e) === "active").length,
    upcoming: events.filter((e) => getStatus(e) === "upcoming").length,
    ended: events.filter((e) => getStatus(e) === "ended").length,
  };

  const startEdit = (e: Event) => {
    setEditing(e.id);
    setDraft({
      title: e.title,
      subtitle: e.subtitle,
      description: e.description,
      image: e.image,
      date: e.date,
      startDate: e.startDate || "",
      endDate: e.endDate || "",
    });
  };

  const startNew = () => {
    setEditing("new");
    setDraft(emptyEvent);
  };

  const save = () => {
    if (!draft.title.trim()) {
      alert("제목을 입력하세요.");
      return;
    }
    update((d) => {
      if (editing === "new") {
        const nextId = Math.max(0, ...d.events.map((e) => e.id)) + 1;
        return { ...d, events: [{ ...draft, id: nextId }, ...d.events] };
      }
      return {
        ...d,
        events: d.events.map((e) =>
          e.id === editing ? { ...e, ...draft } : e
        ),
      };
    });
    setEditing(null);
    setToast(editing === "new" ? "이벤트가 추가되었습니다" : "이벤트가 저장되었습니다");
  };

  const remove = (id: number) => {
    if (!confirm("이 이벤트를 삭제하시겠습니까?")) return;
    update((d) => ({ ...d, events: d.events.filter((e) => e.id !== id) }));
    setToast("이벤트가 삭제되었습니다");
  };

  const move = (id: number, dir: -1 | 1) => {
    update((d) => {
      const list = [...d.events];
      const idx = list.findIndex((e) => e.id === id);
      const target = idx + dir;
      if (target < 0 || target >= list.length) return d;
      [list[idx], list[target]] = [list[target], list[idx]];
      return { ...d, events: list };
    });
  };

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: `전체 (${counts.all})` },
    { key: "active", label: `진행중 (${counts.active})` },
    { key: "upcoming", label: `예정 (${counts.upcoming})` },
    { key: "ended", label: `종료 (${counts.ended})` },
  ];

  return (
    <>
      <PageHeader
        title="이벤트 관리"
        description="진행중인 이벤트를 관리합니다. 홈페이지와 이벤트 페이지에 자동으로 노출됩니다."
        actions={
          <Button onClick={startNew} variant="primary" disabled={editing !== null}>
            + 이벤트 추가
          </Button>
        }
      />

      {editing !== null && (
        <Card className="mb-6 border-accent">
          <h3 className="font-semibold mb-4" style={{ letterSpacing: "-0.02em" }}>
            {editing === "new" ? "새 이벤트 추가" : "이벤트 수정"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Field label="제목">
                <TextInput
                  placeholder="예: 5월 다이어트 패키지"
                  value={draft.title}
                  onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                />
              </Field>
              <Field label="부제목">
                <TextInput
                  placeholder="예: 30% 할인 이벤트"
                  value={draft.subtitle}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, subtitle: e.target.value }))
                  }
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="시작일">
                  <input
                    type="date"
                    value={draft.startDate || ""}
                    onChange={(e) => setDraft((p) => ({ ...p, startDate: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-line bg-surface rounded text-sm outline-none focus:border-accent"
                  />
                </Field>
                <Field label="종료일">
                  <input
                    type="date"
                    value={draft.endDate || ""}
                    onChange={(e) => setDraft((p) => ({ ...p, endDate: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-line bg-surface rounded text-sm outline-none focus:border-accent"
                  />
                </Field>
              </div>
              <Field label="설명">
                <TextArea
                  value={draft.description}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </Field>
            </div>
            <div>
              <Field
                label="이벤트 이미지"
                hint="권장 비율 4:3 · 권장 크기 800×600 이상"
              >
                <ImageInput
                  value={draft.image}
                  onChange={(v) => setDraft((p) => ({ ...p, image: v }))}
                  aspectRatio="4 / 3"
                />
              </Field>
            </div>
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t border-line">
            <Button onClick={save}>저장</Button>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              취소
            </Button>
          </div>
        </Card>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
              filter === f.key
                ? "bg-accent text-white"
                : "bg-bg-alt text-ink-muted hover:text-ink"
            }`}
            style={{ letterSpacing: "-0.02em" }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEvents.map((ev, i) => {
          const status = getStatus(ev);
          return (
            <Card key={ev.id} className={`p-4 flex gap-4 ${status === "ended" ? "opacity-60" : ""}`}>
              <div className="w-32 h-24 bg-bg-alt rounded overflow-hidden flex-shrink-0">
                {ev.image && (
                  <img src={ev.image} alt={ev.title} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[0.65rem] font-semibold px-2 py-0.5 rounded-full ${statusLabel[status].cls}`}
                  >
                    {statusLabel[status].text}
                  </span>
                  <span className="text-xs text-ink-muted" style={{ letterSpacing: "0.03em" }}>
                    {ev.startDate || ""}
                    {ev.startDate && ev.endDate ? " ~ " : ""}
                    {ev.endDate || ""}
                  </span>
                </div>
                <h3
                  className="font-semibold mb-1 truncate"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {ev.title}
                </h3>
                <p className="text-xs text-ink-muted line-clamp-2 mb-2">
                  {ev.description}
                </p>
                <div className="flex gap-1 flex-wrap">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => move(ev.id, -1)}
                    disabled={i === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => move(ev.id, 1)}
                    disabled={i === filteredEvents.length - 1}
                  >
                    ↓
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => startEdit(ev)}>
                    수정
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => remove(ev.id)}>
                    삭제
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredEvents.length === 0 && (
        <Card className="text-center py-16 text-ink-muted">
          {filter === "all"
            ? '등록된 이벤트가 없습니다. 우측 상단 "+ 이벤트 추가"로 추가하세요.'
            : "해당 상태의 이벤트가 없습니다."}
        </Card>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

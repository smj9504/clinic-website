"use client";

import { useState } from "react";
import { useSiteDataForLocale } from "@/lib/useSiteData";
import { useAdminLocale } from "@/lib/adminLocale";
import { updateSiteData, syncImages } from "@/lib/storage";
import { todayKST } from "@/lib/date";
import type { Event } from "@/lib/data";
import { useServiceCatalog } from "@/lib/useServices";
import { patchServices } from "@/lib/servicesApi";
import {
  PageHeader,
  Field,
  TextInput,
  Button,
  Card,
  ImageInput,
  Toast,
} from "@/components/admin/ui";
import RichEditor from "@/components/admin/RichEditor";
import LinkedServicesPicker from "@/components/admin/equipment/LinkedServicesPicker";

const todayStr = todayKST;

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
  const { events, eventEndedHide, clinicInfo } = useSiteDataForLocale(editingLocale);
  const fallbackImage = clinicInfo.defaultImage || "/gowoonbit.jpg";
  const update = async (fn: (data: import("@/lib/storage").SiteData) => import("@/lib/storage").SiteData) => {
    const ok = await updateSiteData(fn, editingLocale);
    await syncImages(editingLocale);
    return ok;
  };
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<Omit<Event, "id">>(emptyEvent);
  const [toast, setToast] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");

  // 시술 ↔ 이벤트 연결: 소스 오브 트루스는 services 테이블의 event_ids다.
  // 이벤트 목록 자체엔 저장하지 않고, 편집 중일 때만 현재 연결 상태를 계산해 보여준다.
  const { categories, subcategories, services, reload: reloadServices } = useServiceCatalog({
    includeHidden: true,
  });
  const [linkedServiceIds, setLinkedServiceIds] = useState<string[]>([]);

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
    setLinkedServiceIds(services.filter((s) => (s.eventIds ?? []).includes(e.id)).map((s) => s.id));
  };

  const startNew = () => {
    setEditing("new");
    setDraft(emptyEvent);
    setLinkedServiceIds([]);
  };

  /** 선택된 시술 목록과 실제 저장된 event_ids의 차이만 골라 필요한 시술만 patch한다 */
  const syncLinkedServices = async (eventId: number, nextServiceIds: string[]) => {
    const nextSet = new Set(nextServiceIds);
    const updates: { id: string; eventIds: number[] }[] = [];
    for (const s of services) {
      const current = s.eventIds ?? [];
      const shouldHave = nextSet.has(s.id);
      const has = current.includes(eventId);
      if (shouldHave === has) continue;
      updates.push({
        id: s.id,
        eventIds: shouldHave ? [...current, eventId] : current.filter((id) => id !== eventId),
      });
    }
    if (updates.length === 0) return true;
    const ok = await patchServices(updates);
    if (ok) reloadServices();
    return ok;
  };

  const save = async () => {
    if (!draft.title.trim()) {
      alert("제목을 입력하세요.");
      return;
    }
    const wasNew = editing === "new";
    let newId: number | null = null;
    const ok = await update((d) => {
      if (editing === "new") {
        const nextId = Math.max(0, ...d.events.map((e) => e.id)) + 1;
        newId = nextId;
        return { ...d, events: [{ ...draft, id: nextId }, ...d.events] };
      }
      return {
        ...d,
        events: d.events.map((e) =>
          e.id === editing ? { ...e, ...draft } : e
        ),
      };
    });
    if (ok) {
      const eventId = wasNew ? newId! : (editing as number);
      await syncLinkedServices(eventId, linkedServiceIds);
    }
    setEditing(null);
    if (ok) setToast(wasNew ? "이벤트가 추가되었습니다" : "이벤트가 저장되었습니다");
  };

  const remove = async (id: number) => {
    if (!confirm("이 이벤트를 삭제하시겠습니까?")) return;
    const ok = await update((d) => ({
      ...d,
      events: d.events.filter((e) => e.id !== id),
      popup: {
        ...d.popup,
        items: (d.popup.items ?? []).filter((it) => it.eventId !== id),
      },
    }));
    if (ok) {
      // 삭제된 이벤트를 참조하던 시술들의 event_ids에서도 정리한다 (고아 참조 방지)
      await syncLinkedServices(id, []);
      setToast("이벤트가 삭제되었습니다");
    }
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <RichEditor
                  value={draft.description}
                  onChange={(html) => setDraft((p) => ({ ...p, description: html }))}
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
              <Field
                label="이벤트 적용 시술"
                hint="이 이벤트가 적용되는 시술을 선택하세요. 이벤트 상세 페이지에 목록으로 표시되고, 시술 목록에서도 '이벤트' 탭으로 모아 볼 수 있습니다."
              >
                <LinkedServicesPicker
                  selectedIds={linkedServiceIds}
                  onChange={setLinkedServiceIds}
                  categories={categories}
                  subcategories={subcategories}
                  services={services}
                  locale={editingLocale}
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
                <img src={ev.image || fallbackImage} alt={ev.title} className="w-full h-full object-cover" />
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
                  {ev.description.replace(/<[^>]*>/g, "")}
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

      {/* 종료 이벤트 숨김 설정 */}
      <Card className="mt-6">
        <h3 className="font-semibold mb-1" style={{ letterSpacing: "-0.02em" }}>
          종료된 이벤트 표시 설정
        </h3>
        <p className="text-xs text-ink-muted mb-4">
          종료된 이벤트를 홈페이지와 이벤트 목록에서 언제 숨길지 설정합니다.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={eventEndedHide === undefined ? "" : eventEndedHide === "immediately" ? "immediately" : String(eventEndedHide)}
            onChange={async (e) => {
              const v = e.target.value;
              const val = v === "" ? undefined : v === "immediately" ? "immediately" as const : Number(v);
              const ok = await update((d) => ({ ...d, eventEndedHide: val }));
              if (ok) setToast("설정이 저장되었습니다");
            }}
            className="px-4 py-2.5 border border-line bg-surface rounded text-sm outline-none focus:border-accent"
          >
            <option value="">숨기지 않음 (항상 표시)</option>
            <option value="immediately">종료 즉시 숨김</option>
            <option value="3">종료 후 3일 뒤 숨김</option>
            <option value="7">종료 후 7일 뒤 숨김</option>
            <option value="14">종료 후 14일 뒤 숨김</option>
            <option value="30">종료 후 30일 뒤 숨김</option>
          </select>
        </div>
      </Card>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

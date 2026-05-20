"use client";

import { useState } from "react";
import { useSiteDataForLocale } from "@/lib/useSiteData";
import { useAdminLocale } from "@/lib/adminLocale";
import { updateSiteData } from "@/lib/storage";
import type { Notice } from "@/lib/data";
import {
  PageHeader,
  Field,
  TextInput,
  TextArea,
  Button,
  Card,
  Toast,
} from "@/components/admin/ui";

const today = () => new Date().toISOString().slice(0, 10).replace(/-/g, ".");
const todayISO = () => new Date().toISOString().slice(0, 10);

type StatusFilter = "all" | "active" | "upcoming" | "ended";

function getStatus(item: { startDate?: string; endDate?: string }): "active" | "upcoming" | "ended" {
  const t = todayISO();
  if (item.startDate && item.startDate > t) return "upcoming";
  if (item.endDate && item.endDate < t) return "ended";
  return "active";
}

const statusLabel: Record<string, { text: string; cls: string }> = {
  active: { text: "진행중", cls: "bg-green-100 text-green-800" },
  upcoming: { text: "예정", cls: "bg-blue-100 text-blue-800" },
  ended: { text: "종료", cls: "bg-gray-100 text-gray-500" },
};

const emptyNotice: Omit<Notice, "id"> = {
  type: "notice",
  title: "",
  content: "",
  date: today(),
  startDate: todayISO(),
  endDate: "",
};

export default function NoticesAdminPage() {
  const { editingLocale } = useAdminLocale();
  const { notices } = useSiteDataForLocale(editingLocale);
  const update: typeof updateSiteData = (fn) => updateSiteData(fn, editingLocale);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<Omit<Notice, "id">>(emptyNotice);
  const [toast, setToast] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filteredNotices = filter === "all"
    ? notices
    : notices.filter((n) => getStatus(n) === filter);

  const counts = {
    all: notices.length,
    active: notices.filter((n) => getStatus(n) === "active").length,
    upcoming: notices.filter((n) => getStatus(n) === "upcoming").length,
    ended: notices.filter((n) => getStatus(n) === "ended").length,
  };

  const startEdit = (n: Notice) => {
    setEditing(n.id);
    setDraft({ type: n.type, title: n.title, content: n.content || "", date: n.date, startDate: n.startDate || "", endDate: n.endDate || "" });
  };

  const startNew = () => {
    setEditing("new");
    setDraft({ ...emptyNotice, content: "", date: today(), startDate: todayISO(), endDate: "" });
  };

  const save = () => {
    if (!draft.title.trim()) {
      alert("제목을 입력하세요.");
      return;
    }
    update((d) => {
      if (editing === "new") {
        const nextId = Math.max(0, ...d.notices.map((n) => n.id)) + 1;
        return { ...d, notices: [{ ...draft, id: nextId }, ...d.notices] };
      }
      return {
        ...d,
        notices: d.notices.map((n) => (n.id === editing ? { ...n, ...draft } : n)),
      };
    });
    setEditing(null);
    setToast(editing === "new" ? "공지가 추가되었습니다" : "공지가 저장되었습니다");
  };

  const remove = (id: number) => {
    if (!confirm("이 공지를 삭제하시겠습니까?")) return;
    update((d) => ({ ...d, notices: d.notices.filter((n) => n.id !== id) }));
    setToast("공지가 삭제되었습니다");
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
        title="공지사항 관리"
        description="공지·이벤트 게시판 콘텐츠를 관리합니다."
        actions={
          <Button onClick={startNew} variant="primary" disabled={editing !== null}>
            + 공지 추가
          </Button>
        }
      />

      {editing !== null && (
        <Card className="mb-6 border-accent">
          <h3 className="font-semibold mb-4" style={{ letterSpacing: "-0.02em" }}>
            {editing === "new" ? "새 공지 추가" : "공지 수정"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="분류">
              <select
                value={draft.type}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, type: e.target.value as Notice["type"] }))
                }
                className="w-full px-4 py-2.5 border border-line bg-surface rounded text-sm outline-none focus:border-accent"
                style={{ letterSpacing: "-0.01em" }}
              >
                <option value="notice">공지</option>
                <option value="event">이벤트</option>
              </select>
            </Field>
            <Field label="시작일">
              <input
                type="date"
                value={draft.startDate || ""}
                onChange={(e) => setDraft((p) => ({ ...p, startDate: e.target.value, date: e.target.value.replace(/-/g, ".") }))}
                className="w-full px-4 py-2.5 border border-line bg-surface rounded text-sm outline-none focus:border-accent"
              />
            </Field>
            <Field label="종료일" hint="비워두면 상시 게시">
              <input
                type="date"
                value={draft.endDate || ""}
                onChange={(e) => setDraft((p) => ({ ...p, endDate: e.target.value }))}
                className="w-full px-4 py-2.5 border border-line bg-surface rounded text-sm outline-none focus:border-accent"
              />
            </Field>
            <div className="md:col-span-4">
              <Field label="제목">
                <TextInput
                  value={draft.title}
                  onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                  placeholder="예: 석가탄신일 휴진 안내"
                />
              </Field>
            </div>
            <div className="md:col-span-4">
              <Field label="내용" hint="줄바꿈은 그대로 표시됩니다">
                <TextArea
                  value={draft.content || ""}
                  onChange={(e) => setDraft((p) => ({ ...p, content: e.target.value }))}
                  rows={6}
                  placeholder="공지 상세 내용을 입력하세요"
                />
              </Field>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
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

      <Card className="p-0 overflow-hidden">
        {filteredNotices.length === 0 ? (
          <div className="text-center py-12 text-ink-muted">
            {filter === "all" ? "등록된 공지가 없습니다." : "해당 상태의 공지가 없습니다."}
          </div>
        ) : (
          filteredNotices.map((n) => {
            const status = getStatus(n);
            return (
              <div
                key={n.id}
                className={`flex items-center gap-3 px-4 py-3 border-b border-line/50 last:border-b-0 ${status === "ended" ? "opacity-50" : ""}`}
              >
                <div className="flex flex-col gap-1 shrink-0">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-sm font-semibold text-center ${
                      n.type === "event" ? "bg-accent text-ink-inverse" : "bg-bg-alt text-ink-soft"
                    }`}
                  >
                    {n.type === "event" ? "이벤트" : "공지"}
                  </span>
                  <span className={`text-[0.65rem] font-semibold px-2 py-0.5 rounded-full text-center ${statusLabel[status].cls}`}>
                    {statusLabel[status].text}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate" style={{ letterSpacing: "-0.02em" }}>{n.title}</div>
                  <div className="text-xs text-ink-muted mt-0.5">
                    {n.startDate || n.date}{n.endDate && ` ~ ${n.endDate}`}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="secondary" onClick={() => startEdit(n)}>수정</Button>
                  <Button size="sm" variant="danger" onClick={() => remove(n.id)}>삭제</Button>
                </div>
              </div>
            );
          })
        )}
      </Card>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

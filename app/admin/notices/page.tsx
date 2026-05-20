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
  Button,
  Card,
  Toast,
} from "@/components/admin/ui";

const today = () => new Date().toISOString().slice(0, 10).replace(/-/g, ".");

const emptyNotice: Omit<Notice, "id"> = {
  type: "notice",
  title: "",
  date: today(),
  startDate: today().replace(/\./g, "-"),
  endDate: "",
};

export default function NoticesAdminPage() {
  const { editingLocale } = useAdminLocale();
  const { notices } = useSiteDataForLocale(editingLocale);
  const update: typeof updateSiteData = (fn) => updateSiteData(fn, editingLocale);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<Omit<Notice, "id">>(emptyNotice);
  const [toast, setToast] = useState<string | null>(null);

  const startEdit = (n: Notice) => {
    setEditing(n.id);
    setDraft({ type: n.type, title: n.title, date: n.date, startDate: n.startDate || "", endDate: n.endDate || "" });
  };

  const startNew = () => {
    setEditing("new");
    setDraft({ ...emptyNotice, date: today(), startDate: today().replace(/\./g, "-"), endDate: "" });
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
          </div>
          <div className="flex gap-2 mt-2">
            <Button onClick={save}>저장</Button>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              취소
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr
              className="border-b border-line text-xs uppercase text-ink-muted"
              style={{ letterSpacing: "0.1em" }}
            >
              <th className="text-center px-3 py-3 w-20">분류</th>
              <th className="text-left px-3 py-3">제목</th>
              <th className="text-left px-3 py-3 w-48">기간</th>
              <th className="text-right px-3 py-3 w-40">관리</th>
            </tr>
          </thead>
          <tbody>
            {notices.map((n) => (
              <tr key={n.id} className="border-b border-line/50 last:border-b-0">
                <td className="text-center px-3 py-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-sm font-semibold ${
                      n.type === "event"
                        ? "bg-accent text-ink-inverse"
                        : "bg-bg-alt text-ink-soft"
                    }`}
                    style={{ letterSpacing: "0.1em" }}
                  >
                    {n.type === "event" ? "이벤트" : "공지"}
                  </span>
                </td>
                <td className="px-3 py-3 font-medium" style={{ letterSpacing: "-0.02em" }}>
                  {n.title}
                </td>
                <td className="px-3 py-3 text-sm text-ink-muted">
                  {n.startDate || n.date}
                  {n.endDate && <span> ~ {n.endDate}</span>}
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="flex gap-1 justify-end">
                    <Button size="sm" variant="secondary" onClick={() => startEdit(n)}>
                      수정
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => remove(n.id)}>
                      삭제
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {notices.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-12 text-ink-muted">
                  등록된 공지가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

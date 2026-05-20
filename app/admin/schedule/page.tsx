"use client";

import { useEffect, useState } from "react";
import { useSiteDataForLocale } from "@/lib/useSiteData";
import { useAdminLocale } from "@/lib/adminLocale";
import { updateSiteData, type SchedulePopup } from "@/lib/storage";
import {
  PageHeader,
  Field,
  TextInput,
  Button,
  Card,
  Toast,
} from "@/components/admin/ui";

export default function ScheduleAdminPage() {
  const { editingLocale } = useAdminLocale();
  const { schedulePopup } = useSiteDataForLocale(editingLocale);
  const update: typeof updateSiteData = (fn) =>
    updateSiteData(fn, editingLocale);
  const [draft, setDraft] = useState<SchedulePopup>(schedulePopup);
  const [toast, setToast] = useState<string | null>(null);

  const draftStr = JSON.stringify(schedulePopup);
  useEffect(() => {
    setDraft(schedulePopup);
  }, [draftStr]);

  const save = () => {
    update((d) => ({ ...d, schedulePopup: draft }));
    setToast("저장되었습니다");
  };

  const updateRow = (
    i: number,
    field: "day" | "hours" | "note",
    value: string
  ) => {
    setDraft((p) => ({
      ...p,
      rows: p.rows.map((r, idx) =>
        idx === i ? { ...r, [field]: value } : r
      ),
    }));
  };

  const addRow = () => {
    setDraft((p) => ({
      ...p,
      rows: [...p.rows, { day: "", hours: "" }],
    }));
  };

  const removeRow = (i: number) => {
    setDraft((p) => ({
      ...p,
      rows: p.rows.filter((_, idx) => idx !== i),
    }));
  };

  const moveRow = (i: number, dir: -1 | 1) => {
    const target = i + dir;
    if (target < 0 || target >= draft.rows.length) return;
    const newRows = [...draft.rows];
    [newRows[i], newRows[target]] = [newRows[target], newRows[i]];
    setDraft((p) => ({ ...p, rows: newRows }));
  };

  return (
    <>
      <PageHeader
        title="진료 일정 팝업"
        description="매월 진료 일정 팝업을 관리합니다. 이벤트 팝업과 함께 탭으로 표시됩니다."
        actions={<Button onClick={save}>저장</Button>}
      />

      <Card className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={draft.isActive}
            onChange={(e) =>
              setDraft((p) => ({ ...p, isActive: e.target.checked }))
            }
            style={{ accentColor: "var(--color-accent)" }}
            className="w-5 h-5"
          />
          <span
            className="font-semibold"
            style={{ letterSpacing: "-0.02em" }}
          >
            팝업 활성화
          </span>
          <span className="text-xs text-ink-muted">
            (체크 해제 시 진료 일정 팝업이 표시되지 않습니다)
          </span>
        </label>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3
            className="font-semibold mb-4"
            style={{ letterSpacing: "-0.02em" }}
          >
            기본 정보
          </h3>
          <Field label="제목" hint="예: 6월 진료 일정">
            <TextInput
              value={draft.title}
              onChange={(e) =>
                setDraft((p) => ({ ...p, title: e.target.value }))
              }
            />
          </Field>
          <Field label="월 표시" hint="예: 2026.06">
            <TextInput
              value={draft.month}
              onChange={(e) =>
                setDraft((p) => ({ ...p, month: e.target.value }))
              }
            />
          </Field>
          <Field label="안내 사항" hint="예: 점심시간 13:00 – 14:00">
            <TextInput
              value={draft.notice}
              onChange={(e) =>
                setDraft((p) => ({ ...p, notice: e.target.value }))
              }
            />
          </Field>
        </Card>

        <Card>
          <h3
            className="font-semibold mb-4"
            style={{ letterSpacing: "-0.02em" }}
          >
            미리보기
          </h3>
          <div className="rounded-lg border border-line overflow-hidden">
            {draft.rows.map((row, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-5 py-3 text-sm ${
                  i < draft.rows.length - 1 ? "border-b border-line" : ""
                } ${row.note ? "bg-bg-alt" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{row.day || "—"}</span>
                  {row.note && (
                    <span className="text-[0.65rem] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full">
                      {row.note}
                    </span>
                  )}
                </div>
                <span
                  className={
                    row.hours === "휴진" || row.hours === "Closed"
                      ? "text-red-500 font-semibold"
                      : "text-ink-soft"
                  }
                >
                  {row.hours || "—"}
                </span>
              </div>
            ))}
          </div>
          {draft.notice && (
            <div className="mt-3 text-sm text-ink-muted bg-bg-alt rounded-lg px-4 py-2.5 text-center">
              {draft.notice}
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3
            className="font-semibold"
            style={{ letterSpacing: "-0.02em" }}
          >
            일정 항목
          </h3>
          <Button size="sm" variant="primary" onClick={addRow}>
            + 항목 추가
          </Button>
        </div>
        <div className="space-y-2">
          {draft.rows.map((row, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-xs text-ink-muted w-6 text-center font-mono">
                {i + 1}
              </span>
              <TextInput
                value={row.day}
                onChange={(e) => updateRow(i, "day", e.target.value)}
                placeholder="요일/날짜 (예: 평일)"
              />
              <TextInput
                value={row.hours}
                onChange={(e) => updateRow(i, "hours", e.target.value)}
                placeholder="시간 (예: 09:00 – 19:00)"
              />
              <TextInput
                value={row.note || ""}
                onChange={(e) => updateRow(i, "note", e.target.value)}
                placeholder="비고"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => moveRow(i, -1)}
                disabled={i === 0}
              >
                ↑
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => moveRow(i, 1)}
                disabled={i === draft.rows.length - 1}
              >
                ↓
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => removeRow(i)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button onClick={save}>저장</Button>
      </div>

      <Card className="mt-6 bg-yellow-50 border-yellow-200">
        <p className="text-sm text-yellow-900" style={{ lineHeight: 1.6 }}>
          💡 매월 초에 제목과 월 표시를 변경하고, 해당 월의 휴진일이나 특별
          일정을 항목에 추가하면 됩니다. 이벤트 팝업이 함께 활성화되어 있으면
          탭으로 전환할 수 있습니다.
        </p>
      </Card>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

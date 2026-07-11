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
import type { HolidayItem } from "@/app/api/holidays/route";

function getYearMonth(monthStr: string): { year: string; month: string } | null {
  // "2026.06" or "2026-06" format
  const match = monthStr.match(/(\d{4})[.\-/](\d{1,2})/);
  if (!match) return null;
  return { year: match[1], month: match[2] };
}

function formatHolidayDay(dateStr: string): string {
  // "2026-06-06" -> "6/6"
  const parts = dateStr.split("-");
  return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
}

function getDayName(dateStr: string): string {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const d = new Date(dateStr);
  return days[d.getDay()];
}

export default function ScheduleAdminPage() {
  const { editingLocale } = useAdminLocale();
  const { schedulePopup } = useSiteDataForLocale(editingLocale);
  const update = (fn: (data: import("@/lib/storage").SiteData) => import("@/lib/storage").SiteData) =>
    updateSiteData(fn, editingLocale);
  const [draft, setDraft] = useState<SchedulePopup>(schedulePopup);
  const [toast, setToast] = useState<string | null>(null);
  const [holidayLoading, setHolidayLoading] = useState(false);

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

  // ─── 공휴일 자동 불러오기 ───
  const fetchHolidays = async () => {
    const ym = getYearMonth(draft.month);
    if (!ym) {
      setToast("월 표시 형식이 올바르지 않습니다. (예: 2026.06)");
      return;
    }

    setHolidayLoading(true);
    try {
      const res = await fetch(`/api/holidays?year=${ym.year}&month=${ym.month}`);
      const data = await res.json();

      if (!res.ok) {
        setToast(data.error || "공휴일 정보를 불러오지 못했습니다.");
        return;
      }

      const holidays: HolidayItem[] = data.holidays;

      if (holidays.length === 0) {
        setToast("해당 월에 공휴일이 없습니다.");
        return;
      }

      // 이미 등록된 공휴일과 중복 확인
      const existingDays = new Set(draft.rows.map((r) => r.day));
      const newRows = holidays
        .filter((h) => h.isHoliday)
        .filter((h) => {
          const dayLabel = `${formatHolidayDay(h.date)} (${getDayName(h.date)})`;
          const dayLabelWithName = `${formatHolidayDay(h.date)} (${h.name})`;
          return !existingDays.has(dayLabel) && !existingDays.has(dayLabelWithName);
        })
        .map((h) => ({
          day: `${formatHolidayDay(h.date)} (${h.name})`,
          hours: "휴진",
          note: "공휴일",
        }));

      if (newRows.length === 0) {
        setToast("모든 공휴일이 이미 등록되어 있습니다.");
        return;
      }

      setDraft((p) => ({
        ...p,
        rows: [...p.rows, ...newRows],
      }));

      setToast(`${newRows.length}개의 공휴일이 추가되었습니다.`);
    } catch {
      setToast("공휴일 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setHolidayLoading(false);
    }
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
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={fetchHolidays}
              disabled={holidayLoading}
            >
              {holidayLoading ? "불러오는 중..." : "공휴일 자동 추가"}
            </Button>
            <Button size="sm" variant="primary" onClick={addRow}>
              + 항목 추가
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {draft.rows.map((row, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-2">
              <div className="flex gap-2 items-center flex-1 min-w-0">
                <span className="text-xs text-ink-muted w-6 text-center font-mono shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <TextInput
                    value={row.day}
                    onChange={(e) => updateRow(i, "day", e.target.value)}
                    placeholder="요일/날짜"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <TextInput
                    value={row.hours}
                    onChange={(e) => updateRow(i, "hours", e.target.value)}
                    placeholder="시간"
                  />
                </div>
                <div className="w-28 shrink-0">
                  <TextInput
                    value={row.note || ""}
                    onChange={(e) => updateRow(i, "note", e.target.value)}
                    placeholder="비고"
                  />
                </div>
              </div>
              <div className="flex gap-1 justify-end sm:justify-start shrink-0">
                <Button size="sm" variant="ghost" onClick={() => moveRow(i, -1)} disabled={i === 0}>↑</Button>
                <Button size="sm" variant="ghost" onClick={() => moveRow(i, 1)} disabled={i === draft.rows.length - 1}>↓</Button>
                <Button size="sm" variant="danger" onClick={() => removeRow(i)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button onClick={save}>저장</Button>
      </div>

      <Card className="mt-6 bg-yellow-50 border-yellow-200">
        <p className="text-sm text-yellow-900" style={{ lineHeight: 1.6 }}>
          💡 매월 초에 제목과 월 표시를 변경하고, &ldquo;공휴일 자동 추가&rdquo; 버튼을 클릭하면
          해당 월의 공휴일(설날, 추석, 대체공휴일 포함)이 자동으로 휴진 항목에 추가됩니다.
        </p>
      </Card>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

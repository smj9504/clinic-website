"use client";

import { useEffect, useState } from "react";
import { useSiteDataForLocale } from "@/lib/useSiteData";
import { useAdminLocale } from "@/lib/adminLocale";
import { updateSiteData, syncImages, type Popup } from "@/lib/storage";
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

/** "EVENT · 2026.05" → "2026.05", or try to extract YYYY.MM from any format */
function extractMonth(dateStr: string): string {
  const m = dateStr.match(/(\d{4})[.\-/](\d{2})/);
  return m ? `${m[1]}.${m[2]}` : "";
}

function isCurrentMonth(dateStr: string): boolean {
  const now = new Date();
  const current = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}`;
  return extractMonth(dateStr) === current;
}

export default function PopupAdminPage() {
  const { editingLocale } = useAdminLocale();
  const { popup, events } = useSiteDataForLocale(editingLocale);
  const update: typeof updateSiteData = (fn) => {
    updateSiteData(fn, editingLocale);
    syncImages(editingLocale);
  };
  const [draft, setDraft] = useState<Popup>(popup);
  const [toast, setToast] = useState<string | null>(null);

  const popupStr = JSON.stringify(popup);
  useEffect(() => {
    setDraft(popup);
  }, [popupStr]);

  const save = () => {
    update((d) => ({ ...d, popup: draft }));
    setToast("팝업 설정이 저장되었습니다");
  };

  const applyEvent = (ev: Event) => {
    setDraft((p) => ({
      ...p,
      title: `${ev.title}\n${ev.subtitle}`,
      body: ev.description,
      image: ev.image,
      linkUrl: `/events/${ev.id}`,
    }));
    setToast("이벤트 내용이 적용되었습니다. 수정 후 저장하세요.");
  };

  // Sort: current month events first, then others
  const sortedEvents = [...events].sort((a, b) => {
    const aCurrent = isCurrentMonth(a.date) ? 0 : 1;
    const bCurrent = isCurrentMonth(b.date) ? 0 : 1;
    return aCurrent - bCurrent;
  });

  return (
    <>
      <PageHeader
        title="이벤트 팝업 관리"
        description="홈페이지 진입 시 표시되는 이벤트 팝업을 관리합니다. 등록된 이벤트를 선택하면 자동으로 채워집니다."
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

      {/* Event selector */}
      <Card className="mb-6">
        <h3 className="font-semibold mb-1" style={{ letterSpacing: "-0.02em" }}>
          이벤트 선택
        </h3>
        <p className="text-xs text-ink-muted mb-4">
          등록된 이벤트를 클릭하면 팝업 내용이 자동으로 채워집니다.
        </p>

        {sortedEvents.length === 0 ? (
          <p className="text-sm text-ink-muted py-4">
            등록된 이벤트가 없습니다. 이벤트 관리에서 먼저 추가해 주세요.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedEvents.map((ev) => {
              const current = isCurrentMonth(ev.date);
              return (
                <button
                  key={ev.id}
                  onClick={() => applyEvent(ev)}
                  className="text-left border border-line rounded-lg p-3 hover:border-accent hover:bg-[#FFFBF5] transition-all group relative overflow-hidden"
                >
                  {current && (
                    <span className="absolute top-2 right-2 text-[0.6rem] font-bold uppercase bg-accent text-white px-1.5 py-0.5 rounded" style={{ letterSpacing: "0.05em" }}>
                      이번 달
                    </span>
                  )}
                  <div className="flex gap-3 items-start">
                    {ev.image && (
                      <div className="w-16 h-12 rounded overflow-hidden flex-shrink-0 bg-bg-alt">
                        <img
                          src={ev.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div
                        className="font-semibold text-sm truncate group-hover:text-accent transition-colors"
                        style={{ letterSpacing: "-0.02em" }}
                      >
                        {ev.title}
                      </div>
                      <div className="text-xs text-ink-muted truncate">
                        {ev.subtitle}
                      </div>
                      <div
                        className="text-[0.65rem] text-ink-muted mt-1 uppercase"
                        style={{ letterSpacing: "0.1em" }}
                      >
                        {ev.date}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Manual edit (pre-filled from selected event) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold mb-4" style={{ letterSpacing: "-0.02em" }}>
            팝업 내용
          </h3>
          <Field label="제목" hint="줄바꿈은 그대로 표시됩니다">
            <TextArea
              value={draft.title}
              onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
              rows={3}
            />
          </Field>
          <Field label="본문">
            <TextArea
              value={draft.body}
              onChange={(e) => setDraft((p) => ({ ...p, body: e.target.value }))}
              rows={4}
            />
          </Field>
          <Field label="버튼 링크" hint="'자세히' 버튼 클릭 시 이동할 URL">
            <TextInput
              value={draft.linkUrl}
              onChange={(e) => setDraft((p) => ({ ...p, linkUrl: e.target.value }))}
              placeholder="/events/1"
            />
          </Field>
        </Card>

        <Card>
          <h3 className="font-semibold mb-4" style={{ letterSpacing: "-0.02em" }}>
            팝업 이미지
          </h3>
          <Field label="" hint="권장 비율 4:3">
            <ImageInput
              value={draft.image}
              onChange={(v) => setDraft((p) => ({ ...p, image: v }))}
              aspectRatio="4 / 3"
            />
          </Field>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={save}>저장</Button>
      </div>

      <Card className="mt-6 bg-yellow-50 border-yellow-200">
        <p className="text-sm text-yellow-900" style={{ lineHeight: 1.6 }}>
          💡 팝업은 사이트 진입 후 2초 뒤에 표시되며, 사용자가 &ldquo;오늘 하루 보지 않기&rdquo;를 선택하면 같은 날 다시 보이지 않습니다.
        </p>
      </Card>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

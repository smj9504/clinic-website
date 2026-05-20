"use client";

import { useEffect, useState } from "react";
import { useSiteDataForLocale } from "@/lib/useSiteData";
import { useAdminLocale } from "@/lib/adminLocale";
import { updateSiteData, syncImages, type Popup } from "@/lib/storage";
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

export default function PopupAdminPage() {
  const { editingLocale } = useAdminLocale();
  const { popup } = useSiteDataForLocale(editingLocale);
  const update: typeof updateSiteData = (fn) => updateSiteData(fn, editingLocale);
  const [draft, setDraft] = useState<Popup>(popup);
  const [toast, setToast] = useState<string | null>(null);

  const popupStr = JSON.stringify(popup);
  useEffect(() => {
    setDraft(popup);
  }, [popupStr]);

  const save = () => {
    update((d) => ({ ...d, popup: draft }));
    syncImages(editingLocale);
    setToast("팝업 설정이 저장되었습니다");
  };

  return (
    <>
      <PageHeader
        title="팝업 관리"
        description="홈페이지 진입 시 표시되는 이달의 이벤트 팝업을 관리합니다."
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold mb-4" style={{ letterSpacing: "-0.02em" }}>
            내용
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
              placeholder="/events"
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

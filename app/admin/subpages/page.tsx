"use client";

import { useState } from "react";
import { useSiteDataForLocale } from "@/lib/useSiteData";
import { useAdminLocale } from "@/lib/adminLocale";
import { updateSiteData, syncImages, type SiteData } from "@/lib/storage";
import type { SubPage } from "@/lib/data";
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
import RichEditor from "@/components/admin/RichEditor";

const GROUPS: { parentMenuId: string; title: string }[] = [
  { parentMenuId: "m7", title: "피부미용" },
  { parentMenuId: "m8", title: "한방치료" },
];

export default function SubPagesAdminPage() {
  const { editingLocale } = useAdminLocale();
  const { subPages } = useSiteDataForLocale(editingLocale);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<SubPage>>({});
  const [toast, setToast] = useState<string | null>(null);

  const items = subPages ?? [];
  const update = (fn: (data: SiteData) => SiteData) => updateSiteData(fn, editingLocale);

  const save = async (id: string) => {
    const ok = await update((d) => ({
      ...d,
      subPages: (d.subPages ?? []).map((sp) => (sp.id === id ? { ...sp, ...draft } : sp)),
    }));
    syncImages(editingLocale);
    setEditing(null);
    setDraft({});
    if (ok) setToast("페이지가 저장되었습니다");
  };

  const toggleHide = async (id: string, current: boolean) => {
    await update((d) => ({
      ...d,
      subPages: (d.subPages ?? []).map((sp) => (sp.id === id ? { ...sp, isHidden: !current } : sp)),
    }));
  };

  return (
    <>
      <PageHeader
        title="시술 페이지 관리"
        description="피부미용·한방치료 하위 메뉴에 연결되는 콘텐츠 페이지를 관리합니다. 제목, 소개, 본문, 이미지를 편집할 수 있습니다."
      />

      {GROUPS.map((group) => {
        const groupItems = items
          .filter((sp) => sp.parentMenuId === group.parentMenuId)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        if (groupItems.length === 0) return null;

        return (
          <Card key={group.parentMenuId} className="p-0 overflow-hidden mb-6">
            <div className="px-5 py-3 border-b border-line bg-bg-alt">
              <h3 className="font-semibold text-sm" style={{ letterSpacing: "-0.02em" }}>{group.title}</h3>
            </div>
            {groupItems.map((sp) => (
              <div key={sp.id} className="border-b border-line/50 last:border-b-0">
                {editing === sp.id ? (
                  <div className="px-4 py-4">
                    <Field label="제목">
                      <TextInput
                        value={draft.title ?? sp.title}
                        onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                      />
                    </Field>
                    <Field label="소개" hint="피부미용·한방치료 목록 페이지의 카드 설명으로 표시됩니다. 여러 줄로 자세히 작성할 수 있습니다">
                      <TextArea
                        rows={4}
                        value={draft.intro ?? sp.intro ?? ""}
                        onChange={(e) => setDraft((p) => ({ ...p, intro: e.target.value }))}
                      />
                    </Field>
                    <Field label="본문" hint="제목, 목록, 인용, 이미지 등의 서식을 넣을 수 있습니다">
                      <RichEditor
                        value={draft.body ?? sp.body}
                        onChange={(html) => setDraft((p) => ({ ...p, body: html }))}
                      />
                    </Field>
                    <Field
                      label="이미지"
                      hint="본문 상단 대표 사진으로 쓰이고, 페이지 맨 위 제목 영역의 배경(어둡게 처리되어 30% 밝기로)으로도 함께 표시됩니다"
                    >
                      <ImageInput
                        value={draft.image ?? sp.image ?? ""}
                        onChange={(v) => setDraft((p) => ({ ...p, image: v }))}
                        aspectRatio="16 / 9"
                      />
                    </Field>
                    <Field
                      label="넓은 배너 이미지"
                      hint="목록 페이지에서 이 항목 아래에 화면 좌우 끝까지 꽉 채워 표시됩니다 (선택 사항, 권장 비율 21:9)"
                    >
                      <ImageInput
                        value={draft.fullBleedImage ?? sp.fullBleedImage ?? ""}
                        onChange={(v) => setDraft((p) => ({ ...p, fullBleedImage: v }))}
                        aspectRatio="21 / 9"
                      />
                    </Field>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" onClick={() => save(sp.id)}>저장</Button>
                      <Button size="sm" variant="secondary" onClick={() => { setEditing(null); setDraft({}); }}>취소</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-semibold text-sm ${sp.isHidden ? "text-ink-muted line-through" : ""}`}
                          style={{ letterSpacing: "-0.02em" }}
                        >
                          {sp.title}
                        </span>
                        {sp.isHidden ? (
                          <span className="text-xs px-1.5 py-0.5 bg-bg-alt rounded text-ink-muted">숨김</span>
                        ) : (
                          <span className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 rounded">표시</span>
                        )}
                        {!sp.body && (
                          <span className="text-xs px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded">본문 없음</span>
                        )}
                      </div>
                      <div className="text-xs text-ink-muted font-mono mt-0.5 truncate">/subpages/{sp.slug}</div>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end sm:justify-start shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => toggleHide(sp.id, sp.isHidden)}>{sp.isHidden ? "표시" : "숨김"}</Button>
                      <Button size="sm" variant="secondary" onClick={() => { setEditing(sp.id); setDraft({}); }}>수정</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </Card>
        );
      })}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

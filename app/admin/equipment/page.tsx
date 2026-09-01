"use client";

import { useState } from "react";
import { useSiteDataForLocale } from "@/lib/useSiteData";
import { useAdminLocale } from "@/lib/adminLocale";
import { updateSiteData, syncImages, generateId, type SiteData } from "@/lib/storage";
import { useServiceCatalog } from "@/lib/useServices";
import type { Equipment } from "@/lib/data";
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
import LinkedServicesPicker from "@/components/admin/equipment/LinkedServicesPicker";

type Draft = Partial<Omit<Equipment, "tags">> & { tagsText?: string };

function tagsToText(tags: string[]) {
  return tags.join(", ");
}
function textToTags(text: string) {
  return text
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function EquipmentAdminPage() {
  const { editingLocale } = useAdminLocale();
  const { equipment, equipmentPageBanner } = useSiteDataForLocale(editingLocale);
  const { categories, subcategories, services } = useServiceCatalog({ includeHidden: true });
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [toast, setToast] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const sorted = [...(equipment ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const update = (fn: (data: SiteData) => SiteData) => updateSiteData(fn, editingLocale);

  const updatePageBanner = async (v: string) => {
    await update((d) => ({ ...d, equipmentPageBanner: v }));
    await syncImages(editingLocale);
  };

  const startEdit = (eq: Equipment) => {
    setEditing(eq.id);
    setDraft({ ...eq, tagsText: tagsToText(eq.tags) });
  };

  const save = async (id: string) => {
    const { tagsText, ...rest } = draft;
    const patch: Partial<Equipment> = { ...rest };
    if (tagsText !== undefined) patch.tags = textToTags(tagsText);
    const ok = await update((d) => ({
      ...d,
      equipment: (d.equipment ?? []).map((eq) => (eq.id === id ? { ...eq, ...patch } : eq)),
    }));
    syncImages(editingLocale);
    setEditing(null);
    setDraft({});
    if (ok) setToast("장비 정보가 저장되었습니다");
  };

  const toggleHide = async (id: string, current: boolean) => {
    await update((d) => ({
      ...d,
      equipment: (d.equipment ?? []).map((eq) => (eq.id === id ? { ...eq, isHidden: !current } : eq)),
    }));
  };

  const move = (id: string, dir: -1 | 1) => {
    update((d) => {
      const list = [...(d.equipment ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
      const idx = list.findIndex((eq) => eq.id === id);
      if (idx < 0) return d;
      const target = idx + dir;
      if (target < 0 || target >= list.length) return d;
      [list[idx], list[target]] = [list[target], list[idx]];
      return { ...d, equipment: list.map((eq, i) => ({ ...eq, sortOrder: i })) };
    });
  };

  const remove = async (id: string) => {
    if (!confirm("이 장비를 삭제하시겠습니까?")) return;
    const ok = await update((d) => ({
      ...d,
      equipment: (d.equipment ?? []).filter((eq) => eq.id !== id).map((eq, i) => ({ ...eq, sortOrder: i })),
    }));
    if (ok) setToast("장비가 삭제되었습니다");
  };

  const add = async () => {
    const ok = await update((d) => ({
      ...d,
      equipment: [
        ...(d.equipment ?? []),
        {
          id: generateId("eq"),
          image: "",
          title: "새 장비",
          subtitle: "",
          tags: [],
          serviceIds: [],
          description: "",
          isHidden: true,
          sortOrder: (d.equipment ?? []).length,
        },
      ],
    }));
    setAdding(false);
    if (ok) setToast("장비가 추가되었습니다. 내용을 입력 후 표시 처리하세요.");
  };

  return (
    <>
      <PageHeader
        title="장비소개 관리"
        description="피부미용 페이지에서 연결되는 장비소개 카드 목록을 관리합니다."
        actions={<Button onClick={add} disabled={adding}>+ 장비 추가</Button>}
      />

      <Card className="mb-6">
        <Field
          label="상단 배경 이미지"
          hint="/equipment(장비소개) 목록 페이지 맨 위 제목 영역의 배경(어둡게 처리되어 30% 밝기로)입니다. 비워두면 그라디언트만 표시됩니다"
        >
          <ImageInput
            value={equipmentPageBanner ?? ""}
            onChange={updatePageBanner}
            aspectRatio="16 / 5"
          />
        </Field>
      </Card>

      <Card className="p-0 overflow-hidden">
        {sorted.length === 0 && (
          <div className="px-4 py-8 text-center text-ink-muted text-sm">등록된 장비가 없습니다.</div>
        )}
        {sorted.map((eq, i) => (
          <div key={eq.id} className="border-b border-line/50 last:border-b-0">
            {editing === eq.id ? (
              <div className="px-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Field label="장비명">
                    <TextInput
                      value={draft.title ?? eq.title}
                      onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                    />
                  </Field>
                  <Field label="부제 (영문/기술명)">
                    <TextInput
                      value={draft.subtitle ?? eq.subtitle ?? ""}
                      onChange={(e) => setDraft((p) => ({ ...p, subtitle: e.target.value }))}
                    />
                  </Field>
                </div>
                <Field label="태그" hint="쉼표(,)로 구분해서 입력하세요. 예: 리프팅, 탄력개선, 윤곽정리, 비수술">
                  <TextInput
                    value={draft.tagsText ?? tagsToText(eq.tags)}
                    onChange={(e) => setDraft((p) => ({ ...p, tagsText: e.target.value }))}
                  />
                </Field>
                <Field label="설명">
                  <TextArea
                    rows={3}
                    value={draft.description ?? eq.description}
                    onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                  />
                </Field>
                <Field
                  label="연결된 시술"
                  hint="이 장비를 사용하는 시술을 선택하세요. 장비소개 페이지에서 카드 클릭 시 모달로 표시됩니다."
                >
                  <LinkedServicesPicker
                    selectedIds={draft.serviceIds ?? eq.serviceIds ?? []}
                    onChange={(ids) => setDraft((p) => ({ ...p, serviceIds: ids }))}
                    categories={categories}
                    subcategories={subcategories}
                    services={services}
                    locale={editingLocale}
                  />
                </Field>
                <Field label="이미지 · 동영상" hint="장비소개 목록 카드, 피부미용 페이지 콜라주 등에 쓰이는 4:3 대표 이미지입니다">
                  <ImageInput
                    value={draft.image ?? eq.image}
                    onChange={(v) => setDraft((p) => ({ ...p, image: v }))}
                    aspectRatio="4 / 3"
                    allowVideo
                  />
                </Field>
                <Field
                  label="와이드 이미지 (선택)"
                  hint="피부미용 페이지 장비 탭 하단 전체폭 영역 전용 고화질 사진입니다. 권장 비율 21:9, 고해상도(2000px 이상) 권장. 비워두면 위 대표 이미지가 대신 쓰입니다"
                >
                  <ImageInput
                    value={draft.showcaseImage ?? eq.showcaseImage ?? ""}
                    onChange={(v) => setDraft((p) => ({ ...p, showcaseImage: v }))}
                    aspectRatio="21 / 9"
                  />
                </Field>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={() => save(eq.id)}>저장</Button>
                  <Button size="sm" variant="secondary" onClick={() => { setEditing(null); setDraft({}); }}>취소</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-14 h-10 rounded overflow-hidden flex-shrink-0 bg-bg-alt">
                    {eq.image && <img src={eq.image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-semibold text-sm ${eq.isHidden ? "text-ink-muted line-through" : ""}`}
                        style={{ letterSpacing: "-0.02em" }}
                      >
                        {eq.title}
                      </span>
                      {eq.isHidden ? (
                        <span className="text-xs px-1.5 py-0.5 bg-bg-alt rounded text-ink-muted">숨김</span>
                      ) : (
                        <span className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 rounded">표시</span>
                      )}
                    </div>
                    <div className="text-xs text-ink-muted mt-0.5 truncate">
                      {eq.tags.length > 0 ? eq.tags.map((t) => `#${t}`).join(" ") : "태그 없음"}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap justify-end sm:justify-start shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => move(eq.id, -1)} disabled={i === 0} title="위로">↑</Button>
                  <Button size="icon" variant="ghost" onClick={() => move(eq.id, 1)} disabled={i === sorted.length - 1} title="아래로">↓</Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleHide(eq.id, eq.isHidden)}>{eq.isHidden ? "표시" : "숨김"}</Button>
                  <Button size="sm" variant="secondary" onClick={() => startEdit(eq)}>수정</Button>
                  <Button size="sm" variant="danger" onClick={() => remove(eq.id)}>삭제</Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </Card>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

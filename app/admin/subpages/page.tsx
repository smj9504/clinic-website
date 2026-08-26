"use client";

import { useState } from "react";
import { useSiteDataForLocale } from "@/lib/useSiteData";
import { useAdminLocale } from "@/lib/adminLocale";
import { updateSiteData, syncImages, generateId, type SiteData } from "@/lib/storage";
import type { SubPage, SubPageAreaMap, SubPageAreaHotspot } from "@/lib/data";
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
import AreaMapPicker from "@/components/admin/subpages/AreaMapPicker";

const DEFAULT_AREA_MAP: SubPageAreaMap = {
  enabled: false,
  kind: "face",
  title: "",
  highlight: "",
  image: null,
  imageAlt: "",
  areas: [],
};

const GROUPS: { parentMenuId: string; title: string }[] = [
  { parentMenuId: "m7", title: "피부미용" },
  { parentMenuId: "m8", title: "한방치료" },
];

export default function SubPagesAdminPage() {
  const { editingLocale } = useAdminLocale();
  const { subPages } = useSiteDataForLocale(editingLocale);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<SubPage>>({});
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);
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
    setActiveAreaId(null);
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
                {editing === sp.id ? (() => {
                  const effectiveAreaMap = draft.areaMap ?? sp.areaMap ?? DEFAULT_AREA_MAP;
                  const updateAreaMap = (patch: Partial<SubPageAreaMap>) =>
                    setDraft((p) => ({ ...p, areaMap: { ...(p.areaMap ?? sp.areaMap ?? DEFAULT_AREA_MAP), ...patch } }));
                  const updateArea = (i: number, patch: Partial<SubPageAreaHotspot>) =>
                    updateAreaMap({ areas: effectiveAreaMap.areas.map((a, idx) => (idx === i ? { ...a, ...patch } : a)) });
                  const setAreas = (areas: SubPageAreaHotspot[]) => updateAreaMap({ areas });
                  const addArea = () => {
                    const id = generateId("area");
                    updateAreaMap({ areas: [...effectiveAreaMap.areas, { id, x: 50, y: 50, label: "", description: "" }] });
                    setActiveAreaId(id);
                  };
                  const removeArea = (i: number) =>
                    updateAreaMap({ areas: effectiveAreaMap.areas.filter((_, idx) => idx !== i) });
                  const moveArea = (i: number, dir: -1 | 1) => {
                    const list = [...effectiveAreaMap.areas];
                    const target = i + dir;
                    if (target < 0 || target >= list.length) return;
                    [list[i], list[target]] = [list[target], list[i]];
                    updateAreaMap({ areas: list });
                  };
                  const addFootnote = () => updateAreaMap({ footnote: [...(effectiveAreaMap.footnote ?? []), ""] });
                  const removeFootnote = (i: number) =>
                    updateAreaMap({ footnote: (effectiveAreaMap.footnote ?? []).filter((_, idx) => idx !== i) });
                  const updateFootnote = (i: number, value: string) =>
                    updateAreaMap({ footnote: (effectiveAreaMap.footnote ?? []).map((f, idx) => (idx === i ? value : f)) });

                  return (
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

                    <div className="mb-5 pt-4 border-t border-line">
                      <label className="flex items-center gap-3 cursor-pointer mb-4">
                        <input
                          type="checkbox"
                          checked={effectiveAreaMap.enabled}
                          onChange={(e) => updateAreaMap({ enabled: e.target.checked })}
                          style={{ accentColor: "var(--color-accent)" }}
                          className="w-5 h-5"
                        />
                        <span className="font-semibold text-sm" style={{ letterSpacing: "-0.02em" }}>
                          부위 안내 맵 사용
                        </span>
                        <span className="text-xs text-ink-muted">
                          (사진 위 클릭 가능한 부위 핫스팟을 본문 위에 표시합니다)
                        </span>
                      </label>

                      {effectiveAreaMap.enabled && (
                        <div className="pl-8 space-y-1">
                          <Field
                            label="맵 종류"
                            hint="얼굴형: 3:2 비율 사진 (예: 리프팅). 신체형: 세로~가로 사진 + 부드러운 강조 효과 (예: 통증치료)"
                          >
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant={effectiveAreaMap.kind === "face" ? "primary" : "secondary"}
                                onClick={() => updateAreaMap({ kind: "face" })}
                              >
                                얼굴형
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={effectiveAreaMap.kind === "body" ? "primary" : "secondary"}
                                onClick={() => updateAreaMap({ kind: "body" })}
                              >
                                신체형
                              </Button>
                            </div>
                          </Field>

                          <Field label="제목">
                            <TextInput
                              value={effectiveAreaMap.title}
                              onChange={(e) => updateAreaMap({ title: e.target.value })}
                              placeholder="예: 리프팅"
                            />
                          </Field>
                          <Field label="강조 문구" hint="제목 뒤에 강조 색상으로 이어 붙습니다. 예: 리프팅 [시술 가능 부위]">
                            <TextInput
                              value={effectiveAreaMap.highlight}
                              onChange={(e) => updateAreaMap({ highlight: e.target.value })}
                              placeholder="예: 시술 가능 부위"
                            />
                          </Field>
                          <Field
                            label="맵 이미지"
                            hint={
                              effectiveAreaMap.kind === "face"
                                ? "권장 비율 3:2 (가로가 긴 얼굴 정면 사진)"
                                : "권장 비율 세로 3:4 ~ 가로 4:3 (전신 정면 사진, 인물을 사진 중앙에 배치하세요)"
                            }
                          >
                            <ImageInput
                              value={effectiveAreaMap.image ?? ""}
                              onChange={(v) => updateAreaMap({ image: v || null })}
                              aspectRatio={effectiveAreaMap.kind === "face" ? "3 / 2" : "4 / 3"}
                            />
                          </Field>
                          <Field label="이미지 대체 텍스트" hint="스크린 리더 및 이미지 로드 실패 시 표시됩니다">
                            <TextInput
                              value={effectiveAreaMap.imageAlt}
                              onChange={(e) => updateAreaMap({ imageAlt: e.target.value })}
                            />
                          </Field>

                          <Field
                            label="부위 목록"
                            hint="왼쪽 사진에서 핀을 드래그해 위치를 지정하세요. 새 부위는 '+ 부위 추가'로 만든 뒤 드래그해서 배치합니다."
                          >
                            <div className="grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-6 items-start">
                              <AreaMapPicker
                                image={effectiveAreaMap.image}
                                kind={effectiveAreaMap.kind}
                                areas={effectiveAreaMap.areas}
                                onAreasChange={setAreas}
                                activeId={activeAreaId}
                                onActiveIdChange={setActiveAreaId}
                              />
                              <div className="space-y-3">
                                {effectiveAreaMap.areas.map((area, i) => (
                                  <div
                                    key={area.id}
                                    className={`border rounded-lg p-3 ${area.id === activeAreaId ? "border-accent" : "border-line"}`}
                                  >
                                    <div
                                      className="flex items-center gap-2 mb-2 cursor-pointer"
                                      onClick={() => setActiveAreaId(area.id)}
                                    >
                                      <span className="text-xs text-ink-muted font-mono w-5 shrink-0">{i + 1}</span>
                                      <span className="text-xs text-ink-muted flex-1">
                                        ({Math.round(area.x)}, {Math.round(area.y)})
                                      </span>
                                      <Button size="icon" variant="ghost" onClick={() => moveArea(i, -1)} disabled={i === 0}>↑</Button>
                                      <Button size="icon" variant="ghost" onClick={() => moveArea(i, 1)} disabled={i === effectiveAreaMap.areas.length - 1}>↓</Button>
                                      <Button size="icon" variant="danger" onClick={() => removeArea(i)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                      </Button>
                                    </div>
                                    <TextInput
                                      className="mb-2"
                                      placeholder="부위 이름 (예: 이마)"
                                      value={area.label}
                                      onChange={(e) => updateArea(i, { label: e.target.value })}
                                      onFocus={() => setActiveAreaId(area.id)}
                                    />
                                    <TextArea
                                      rows={2}
                                      placeholder="부위 설명"
                                      value={area.description}
                                      onChange={(e) => updateArea(i, { description: e.target.value })}
                                      onFocus={() => setActiveAreaId(area.id)}
                                    />
                                  </div>
                                ))}
                                <Button type="button" size="sm" variant="secondary" onClick={addArea}>+ 부위 추가</Button>
                              </div>
                            </div>
                          </Field>

                          {effectiveAreaMap.kind === "body" && (
                            <Field
                              label="추가 안내 문구"
                              hint="부위로 표현되지 않는 나머지 항목을 맵 아래에 가운뎃점으로 구분해 나열합니다 (선택 사항)"
                            >
                              <div className="space-y-2">
                                {(effectiveAreaMap.footnote ?? []).map((line, i) => (
                                  <div key={i} className="flex gap-2">
                                    <TextInput value={line} onChange={(e) => updateFootnote(i, e.target.value)} />
                                    <Button size="icon" variant="danger" onClick={() => removeFootnote(i)}>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                    </Button>
                                  </div>
                                ))}
                                <Button type="button" size="sm" variant="secondary" onClick={addFootnote}>+ 문구 추가</Button>
                              </div>
                            </Field>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button size="sm" onClick={() => save(sp.id)}>저장</Button>
                      <Button size="sm" variant="secondary" onClick={() => { setEditing(null); setDraft({}); setActiveAreaId(null); }}>취소</Button>
                    </div>
                  </div>
                  );
                })() : (
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
                      <Button size="sm" variant="secondary" onClick={() => { setEditing(sp.id); setDraft({}); setActiveAreaId(null); }}>수정</Button>
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

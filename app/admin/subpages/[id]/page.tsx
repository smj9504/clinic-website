"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSiteDataForLocale } from "@/lib/useSiteData";
import { useAdminLocale } from "@/lib/adminLocale";
import { updateSiteData, syncImages, generateId } from "@/lib/storage";
import type {
  SubPage,
  SubPageAreaMap,
  SubPageAreaHotspot,
  SubPageStepProcess,
  SubPageStepItem,
  SubPagePointCards,
  SubPagePointItem,
  SubPageSequentialChecklist,
  SubPageChecklistItem,
  SubPageChecklistHero,
  SubPageChecklistHeroItem,
  SubPageChecklistBlock,
  SubPageChecklistBlockItem,
  SubPageSectionId,
} from "@/lib/data";
import { normalizeSectionOrder } from "@/lib/data";
import {
  PageHeader,
  Field,
  TextInput,
  TextArea,
  Button,
  Card,
  ImageInput,
  Toast,
  TabPanel,
} from "@/components/admin/ui";
import RichEditor from "@/components/admin/RichEditor";
import AreaMapPicker from "@/components/admin/subpages/AreaMapPicker";
import ChecklistHeroPicker from "@/components/admin/subpages/ChecklistHeroPicker";
import { useReorderDrag, DragHandleIcon } from "@/components/admin/useReorderDrag";

const DEFAULT_AREA_MAP: SubPageAreaMap = {
  enabled: false,
  kind: "face",
  title: "",
  highlight: "",
  image: null,
  imageAlt: "",
  areas: [],
};

const DEFAULT_STEP_PROCESS: SubPageStepProcess = { title: "", intro: "", items: [] };
const DEFAULT_POINT_CARDS: SubPagePointCards = { title: "", items: [] };
const DEFAULT_SEQUENTIAL_CHECKLIST: SubPageSequentialChecklist = { title: "", items: [] };
const DEFAULT_CHECKLIST_HERO: SubPageChecklistHero = { eyebrow: "Check List", title: "", items: [] };
const DEFAULT_CHECKLIST_BLOCKS: SubPageChecklistBlock[] = [];

/** 새 카드를 추가할 때 순환 배정하는 기본 좌표 — 공개 페이지의 4개 프리셋
 * 위치(top-left/right-mid/bottom-left/bottom-right)와 대략 대응해, 처음
 * 놓였을 때부터 사방에 자연스럽게 흩어지도록 한다. 이후 사진 위에서
 * 자유롭게 드래그해 조정할 수 있다. */
const CHECKLIST_HERO_PRESET_COORDS = [
  { x: 14, y: 12 },
  { x: 82, y: 46 },
  { x: 15, y: 84 },
  { x: 83, y: 88 },
];

/** 구버전 position 프리셋 → 자유 좌표 마이그레이션 매핑. CHECKLIST_HERO_PRESET_COORDS와
 * 같은 값을 쓴다 — 공개 페이지 컴포넌트(ChecklistHero.tsx)의 CARD_POSITION_STYLES가
 * 그리던 대략적인 위치와 대응시켜, 저장된 적 없는 x/y라도 처음 열었을 때부터
 * 기존 레이아웃과 비슷한 자리에서 시작하게 한다. */
const POSITION_TO_COORD: Record<string, { x: number; y: number }> = {
  "top-left": CHECKLIST_HERO_PRESET_COORDS[0],
  "right-mid": CHECKLIST_HERO_PRESET_COORDS[1],
  "bottom-left": CHECKLIST_HERO_PRESET_COORDS[2],
  "bottom-right": CHECKLIST_HERO_PRESET_COORDS[3],
};


/** 항상 맨 앞 고정 — 독립된 공개 화면 섹션이 아니라(제목/소개는 히어로에 쓰이고, 이미지는 다른 섹션용 사진 업로드일 뿐) 순서 조정 대상이 아니다 */
const FIXED_TABS = [
  { id: "basic", label: "기본 정보" },
  { id: "images", label: "이미지" },
] as const;

/** 공개 페이지에 실제 표시 영역을 갖는 구조화 섹션(6개) + 본문 — 여기 순서가 아니라 draft.sectionOrder가 실제 표시 순서를 결정한다 */
const SECTION_TAB_LABELS: Record<SubPageSectionId, string> = {
  areaMap: "부위 맵",
  stepProcess: "순서 안내",
  pointCards: "포인트 카드",
  checklist: "추천 체크리스트",
  checklistHero: "사진 위 체크리스트",
  checklistBlocks: "체크리스트 블록",
  body: "본문",
};

/** 내용 유무를 점 하나로 표시 — 채워짐(초록)·비어 있음(주황) 두 상태만 필요해서 색만으로 구분한다 */
function ContentDot({ hasContent, title }: { hasContent: boolean; title: string }) {
  return (
    <span
      className={`w-1.5 h-1.5 rounded-full shrink-0 ${hasContent ? "bg-emerald-500" : "bg-amber-500"}`}
      title={title}
    />
  );
}

/**
 * 체크리스트 블록 하나(제목+본문+번호 목록)의 편집 UI. 블록마다 목록
 * 항목 개수가 다르므로 항목 드래그 훅(useReorderDrag)을 블록 개수만큼
 * 부모에서 동적으로 호출할 수 없어(Hooks 규칙 위반) 블록 단위로 분리했다 —
 * 이 컴포넌트 자체가 각자 자기 항목 리스트에 대한 훅을 하나씩 갖는다.
 */
function ChecklistBlockEditor({
  block,
  onUpdate,
  onSetItems,
  onAddItem,
  onRemoveItem,
}: {
  block: SubPageChecklistBlock;
  onUpdate: (p: Partial<SubPageChecklistBlock>) => void;
  onSetItems: (items: SubPageChecklistBlockItem[]) => void;
  onAddItem: () => void;
  onRemoveItem: (itemIndex: number) => void;
}) {
  const itemDrag = useReorderDrag(block.items, onSetItems);

  return (
    <>
      <TextInput
        className="mb-2"
        placeholder="제목 (예: 이런 변화가 느껴진다면)"
        value={block.title}
        onChange={(e) => onUpdate({ title: e.target.value })}
      />
      <TextArea
        className="mb-3"
        rows={2}
        placeholder="본문 (선택 사항) — 목록 없이 안내 문단만 넣을 때도 사용합니다"
        value={block.body ?? ""}
        onChange={(e) => onUpdate({ body: e.target.value })}
      />
      <div className="space-y-2">
        {block.items.map((item, ii) => (
          <div
            key={item.id}
            {...itemDrag.getItemProps(ii)}
            className={`flex items-center gap-2 rounded transition-colors ${
              itemDrag.dragOverIndex === ii ? "bg-bg-alt" : ""
            } ${itemDrag.draggingIndex === ii ? "opacity-40" : ""}`}
          >
            <span
              {...itemDrag.getHandleProps(ii)}
              className="cursor-grab active:cursor-grabbing text-ink-muted shrink-0 touch-none"
              title="드래그해서 순서 변경"
            >
              <DragHandleIcon />
            </span>
            <span className="text-xs text-ink-muted font-mono w-6 shrink-0">
              {String(ii + 1).padStart(2, "0")}
            </span>
            <TextInput
              className="flex-1"
              placeholder="목록 항목"
              value={item.text}
              onChange={(e) =>
                onSetItems(block.items.map((it, idx) => (idx === ii ? { ...it, text: e.target.value } : it)))
              }
            />
            <Button size="icon" variant="danger" onClick={() => onRemoveItem(ii)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </Button>
          </div>
        ))}
        <Button type="button" size="sm" variant="secondary" onClick={onAddItem}>+ 항목 추가</Button>
      </div>
    </>
  );
}

export default function SubPageEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";

  const { editingLocale } = useAdminLocale();
  const { subPages, loaded } = useSiteDataForLocale(editingLocale);
  const source = (subPages ?? []).find((sp) => sp.id === id);

  const [draft, setDraft] = useState<Partial<SubPage> | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);
  const [activeChecklistHeroId, setActiveChecklistHeroId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // 소스가 로드되면 초안을 그 값으로 초기화한다. 로케일 전환으로 소스가
  // 바뀌어도(제목 등 번역 필드) 다시 초기화되도록 id뿐 아니라 source도 감시한다.
  useEffect(() => {
    if (source) setDraft({ ...source });
  }, [id, source]);

  const patch = (p: Partial<SubPage>) => setDraft((prev) => (prev ? { ...prev, ...p } : prev));

  // 드래그 재정렬 훅은 draft가 아직 null인 로딩 상태에서도 항상 같은 순서로
  // 호출돼야 하므로(React Hooks 규칙), draft 유무를 가리는 조건부 return보다
  // 앞에 둔다 — 값 계산 자체는 draft가 없으면 빈 배열로 안전하게 폴백한다.
  const areaDrag = useReorderDrag(draft?.areaMap?.areas ?? [], (areas) =>
    patch({ areaMap: { ...(draft?.areaMap ?? DEFAULT_AREA_MAP), areas } })
  );
  const stepDrag = useReorderDrag(draft?.stepProcess?.items ?? [], (items) =>
    patch({ stepProcess: { ...(draft?.stepProcess ?? DEFAULT_STEP_PROCESS), items } })
  );
  const pointDrag = useReorderDrag(draft?.pointCards?.items ?? [], (items) =>
    patch({ pointCards: { ...(draft?.pointCards ?? DEFAULT_POINT_CARDS), items } })
  );
  const checklistDrag = useReorderDrag(draft?.sequentialChecklist?.items ?? [], (items) =>
    patch({ sequentialChecklist: { ...(draft?.sequentialChecklist ?? DEFAULT_SEQUENTIAL_CHECKLIST), items } })
  );
  const checklistBlockDrag = useReorderDrag(draft?.checklistBlocks ?? [], (blocks) =>
    patch({ checklistBlocks: blocks })
  );

  if (loaded && !source) {
    return (
      <>
        <PageHeader title="시술 페이지 편집" />
        <Card className="text-center py-16">
          <p className="text-ink-muted mb-6">페이지를 찾을 수 없습니다.</p>
          <Link href="/admin/subpages" className="text-accent font-semibold text-sm hover:underline">
            &larr; 목록으로
          </Link>
        </Card>
      </>
    );
  }

  if (!draft) {
    return (
      <>
        <PageHeader title="시술 페이지 편집" />
        <Card className="text-center py-16 text-ink-muted">불러오는 중...</Card>
      </>
    );
  }

  const effectiveAreaMap = draft.areaMap ?? DEFAULT_AREA_MAP;
  const updateAreaMap = (p: Partial<SubPageAreaMap>) =>
    patch({ areaMap: { ...effectiveAreaMap, ...p } });
  const updateArea = (i: number, p: Partial<SubPageAreaHotspot>) =>
    updateAreaMap({ areas: effectiveAreaMap.areas.map((a, idx) => (idx === i ? { ...a, ...p } : a)) });
  const setAreas = (areas: SubPageAreaHotspot[]) => updateAreaMap({ areas });
  const addArea = () => {
    const newId = generateId("area");
    updateAreaMap({ areas: [...effectiveAreaMap.areas, { id: newId, x: 50, y: 50, label: "", description: "" }] });
    setActiveAreaId(newId);
  };
  const removeArea = (i: number) => updateAreaMap({ areas: effectiveAreaMap.areas.filter((_, idx) => idx !== i) });
  const addFootnote = () => updateAreaMap({ footnote: [...(effectiveAreaMap.footnote ?? []), ""] });
  const removeFootnote = (i: number) =>
    updateAreaMap({ footnote: (effectiveAreaMap.footnote ?? []).filter((_, idx) => idx !== i) });
  const updateFootnote = (i: number, value: string) =>
    updateAreaMap({ footnote: (effectiveAreaMap.footnote ?? []).map((f, idx) => (idx === i ? value : f)) });

  // 순서 안내(STEP)
  const effectiveStepProcess = draft.stepProcess ?? DEFAULT_STEP_PROCESS;
  const updateStepProcess = (p: Partial<SubPageStepProcess>) =>
    patch({ stepProcess: { ...effectiveStepProcess, ...p } });
  const updateStepItem = (i: number, p: Partial<SubPageStepItem>) =>
    updateStepProcess({ items: effectiveStepProcess.items.map((it, idx) => (idx === i ? { ...it, ...p } : it)) });
  const addStepItem = () =>
    updateStepProcess({ items: [...effectiveStepProcess.items, { id: generateId("step"), text: "", image: null }] });
  const removeStepItem = (i: number) =>
    updateStepProcess({ items: effectiveStepProcess.items.filter((_, idx) => idx !== i) });
  const setStepItems = (items: SubPageStepItem[]) => updateStepProcess({ items });

  // 포인트 카드
  const effectivePointCards = draft.pointCards ?? DEFAULT_POINT_CARDS;
  const updatePointCards = (p: Partial<SubPagePointCards>) =>
    patch({ pointCards: { ...effectivePointCards, ...p } });
  const updatePointItem = (i: number, p: Partial<SubPagePointItem>) =>
    updatePointCards({ items: effectivePointCards.items.map((it, idx) => (idx === i ? { ...it, ...p } : it)) });
  const addPointItem = () =>
    updatePointCards({
      items: [...effectivePointCards.items, { id: generateId("point"), title: "", body: "", image: null }],
    });
  const removePointItem = (i: number) =>
    updatePointCards({ items: effectivePointCards.items.filter((_, idx) => idx !== i) });
  const setPointItems = (items: SubPagePointItem[]) => updatePointCards({ items });

  // 추천 체크리스트
  const effectiveChecklist = draft.sequentialChecklist ?? DEFAULT_SEQUENTIAL_CHECKLIST;
  const updateChecklist = (p: Partial<SubPageSequentialChecklist>) =>
    patch({ sequentialChecklist: { ...effectiveChecklist, ...p } });
  const updateChecklistItem = (i: number, p: Partial<SubPageChecklistItem>) =>
    updateChecklist({ items: effectiveChecklist.items.map((it, idx) => (idx === i ? { ...it, ...p } : it)) });
  const addChecklistItem = () =>
    updateChecklist({ items: [...effectiveChecklist.items, { id: generateId("check"), text: "", image: null }] });
  const removeChecklistItem = (i: number) =>
    updateChecklist({ items: effectiveChecklist.items.filter((_, idx) => idx !== i) });
  const setChecklistItems = (items: SubPageChecklistItem[]) => updateChecklist({ items });

  // 사진 위 체크리스트 히어로. x/y 없이 position 프리셋만 저장된 구버전
  // 데이터는 화면에 열자마자 좌표로 변환해 보여준다 — 그래야 피커에서
  // "위치 미지정"으로 뜨지 않고 기존 자리에서 바로 드래그 조정을 시작할 수 있다.
  const rawChecklistHero = draft.checklistHero ?? DEFAULT_CHECKLIST_HERO;
  const effectiveChecklistHero: SubPageChecklistHero = {
    ...rawChecklistHero,
    items: rawChecklistHero.items.map((it) => {
      if (typeof it.x === "number" && typeof it.y === "number") return it;
      const coord = it.position ? POSITION_TO_COORD[it.position] : undefined;
      return coord ? { ...it, x: coord.x, y: coord.y } : it;
    }),
  };
  const updateChecklistHero = (p: Partial<SubPageChecklistHero>) =>
    patch({ checklistHero: { ...effectiveChecklistHero, ...p } });
  const updateChecklistHeroItem = (i: number, p: Partial<SubPageChecklistHeroItem>) =>
    updateChecklistHero({ items: effectiveChecklistHero.items.map((it, idx) => (idx === i ? { ...it, ...p } : it)) });
  const addChecklistHeroItem = () => {
    const preset =
      CHECKLIST_HERO_PRESET_COORDS[effectiveChecklistHero.items.length % CHECKLIST_HERO_PRESET_COORDS.length];
    const newId = generateId("checkhero");
    updateChecklistHero({
      items: [...effectiveChecklistHero.items, { id: newId, label: "", detail: "", x: preset.x, y: preset.y }],
    });
    setActiveChecklistHeroId(newId);
  };
  const removeChecklistHeroItem = (i: number) =>
    updateChecklistHero({ items: effectiveChecklistHero.items.filter((_, idx) => idx !== i) });
  const setChecklistHeroItems = (items: SubPageChecklistHeroItem[]) => updateChecklistHero({ items });

  // 체크리스트 블록 (소제목 + 본문 + 01/02… 번호 목록 반복)
  const effectiveChecklistBlocks = draft.checklistBlocks ?? DEFAULT_CHECKLIST_BLOCKS;
  const setChecklistBlocks = (blocks: SubPageChecklistBlock[]) => patch({ checklistBlocks: blocks });
  const updateChecklistBlock = (i: number, p: Partial<SubPageChecklistBlock>) =>
    setChecklistBlocks(effectiveChecklistBlocks.map((b, idx) => (idx === i ? { ...b, ...p } : b)));
  const addChecklistBlock = () =>
    setChecklistBlocks([...effectiveChecklistBlocks, { id: generateId("checkblock"), title: "", body: "", items: [] }]);
  const removeChecklistBlock = (i: number) =>
    setChecklistBlocks(effectiveChecklistBlocks.filter((_, idx) => idx !== i));
  const addChecklistBlockItem = (blockIndex: number) =>
    updateChecklistBlock(blockIndex, {
      items: [...effectiveChecklistBlocks[blockIndex].items, { id: generateId("checkblockitem"), text: "" }],
    });
  const removeChecklistBlockItem = (blockIndex: number, itemIndex: number) =>
    updateChecklistBlock(blockIndex, {
      items: effectiveChecklistBlocks[blockIndex].items.filter((_, idx) => idx !== itemIndex),
    });
  const setChecklistBlockItems = (blockIndex: number, items: SubPageChecklistBlockItem[]) =>
    updateChecklistBlock(blockIndex, { items });

  // 섹션 표시 순서 — 항상 6개 id 전부를 포함한 완전한 순열로 정규화해서 쓴다.
  // 탭 옆 ↑↓ 버튼으로만 바꾸고(이 저장소 전반의 기존 순서 변경 관례와 동일), 드래그는 쓰지 않는다.
  const effectiveSectionOrder = normalizeSectionOrder(draft.sectionOrder);
  const moveSectionTab = (sectionId: SubPageSectionId, dir: -1 | 1) => {
    const list = [...effectiveSectionOrder];
    const i = list.indexOf(sectionId);
    const target = i + dir;
    if (target < 0 || target >= list.length) return;
    [list[i], list[target]] = [list[target], list[i]];
    patch({ sectionOrder: list });
  };

  // 탭에서 내용 유무를 한눈에 비교할 수 있도록 각 섹션의 "내용이 있는지" 여부를 계산한다.
  // 채워진 값 없이 빈 배열/빈 문자열만 있는 상태(추가는 했지만 아직 아무것도 안 쓴 상태)는
  // "없음"으로 취급해, 실수로 빈 섹션을 켜둔 채 저장하는 것을 미리 알아챌 수 있게 한다.
  const sectionHasContent: Record<SubPageSectionId, boolean> = {
    areaMap: effectiveAreaMap.enabled && effectiveAreaMap.areas.length > 0,
    stepProcess: effectiveStepProcess.items.length > 0,
    pointCards: effectivePointCards.items.length > 0,
    checklist: effectiveChecklist.items.length > 0,
    checklistHero: effectiveChecklistHero.items.length > 0,
    checklistBlocks: effectiveChecklistBlocks.length > 0,
    body: Boolean(draft.body?.trim()),
  };
  const imagesHaveContent = Boolean(draft.image);
  const basicHasContent = Boolean(draft.title?.trim());

  const save = async () => {
    setSaving(true);
    const ok = await updateSiteData(
      (d) => ({
        ...d,
        subPages: (d.subPages ?? []).map((sp) => (sp.id === id ? { ...sp, ...draft } : sp)),
      }),
      editingLocale
    );
    await syncImages(editingLocale);
    setSaving(false);
    if (ok) setToast("페이지가 저장되었습니다");
  };

  const remove = async () => {
    if (!confirm("이 시술 페이지를 삭제하시겠습니까?")) return;
    const ok = await updateSiteData(
      (d) => ({ ...d, subPages: (d.subPages ?? []).filter((sp) => sp.id !== id) }),
      editingLocale
    );
    if (ok) router.push("/admin/subpages");
  };

  return (
    <>
      <PageHeader
        title={source?.title || "시술 페이지 편집"}
        description={`/subpages/${source?.slug ?? ""}`}
        actions={
          <>
            {source && (
              <Link
                href={`/subpages/${source.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded font-semibold transition-colors border border-line bg-surface text-ink hover:bg-bg-alt px-4 py-2 text-sm"
                style={{ letterSpacing: "-0.02em" }}
              >
                미리보기 ↗
              </Link>
            )}
            <Link
              href="/admin/subpages"
              className="inline-flex items-center gap-1.5 rounded font-semibold transition-colors border border-line bg-surface text-ink hover:bg-bg-alt px-4 py-2 text-sm"
              style={{ letterSpacing: "-0.02em" }}
            >
              목록
            </Link>
          </>
        }
      />

      <Card>
        <div className="mb-3">
          <p className="text-xs text-ink-muted mb-2">
            공개 페이지 표시 순서 — 탭 오른쪽 ↑↓ 버튼으로 바꿀 수 있습니다. 점 색상은 내용이 채워져 있는지(●) 비어 있는지(●)를 나타냅니다.
          </p>
          <div role="tablist" className="flex flex-wrap gap-1 border-b border-line overflow-x-auto">
            {FIXED_TABS.map((tab) => {
              const isActive = tab.id === activeTab;
              const hasContent = tab.id === "basic" ? basicHasContent : imagesHaveContent;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative shrink-0 px-4 py-3 text-sm font-semibold transition-colors ${
                    isActive ? "text-ink" : "text-ink-muted hover:text-ink"
                  }`}
                  style={{ letterSpacing: "-0.02em" }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {tab.label}
                    <ContentDot
                      hasContent={hasContent}
                      title={hasContent ? "내용이 채워져 있습니다" : "비어 있는 항목이 있습니다"}
                    />
                  </span>
                  {isActive && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-ink rounded-full" />}
                </button>
              );
            })}
            <span className="w-px my-2 bg-line shrink-0" aria-hidden="true" />
            {effectiveSectionOrder.map((sectionId, i) => {
              const isActive = sectionId === activeTab;
              const hasContent = sectionHasContent[sectionId];
              return (
                <span
                  key={sectionId}
                  role="tab"
                  aria-selected={isActive}
                  className={`relative shrink-0 flex items-center gap-0.5 pl-4 pr-1.5 py-1.5 text-sm font-semibold transition-colors ${
                    isActive ? "text-ink" : "text-ink-muted hover:text-ink"
                  }`}
                  style={{ letterSpacing: "-0.02em" }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveTab(sectionId)}
                    className="inline-flex items-center gap-1.5 py-1.5"
                  >
                    <span className="text-[0.7rem] text-ink-muted/70 font-mono">{i + 1}</span>
                    {SECTION_TAB_LABELS[sectionId]}
                    <ContentDot
                      hasContent={hasContent}
                      title={hasContent ? "내용이 채워져 있습니다" : "비어 있습니다"}
                    />
                  </button>
                  <span className="flex items-center">
                    <button
                      type="button"
                      onClick={() => moveSectionTab(sectionId, -1)}
                      disabled={i === 0}
                      aria-label={`${SECTION_TAB_LABELS[sectionId]} 순서를 앞으로`}
                      className="w-5 h-5 flex items-center justify-center rounded text-ink-muted hover:text-ink hover:bg-bg-alt disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSectionTab(sectionId, 1)}
                      disabled={i === effectiveSectionOrder.length - 1}
                      aria-label={`${SECTION_TAB_LABELS[sectionId]} 순서를 뒤로`}
                      className="w-5 h-5 flex items-center justify-center rounded text-ink-muted hover:text-ink hover:bg-bg-alt disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      →
                    </button>
                  </span>
                  {isActive && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-ink rounded-full" />}
                </span>
              );
            })}
          </div>
        </div>

        <TabPanel id="basic" active={activeTab}>
          <Field label="제목">
            <TextInput value={draft.title ?? ""} onChange={(e) => patch({ title: e.target.value })} />
          </Field>
          <Field
            label="소개"
            hint="피부미용·한방치료 목록 페이지의 카드 설명으로 표시됩니다. 여러 줄로 자세히 작성할 수 있습니다"
          >
            <TextArea rows={4} value={draft.intro ?? ""} onChange={(e) => patch({ intro: e.target.value })} />
          </Field>
        </TabPanel>

        <TabPanel id="body" active={activeTab}>
          <p className="text-sm text-ink-muted mb-5">
            다른 구조화 섹션(순서 안내·포인트 카드·추천 체크리스트 등)에 속하지 않는 자유 서술(서론,
            마무리 안내 등)을 씁니다. 제목, 목록, 인용, 이미지 등의 서식을 넣을 수 있습니다. 공개 페이지
            표시 위치는 위 탭 줄의 ←→ 버튼으로 조정합니다.
          </p>
          <RichEditor value={draft.body ?? ""} onChange={(html) => patch({ body: html })} />
        </TabPanel>

        <TabPanel id="images" active={activeTab}>
          <Field
            label="대표 이미지"
            hint="본문 상단에 표시되는 대표 사진입니다"
          >
            <ImageInput
              value={draft.image ?? ""}
              onChange={(v) => patch({ image: v })}
              aspectRatio="16 / 9"
            />
          </Field>
          <Field
            label="상단 배경 이미지"
            hint="페이지 맨 위 제목 영역의 배경(어둡게 처리되어 30% 밝기로)입니다. 비워두면 대표 이미지가 대신 쓰입니다"
          >
            <ImageInput
              value={draft.titleBgImage ?? ""}
              onChange={(v) => patch({ titleBgImage: v })}
              aspectRatio="16 / 9"
            />
          </Field>
          <p className="text-xs text-ink-muted">
            목록 페이지(피부미용·한방치료)의 넓은 배너 이미지는{" "}
            <Link href="/admin/hub-pages" className="text-accent hover:underline">
              피부미용 · 한방치료 페이지
            </Link>{" "}
            화면에서 관리합니다.
          </p>
        </TabPanel>

        <TabPanel id="areaMap" active={activeTab}>
          <label className="flex items-center gap-3 cursor-pointer mb-5">
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

          {effectiveAreaMap.enabled ? (
            <div className="space-y-1">
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
                        {...areaDrag.getItemProps(i)}
                        className={`border rounded-lg p-3 transition-colors ${
                          area.id === activeAreaId ? "border-accent" : "border-line"
                        } ${areaDrag.dragOverIndex === i ? "border-accent bg-bg-alt" : ""} ${
                          areaDrag.draggingIndex === i ? "opacity-40" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2 cursor-pointer" onClick={() => setActiveAreaId(area.id)}>
                          <span
                            {...areaDrag.getHandleProps(i)}
                            className="cursor-grab active:cursor-grabbing text-ink-muted shrink-0 touch-none"
                            title="드래그해서 순서 변경"
                          >
                            <DragHandleIcon />
                          </span>
                          <span className="text-xs text-ink-muted font-mono w-5 shrink-0">{i + 1}</span>
                          <span className="text-xs text-ink-muted flex-1">
                            ({Math.round(area.x)}, {Math.round(area.y)})
                          </span>
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
          ) : (
            <p className="text-sm text-ink-muted py-8 text-center">
              부위 안내 맵을 사용하면 사진 위에 클릭 가능한 부위 핫스팟을 표시할 수 있습니다.
            </p>
          )}
        </TabPanel>

        <TabPanel id="stepProcess" active={activeTab}>
          <p className="text-sm text-ink-muted mb-5">
            "OO치료는 이렇게 진행됩니다" 류의 순서 안내입니다. 비워두면 본문에 STEP 패턴이 있을 때 그걸로 대신 표시됩니다.
          </p>
          <Field label="제목" hint='예: "추나치료는 이렇게 진행됩니다"'>
            <TextInput
              value={effectiveStepProcess.title}
              onChange={(e) => updateStepProcess({ title: e.target.value })}
            />
          </Field>
          <Field label="안내 문구" hint="제목 아래에 표시되는 한 줄 설명 (선택 사항)">
            <TextInput
              value={effectiveStepProcess.intro}
              onChange={(e) => updateStepProcess({ intro: e.target.value })}
            />
          </Field>
          <Field label="스텝 목록">
            <div className="space-y-3">
              {effectiveStepProcess.items.map((item, i) => (
                <div
                  key={item.id}
                  {...stepDrag.getItemProps(i)}
                  className={`border rounded-lg p-4 transition-colors ${
                    stepDrag.dragOverIndex === i ? "border-accent bg-bg-alt" : "border-line"
                  } ${stepDrag.draggingIndex === i ? "opacity-40" : ""}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      {...stepDrag.getHandleProps(i)}
                      className="cursor-grab active:cursor-grabbing text-ink-muted shrink-0 touch-none"
                      title="드래그해서 순서 변경"
                    >
                      <DragHandleIcon />
                    </span>
                    <span className="text-xs font-mono text-ink-muted w-14 shrink-0">
                      STEP {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1" />
                    <Button size="icon" variant="danger" onClick={() => removeStepItem(i)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </Button>
                  </div>
                  <TextArea
                    className="mb-3"
                    rows={2}
                    placeholder="이 단계에서 하는 일을 설명하세요"
                    value={item.text}
                    onChange={(e) => updateStepItem(i, { text: e.target.value })}
                  />
                  <ImageInput
                    value={item.image ?? ""}
                    onChange={(v) => updateStepItem(i, { image: v || null })}
                    aspectRatio="4 / 3"
                  />
                </div>
              ))}
              <Button type="button" size="sm" variant="secondary" onClick={addStepItem}>+ 스텝 추가</Button>
            </div>
          </Field>
          <Field label="보충 설명" hint="스텝 목록 아래에 표시되는 자유 서술입니다 (선택 사항). 제목, 목록, 인용, 이미지 등의 서식을 넣을 수 있습니다">
            <RichEditor value={effectiveStepProcess.note ?? ""} onChange={(html) => updateStepProcess({ note: html })} />
          </Field>
        </TabPanel>

        <TabPanel id="pointCards" active={activeTab}>
          <p className="text-sm text-ink-muted mb-5">
            "POINT 01/02/03" 류의 3열 카드입니다. 비워두면 본문에 카드 패턴이 있을 때 그걸로 대신 표시됩니다.
          </p>
          <Field label="제목" hint='예: "고운빛한의원의 한약 처방"'>
            <TextInput
              value={effectivePointCards.title}
              onChange={(e) => updatePointCards({ title: e.target.value })}
            />
          </Field>
          <Field label="카드 목록">
            <div className="space-y-3">
              {effectivePointCards.items.map((item, i) => (
                <div
                  key={item.id}
                  {...pointDrag.getItemProps(i)}
                  className={`border rounded-lg p-4 transition-colors ${
                    pointDrag.dragOverIndex === i ? "border-accent bg-bg-alt" : "border-line"
                  } ${pointDrag.draggingIndex === i ? "opacity-40" : ""}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      {...pointDrag.getHandleProps(i)}
                      className="cursor-grab active:cursor-grabbing text-ink-muted shrink-0 touch-none"
                      title="드래그해서 순서 변경"
                    >
                      <DragHandleIcon />
                    </span>
                    <span className="text-xs font-mono text-ink-muted w-16 shrink-0">
                      POINT {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1" />
                    <Button size="icon" variant="danger" onClick={() => removePointItem(i)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </Button>
                  </div>
                  <TextInput
                    className="mb-2"
                    placeholder="카드 제목 (예: 정밀한 진단과 상담)"
                    value={item.title}
                    onChange={(e) => updatePointItem(i, { title: e.target.value })}
                  />
                  <TextArea
                    className="mb-3"
                    rows={3}
                    placeholder="카드 설명"
                    value={item.body}
                    onChange={(e) => updatePointItem(i, { body: e.target.value })}
                  />
                  <ImageInput
                    value={item.image ?? ""}
                    onChange={(v) => updatePointItem(i, { image: v || null })}
                    aspectRatio="4 / 3"
                  />
                </div>
              ))}
              <Button type="button" size="sm" variant="secondary" onClick={addPointItem}>+ 카드 추가</Button>
            </div>
          </Field>
          <Field label="보충 설명" hint="카드 목록 아래에 표시되는 자유 서술입니다 (선택 사항). 제목, 목록, 인용, 이미지 등의 서식을 넣을 수 있습니다">
            <RichEditor value={effectivePointCards.note ?? ""} onChange={(html) => updatePointCards({ note: html })} />
          </Field>
        </TabPanel>

        <TabPanel id="checklist" active={activeTab}>
          <p className="text-sm text-ink-muted mb-5">
            좌측에 목록이 시간차를 두고 한 줄씩 자동 강조되고 우측 사진이 함께 전환됩니다. 비워두면 이 기능이 표시되지 않습니다.
          </p>
          <Field label="제목" hint='예: "이런 분들께 추천합니다"'>
            <TextInput
              value={effectiveChecklist.title}
              onChange={(e) => updateChecklist({ title: e.target.value })}
            />
          </Field>
          <Field
            label="항목 목록"
            hint="사진을 지정하지 않은 항목은 다른 항목의 사진을 순환해서 보여줍니다"
          >
            <div className="space-y-3">
              {effectiveChecklist.items.map((item, i) => (
                <div
                  key={item.id}
                  {...checklistDrag.getItemProps(i)}
                  className={`border rounded-lg p-4 transition-colors ${
                    checklistDrag.dragOverIndex === i ? "border-accent bg-bg-alt" : "border-line"
                  } ${checklistDrag.draggingIndex === i ? "opacity-40" : ""}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      {...checklistDrag.getHandleProps(i)}
                      className="cursor-grab active:cursor-grabbing text-ink-muted shrink-0 touch-none"
                      title="드래그해서 순서 변경"
                    >
                      <DragHandleIcon />
                    </span>
                    <span className="text-xs text-ink-muted font-mono w-5 shrink-0">{i + 1}</span>
                    <div className="flex-1" />
                    <Button size="icon" variant="danger" onClick={() => removeChecklistItem(i)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </Button>
                  </div>
                  <TextArea
                    className="mb-3"
                    rows={2}
                    placeholder="예: 이유 없이 피로하고 기력이 떨어졌다고 느끼시는 분"
                    value={item.text}
                    onChange={(e) => updateChecklistItem(i, { text: e.target.value })}
                  />
                  <ImageInput
                    value={item.image ?? ""}
                    onChange={(v) => updateChecklistItem(i, { image: v || null })}
                    aspectRatio="4 / 3"
                  />
                </div>
              ))}
              <Button type="button" size="sm" variant="secondary" onClick={addChecklistItem}>+ 항목 추가</Button>
            </div>
          </Field>
          <Field label="보충 설명" hint="체크리스트 아래에 표시되는 자유 서술입니다 (선택 사항). 제목, 목록, 인용, 이미지 등의 서식을 넣을 수 있습니다">
            <RichEditor value={effectiveChecklist.note ?? ""} onChange={(html) => updateChecklist({ note: html })} />
          </Field>
        </TabPanel>

        <TabPanel id="checklistHero" active={activeTab}>
          <p className="text-sm text-ink-muted mb-5">
            대표 사진 위에 체크리스트 카드가 사방에 겹쳐 떠 있는 히어로입니다. 항목을 비워두면 표시되지 않습니다.
          </p>
          <Field label="작은 라벨" hint='카드 제목 위에 작게 표시됩니다. 예: "Check List"'>
            <TextInput
              value={effectiveChecklistHero.eyebrow}
              onChange={(e) => updateChecklistHero({ eyebrow: e.target.value })}
            />
          </Field>
          <Field label="제목" hint='예: "레이저로 다가가는 피부 고민"'>
            <TextInput
              value={effectiveChecklistHero.title}
              onChange={(e) => updateChecklistHero({ title: e.target.value })}
            />
          </Field>
          <Field
            label="배경 사진"
            hint="권장 비율 16:10, 권장 해상도 1600×1000px 이상 (세로로 긴 모바일 화면에서는 3:5 비율로 크롭되어 보이므로, 인물·핵심 피사체를 사진 중앙에 배치하세요). 비워두면 '넓은 배너 이미지'를, 그마저 없으면 '대표 이미지'를 대신 사용합니다."
          >
            <ImageInput
              value={effectiveChecklistHero.image ?? ""}
              onChange={(v) => updateChecklistHero({ image: v || null })}
              aspectRatio="16 / 10"
            />
          </Field>
          {effectiveChecklistHero.image && (
            <Field label="이미지 대체 텍스트" hint="스크린 리더 및 이미지 로드 실패 시 표시됩니다">
              <TextInput
                value={effectiveChecklistHero.imageAlt ?? ""}
                onChange={(e) => updateChecklistHero({ imageAlt: e.target.value })}
              />
            </Field>
          )}

          <Field
            label="카드 목록"
            hint="왼쪽 사진에서 카드를 드래그해 위치를 지정하세요. 새 카드는 '+ 카드 추가'로 만든 뒤 드래그해서 배치합니다."
          >
            <div className="grid grid-cols-1 md:grid-cols-[6fr_6fr] gap-6 items-start">
              <ChecklistHeroPicker
                image={
                  effectiveChecklistHero.image ?? draft.fullBleedImage ?? draft.image ?? null
                }
                items={effectiveChecklistHero.items}
                onItemsChange={setChecklistHeroItems}
                activeId={activeChecklistHeroId}
                onActiveIdChange={setActiveChecklistHeroId}
              />
              <div className="space-y-3">
                {effectiveChecklistHero.items.map((item, i) => (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-3 ${item.id === activeChecklistHeroId ? "border-accent" : "border-line"}`}
                  >
                    <div
                      className="flex items-center gap-2 mb-2 cursor-pointer"
                      onClick={() => setActiveChecklistHeroId(item.id)}
                    >
                      <span className="text-xs text-ink-muted font-mono w-5 shrink-0">{i + 1}</span>
                      <span className="text-xs text-ink-muted flex-1">
                        {typeof item.x === "number" && typeof item.y === "number"
                          ? `(${Math.round(item.x)}, ${Math.round(item.y)})`
                          : "위치 미지정"}
                      </span>
                      <Button size="icon" variant="danger" onClick={() => removeChecklistHeroItem(i)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </Button>
                    </div>
                    <TextInput
                      className="mb-2"
                      placeholder="라벨 (예: 색소 고민)"
                      value={item.label}
                      onChange={(e) => updateChecklistHeroItem(i, { label: e.target.value })}
                      onFocus={() => setActiveChecklistHeroId(item.id)}
                    />
                    <TextArea
                      rows={2}
                      placeholder="설명 (예: 기미·잡티·주근깨 등 칙칙함이 신경 쓰이는 경우)"
                      value={item.detail}
                      onChange={(e) => updateChecklistHeroItem(i, { detail: e.target.value })}
                      onFocus={() => setActiveChecklistHeroId(item.id)}
                    />
                  </div>
                ))}
                <Button type="button" size="sm" variant="secondary" onClick={addChecklistHeroItem}>+ 카드 추가</Button>
              </div>
            </div>
          </Field>
        </TabPanel>

        <TabPanel id="checklistBlocks" active={activeTab}>
          <p className="text-sm text-ink-muted mb-5">
            "이런 변화가 느껴진다면", "고운빛의 리프팅 접근", "이런 분들께 권해드립니다" 같은 소제목 +
            본문 + 01/02… 번호 목록 블록을 순서대로 여러 개 만듭니다. 목록을 비워두면 제목(과 본문)만 표시됩니다.
          </p>
          <div className="space-y-4">
            {effectiveChecklistBlocks.map((block, bi) => (
              <div
                key={block.id}
                {...checklistBlockDrag.getItemProps(bi)}
                className={`border rounded-lg p-4 transition-colors ${
                  checklistBlockDrag.dragOverIndex === bi ? "border-accent bg-bg-alt" : "border-line"
                } ${checklistBlockDrag.draggingIndex === bi ? "opacity-40" : ""}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    {...checklistBlockDrag.getHandleProps(bi)}
                    className="cursor-grab active:cursor-grabbing text-ink-muted shrink-0 touch-none"
                    title="드래그해서 순서 변경"
                  >
                    <DragHandleIcon />
                  </span>
                  <span className="text-xs text-ink-muted font-mono w-5 shrink-0">{bi + 1}</span>
                  <div className="flex-1" />
                  <Button size="icon" variant="danger" onClick={() => removeChecklistBlock(bi)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </Button>
                </div>
                <ChecklistBlockEditor
                  block={block}
                  onUpdate={(p) => updateChecklistBlock(bi, p)}
                  onSetItems={(items) => setChecklistBlockItems(bi, items)}
                  onAddItem={() => addChecklistBlockItem(bi)}
                  onRemoveItem={(ii) => removeChecklistBlockItem(bi, ii)}
                />
              </div>
            ))}
            <Button type="button" size="sm" variant="secondary" onClick={addChecklistBlock}>+ 블록 추가</Button>
          </div>
        </TabPanel>
      </Card>

      <div className="flex gap-2 sticky bottom-0 bg-[#FAFAFA] py-4 mt-6 border-t border-line">
        <Button onClick={save} disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </Button>
        <Link
          href="/admin/subpages"
          className="inline-flex items-center gap-1.5 rounded font-semibold transition-colors border border-line bg-surface text-ink hover:bg-bg-alt px-4 py-2 text-sm"
          style={{ letterSpacing: "-0.02em" }}
        >
          취소
        </Link>
        <Button variant="danger" onClick={remove} className="ml-auto">
          삭제
        </Button>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAdminLocale } from "@/lib/adminLocale";
import { useService, useServiceCatalog } from "@/lib/useServices";
import { createService, updateService } from "@/lib/servicesApi";
import {
  categoryText,
  createDefaultBlocks,
  rawText,
  subcategoryText,
  withLocalized,
  SERVICE_BADGES,
  type Service,
  type ServiceBadge,
} from "@/lib/services";
import PriceEditor from "@/components/admin/PriceEditor";
import ServiceBlockEditor from "@/components/admin/ServiceBlockEditor";
import {
  Button,
  Card,
  Field,
  ImageInput,
  PageHeader,
  TextArea,
  TextInput,
  Toast,
} from "@/components/admin/ui";

type Draft = Required<
  Pick<Service, "subcategoryId" | "image" | "badges" | "isHidden" | "i18n" | "prices" | "blocks">
> & {
  tag: string;
  saleStartDate: string;
  saleEndDate: string;
};

function emptyDraft(subcategoryId: string): Draft {
  return {
    subcategoryId,
    image: "",
    tag: "",
    badges: [],
    saleStartDate: "",
    saleEndDate: "",
    isHidden: false,
    i18n: {},
    prices: [],
    // 빈 화면부터 시작하지 않도록 기본 섹션 5개를 미리 넣어 둔다
    blocks: createDefaultBlocks(),
  };
}

const dateInputClass =
  "w-full px-4 py-2.5 border border-line bg-surface rounded text-sm outline-none focus:border-accent";

export default function ServiceEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";
  const isNew = id === "new";

  const { editingLocale } = useAdminLocale();
  const { categories, subcategories, loading: catalogLoading } = useServiceCatalog({
    includeHidden: true,
  });
  const detail = useService(isNew ? undefined : id, { includeHidden: true });

  const [draft, setDraft] = useState<Draft | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 초기 draft — 신규는 쿼리스트링의 서브카테고리를 미리 채운다.
  // useSearchParams 대신 location을 읽는다 (정적 프리렌더에서 Suspense 요구를 피한다)
  useEffect(() => {
    if (draft) return;
    if (isNew) {
      const preset = new URLSearchParams(window.location.search).get("sub") ?? "";
      setDraft(emptyDraft(preset));
      return;
    }
    if (detail.service) {
      const s = detail.service;
      setDraft({
        subcategoryId: s.subcategoryId,
        image: s.image,
        tag: s.tag ?? "",
        badges: s.badges,
        saleStartDate: s.saleStartDate ?? "",
        saleEndDate: s.saleEndDate ?? "",
        isHidden: s.isHidden,
        i18n: s.i18n,
        prices: s.prices,
        blocks: s.blocks ?? [],
      });
    }
  }, [isNew, detail.service, draft]);

  const patch = (next: Partial<Draft>) => setDraft((prev) => (prev ? { ...prev, ...next } : prev));

  const currentSubcategory = subcategories.find((s) => s.id === draft?.subcategoryId);
  const currentCategoryId = currentSubcategory?.categoryId ?? categories[0]?.id ?? "";
  const siblingSubcategories = useMemo(
    () => subcategories.filter((s) => s.categoryId === currentCategoryId),
    [subcategories, currentCategoryId]
  );

  const text = rawText<{ name: string; summary: string }>(draft?.i18n, editingLocale);
  const koName = draft?.i18n?.ko?.name ?? "";

  if (!isNew && detail.notFound) {
    return (
      <>
        <PageHeader title="시술 편집" />
        <Card className="text-center py-16">
          <p className="text-ink-muted mb-6">시술을 찾을 수 없습니다.</p>
          <Link href="/admin/services" className="text-accent font-semibold text-sm hover:underline">
            &larr; 시술 목록으로
          </Link>
        </Card>
      </>
    );
  }

  if (!draft || (!isNew && detail.loading) || catalogLoading) {
    return (
      <>
        <PageHeader title="시술 편집" />
        <Card className="text-center py-16 text-ink-muted">불러오는 중...</Card>
      </>
    );
  }

  const save = async () => {
    if (!draft.subcategoryId) {
      alert("소속 서브카테고리를 선택하세요.");
      return;
    }
    if (!(text.name ?? "").trim()) {
      alert(`시술 이름을 입력하세요. (${editingLocale === "ko" ? "한국어" : "English"} 기준)`);
      return;
    }

    const payload: Partial<Service> = {
      subcategoryId: draft.subcategoryId,
      image: draft.image,
      tag: draft.tag.trim(),
      badges: draft.badges,
      saleStartDate: draft.saleStartDate,
      saleEndDate: draft.saleEndDate,
      isHidden: draft.isHidden,
      i18n: draft.i18n,
      prices: draft.prices,
      blocks: draft.blocks,
    };

    setSaving(true);
    const result = isNew ? await createService(payload) : await updateService(id, payload);
    setSaving(false);
    if (!result) return; // 실패 토스트는 servicesApi가 띄운다

    if (isNew) {
      router.replace(`/admin/services/${result.id}`);
      setToast("시술이 추가되었습니다");
    } else {
      setToast("저장되었습니다");
    }
  };

  const toggleBadge = (badge: ServiceBadge) =>
    patch({
      badges: draft.badges.includes(badge)
        ? draft.badges.filter((b) => b !== badge)
        : [...draft.badges, badge],
    });

  return (
    <>
      <PageHeader
        title={isNew ? "시술 추가" : "시술 편집"}
        description="기본 정보와 가격 옵션, 상세 페이지에 들어갈 내용을 한 곳에서 편집합니다."
        actions={
          <>
            {!isNew && (
              <Link
                href={`/services/${id}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded font-semibold transition-colors border border-line bg-surface text-ink hover:bg-bg-alt px-4 py-2 text-sm"
                style={{ letterSpacing: "-0.02em" }}
              >
                미리보기 ↗
              </Link>
            )}
            <Link
              href="/admin/services"
              className="inline-flex items-center gap-1.5 rounded font-semibold transition-colors border border-line bg-surface text-ink hover:bg-bg-alt px-4 py-2 text-sm"
              style={{ letterSpacing: "-0.02em" }}
            >
              목록
            </Link>
          </>
        }
      />

      {/* ─── 기본 정보 ─── */}
      <Card className="mb-6">
        <h2 className="font-semibold mb-5" style={{ letterSpacing: "-0.02em" }}>
          기본 정보
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <div>
            <Field label="소속 카테고리">
              <select
                value={currentCategoryId}
                onChange={(e) => {
                  const first = subcategories.find((s) => s.categoryId === e.target.value);
                  patch({ subcategoryId: first?.id ?? "" });
                }}
                className={dateInputClass}
              >
                {categories.length === 0 && <option value="">분류를 먼저 만들어 주세요</option>}
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {categoryText(category, editingLocale).name || "(이름 없음)"}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="소속 서브카테고리"
              hint={
                siblingSubcategories.length === 0
                  ? "이 카테고리에 서브카테고리가 없습니다. 목록 화면에서 먼저 추가하세요."
                  : undefined
              }
            >
              <select
                value={draft.subcategoryId}
                onChange={(e) => patch({ subcategoryId: e.target.value })}
                className={dateInputClass}
              >
                {siblingSubcategories.length === 0 && <option value="">없음</option>}
                {siblingSubcategories.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategoryText(subcategory, editingLocale).name || "(이름 없음)"}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="시술 이름"
              hint={
                editingLocale !== "ko" && !koName.trim()
                  ? "한국어 이름이 비어 있습니다. 한국어 화면에서는 이름이 표시되지 않습니다."
                  : undefined
              }
            >
              <TextInput
                placeholder="예: 울쎄라피 프라임 리프팅"
                value={text.name ?? ""}
                onChange={(e) =>
                  patch({ i18n: withLocalized(draft.i18n, editingLocale, { name: e.target.value }) })
                }
              />
            </Field>

            <Field label="한 줄 설명" hint="목록 카드와 상세 상단에 표시됩니다.">
              <TextArea
                placeholder="예: 기존의 완성도를 끌어올려 더욱 강력해진 차세대 리프팅"
                value={text.summary ?? ""}
                onChange={(e) =>
                  patch({
                    i18n: withLocalized(draft.i18n, editingLocale, { summary: e.target.value }),
                  })
                }
                style={{ minHeight: "4.5rem" }}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="노출 시작일 (선택)">
                <input
                  type="date"
                  value={draft.saleStartDate}
                  onChange={(e) => patch({ saleStartDate: e.target.value })}
                  className={dateInputClass}
                />
              </Field>
              <Field label="노출 종료일 (선택)" hint="카드에 “종료일까지”로 표시되고, 지나면 숨겨집니다.">
                <input
                  type="date"
                  value={draft.saleEndDate}
                  onChange={(e) => patch({ saleEndDate: e.target.value })}
                  className={dateInputClass}
                />
              </Field>
            </div>
          </div>

          <div>
            <Field
              label="대표 이미지 / 동영상"
              hint="목록 카드는 4:3, 상세 페이지는 16:10으로 표시됩니다. 동영상은 상세 페이지에서만 재생됩니다."
            >
              <ImageInput
                value={draft.image}
                onChange={(image) => patch({ image })}
                aspectRatio="4 / 3"
                allowVideo
              />
            </Field>

            <Field label="태그 (선택)" hint="카드 왼쪽 위에 작게 표시됩니다. 예: 여성 · 1부위">
              <TextInput
                placeholder="예: 1부위"
                value={draft.tag}
                onChange={(e) => patch({ tag: e.target.value })}
              />
            </Field>

            <Field label="뱃지 (선택)">
              <div className="flex gap-4 flex-wrap">
                {SERVICE_BADGES.map((badge) => (
                  <label key={badge} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.badges.includes(badge)}
                      onChange={() => toggleBadge(badge)}
                      className="w-4 h-4"
                    />
                    {badge}
                  </label>
                ))}
              </div>
            </Field>

            <Field label="노출 여부">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.isHidden}
                  onChange={(e) => patch({ isHidden: e.target.checked })}
                  className="w-4 h-4"
                />
                숨김 (공개 사이트에 노출하지 않음)
              </label>
            </Field>
          </div>
        </div>
      </Card>

      {/* ─── 가격 ─── */}
      <Card className="mb-6">
        <h2 className="font-semibold mb-1" style={{ letterSpacing: "-0.02em" }}>
          가격 옵션
        </h2>
        <p className="text-xs text-ink-muted mb-5">
          첫 번째 옵션이 목록 카드에 표시됩니다. 상세 페이지에는 모든 옵션이 나옵니다.
        </p>
        <PriceEditor
          prices={draft.prices}
          locale={editingLocale}
          onChange={(prices) => patch({ prices })}
        />
      </Card>

      {/* ─── 상세 ─── */}
      <Card className="mb-6">
        <h2 className="font-semibold mb-1" style={{ letterSpacing: "-0.02em" }}>
          상세 내용
        </h2>
        <p className="text-xs text-ink-muted mb-5">
          블록을 추가·이동해 상세 페이지 구성을 바꿀 수 있습니다. 내용이 빈 블록은 공개 화면에 나오지
          않습니다.
        </p>
        <ServiceBlockEditor
          blocks={draft.blocks}
          locale={editingLocale}
          onChange={(blocks) => patch({ blocks })}
        />
      </Card>

      <div className="flex gap-2 sticky bottom-0 bg-[#FAFAFA] py-4 border-t border-line">
        <Button onClick={save} disabled={saving}>
          {saving ? "저장 중..." : isNew ? "시술 추가" : "저장"}
        </Button>
        <Link
          href="/admin/services"
          className="inline-flex items-center gap-1.5 rounded font-semibold transition-colors border border-line bg-surface text-ink hover:bg-bg-alt px-4 py-2 text-sm"
          style={{ letterSpacing: "-0.02em" }}
        >
          취소
        </Link>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

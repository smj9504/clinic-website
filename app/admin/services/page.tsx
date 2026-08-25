"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAdminLocale } from "@/lib/adminLocale";
import { useServiceCatalog } from "@/lib/useServices";
import {
  createCategory,
  createSubcategory,
  deleteService,
  deleteTaxonomy,
  patchServices,
  patchTaxonomy,
  type TaxonomyKind,
} from "@/lib/servicesApi";
import {
  categoryText,
  isVideoUrl,
  priceText,
  serviceText,
  subcategoryText,
  type Service,
  type ServiceCategory,
  type ServiceSubcategory,
} from "@/lib/services";
import { computePrice, formatKRW } from "@/lib/price";
import { PageHeader, Button, Card, TextInput, Toast, ImageInput } from "@/components/admin/ui";

type Sortable = { id: string; sortOrder: number };

/**
 * 위/아래 이동. 순서를 통째로 0..n-1로 다시 매긴다 —
 * 값을 맞바꾸기만 하면 sortOrder가 중복된 데이터에서 아무 일도 일어나지 않는다.
 */
function reorder<T extends Sortable>(items: T[], id: string, dir: -1 | 1) {
  const list = [...items];
  const index = list.findIndex((item) => item.id === id);
  const target = index + dir;
  if (index < 0 || target < 0 || target >= list.length) return null;
  [list[index], list[target]] = [list[target], list[index]];
  return list
    .map((item, i) => ({ id: item.id, sortOrder: i, previous: item.sortOrder }))
    .filter((u) => u.sortOrder !== u.previous)
    .map(({ id: itemId, sortOrder }) => ({ id: itemId, sortOrder }));
}

type TaxDraft = { name: string; slug: string; isHidden: boolean; image: string };
const emptyDraft: TaxDraft = { name: "", slug: "", isHidden: false, image: "" };

function Column({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-surface border border-line rounded-lg flex flex-col min-w-0">
      <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-line">
        <div className="min-w-0">
          <h2 className="font-semibold text-sm truncate" style={{ letterSpacing: "-0.02em" }}>
            {title}
          </h2>
          {hint && <p className="text-[0.7rem] text-ink-muted mt-0.5">{hint}</p>}
        </div>
        {action}
      </header>
      <div className="p-3 flex-1">{children}</div>
    </section>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-ink-muted text-center py-8 px-2">{children}</p>;
}

export default function ServicesAdminPage() {
  const { editingLocale } = useAdminLocale();
  const { categories, subcategories, services, loading, setupRequired, error, reload } =
    useServiceCatalog({ includeHidden: true });

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ kind: TaxonomyKind; id: string | "new" } | null>(null);
  const [draft, setDraft] = useState<TaxDraft>(emptyDraft);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const childSubcategories = useMemo(
    () => subcategories.filter((s) => s.categoryId === categoryId),
    [subcategories, categoryId]
  );
  const childServices = useMemo(
    () => services.filter((s) => s.subcategoryId === subcategoryId),
    [services, subcategoryId]
  );

  // 선택이 없거나, 선택한 항목이 사라졌으면 첫 항목으로 되돌린다
  useEffect(() => {
    if (categories.length === 0) {
      setCategoryId(null);
      return;
    }
    if (!categoryId || !categories.some((c) => c.id === categoryId)) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  useEffect(() => {
    const list = subcategories.filter((s) => s.categoryId === categoryId);
    if (list.length === 0) {
      setSubcategoryId(null);
      return;
    }
    if (!subcategoryId || !list.some((s) => s.id === subcategoryId)) {
      setSubcategoryId(list[0].id);
    }
  }, [subcategories, categoryId, subcategoryId]);

  const run = async (fn: () => Promise<boolean>, message: string) => {
    setBusy(true);
    const ok = await fn();
    setBusy(false);
    if (ok) {
      reload();
      setToast(message);
    }
    return ok;
  };

  // ─── 분류 편집 ───

  const startEdit = (kind: TaxonomyKind, item: ServiceCategory | ServiceSubcategory) => {
    const name =
      kind === "category"
        ? categoryText(item as ServiceCategory, editingLocale).name
        : subcategoryText(item as ServiceSubcategory, editingLocale).name;
    setEditing({ kind, id: item.id });
    setDraft({
      name,
      slug: item.slug,
      isHidden: item.isHidden,
      image: kind === "category" ? (item as ServiceCategory).image : "",
    });
  };

  const startNew = (kind: TaxonomyKind) => {
    setEditing({ kind, id: "new" });
    setDraft(emptyDraft);
  };

  const saveDraft = async () => {
    if (!editing) return;
    if (!draft.name.trim()) {
      alert("이름을 입력하세요.");
      return;
    }

    const isCategory = editing.kind === "category";
    const existing = isCategory
      ? categories.find((c) => c.id === editing.id)
      : subcategories.find((s) => s.id === editing.id);

    // 편집 중인 언어만 덮어쓴다 — 영어를 고치다가 한국어가 지워지면 안 된다
    const i18n = {
      ...(existing?.i18n ?? {}),
      [editingLocale]: {
        ...(existing?.i18n?.[editingLocale] ?? {}),
        name: draft.name.trim(),
      },
    };

    const ok = await run(async () => {
      if (editing.id === "new") {
        if (isCategory) {
          return !!(await createCategory({
            i18n,
            slug: draft.slug.trim(),
            isHidden: draft.isHidden,
            image: draft.image,
          }));
        }
        if (!categoryId) return false;
        return !!(await createSubcategory({
          categoryId,
          i18n,
          slug: draft.slug.trim(),
          isHidden: draft.isHidden,
        }));
      }

      return patchTaxonomy(editing.kind, [
        {
          id: editing.id,
          i18n,
          ...(draft.slug.trim() ? { slug: draft.slug.trim() } : {}),
          isHidden: draft.isHidden,
          ...(isCategory ? { image: draft.image } : {}),
        },
      ]);
    }, editing.id === "new" ? "추가되었습니다" : "저장되었습니다");

    if (ok) setEditing(null);
  };

  const removeTaxonomy = async (kind: TaxonomyKind, item: ServiceCategory | ServiceSubcategory) => {
    const name =
      kind === "category"
        ? categoryText(item as ServiceCategory, editingLocale).name
        : subcategoryText(item as ServiceSubcategory, editingLocale).name;

    // 지우기 전에 무엇이 함께 사라지는지 정확히 알려준다
    const subs =
      kind === "category" ? subcategories.filter((s) => s.categoryId === item.id) : [];
    const subIds = kind === "category" ? subs.map((s) => s.id) : [item.id];
    const svcCount = services.filter((s) => subIds.includes(s.subcategoryId)).length;

    const detail =
      kind === "category"
        ? `하위 서브카테고리 ${subs.length}개와 시술 ${svcCount}개가 함께 삭제됩니다.`
        : `이 서브카테고리의 시술 ${svcCount}개가 함께 삭제됩니다.`;

    if (!confirm(`"${name}"을(를) 삭제하시겠습니까?\n\n${detail}\n이 작업은 되돌릴 수 없습니다.`)) return;

    setBusy(true);
    const result = await deleteTaxonomy(kind, item.id);
    setBusy(false);
    if (result) {
      reload();
      setToast(
        kind === "category"
          ? `삭제되었습니다 (서브카테고리 ${result.removedSubcategories}개, 시술 ${result.removedServices}개 포함)`
          : `삭제되었습니다 (시술 ${result.removedServices}개 포함)`
      );
    }
  };

  const moveTaxonomy = (kind: TaxonomyKind, list: Sortable[], id: string, dir: -1 | 1) => {
    const updates = reorder(list, id, dir);
    if (!updates) return;
    run(() => patchTaxonomy(kind, updates), "순서가 변경되었습니다");
  };

  // ─── 시술 ───

  const moveService = (id: string, dir: -1 | 1) => {
    const updates = reorder(childServices, id, dir);
    if (!updates) return;
    run(() => patchServices(updates), "순서가 변경되었습니다");
  };

  const toggleServiceHidden = (service: Service) => {
    run(
      () => patchServices([{ id: service.id, isHidden: !service.isHidden }]),
      service.isHidden ? "노출로 변경되었습니다" : "숨김으로 변경되었습니다"
    );
  };

  const removeService = async (service: Service) => {
    const { name } = serviceText(service, editingLocale);
    if (!confirm(`"${name || "이름 없는 시술"}"을(를) 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    run(() => deleteService(service.id), "시술이 삭제되었습니다");
  };

  // ─── 렌더 ───

  const selectedCategory = categories.find((c) => c.id === categoryId) ?? null;
  const selectedSubcategory = childSubcategories.find((s) => s.id === subcategoryId) ?? null;

  const hiddenBadge = (
    <span className="text-[0.6rem] px-1.5 py-0.5 rounded-full bg-bg-alt text-ink-muted shrink-0">
      숨김
    </span>
  );

  return (
    <>
      <PageHeader
        title="시술·가격 관리"
        description="카테고리 → 서브카테고리 → 시술 순서로 관리합니다. 공개 사이트의 시술 안내 페이지에 그대로 반영됩니다."
        actions={
          <Button variant="secondary" onClick={reload} disabled={busy || loading}>
            새로고침
          </Button>
        }
      />

      {setupRequired && (
        <Card className="mb-6 border-accent">
          <h3 className="font-semibold mb-2" style={{ letterSpacing: "-0.02em" }}>
            데이터베이스 준비가 필요합니다
          </h3>
          <p className="text-sm text-ink-soft" style={{ lineHeight: 1.8 }}>
            시술 테이블이 아직 만들어지지 않았습니다. Supabase 대시보드의 SQL Editor에서 프로젝트
            루트의 <code className="bg-bg-alt px-1.5 py-0.5 rounded text-xs">supabase-services.sql</code> 을
            한 번 실행한 뒤 새로고침해 주세요.
          </p>
        </Card>
      )}

      {error && !setupRequired && (
        <Card className="mb-6">
          <p className="text-sm text-ink-soft">{error}</p>
        </Card>
      )}

      {editing && (
        <Card className="mb-6 border-accent">
          <h3 className="font-semibold mb-4" style={{ letterSpacing: "-0.02em" }}>
            {editing.kind === "category" ? "카테고리" : "서브카테고리"}
            {editing.id === "new" ? " 추가" : " 수정"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold mb-2">이름</label>
              <TextInput
                autoFocus
                placeholder={editing.kind === "category" ? "예: 리프팅" : "예: 초음파 리프팅"}
                value={draft.name}
                onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">slug (선택)</label>
              <TextInput
                placeholder="비워두면 자동 생성"
                value={draft.slug}
                onChange={(e) => setDraft((p) => ({ ...p, slug: e.target.value }))}
              />
              <p className="text-xs text-ink-muted mt-1.5">
                내부 식별용입니다. 주소에는 쓰이지 않습니다.
              </p>
            </div>
          </div>

          {editing.kind === "category" && (
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">카테고리 이미지 (선택)</label>
              <ImageInput
                value={draft.image}
                onChange={(v) => setDraft((p) => ({ ...p, image: v }))}
                aspectRatio="16 / 9"
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.isHidden}
              onChange={(e) => setDraft((p) => ({ ...p, isHidden: e.target.checked }))}
              className="w-4 h-4"
            />
            숨김 (공개 사이트에 노출하지 않음 — 하위 항목도 함께 숨겨집니다)
          </label>

          <div className="flex gap-2 pt-4 border-t border-line">
            <Button onClick={saveDraft} disabled={busy}>
              저장
            </Button>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={busy}>
              취소
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {/* 카테고리 */}
        <Column
          title="카테고리"
          hint={`${categories.length}개`}
          action={
            <Button size="sm" onClick={() => startNew("category")} disabled={busy || !!editing}>
              + 추가
            </Button>
          }
        >
          {loading && categories.length === 0 ? (
            <EmptyNote>불러오는 중...</EmptyNote>
          ) : categories.length === 0 ? (
            <EmptyNote>카테고리를 먼저 추가하세요.</EmptyNote>
          ) : (
            <ul className="space-y-1">
              {categories.map((category, i) => {
                const active = category.id === categoryId;
                return (
                  <li key={category.id}>
                    <div
                      className={`rounded border px-3 py-2 transition-colors ${
                        active ? "border-accent bg-bg-alt" : "border-transparent hover:bg-bg-alt"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setCategoryId(category.id)}
                        className="w-full flex items-center gap-2 text-left min-h-[1.75rem]"
                      >
                        <span className="flex-1 text-sm font-medium truncate">
                          {categoryText(category, editingLocale).name || "(이름 없음)"}
                        </span>
                        {category.isHidden && hiddenBadge}
                      </button>
                      {active && (
                        <div className="flex gap-1 flex-wrap mt-2">
                          <Button size="sm" variant="ghost" onClick={() => moveTaxonomy("category", categories, category.id, -1)} disabled={busy || i === 0}>↑</Button>
                          <Button size="sm" variant="ghost" onClick={() => moveTaxonomy("category", categories, category.id, 1)} disabled={busy || i === categories.length - 1}>↓</Button>
                          <Button size="sm" variant="secondary" onClick={() => startEdit("category", category)} disabled={busy}>수정</Button>
                          <Button size="sm" variant="danger" onClick={() => removeTaxonomy("category", category)} disabled={busy}>삭제</Button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Column>

        {/* 서브카테고리 */}
        <Column
          title="서브카테고리"
          hint={selectedCategory ? categoryText(selectedCategory, editingLocale).name : "카테고리를 선택하세요"}
          action={
            <Button
              size="sm"
              onClick={() => startNew("subcategory")}
              disabled={busy || !!editing || !categoryId}
            >
              + 추가
            </Button>
          }
        >
          {!categoryId ? (
            <EmptyNote>왼쪽에서 카테고리를 선택하세요.</EmptyNote>
          ) : childSubcategories.length === 0 ? (
            <EmptyNote>서브카테고리를 추가하세요.</EmptyNote>
          ) : (
            <ul className="space-y-1">
              {childSubcategories.map((subcategory, i) => {
                const active = subcategory.id === subcategoryId;
                return (
                  <li key={subcategory.id}>
                    <div
                      className={`rounded border px-3 py-2 transition-colors ${
                        active ? "border-accent bg-bg-alt" : "border-transparent hover:bg-bg-alt"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSubcategoryId(subcategory.id)}
                        className="w-full flex items-center gap-2 text-left min-h-[1.75rem]"
                      >
                        <span className="flex-1 text-sm font-medium truncate">
                          {subcategoryText(subcategory, editingLocale).name || "(이름 없음)"}
                        </span>
                        <span className="text-[0.65rem] text-ink-muted shrink-0">
                          {services.filter((s) => s.subcategoryId === subcategory.id).length}
                        </span>
                        {subcategory.isHidden && hiddenBadge}
                      </button>
                      {active && (
                        <div className="flex gap-1 flex-wrap mt-2">
                          <Button size="sm" variant="ghost" onClick={() => moveTaxonomy("subcategory", childSubcategories, subcategory.id, -1)} disabled={busy || i === 0}>↑</Button>
                          <Button size="sm" variant="ghost" onClick={() => moveTaxonomy("subcategory", childSubcategories, subcategory.id, 1)} disabled={busy || i === childSubcategories.length - 1}>↓</Button>
                          <Button size="sm" variant="secondary" onClick={() => startEdit("subcategory", subcategory)} disabled={busy}>수정</Button>
                          <Button size="sm" variant="danger" onClick={() => removeTaxonomy("subcategory", subcategory)} disabled={busy}>삭제</Button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Column>

        {/* 시술 */}
        <Column
          title="시술"
          hint={
            selectedSubcategory
              ? subcategoryText(selectedSubcategory, editingLocale).name
              : "서브카테고리를 선택하세요"
          }
          action={
            subcategoryId ? (
              <Link
                href={`/admin/services/new?sub=${subcategoryId}`}
                className="inline-flex items-center gap-1.5 rounded font-semibold transition-colors bg-ink text-ink-inverse hover:bg-ink-soft px-3 py-1.5 text-xs"
                style={{ letterSpacing: "-0.02em" }}
              >
                + 시술 추가
              </Link>
            ) : null
          }
        >
          {!subcategoryId ? (
            <EmptyNote>가운데에서 서브카테고리를 선택하세요.</EmptyNote>
          ) : childServices.length === 0 ? (
            <EmptyNote>등록된 시술이 없습니다. &ldquo;+ 시술 추가&rdquo;로 시작하세요.</EmptyNote>
          ) : (
            <ul className="space-y-2">
              {childServices.map((service, i) => {
                const { name } = serviceText(service, editingLocale);
                const price = service.prices[0];
                const computed = price ? computePrice(price) : null;
                return (
                  <li
                    key={service.id}
                    className={`border border-line rounded p-2.5 ${service.isHidden ? "opacity-60" : ""}`}
                  >
                    <div className="flex gap-2.5">
                      <div className="w-14 h-14 bg-bg-alt rounded overflow-hidden shrink-0 flex items-center justify-center">
                        {service.image && (
                          isVideoUrl(service.image) ? (
                            <span className="text-lg" aria-label="동영상" title="동영상">🎬</span>
                          ) : (
                            // 관리자 목록 썸네일 — next/image 최적화가 필요 없는 크기
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={service.image} alt="" className="w-full h-full object-cover" />
                          )
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium truncate">{name || "(이름 없음)"}</span>
                          {service.isHidden && hiddenBadge}
                        </div>
                        {price && computed ? (
                          <div className="text-xs text-ink-muted truncate mt-0.5">
                            {priceText(price, editingLocale).label}
                          </div>
                        ) : (
                          <div className="text-xs text-ink-muted mt-0.5">가격 옵션 없음</div>
                        )}
                        {computed && (
                          <div className="text-sm font-semibold mt-0.5" style={{ fontVariantNumeric: "tabular-nums" }}>
                            {computed.hasDiscount && (
                              <span className="text-sale mr-1">{computed.rate}%</span>
                            )}
                            {formatKRW(computed.final)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1 flex-wrap mt-2 pt-2 border-t border-line">
                      <Button size="sm" variant="ghost" onClick={() => moveService(service.id, -1)} disabled={busy || i === 0}>↑</Button>
                      <Button size="sm" variant="ghost" onClick={() => moveService(service.id, 1)} disabled={busy || i === childServices.length - 1}>↓</Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleServiceHidden(service)} disabled={busy}>
                        {service.isHidden ? "노출" : "숨김"}
                      </Button>
                      <Link
                        href={`/admin/services/${service.id}`}
                        className="inline-flex items-center gap-1.5 rounded font-semibold transition-colors border border-line bg-surface text-ink hover:bg-bg-alt px-3 py-1.5 text-xs"
                        style={{ letterSpacing: "-0.02em" }}
                      >
                        수정
                      </Link>
                      <Button size="sm" variant="danger" onClick={() => removeService(service)} disabled={busy}>삭제</Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Column>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

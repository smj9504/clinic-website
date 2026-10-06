"use client";

import { useMemo, useState } from "react";
import {
  categoryText,
  serviceText,
  subcategoryText,
  type Service,
  type ServiceCategory,
  type ServiceSubcategory,
} from "@/lib/services";
import type { Locale } from "@/lib/i18n";

type Props = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  categories: ServiceCategory[];
  subcategories: ServiceSubcategory[];
  services: Service[];
  locale: Locale;
};

export default function LinkedServicesPicker({
  selectedIds,
  onChange,
  categories,
  subcategories,
  services,
  locale,
}: Props) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const selected = new Set(selectedIds);
  const serviceById = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);

  const normalizedQuery = query.trim().toLowerCase();

  // 카테고리 → 서브카테고리 → 시술 순으로 묶는다
  const groups = useMemo(() => {
    const subsByCategory = new Map<string, ServiceSubcategory[]>();
    for (const sub of subcategories) {
      const list = subsByCategory.get(sub.categoryId) ?? [];
      list.push(sub);
      subsByCategory.set(sub.categoryId, list);
    }
    const servicesBySub = new Map<string, Service[]>();
    for (const s of services) {
      const list = servicesBySub.get(s.subcategoryId) ?? [];
      list.push(s);
      servicesBySub.set(s.subcategoryId, list);
    }
    return categories
      .map((cat) => ({
        category: cat,
        subgroups: (subsByCategory.get(cat.id) ?? [])
          .map((sub) => ({ subcategory: sub, services: servicesBySub.get(sub.id) ?? [] }))
          .filter((g) => g.services.length > 0),
      }))
      .filter((g) => g.subgroups.length > 0);
  }, [categories, subcategories, services]);

  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) return groups;
    return groups
      .map((g) => ({
        category: g.category,
        subgroups: g.subgroups
          .map((sg) => ({
            subcategory: sg.subcategory,
            services: sg.services.filter((s) =>
              serviceText(s, locale).name.toLowerCase().includes(normalizedQuery)
            ),
          }))
          .filter((sg) => sg.services.length > 0),
      }))
      .filter((g) => g.subgroups.length > 0);
  }, [groups, normalizedQuery, locale]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  };

  const toggleCollapsed = (categoryId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  if (services.length === 0) {
    return (
      <p className="text-sm text-ink-muted px-3 py-4 border border-line rounded">
        등록된 시술이 없습니다. 시술을 먼저 등록해주세요.
      </p>
    );
  }

  return (
    <div className="border border-line rounded overflow-hidden">
      <div className="p-3 border-b border-line bg-bg-alt/60 space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-ink" style={{ letterSpacing: "-0.01em" }}>
            {selected.size > 0 ? `${selected.size}개 선택됨` : "선택된 시술 없음"}
          </span>
          {selected.size > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs text-ink-muted hover:text-ink transition-colors"
            >
              모두 지우기
            </button>
          )}
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedIds.map((id) => {
              const s = serviceById.get(id);
              if (!s) return null;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full bg-ink text-ink-inverse text-xs"
                  style={{ letterSpacing: "-0.01em" }}
                >
                  {serviceText(s, locale).name}
                  <button
                    type="button"
                    onClick={() => toggle(id)}
                    aria-label={`${serviceText(s, locale).name} 선택 해제`}
                    className="w-4 h-4 flex items-center justify-center rounded-full opacity-70 hover:opacity-100 hover:bg-white/20 transition"
                  >
                    ✕
                  </button>
                </span>
              );
            })}
          </div>
        )}

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="시술명으로 검색"
          className="w-full px-3 py-2 border border-line bg-surface rounded text-sm outline-none focus:border-accent transition-colors"
          style={{ letterSpacing: "-0.01em" }}
        />
      </div>

      <div className="max-h-72 overflow-y-auto p-3 space-y-1">
        {filteredGroups.length === 0 && (
          <p className="text-sm text-ink-muted text-center py-6">검색 결과가 없습니다.</p>
        )}
        {filteredGroups.map(({ category, subgroups }) => {
          const isCollapsed = collapsed.has(category.id) && !normalizedQuery;
          const categoryServiceIds = subgroups.flatMap((sg) => sg.services.map((s) => s.id));
          const selectedInCategory = categoryServiceIds.filter((id) => selected.has(id)).length;

          return (
            <div key={category.id} className="border-b border-line/50 last:border-b-0">
              <button
                type="button"
                onClick={() => toggleCollapsed(category.id)}
                className="w-full flex items-center justify-between gap-2 py-2 text-left group"
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    className="shrink-0 text-ink-muted transition-transform duration-150"
                    style={{ transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
                  >
                    <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-xs font-semibold text-ink-muted truncate">
                    {categoryText(category, locale).name}
                  </span>
                </span>
                {selectedInCategory > 0 && (
                  <span className="text-[11px] text-ink-muted shrink-0">{selectedInCategory}개 선택</span>
                )}
              </button>

              {!isCollapsed && (
                <div className="pb-2 space-y-2.5">
                  {subgroups.map(({ subcategory, services: subServices }) => (
                    <div key={subcategory.id}>
                      <p className="text-[11px] text-ink-muted/70 mb-1 pl-2">
                        {subcategoryText(subcategory, locale).name}
                      </p>
                      <div className="pl-2 space-y-0.5">
                        {subServices.map((s) => (
                          <label
                            key={s.id}
                            className="flex items-center gap-2 text-sm py-1 px-1.5 -mx-1.5 rounded cursor-pointer hover:bg-bg-alt transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selected.has(s.id)}
                              onChange={() => toggle(s.id)}
                              className="rounded border-line accent-accent"
                            />
                            <span className="text-ink">
                              {serviceText(s, locale).name}
                              {s.isHidden && <span className="text-ink-muted"> (숨김)</span>}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

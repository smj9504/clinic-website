"use client";

import { useMemo } from "react";
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
  const selected = new Set(selectedIds);

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

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  };

  if (services.length === 0) {
    return (
      <p className="text-sm text-ink-muted px-3 py-4 border border-line rounded">
        등록된 시술이 없습니다. 시술을 먼저 등록해주세요.
      </p>
    );
  }

  return (
    <div className="max-h-80 overflow-y-auto border border-line rounded p-3 space-y-4">
      {groups.map(({ category, subgroups }) => (
        <div key={category.id}>
          <p className="text-xs font-semibold text-ink-muted mb-1.5">
            {categoryText(category, locale).name}
          </p>
          {subgroups.map(({ subcategory, services: subServices }) => (
            <div key={subcategory.id} className="mb-2 last:mb-0">
              <p className="text-xs text-ink-muted/70 mb-1 pl-2">
                {subcategoryText(subcategory, locale).name}
              </p>
              <div className="pl-2 space-y-1">
                {subServices.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-2 text-sm py-0.5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggle(s.id)}
                      className="rounded border-line"
                    />
                    <span>
                      {serviceText(s, locale).name}
                      {s.isHidden && <span className="text-ink-muted"> (숨김)</span>}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

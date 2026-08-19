"use client";

import {
  categoryText,
  subcategoryText,
  type ServiceCategory,
  type ServiceSubcategory,
} from "@/lib/services";
import type { Locale } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/translations";

export const ALL = "all";

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-4 min-h-[2.75rem] rounded-full border text-sm font-medium transition-colors ${
        active
          ? "border-accent text-accent"
          : "border-line text-ink-muted hover:border-line-strong hover:text-ink"
      }`}
      style={{ letterSpacing: "-0.02em" }}
    >
      {label}
    </button>
  );
}

export type CategoryFilterProps = {
  categories: ServiceCategory[];
  subcategories: ServiceSubcategory[];
  activeCategory: string;
  activeSubcategory: string;
  onCategoryChange: (id: string) => void;
  onSubcategoryChange: (id: string) => void;
  locale: Locale;
  t: (key: TranslationKey) => string;
};

/**
 * 카테고리 칩 한 줄 + (카테고리를 고른 경우) 서브카테고리 칩 한 줄.
 * 서브카테고리가 하나뿐이면 고를 것이 없으므로 둘째 줄을 그리지 않는다.
 */
export default function CategoryFilter({
  categories,
  subcategories,
  activeCategory,
  activeSubcategory,
  onCategoryChange,
  onSubcategoryChange,
  locale,
  t,
}: CategoryFilterProps) {
  if (categories.length === 0) return null;

  const childSubcategories =
    activeCategory === ALL
      ? []
      : subcategories.filter((s) => s.categoryId === activeCategory);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 justify-center">
        <Chip
          label={t("services.all")}
          active={activeCategory === ALL}
          onClick={() => onCategoryChange(ALL)}
        />
        {categories.map((category) => (
          <Chip
            key={category.id}
            label={categoryText(category, locale).name}
            active={activeCategory === category.id}
            onClick={() => onCategoryChange(category.id)}
          />
        ))}
      </div>

      {childSubcategories.length > 1 && (
        <div className="flex flex-wrap gap-2 justify-center pt-1">
          <Chip
            label={t("services.all")}
            active={activeSubcategory === ALL}
            onClick={() => onSubcategoryChange(ALL)}
          />
          {childSubcategories.map((subcategory) => (
            <Chip
              key={subcategory.id}
              label={subcategoryText(subcategory, locale).name}
              active={activeSubcategory === subcategory.id}
              onClick={() => onSubcategoryChange(subcategory.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

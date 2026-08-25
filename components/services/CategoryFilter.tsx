"use client";

import { categoryText, type ServiceCategory } from "@/lib/services";
import type { Locale } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/translations";

export const ALL = "all";

function Tab({
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
      className="relative font-display pb-2 transition-colors duration-200"
      style={{
        fontSize: "clamp(1.1rem, 2vw, 1.5rem)",
        fontWeight: 700,
        letterSpacing: "-0.02em",
        color: active ? "var(--color-ink)" : "var(--color-ink-muted)",
        opacity: active ? 1 : 0.6,
      }}
    >
      {label}
      <span
        className="absolute left-0 right-0 bottom-0 h-0.5 bg-accent transition-transform duration-200 origin-left"
        style={{ transform: active ? "scaleX(1)" : "scaleX(0)" }}
        aria-hidden="true"
      />
    </button>
  );
}

export type CategoryFilterProps = {
  categories: ServiceCategory[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  locale: Locale;
  t: (key: TranslationKey) => string;
};

/**
 * 카테고리 언더라인 탭. 서브카테고리는 고르는 UI 없이 선택한 카테고리의
 * 시술을 모두 카드로 보여준다 (필터링은 app/services/page.tsx에서 처리).
 */
export default function CategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
  locale,
  t,
}: CategoryFilterProps) {
  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-5 md:gap-x-16">
      <Tab
        label={t("services.all")}
        active={activeCategory === ALL}
        onClick={() => onCategoryChange(ALL)}
      />
      {categories.map((category) => (
        <Tab
          key={category.id}
          label={categoryText(category, locale).name}
          active={activeCategory === category.id}
          onClick={() => onCategoryChange(category.id)}
        />
      ))}
    </div>
  );
}

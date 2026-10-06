"use client";

import { categoryText, type ServiceCategory } from "@/lib/services";
import type { Locale } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/translations";

export const ALL = "all";
/** 실제 카테고리가 아니라 "eventIds가 있는 시술만" 골라 보여주는 가상 필터 */
export const EVENT_FILTER = "event";

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
      className="relative shrink-0 text-left px-4 py-3 md:px-5 md:py-3.5 rounded-lg transition-colors duration-200 whitespace-nowrap md:whitespace-normal"
      style={{
        fontWeight: 700,
        letterSpacing: "-0.02em",
        fontSize: "0.9375rem",
        color: active ? "var(--color-ink-inverse)" : "var(--color-ink)",
        background: active ? "var(--color-accent)" : "transparent",
      }}
    >
      {label}
    </button>
  );
}

export type CategoryFilterProps = {
  categories: ServiceCategory[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  locale: Locale;
  t: (key: TranslationKey) => string;
  /** 이벤트 적용 시술이 하나라도 있을 때만 "이벤트" 탭을 보여준다 */
  hasEventServices?: boolean;
};

/**
 * 카테고리 탭 — 좁은 화면에서는 가로 스크롤 탭, md 이상에서는 좌측 세로
 * 탭 목록으로 배치한다(app/services/page.tsx가 md 이상에서 그리드로 감싼다).
 * 서브카테고리는 고르는 UI 없이 선택한 카테고리의 시술을 모두 리스트로
 * 보여준다(필터링은 app/services/page.tsx에서 처리).
 *
 * "이벤트" 탭은 실제 카테고리가 아니라 eventIds가 있는 시술만 모아 보는
 * 가상 필터라 categories 배열과 별도로 맨 앞에 고정 배치한다.
 */
export default function CategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
  locale,
  t,
  hasEventServices = false,
}: CategoryFilterProps) {
  if (categories.length === 0 && !hasEventServices) return null;

  return (
    <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0">
      <Tab label={t("services.all")} active={activeCategory === ALL} onClick={() => onCategoryChange(ALL)} />
      {hasEventServices && (
        <Tab
          label={t("badge.event")}
          active={activeCategory === EVENT_FILTER}
          onClick={() => onCategoryChange(EVENT_FILTER)}
        />
      )}
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

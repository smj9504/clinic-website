"use client";

import { useState } from "react";
import Link from "next/link";
import { useSiteDataForLocale } from "@/lib/useSiteData";
import { useAdminLocale } from "@/lib/adminLocale";
import { updateSiteData, type SiteData, type MenuItem } from "@/lib/storage";
import type { SkinBeautyEquipmentSections } from "@/lib/data";
import { PageHeader, Field, TextInput, TextArea, Card, ImageInput, Tabs, TabPanel } from "@/components/admin/ui";

const HUBS: { menuId: string; parentMenuId: string; title: string; publicHref: string }[] = [
  { menuId: "m7", parentMenuId: "m7", title: "피부미용", publicHref: "/skin-beauty" },
  { menuId: "m8", parentMenuId: "m8", title: "한방치료", publicHref: "/korean-treatment" },
];

const DEFAULT_EQUIPMENT_SECTIONS: SkinBeautyEquipmentSections = {};

const COLLAGE_SLOT_COUNT = 6;

/**
 * /skin-beauty, /korean-treatment 허브 페이지는 "메뉴 관리"(배너 이미지)와
 * "시술 페이지"(카드 순서·내용) 두 화면에 걸쳐 편집되던 콘텐츠라, 이 URL을
 * 하나로 관리하는 화면이 없어 어디서 손대야 할지 찾기 어려웠다. 이 페이지는
 * 새 편집 로직을 만들지 않고 두 소스를 한 화면에 모아 보여주기만 한다 —
 * 배너는 여기서 바로 patch하고(menus[].bannerImage), 카드 내용 자체는
 * 이미 검증된 /admin/subpages/[id] 편집기로 그대로 위임한다(중복 저장 로직을
 * 피하기 위해 의도적으로 재구현하지 않음).
 *
 * 장비소개 섹션(EquipmentShowcase/EquipmentCarousel)의 하위 장비 선택 UI는
 * 의도적으로 두지 않는다 — "장비소개" admin이 이미 표시 순서·숨김을
 * 관리하므로, 여기서 또 고르게 하면 같은 결정을 두 곳에서 관리하게 된다.
 * 두 섹션 다 항상 장비소개의 전체 목록을 그대로 보여준다.
 */
export default function HubPagesAdminPage() {
  const { editingLocale } = useAdminLocale();
  const { menus, subPages, skinBeautyEquipmentSections } = useSiteDataForLocale(editingLocale);
  const [activeHub, setActiveHub] = useState(HUBS[0].menuId);

  const findMenu = (id: string): MenuItem | undefined => menus.find((m) => m.id === id);

  const updateBanner = async (menuId: string, bannerImage: string) => {
    await updateSiteData(
      (d: SiteData) => ({
        ...d,
        menus: d.menus.map((m) => (m.id === menuId ? { ...m, bannerImage } : m)),
      }),
      editingLocale
    );
  };

  const effectiveEquipmentSections = skinBeautyEquipmentSections ?? DEFAULT_EQUIPMENT_SECTIONS;
  const updateEquipmentSections = async (p: Partial<SkinBeautyEquipmentSections>) => {
    await updateSiteData(
      (d: SiteData) => ({
        ...d,
        skinBeautyEquipmentSections: { ...(d.skinBeautyEquipmentSections ?? {}), ...p },
      }),
      editingLocale
    );
  };
  const collageSlots = Array.from(
    { length: COLLAGE_SLOT_COUNT },
    (_, i) => effectiveEquipmentSections.collageImages?.[i] ?? ""
  );
  const updateCollageSlot = (i: number, value: string) => {
    const next = [...collageSlots];
    next[i] = value;
    updateEquipmentSections({ collageImages: next });
  };

  return (
    <>
      <PageHeader
        title="피부미용 · 한방치료 페이지"
        description="/skin-beauty, /korean-treatment 목록 페이지를 관리합니다. 상단 배너는 여기서 바로 수정하고, 카드 내용은 '시술 페이지'에서 편집합니다."
      />

      <Card>
        <Tabs tabs={HUBS.map((h) => ({ id: h.menuId, label: h.title }))} active={activeHub} onChange={setActiveHub} />

        {HUBS.map((hub) => {
          const menu = findMenu(hub.menuId);
          const items = (subPages ?? [])
            .filter((sp) => sp.parentMenuId === hub.parentMenuId)
            .sort((a, b) => a.sortOrder - b.sortOrder);

          return (
            <TabPanel key={hub.menuId} id={hub.menuId} active={activeHub}>
              <div className="flex items-center justify-end mb-5">
                <Link
                  href={hub.publicHref}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded font-semibold transition-colors border border-line bg-surface text-ink hover:bg-bg-alt px-3 py-1.5 text-xs"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  페이지 보기 ↗
                </Link>
              </div>

              <Field
                label="상단 배너 이미지"
                hint="페이지 맨 위 제목 영역의 배경(어둡게 처리되어 30% 밝기로 표시됩니다)"
              >
                <ImageInput
                  value={menu?.bannerImage ?? ""}
                  onChange={(v) => hub.menuId && updateBanner(hub.menuId, v)}
                  aspectRatio="16 / 5"
                />
              </Field>

              <div className="mt-6 pt-5 border-t border-line">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold" style={{ letterSpacing: "-0.02em" }}>
                    카드 목록
                  </span>
                  <span className="text-xs text-ink-muted">
                    순서·표시 여부는 &quot;시술 페이지&quot;에서, 여기서는 미리보기만 제공합니다
                  </span>
                </div>

                {items.length === 0 ? (
                  <p className="text-sm text-ink-muted py-6 text-center">등록된 카드가 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 border border-line rounded-lg p-3 ${
                          item.isHidden ? "opacity-50" : ""
                        }`}
                      >
                        <div className="w-16 h-12 bg-bg-alt rounded overflow-hidden shrink-0 flex items-center justify-center">
                          {item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-ink-muted text-xs">사진 없음</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium truncate">{item.title}</span>
                            {item.isHidden && (
                              <span className="text-xs px-1.5 py-0.5 bg-bg-alt rounded text-ink-muted shrink-0">
                                숨김
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-ink-muted truncate mt-0.5">
                            {item.intro || "소개 문구 없음"}
                          </p>
                        </div>
                        <Link
                          href={`/admin/subpages/${item.id}`}
                          className="inline-flex items-center gap-1.5 rounded font-semibold transition-colors border border-line bg-surface text-ink hover:bg-bg-alt px-3 py-1.5 text-xs shrink-0"
                          style={{ letterSpacing: "-0.02em" }}
                        >
                          편집
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {hub.menuId === "m7" && (
                <div className="mt-6 pt-5 border-t border-line space-y-6">
                  <div>
                    <span className="text-sm font-semibold block mb-1" style={{ letterSpacing: "-0.02em" }}>
                      시그니처 케어 소개
                    </span>
                    <p className="text-xs text-ink-muted mb-4">
                      장비소개 섹션 상단의 사진 콜라주와 소개 문구입니다. 비워두면 이 텍스트 영역 자체가 표시되지 않습니다.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <Field label="작은 라벨" hint='예: "전부 같은 관리가 아닙니다."'>
                        <TextInput
                          value={effectiveEquipmentSections.introLabel ?? ""}
                          onChange={(e) => updateEquipmentSections({ introLabel: e.target.value })}
                        />
                      </Field>
                      <Field label="제목" hint='예: "고운빛 시그니처 케어"'>
                        <TextInput
                          value={effectiveEquipmentSections.introTitle ?? ""}
                          onChange={(e) => updateEquipmentSections({ introTitle: e.target.value })}
                        />
                      </Field>
                    </div>
                    <Field label="본문">
                      <TextArea
                        rows={3}
                        value={effectiveEquipmentSections.introBody ?? ""}
                        onChange={(e) => updateEquipmentSections({ introBody: e.target.value })}
                      />
                    </Field>
                    <Field label="버튼 문구" hint='예: "장비소개 더 보기" — 소개 텍스트가 하나라도 있어야 표시됩니다'>
                      <TextInput
                        value={effectiveEquipmentSections.introCta ?? ""}
                        onChange={(e) => updateEquipmentSections({ introCta: e.target.value })}
                      />
                    </Field>

                    <Field
                      label="사진 콜라주 (6칸)"
                      hint="비워둔 칸은 장비소개 목록의 같은 순번 사진으로 자동 채워집니다"
                    >
                      <div className="grid grid-cols-3 gap-3">
                        {collageSlots.map((slot, i) => (
                          <ImageInput
                            key={i}
                            value={slot}
                            onChange={(v) => updateCollageSlot(i, v)}
                            aspectRatio="1 / 1"
                          />
                        ))}
                      </div>
                    </Field>
                  </div>

                  <div>
                    <span className="text-sm font-semibold block mb-1" style={{ letterSpacing: "-0.02em" }}>
                      원형 캐러셀 제목
                    </span>
                    <p className="text-xs text-ink-muted mb-4">
                      페이지 하단, 원형 사진이 자동으로 넘어가는 캐러셀 위에 표시되는 문구입니다. 비워두면 제목·부제 영역이 표시되지 않습니다.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <Field label="제목" hint='예: "고운빛의"'>
                        <TextInput
                          value={effectiveEquipmentSections.carouselTitle ?? ""}
                          onChange={(e) => updateEquipmentSections({ carouselTitle: e.target.value })}
                        />
                      </Field>
                      <Field label="제목 강조 부분" hint='제목 뒤에 강조 색상으로 이어 붙습니다. 예: "장비를 만나보세요"'>
                        <TextInput
                          value={effectiveEquipmentSections.carouselTitleHighlight ?? ""}
                          onChange={(e) => updateEquipmentSections({ carouselTitleHighlight: e.target.value })}
                        />
                      </Field>
                    </div>
                    <Field label="부제">
                      <TextArea
                        rows={2}
                        value={effectiveEquipmentSections.carouselSubtitle ?? ""}
                        onChange={(e) => updateEquipmentSections({ carouselSubtitle: e.target.value })}
                      />
                    </Field>
                  </div>
                </div>
              )}
            </TabPanel>
          );
        })}
      </Card>
    </>
  );
}

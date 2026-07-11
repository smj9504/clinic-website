"use client";

import { useState, useEffect } from "react";
import { useSiteDataForLocale } from "@/lib/useSiteData";
import { useAdminLocale } from "@/lib/adminLocale";
import { updateSiteData, syncImages, changePassword } from "@/lib/storage";
import type { HeroSlide, Treatment } from "@/lib/data";
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

type Tab = "clinic" | "hero" | "treatments" | "about" | "password";

export default function SettingsAdminPage() {
  const { editingLocale } = useAdminLocale();
  const data = useSiteDataForLocale(editingLocale);
  const [tab, setTab] = useState<Tab>("clinic");
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => setToast(msg);

  const tabs: { key: Tab; label: string }[] = [
    { key: "clinic", label: "한의원 기본 정보" },
    { key: "hero", label: "히어로 슬라이드" },
    { key: "treatments", label: "진료 내용" },
    { key: "about", label: "한의원 소개" },
    { key: "password", label: "비밀번호 변경" },
  ];

  return (
    <>
      <PageHeader
        title="사이트 설정"
        description="한의원 기본 정보, 히어로 슬라이드, 진료 내용, 한의원 소개를 관리합니다."
      />

      <div className="flex gap-1 mb-6 border-b border-line overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              tab === t.key
                ? "border-accent text-accent"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
            style={{ letterSpacing: "-0.02em" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "clinic" && <ClinicInfoTab onSave={() => showToast("저장되었습니다")} />}
      {tab === "hero" && <HeroSlidesTab onSave={() => showToast("저장되었습니다")} />}
      {tab === "treatments" && <TreatmentsTab onSave={() => showToast("저장되었습니다")} />}
      {tab === "about" && <AboutTab onSave={() => showToast("저장되었습니다")} />}
      {tab === "password" && <PasswordTab onSave={() => showToast("비밀번호가 변경되었습니다")} />}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

// ─── Clinic Info Tab ───
function ClinicInfoTab({ onSave }: { onSave: () => void }) {
  const { editingLocale } = useAdminLocale();
  const { clinicInfo, showStats, stats } = useSiteDataForLocale(editingLocale);
  const defaultStats = [
    { label: "진료 경력", value: 15, suffix: "년" },
    { label: "누적 환자", value: 30000, suffix: "명+" },
    { label: "환자 만족도", value: 98, suffix: "%" },
    { label: "진료 분야", value: 5, suffix: "개" },
  ];
  const [draft, setDraft] = useState(clinicInfo);
  const [statsVisible, setStatsVisible] = useState(showStats);
  const [statsDraft, setStatsDraft] = useState(stats ?? defaultStats);

  // hydration 후 또는 편집 언어 변경 시 draft 동기화
  const clinicStr = JSON.stringify(clinicInfo);
  useEffect(() => {
    setDraft(clinicInfo);
    setStatsVisible(showStats);
    setStatsDraft(stats ?? defaultStats);
  }, [clinicStr, showStats]);

  const save = () => {
    updateSiteData((d) => ({ ...d, clinicInfo: draft, showStats: statsVisible, stats: statsDraft }), editingLocale);
    syncImages(editingLocale);
    onSave();
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold mb-4" style={{ letterSpacing: "-0.02em" }}>
            기본 정보
          </h3>
          <Field label="한의원 이름">
            <TextInput
              value={draft.name}
              onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
            />
          </Field>
          <Field label="전화번호">
            <TextInput
              value={draft.phone}
              onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))}
            />
          </Field>
          <Field label="주소">
            <TextInput
              value={draft.address}
              onChange={(e) => setDraft((p) => ({ ...p, address: e.target.value }))}
            />
          </Field>
          <Field label="네이버 예약 URL">
            <TextInput
              value={draft.reservationUrl}
              onChange={(e) =>
                setDraft((p) => ({ ...p, reservationUrl: e.target.value }))
              }
            />
          </Field>
        </Card>

        <Card>
          <h3 className="font-semibold mb-4" style={{ letterSpacing: "-0.02em" }}>
            진료 시간
          </h3>
          <Field label="평일">
            <TextInput
              value={draft.hours.weekday}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  hours: { ...p.hours, weekday: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="토요일">
            <TextInput
              value={draft.hours.saturday}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  hours: { ...p.hours, saturday: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="휴진">
            <TextInput
              value={draft.hours.closed}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  hours: { ...p.hours, closed: e.target.value },
                }))
              }
            />
          </Field>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="font-semibold mb-4" style={{ letterSpacing: "-0.02em" }}>
            기본 이미지
          </h3>
          <p className="text-xs text-ink-muted mb-4">
            이벤트·공지사항 등에서 이미지를 등록하지 않은 경우 표시되는 대체 이미지입니다.
          </p>
          <ImageInput
            value={draft.defaultImage ?? ""}
            onChange={(v) => setDraft((p) => ({ ...p, defaultImage: v }))}
            aspectRatio="16 / 10"
          />
        </Card>

        <Card className="lg:col-span-2">
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={statsVisible}
              onChange={(e) => setStatsVisible(e.target.checked)}
              style={{ accentColor: "var(--color-accent)" }}
              className="w-5 h-5"
            />
            <span className="font-semibold" style={{ letterSpacing: "-0.02em" }}>
              통계 섹션 표시
            </span>
            <span className="text-xs text-ink-muted">
              (진료 경력, 누적 환자, 만족도 등 숫자 카운트업 섹션)
            </span>
          </label>

          {statsVisible && (
            <div className="border-t border-line pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {statsDraft.map((s, i) => (
                  <div key={i} className="flex items-end gap-2 p-3 bg-bg-alt rounded-lg">
                    <div className="flex-1">
                      <label className="block text-xs text-ink-muted mb-1">라벨</label>
                      <TextInput
                        value={s.label}
                        onChange={(e) => setStatsDraft((p) => p.map((item, idx) => idx === i ? { ...item, label: e.target.value } : item))}
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs text-ink-muted mb-1">숫자</label>
                      <TextInput
                        type="number"
                        value={s.value}
                        onChange={(e) => setStatsDraft((p) => p.map((item, idx) => idx === i ? { ...item, value: Number(e.target.value) || 0 } : item))}
                      />
                    </div>
                    <div className="w-16">
                      <label className="block text-xs text-ink-muted mb-1">단위</label>
                      <TextInput
                        value={s.suffix}
                        onChange={(e) => setStatsDraft((p) => p.map((item, idx) => idx === i ? { ...item, suffix: e.target.value } : item))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="font-semibold mb-4" style={{ letterSpacing: "-0.02em" }}>
            소셜 / 외부 링크
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="네이버 블로그">
              <TextInput
                value={draft.socialLinks.blog}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    socialLinks: { ...p.socialLinks, blog: e.target.value },
                  }))
                }
              />
            </Field>
            <Field label="인스타그램">
              <TextInput
                value={draft.socialLinks.instagram}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    socialLinks: { ...p.socialLinks, instagram: e.target.value },
                  }))
                }
              />
            </Field>
            <Field label="카카오 채널">
              <TextInput
                value={draft.socialLinks.kakao}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    socialLinks: { ...p.socialLinks, kakao: e.target.value },
                  }))
                }
              />
            </Field>
          </div>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={save}>저장</Button>
      </div>
    </>
  );
}

// ─── Hero Slides Tab ───
function HeroSlidesTab({ onSave }: { onSave: () => void }) {
  const { editingLocale } = useAdminLocale();
  const { heroSlides } = useSiteDataForLocale(editingLocale);
  const updateData = async (fn: (data: import("@/lib/storage").SiteData) => import("@/lib/storage").SiteData) => {
    await updateSiteData(fn, editingLocale);
    await syncImages(editingLocale);
  };

  const update = (id: number, patch: Partial<HeroSlide>) => {
    updateData((d) => ({
      ...d,
      heroSlides: d.heroSlides.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
    onSave();
  };

  const remove = (id: number) => {
    if (!confirm("이 슬라이드를 삭제하시겠습니까?")) return;
    updateData((d) => ({
      ...d,
      heroSlides: d.heroSlides.filter((s) => s.id !== id),
    }));
    onSave();
  };

  const add = () => {
    updateData((d) => {
      const nextId = Math.max(0, ...d.heroSlides.map((s) => s.id)) + 1;
      return {
        ...d,
        heroSlides: [
          ...d.heroSlides,
          {
            id: nextId,
            label: "New Slide",
            title: "새 슬라이드 제목",
            subtitle: "부제목을 입력하세요",
            image: "",
          },
        ],
      };
    });
    onSave();
  };

  const move = (id: number, dir: -1 | 1) => {
    updateData((d) => {
      const list = [...d.heroSlides];
      const idx = list.findIndex((s) => s.id === id);
      const target = idx + dir;
      if (target < 0 || target >= list.length) return d;
      [list[idx], list[target]] = [list[target], list[idx]];
      return { ...d, heroSlides: list };
    });
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={add} variant="primary">
          + 슬라이드 추가
        </Button>
      </div>

      <div className="space-y-6">
        {heroSlides.map((s, i) => (
          <Card key={s.id}>
            <div className="flex items-start justify-between mb-4">
              <h4
                className="font-semibold"
                style={{ letterSpacing: "-0.02em" }}
              >
                슬라이드 {i + 1}
              </h4>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => move(s.id, -1)}
                  disabled={i === 0}
                >
                  ↑
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => move(s.id, 1)}
                  disabled={i === heroSlides.length - 1}
                >
                  ↓
                </Button>
                <Button size="sm" variant="danger" onClick={() => remove(s.id)}>
                  삭제
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Field label="영문 라벨" hint="작은 헤더 텍스트 (대문자 권장)">
                  <TextInput
                    value={s.label}
                    onChange={(e) => update(s.id, { label: e.target.value })}
                  />
                </Field>
                <Field label="메인 카피" hint="줄바꿈은 그대로 표시됩니다">
                  <TextArea
                    rows={3}
                    value={s.title}
                    onChange={(e) => update(s.id, { title: e.target.value })}
                  />
                </Field>
                <Field label="서브 카피">
                  <TextArea
                    rows={3}
                    value={s.subtitle}
                    onChange={(e) => update(s.id, { subtitle: e.target.value })}
                  />
                </Field>
              </div>
              <div>
                <Field label="배경 이미지" hint="권장 크기 1920×1080 이상">
                  <ImageInput
                    value={s.image}
                    onChange={(v) => update(s.id, { image: v })}
                    aspectRatio="16 / 9"
                  />
                </Field>
              </div>
            </div>
          </Card>
        ))}
        {heroSlides.length === 0 && (
          <Card className="text-center py-12 text-ink-muted">
            슬라이드가 없습니다. 우측 상단 &ldquo;+ 슬라이드 추가&rdquo;로 추가하세요.
          </Card>
        )}
      </div>
    </>
  );
}

// ─── Treatments Tab ───
function TreatmentsTab({ onSave }: { onSave: () => void }) {
  const { editingLocale } = useAdminLocale();
  const { treatments } = useSiteDataForLocale(editingLocale);
  const updateData = (fn: (data: import("@/lib/storage").SiteData) => import("@/lib/storage").SiteData) => updateSiteData(fn, editingLocale);

  const update = (id: number, patch: Partial<Treatment>) => {
    updateData((d) => ({
      ...d,
      treatments: d.treatments.map((t) =>
        t.id === id ? { ...t, ...patch } : t
      ),
    }));
    syncImages(editingLocale);
    onSave();
  };

  const remove = (id: number) => {
    if (!confirm("이 진료 항목을 삭제하시겠습니까?")) return;
    updateData((d) => ({
      ...d,
      treatments: d.treatments.filter((t) => t.id !== id),
    }));
    onSave();
  };

  const add = () => {
    updateData((d) => {
      const nextId = Math.max(0, ...d.treatments.map((t) => t.id)) + 1;
      const nextNum = String(d.treatments.length + 1).padStart(2, "0");
      return {
        ...d,
        treatments: [
          ...d.treatments,
          {
            id: nextId,
            number: nextNum,
            title: "새 진료 항목",
            description: "설명을 입력하세요",
            slug: `treatment-${nextId}`,
            image: "",
          },
        ],
      };
    });
    onSave();
  };

  const move = (id: number, dir: -1 | 1) => {
    updateData((d) => {
      const list = [...d.treatments];
      const idx = list.findIndex((t) => t.id === id);
      const target = idx + dir;
      if (target < 0 || target >= list.length) return d;
      [list[idx], list[target]] = [list[target], list[idx]];
      // 번호 재정렬
      const renumbered = list.map((t, i) => ({
        ...t,
        number: String(i + 1).padStart(2, "0"),
      }));
      return { ...d, treatments: renumbered };
    });
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={add} variant="primary" disabled={treatments.length >= 5}>
          + 진료 항목 추가 ({treatments.length}/5)
        </Button>
      </div>

      <div className="space-y-4">
        {treatments.map((t, i) => (
          <Card key={t.id} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-[80px_1fr_1fr_auto] gap-4 items-start mb-3">
              <div>
                <label className="block text-xs text-ink-muted mb-1">번호</label>
                <TextInput
                  value={t.number}
                  onChange={(e) => update(t.id, { number: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-ink-muted mb-1">제목</label>
                <TextInput
                  value={t.title}
                  onChange={(e) => update(t.id, { title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-ink-muted mb-1">설명</label>
                <TextInput
                  value={t.description}
                  onChange={(e) => update(t.id, { description: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => move(t.id, -1)}
                  disabled={i === 0}
                >
                  ↑
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => move(t.id, 1)}
                  disabled={i === treatments.length - 1}
                >
                  ↓
                </Button>
                <Button size="sm" variant="danger" onClick={() => remove(t.id)}>
                  삭제
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-ink-muted mb-1">진료 이미지</label>
              <ImageInput
                value={t.image || ""}
                onChange={(v) => update(t.id, { image: v })}
                aspectRatio="4 / 3"
              />
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

// ─── About Tab ───
function AboutTab({ onSave }: { onSave: () => void }) {
  const { editingLocale } = useAdminLocale();
  const { about } = useSiteDataForLocale(editingLocale);
  const [draft, setDraft] = useState(about);

  const aboutStr = JSON.stringify(about);
  useEffect(() => { setDraft(about); }, [aboutStr]);

  const save = () => {
    updateSiteData((d) => ({ ...d, about: draft }), editingLocale);
    syncImages(editingLocale);
    onSave();
  };

  const updateFacility = (i: number, v: string) => {
    setDraft((p) => ({
      ...p,
      facilityImages: p.facilityImages.map((img, idx) => (idx === i ? v : img)),
    }));
  };

  const addFacility = () => {
    setDraft((p) => ({ ...p, facilityImages: [...p.facilityImages, ""] }));
  };

  const removeFacility = (i: number) => {
    setDraft((p) => ({
      ...p,
      facilityImages: p.facilityImages.filter((_, idx) => idx !== i),
    }));
  };

  return (
    <>
      <Card className="mb-6">
        <h3 className="font-semibold mb-4" style={{ letterSpacing: "-0.02em" }}>
          진료 철학
        </h3>
        <Field label="제목">
          <TextInput
            value={draft.philosophyTitle}
            onChange={(e) =>
              setDraft((p) => ({ ...p, philosophyTitle: e.target.value }))
            }
          />
        </Field>
        <Field label="본문">
          <TextArea
            value={draft.philosophyBody}
            onChange={(e) =>
              setDraft((p) => ({ ...p, philosophyBody: e.target.value }))
            }
            rows={5}
          />
        </Field>
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold" style={{ letterSpacing: "-0.02em" }}>
            시설 사진
          </h3>
          <Button size="sm" variant="primary" onClick={addFacility}>
            + 사진 추가
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {draft.facilityImages.map((img, i) => (
            <div key={i} className="border border-line rounded p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-ink-muted">사진 {i + 1}</span>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => removeFacility(i)}
                >
                  삭제
                </Button>
              </div>
              <ImageInput
                value={img}
                onChange={(v) => updateFacility(i, v)}
                aspectRatio="4 / 3"
              />
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button onClick={save}>저장</Button>
      </div>
    </>
  );
}

// ─── Password Tab ───
function PasswordTab({ onSave }: { onSave: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setError("");
    if (!current || !next) {
      setError("모든 필드를 입력해 주세요.");
      return;
    }
    if (next.length < 4) {
      setError("새 비밀번호는 4자 이상이어야 합니다.");
      return;
    }
    if (next !== confirm) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    const result = await changePassword(current, next);
    setLoading(false);
    if (result.success) {
      setCurrent("");
      setNext("");
      setConfirm("");
      onSave();
    } else {
      setError(result.error || "변경에 실패했습니다.");
    }
  };

  return (
    <Card className="max-w-md">
      <h3 className="font-semibold mb-4" style={{ letterSpacing: "-0.02em" }}>
        관리자 비밀번호 변경
      </h3>
      <Field label="현재 비밀번호">
        <TextInput
          type="password"
          value={current}
          onChange={(e) => { setCurrent(e.target.value); setError(""); }}
          placeholder="현재 비밀번호"
        />
      </Field>
      <Field label="새 비밀번호">
        <TextInput
          type="password"
          value={next}
          onChange={(e) => { setNext(e.target.value); setError(""); }}
          placeholder="4자 이상"
        />
      </Field>
      <Field label="새 비밀번호 확인">
        <TextInput
          type="password"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setError(""); }}
          placeholder="새 비밀번호 재입력"
        />
      </Field>
      {error && (
        <p className="text-sm text-red-600 mb-4" style={{ letterSpacing: "-0.02em" }}>
          {error}
        </p>
      )}
      <Button onClick={save} disabled={loading}>
        {loading ? "변경 중..." : "비밀번호 변경"}
      </Button>
    </Card>
  );
}

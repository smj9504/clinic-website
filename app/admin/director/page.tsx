"use client";

import { useState, useEffect } from "react";
import { useSiteDataForLocale } from "@/lib/useSiteData";
import { useAdminLocale } from "@/lib/adminLocale";
import { updateSiteData, syncImages } from "@/lib/storage";
import type { Director } from "@/lib/data";
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

export default function DirectorAdminPage() {
  const { editingLocale } = useAdminLocale();
  const { director } = useSiteDataForLocale(editingLocale);
  const update: typeof updateSiteData = (fn) => updateSiteData(fn, editingLocale);
  const [draft, setDraft] = useState<Director>(director);
  const [toast, setToast] = useState<string | null>(null);

  const directorStr = JSON.stringify(director);
  useEffect(() => {
    setDraft(director);
  }, [directorStr]);

  const save = () => {
    update((d) => ({ ...d, director: draft }));
    syncImages(editingLocale);
    setToast("저장되었습니다");
  };

  const updateBioLine = (i: number, v: string) => {
    setDraft((p) => ({
      ...p,
      bio: p.bio.map((line, idx) => (idx === i ? v : line)),
    }));
  };

  const addBioLine = () => {
    setDraft((p) => ({ ...p, bio: [...p.bio, ""] }));
  };

  const removeBioLine = (i: number) => {
    setDraft((p) => ({ ...p, bio: p.bio.filter((_, idx) => idx !== i) }));
  };

  const moveBioLine = (i: number, dir: -1 | 1) => {
    const target = i + dir;
    if (target < 0 || target >= draft.bio.length) return;
    const newBio = [...draft.bio];
    [newBio[i], newBio[target]] = [newBio[target], newBio[i]];
    setDraft((p) => ({ ...p, bio: newBio }));
  };

  return (
    <>
      <PageHeader
        title="대표원장 정보"
        description="대표원장의 사진, 이름, 약력 등 한의원 소개 페이지에 표시되는 내용을 관리합니다."
        actions={<Button onClick={save}>저장</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold mb-4" style={{ letterSpacing: "-0.02em" }}>
            기본 정보
          </h3>
          <Field label="직함" hint="예: 대표 원장, 원장">
            <TextInput
              value={draft.title}
              onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
            />
          </Field>
          <Field label="이름 (한글)">
            <TextInput
              value={draft.name}
              onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
            />
          </Field>
          <Field label="이름 (영문)" hint="모두 대문자 권장 (예: PARK JUNWOO)">
            <TextInput
              value={draft.nameEn}
              onChange={(e) => setDraft((p) => ({ ...p, nameEn: e.target.value }))}
            />
          </Field>
          <Field label="진료 철학 한 줄" hint="줄바꿈은 그대로 반영됩니다">
            <TextArea
              value={draft.quote}
              onChange={(e) => setDraft((p) => ({ ...p, quote: e.target.value }))}
              rows={3}
            />
          </Field>
        </Card>

        <Card>
          <h3 className="font-semibold mb-4" style={{ letterSpacing: "-0.02em" }}>
            프로필 사진
          </h3>
          <Field label="" hint="권장 비율 4:5 · 자연광 인물 사진">
            <ImageInput
              value={draft.image}
              onChange={(v) => setDraft((p) => ({ ...p, image: v }))}
              aspectRatio="4 / 5"
            />
          </Field>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold" style={{ letterSpacing: "-0.02em" }}>
            약력 (한 줄씩 입력)
          </h3>
          <Button size="sm" variant="primary" onClick={addBioLine}>
            + 약력 추가
          </Button>
        </div>
        <div className="space-y-2">
          {draft.bio.map((line, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-xs text-ink-muted w-6 text-center font-mono">
                {i + 1}
              </span>
              <TextInput
                value={line}
                onChange={(e) => updateBioLine(i, e.target.value)}
                placeholder="예: 경희대학교 한의과대학 졸업"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => moveBioLine(i, -1)}
                disabled={i === 0}
              >
                ↑
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => moveBioLine(i, 1)}
                disabled={i === draft.bio.length - 1}
              >
                ↓
              </Button>
              <Button size="sm" variant="danger" onClick={() => removeBioLine(i)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button onClick={save}>모든 변경사항 저장</Button>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

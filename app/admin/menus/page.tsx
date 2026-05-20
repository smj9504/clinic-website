"use client";

import { useState } from "react";
import { useSiteDataForLocale } from "@/lib/useSiteData";
import { useAdminLocale } from "@/lib/adminLocale";
import { updateSiteData, syncImages, generateId, type MenuItem } from "@/lib/storage";
import {
  PageHeader,
  Field,
  TextInput,
  Button,
  Card,
  ImageInput,
  Toast,
} from "@/components/admin/ui";

export default function MenusAdminPage() {
  const { editingLocale } = useAdminLocale();
  const { menus } = useSiteDataForLocale(editingLocale);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<MenuItem>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ label: "", href: "" });

  const sorted = [...menus].sort((a, b) => a.sortOrder - b.sortOrder);
  const update: typeof updateSiteData = (fn) => updateSiteData(fn, editingLocale);

  const save = (id: string) => {
    update((d) => ({
      ...d,
      menus: d.menus.map((m) => (m.id === id ? { ...m, ...draft } as MenuItem : m)),
    }));
    syncImages(editingLocale);
    setEditing(null);
    setDraft({});
    setToast("메뉴가 저장되었습니다");
  };

  const remove = (id: string) => {
    if (!confirm("이 메뉴를 삭제하시겠습니까?")) return;
    update((d) => ({
      ...d,
      menus: d.menus.filter((m) => m.id !== id),
    }));
    setToast("메뉴가 삭제되었습니다");
  };

  const toggleHide = (id: string) => {
    update((d) => ({
      ...d,
      menus: d.menus.map((m) =>
        m.id === id ? { ...m, isHidden: !m.isHidden } : m
      ),
    }));
  };

  const move = (id: string, dir: -1 | 1) => {
    update((d) => {
      const list = [...d.menus].sort((a, b) => a.sortOrder - b.sortOrder);
      const idx = list.findIndex((m) => m.id === id);
      if (idx < 0) return d;
      const target = idx + dir;
      if (target < 0 || target >= list.length) return d;
      // swap
      [list[idx], list[target]] = [list[target], list[idx]];
      const renumbered = list.map((m, i) => ({ ...m, sortOrder: i }));
      return { ...d, menus: renumbered };
    });
  };

  const add = () => {
    if (!newItem.label.trim() || !newItem.href.trim()) {
      alert("메뉴명과 링크를 모두 입력하세요.");
      return;
    }
    update((d) => ({
      ...d,
      menus: [
        ...d.menus,
        {
          id: generateId("menu"),
          label: newItem.label.trim(),
          href: newItem.href.trim(),
          isHidden: false,
          sortOrder: d.menus.length,
        },
      ],
    }));
    setNewItem({ label: "", href: "" });
    setShowAdd(false);
    setToast("새 메뉴가 추가되었습니다");
  };

  return (
    <>
      <PageHeader
        title="메뉴 관리"
        description="상단 네비게이션에 표시되는 메뉴를 관리합니다. 이름 변경, 순서 조정, 숨김 처리, 삭제가 가능합니다."
      />

      <Card className="p-0 overflow-hidden">
        {sorted.map((m, i) => (
          <div key={m.id} className="border-b border-line/50 last:border-b-0">
            {editing === m.id ? (
              <div className="px-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Field label="메뉴명">
                    <TextInput
                      value={draft.label ?? m.label}
                      onChange={(e) => setDraft((p) => ({ ...p, label: e.target.value }))}
                    />
                  </Field>
                  <Field label="링크 경로">
                    <TextInput
                      value={draft.href ?? m.href}
                      onChange={(e) => setDraft((p) => ({ ...p, href: e.target.value }))}
                    />
                  </Field>
                </div>
                <Field label="배너 이미지" hint="해당 페이지 상단에 표시되는 배경 이미지 (권장 1920×600)">
                  <ImageInput
                    value={draft.bannerImage ?? m.bannerImage ?? ""}
                    onChange={(v) => setDraft((p) => ({ ...p, bannerImage: v }))}
                    aspectRatio="16 / 5"
                  />
                </Field>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={() => save(m.id)}>저장</Button>
                  <Button size="sm" variant="secondary" onClick={() => { setEditing(null); setDraft({}); }}>취소</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-3">
                <span className="text-xs text-ink-muted font-mono w-5 text-center shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-semibold text-sm ${m.isHidden ? "text-ink-muted line-through" : ""}`}
                      style={{ letterSpacing: "-0.02em" }}
                    >
                      {m.label}
                    </span>
                    {m.isHidden ? (
                      <span className="text-xs px-1.5 py-0.5 bg-bg-alt rounded text-ink-muted">숨김</span>
                    ) : (
                      <span className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 rounded">표시</span>
                    )}
                  </div>
                  <div className="text-xs text-ink-muted font-mono mt-0.5 truncate">{m.href}</div>
                </div>
                <div className="flex gap-1 flex-wrap justify-end shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => move(m.id, -1)} disabled={i === 0} title="위로">↑</Button>
                  <Button size="sm" variant="ghost" onClick={() => move(m.id, 1)} disabled={i === sorted.length - 1} title="아래로">↓</Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleHide(m.id)}>{m.isHidden ? "표시" : "숨김"}</Button>
                  <Button size="sm" variant="secondary" onClick={() => { setEditing(m.id); setDraft({}); }}>수정</Button>
                  <Button size="sm" variant="danger" onClick={() => remove(m.id)}>삭제</Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </Card>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

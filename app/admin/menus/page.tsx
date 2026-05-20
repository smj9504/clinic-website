"use client";

import { useState } from "react";
import { useSiteDataForLocale } from "@/lib/useSiteData";
import { useAdminLocale } from "@/lib/adminLocale";
import { updateSiteData, generateId, type MenuItem } from "@/lib/storage";
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
        actions={
          <Button onClick={() => setShowAdd(!showAdd)} variant="primary">
            + 메뉴 추가
          </Button>
        }
      />

      {showAdd && (
        <Card className="mb-6 border-accent">
          <h3
            className="font-semibold mb-4"
            style={{ letterSpacing: "-0.02em" }}
          >
            새 메뉴 추가
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="메뉴명">
              <TextInput
                placeholder="예: 자주 묻는 질문"
                value={newItem.label}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, label: e.target.value }))
                }
              />
            </Field>
            <Field label="링크 경로" hint="예: /community/faq, /events, https://...">
              <TextInput
                placeholder="/path 또는 https://..."
                value={newItem.href}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, href: e.target.value }))
                }
              />
            </Field>
          </div>
          <div className="flex gap-2 mt-2">
            <Button onClick={add}>추가</Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowAdd(false);
                setNewItem({ label: "", href: "" });
              }}
            >
              취소
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr
              className="border-b border-line text-xs uppercase text-ink-muted"
              style={{ letterSpacing: "0.1em" }}
            >
              <th className="text-center px-3 py-3 w-12">#</th>
              <th className="text-left px-3 py-3">메뉴명</th>
              <th className="text-left px-3 py-3">링크</th>
              <th className="text-center px-3 py-3 w-24">상태</th>
              <th className="text-right px-3 py-3 w-72">관리</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, i) => (
              <tr key={m.id} className="border-b border-line/50 last:border-b-0">
                <td className="text-center text-sm text-ink-muted px-3 py-3 font-mono">
                  {i + 1}
                </td>
                {editing === m.id ? (
                  <>
                    <td colSpan={4} className="px-3 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <Field label="메뉴명">
                          <TextInput
                            value={draft.label ?? m.label}
                            onChange={(e) =>
                              setDraft((p) => ({ ...p, label: e.target.value }))
                            }
                          />
                        </Field>
                        <Field label="링크 경로">
                          <TextInput
                            value={draft.href ?? m.href}
                            onChange={(e) =>
                              setDraft((p) => ({ ...p, href: e.target.value }))
                            }
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
                      <div className="flex gap-1 mt-4">
                        <Button size="sm" onClick={() => save(m.id)}>
                          저장
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditing(null);
                            setDraft({});
                          }}
                        >
                          취소
                        </Button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-3">
                      <span
                        className={`font-semibold ${
                          m.isHidden ? "text-ink-muted line-through" : ""
                        }`}
                        style={{ letterSpacing: "-0.02em" }}
                      >
                        {m.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-ink-muted font-mono">
                      {m.href}
                    </td>
                    <td className="text-center px-3 py-3">
                      {m.isHidden ? (
                        <span className="text-xs px-2 py-1 bg-bg-alt rounded text-ink-muted">
                          숨김
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded">
                          표시
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex gap-1 justify-end flex-wrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => move(m.id, -1)}
                          disabled={i === 0}
                          title="위로"
                        >
                          ↑
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => move(m.id, 1)}
                          disabled={i === sorted.length - 1}
                          title="아래로"
                        >
                          ↓
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleHide(m.id)}
                        >
                          {m.isHidden ? "표시" : "숨김"}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditing(m.id);
                            setDraft({});
                          }}
                        >
                          수정
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => remove(m.id)}
                        >
                          삭제
                        </Button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

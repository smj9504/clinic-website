"use client";

import { useState } from "react";
import { useSiteDataForLocale } from "@/lib/useSiteData";
import { useAdminLocale } from "@/lib/adminLocale";
import { updateSiteData, syncImages, generateId, type MenuItem, type SiteData } from "@/lib/storage";
import {
  PageHeader,
  Field,
  TextInput,
  Button,
  Card,
  ImageInput,
  Toast,
} from "@/components/admin/ui";

/** 최상위 또는 자식(1단계) 메뉴 항목을 id로 찾아 patch를 적용한다 */
function updateMenuTree(menus: MenuItem[], id: string, patch: Partial<MenuItem>): MenuItem[] {
  return menus.map((m) => {
    if (m.id === id) return { ...m, ...patch };
    if (m.children?.some((c) => c.id === id)) {
      return {
        ...m,
        children: m.children.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      };
    }
    return m;
  });
}

export default function MenusAdminPage() {
  const { editingLocale } = useAdminLocale();
  const { menus, subPages } = useSiteDataForLocale(editingLocale);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<MenuItem>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [addingChildFor, setAddingChildFor] = useState<string | null>(null);
  const [newChild, setNewChild] = useState({ label: "", href: "" });

  const sorted = [...menus].sort((a, b) => a.sortOrder - b.sortOrder);
  const update = (fn: (data: SiteData) => SiteData) => updateSiteData(fn, editingLocale);
  const updateBoth = (fn: (data: SiteData) => SiteData) => {
    updateSiteData(fn, "ko");
    updateSiteData(fn, "en");
  };

  const save = async (id: string) => {
    const ok = await update((d) => ({
      ...d,
      menus: updateMenuTree(d.menus, id, draft),
    }));
    syncImages(editingLocale);
    setEditing(null);
    setDraft({});
    if (ok) setToast("메뉴가 저장되었습니다");
  };

  const toggleHide = (id: string, current: boolean) => {
    updateBoth((d) => ({
      ...d,
      menus: updateMenuTree(d.menus, id, { isHidden: !current }),
    }));
  };

  const move = (id: string, dir: -1 | 1) => {
    update((d) => {
      const list = [...d.menus].sort((a, b) => a.sortOrder - b.sortOrder);
      const idx = list.findIndex((m) => m.id === id);
      if (idx < 0) return d;
      const target = idx + dir;
      if (target < 0 || target >= list.length) return d;
      [list[idx], list[target]] = [list[target], list[idx]];
      const renumbered = list.map((m, i) => ({ ...m, sortOrder: i }));
      return { ...d, menus: renumbered };
    });
  };

  const moveChild = (parentId: string, childId: string, dir: -1 | 1) => {
    update((d) => ({
      ...d,
      menus: d.menus.map((m) => {
        if (m.id !== parentId || !m.children) return m;
        const list = [...m.children].sort((a, b) => a.sortOrder - b.sortOrder);
        const idx = list.findIndex((c) => c.id === childId);
        if (idx < 0) return m;
        const target = idx + dir;
        if (target < 0 || target >= list.length) return m;
        [list[idx], list[target]] = [list[target], list[idx]];
        return { ...m, children: list.map((c, i) => ({ ...c, sortOrder: i })) };
      }),
    }));
  };

  const addChild = async (parentId: string) => {
    if (!newChild.label.trim() || !newChild.href.trim()) {
      alert("메뉴명과 링크를 모두 입력하세요.");
      return;
    }
    const ok = await update((d) => ({
      ...d,
      menus: d.menus.map((m) => {
        if (m.id !== parentId) return m;
        const children = m.children ?? [];
        return {
          ...m,
          children: [
            ...children,
            {
              id: generateId("submenu"),
              label: newChild.label.trim(),
              href: newChild.href.trim(),
              isHidden: false,
              sortOrder: children.length,
            },
          ],
        };
      }),
    }));
    setNewChild({ label: "", href: "" });
    setAddingChildFor(null);
    if (ok) setToast("하위 메뉴가 추가되었습니다");
  };

  const deleteChild = async (parentId: string, childId: string) => {
    if (!confirm("이 하위 메뉴를 삭제하시겠습니까?")) return;
    const ok = await update((d) => ({
      ...d,
      menus: d.menus.map((m) => {
        if (m.id !== parentId || !m.children) return m;
        const remaining = m.children.filter((c) => c.id !== childId).map((c, i) => ({ ...c, sortOrder: i }));
        return { ...m, children: remaining };
      }),
    }));
    if (ok) setToast("하위 메뉴가 삭제되었습니다");
  };

  const subPageOptions = (subPages ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);

  const renderEditForm = (item: MenuItem, isChild: boolean) => (
    <div className="px-4 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Field label="메뉴명">
          <TextInput
            value={draft.label ?? item.label}
            onChange={(e) => setDraft((p) => ({ ...p, label: e.target.value }))}
          />
        </Field>
        <Field label="링크 경로">
          {isChild ? (
            <>
              <select
                className="w-full px-4 py-2.5 border border-line bg-surface rounded text-sm outline-none focus:border-accent transition-colors"
                style={{ letterSpacing: "-0.01em" }}
                value={draft.href ?? item.href}
                onChange={(e) => setDraft((p) => ({ ...p, href: e.target.value }))}
              >
                <option value={item.href}>{item.href} (현재)</option>
                {subPageOptions.map((sp) => (
                  <option key={sp.id} value={`/subpages/${sp.slug}`}>
                    /subpages/{sp.slug} — {sp.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-ink-muted mt-1">서브페이지 콘텐츠는 &quot;시술 페이지 관리&quot;에서 편집합니다.</p>
            </>
          ) : (
            <>
              <TextInput value={item.href} disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
              <p className="text-xs text-ink-muted mt-1">링크 경로는 변경할 수 없습니다.</p>
            </>
          )}
        </Field>
      </div>
      {!isChild && (
        <Field label="배너 이미지" hint="해당 페이지 상단에 표시되는 배경 이미지 (권장 1920×600)">
          <ImageInput
            value={draft.bannerImage ?? item.bannerImage ?? ""}
            onChange={(v) => setDraft((p) => ({ ...p, bannerImage: v }))}
            aspectRatio="16 / 5"
          />
        </Field>
      )}
      <div className="flex gap-2 mt-4">
        <Button size="sm" onClick={() => save(item.id)}>저장</Button>
        <Button size="sm" variant="secondary" onClick={() => { setEditing(null); setDraft({}); }}>취소</Button>
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        title="메뉴 관리"
        description="상단 네비게이션에 표시되는 메뉴를 관리합니다. 이름 변경, 순서 조정, 숨김 처리, 하위 메뉴 추가가 가능합니다."
      />

      <Card className="p-0 overflow-hidden">
        {sorted.map((m, i) => {
          const children = (m.children ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
          return (
            <div key={m.id} className="border-b border-line/50 last:border-b-0">
              {editing === m.id ? (
                renderEditForm(m, false)
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3">
                  <div className="flex items-center gap-2 min-w-0">
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
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end sm:justify-start shrink-0 pl-7 sm:pl-0">
                    <Button size="icon" variant="ghost" onClick={() => move(m.id, -1)} disabled={i === 0} title="위로">↑</Button>
                    <Button size="icon" variant="ghost" onClick={() => move(m.id, 1)} disabled={i === sorted.length - 1} title="아래로">↓</Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleHide(m.id, m.isHidden)}>{m.isHidden ? "표시" : "숨김"}</Button>
                    <Button size="sm" variant="secondary" onClick={() => { setEditing(m.id); setDraft({}); }}>수정</Button>
                  </div>
                </div>
              )}

              {/* 하위 메뉴 */}
              {(children.length > 0 || addingChildFor === m.id) && (
                <div className="pl-8 pr-4 pb-3 space-y-2">
                  {children.map((c, ci) => (
                    <div key={c.id} className="bg-bg-alt rounded border border-line/50">
                      {editing === c.id ? (
                        renderEditForm(c, true)
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2.5">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-xs text-ink-muted">└</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-sm font-medium ${c.isHidden ? "text-ink-muted line-through" : ""}`}
                                  style={{ letterSpacing: "-0.02em" }}
                                >
                                  {c.label}
                                </span>
                                {c.isHidden && (
                                  <span className="text-xs px-1.5 py-0.5 bg-bg rounded text-ink-muted">숨김</span>
                                )}
                              </div>
                              <div className="text-xs text-ink-muted font-mono mt-0.5 truncate">{c.href}</div>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-wrap justify-end shrink-0">
                            <Button size="icon" variant="ghost" onClick={() => moveChild(m.id, c.id, -1)} disabled={ci === 0} title="위로">↑</Button>
                            <Button size="icon" variant="ghost" onClick={() => moveChild(m.id, c.id, 1)} disabled={ci === children.length - 1} title="아래로">↓</Button>
                            <Button size="sm" variant="ghost" onClick={() => toggleHide(c.id, c.isHidden)}>{c.isHidden ? "표시" : "숨김"}</Button>
                            <Button size="sm" variant="secondary" onClick={() => { setEditing(c.id); setDraft({}); }}>수정</Button>
                            <Button size="sm" variant="danger" onClick={() => deleteChild(m.id, c.id)}>삭제</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {addingChildFor === m.id ? (
                    <div className="bg-bg-alt rounded border border-line/50 p-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <TextInput
                          placeholder="메뉴명 (예: 리프팅)"
                          value={newChild.label}
                          onChange={(e) => setNewChild((p) => ({ ...p, label: e.target.value }))}
                        />
                        <select
                          className="w-full px-4 py-2.5 border border-line bg-surface rounded text-sm outline-none focus:border-accent transition-colors"
                          value={newChild.href}
                          onChange={(e) => setNewChild((p) => ({ ...p, href: e.target.value }))}
                        >
                          <option value="">링크 경로 선택</option>
                          {subPageOptions.map((sp) => (
                            <option key={sp.id} value={`/subpages/${sp.slug}`}>
                              /subpages/{sp.slug} — {sp.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => addChild(m.id)}>추가</Button>
                        <Button size="sm" variant="secondary" onClick={() => { setAddingChildFor(null); setNewChild({ label: "", href: "" }); }}>취소</Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
              {addingChildFor !== m.id && (
                <div className="pl-8 pr-4 pb-3">
                  <Button size="sm" variant="ghost" onClick={() => setAddingChildFor(m.id)}>
                    + 하위 메뉴 추가
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </Card>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

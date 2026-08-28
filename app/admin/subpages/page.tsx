"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSiteDataForLocale } from "@/lib/useSiteData";
import { useAdminLocale } from "@/lib/adminLocale";
import { updateSiteData, generateId, type SiteData } from "@/lib/storage";
import { PageHeader, Button, Card, Toast } from "@/components/admin/ui";

const GROUPS: { parentMenuId: string; title: string }[] = [
  { parentMenuId: "m7", title: "피부미용" },
  { parentMenuId: "m8", title: "한방치료" },
];

export default function SubPagesAdminPage() {
  const router = useRouter();
  const { editingLocale } = useAdminLocale();
  const { subPages } = useSiteDataForLocale(editingLocale);
  const [toast, setToast] = useState<string | null>(null);

  const items = subPages ?? [];
  const update = (fn: (data: SiteData) => SiteData) => updateSiteData(fn, editingLocale);

  const addPage = async (parentMenuId: string) => {
    const id = generateId("sp");
    const groupItems = items.filter((sp) => sp.parentMenuId === parentMenuId);
    const ok = await update((d) => ({
      ...d,
      subPages: [
        ...(d.subPages ?? []),
        {
          id,
          slug: id,
          parentMenuId,
          title: "새 시술 페이지",
          intro: "",
          body: "",
          image: "",
          isHidden: true,
          sortOrder: groupItems.length,
        },
      ],
    }));
    if (ok) router.push(`/admin/subpages/${id}`);
  };

  const removePage = async (id: string) => {
    if (!confirm("이 시술 페이지를 삭제하시겠습니까?")) return;
    const ok = await update((d) => ({
      ...d,
      subPages: (d.subPages ?? []).filter((sp) => sp.id !== id),
    }));
    if (ok) setToast("페이지가 삭제되었습니다");
  };

  const toggleHide = async (id: string, current: boolean) => {
    await update((d) => ({
      ...d,
      subPages: (d.subPages ?? []).map((sp) => (sp.id === id ? { ...sp, isHidden: !current } : sp)),
    }));
  };

  return (
    <>
      <PageHeader
        title="시술 페이지 관리"
        description="피부미용·한방치료 하위 메뉴에 연결되는 콘텐츠 페이지를 관리합니다. '수정'을 눌러 제목, 본문, 이미지를 편집하세요."
      />

      {GROUPS.map((group) => {
        const groupItems = items
          .filter((sp) => sp.parentMenuId === group.parentMenuId)
          .sort((a, b) => a.sortOrder - b.sortOrder);

        return (
          <Card key={group.parentMenuId} className="p-0 overflow-hidden mb-6">
            <div className="px-5 py-3 border-b border-line bg-bg-alt flex items-center justify-between">
              <h3 className="font-semibold text-sm" style={{ letterSpacing: "-0.02em" }}>{group.title}</h3>
              <Button size="sm" onClick={() => addPage(group.parentMenuId)}>+ 새 시술 페이지 추가</Button>
            </div>
            {groupItems.length === 0 && (
              <div className="px-5 py-6 text-sm text-ink-muted">
                등록된 시술 페이지가 없습니다. &quot;새 시술 페이지 추가&quot;로 첫 항목을 만들어 보세요.
              </div>
            )}
            {groupItems.map((sp) => (
              <div
                key={sp.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3 border-b border-line/50 last:border-b-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-semibold text-sm ${sp.isHidden ? "text-ink-muted line-through" : ""}`}
                      style={{ letterSpacing: "-0.02em" }}
                    >
                      {sp.title}
                    </span>
                    {sp.isHidden ? (
                      <span className="text-xs px-1.5 py-0.5 bg-bg-alt rounded text-ink-muted">숨김</span>
                    ) : (
                      <span className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 rounded">표시</span>
                    )}
                    {!sp.body && (
                      <span className="text-xs px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded">본문 없음</span>
                    )}
                    {!sp.image && (
                      <span className="text-xs px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded">이미지 없음</span>
                    )}
                  </div>
                  <div className="text-xs text-ink-muted font-mono mt-0.5 truncate">/subpages/{sp.slug}</div>
                </div>
                <div className="flex gap-1 flex-wrap justify-end sm:justify-start shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => toggleHide(sp.id, sp.isHidden)}>
                    {sp.isHidden ? "표시" : "숨김"}
                  </Button>
                  <Link
                    href={`/admin/subpages/${sp.id}`}
                    className="inline-flex items-center gap-1.5 rounded font-semibold transition-colors border border-line bg-surface text-ink hover:bg-bg-alt px-3 py-1.5 text-xs"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    수정
                  </Link>
                  <Button size="sm" variant="danger" onClick={() => removePage(sp.id)}>삭제</Button>
                </div>
              </div>
            ))}
          </Card>
        );
      })}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

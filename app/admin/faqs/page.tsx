"use client";

import { useState } from "react";
import { useSiteDataForLocale } from "@/lib/useSiteData";
import { useAdminLocale } from "@/lib/adminLocale";
import { updateSiteData, generateId, type FaqItem } from "@/lib/storage";
import {
  PageHeader,
  Field,
  TextInput,
  TextArea,
  Button,
  Card,
  Toast,
} from "@/components/admin/ui";

const emptyFaq: Omit<FaqItem, "id" | "sortOrder"> = {
  category: "진료",
  question: "",
  answer: "",
};

export default function FaqsAdminPage() {
  const { editingLocale } = useAdminLocale();
  const { faqs } = useSiteDataForLocale(editingLocale);
  const update: typeof updateSiteData = (fn) => updateSiteData(fn, editingLocale);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Omit<FaqItem, "id" | "sortOrder">>(emptyFaq);
  const [toast, setToast] = useState<string | null>(null);

  const sorted = [...faqs].sort((a, b) => a.sortOrder - b.sortOrder);

  const startEdit = (f: FaqItem) => {
    setEditing(f.id);
    setDraft({ category: f.category, question: f.question, answer: f.answer });
  };

  const startNew = () => {
    setEditing("new");
    setDraft(emptyFaq);
  };

  const save = () => {
    if (!draft.question.trim() || !draft.answer.trim()) {
      alert("질문과 답변을 모두 입력하세요.");
      return;
    }
    update((d) => {
      if (editing === "new") {
        return {
          ...d,
          faqs: [
            ...d.faqs,
            { ...draft, id: generateId("faq"), sortOrder: d.faqs.length },
          ],
        };
      }
      return {
        ...d,
        faqs: d.faqs.map((f) => (f.id === editing ? { ...f, ...draft } : f)),
      };
    });
    setEditing(null);
    setToast(editing === "new" ? "FAQ가 추가되었습니다" : "FAQ가 저장되었습니다");
  };

  const remove = (id: string) => {
    if (!confirm("이 FAQ를 삭제하시겠습니까?")) return;
    update((d) => ({ ...d, faqs: d.faqs.filter((f) => f.id !== id) }));
    setToast("FAQ가 삭제되었습니다");
  };

  const move = (id: string, dir: -1 | 1) => {
    update((d) => {
      const list = [...d.faqs].sort((a, b) => a.sortOrder - b.sortOrder);
      const idx = list.findIndex((f) => f.id === id);
      const target = idx + dir;
      if (target < 0 || target >= list.length) return d;
      [list[idx], list[target]] = [list[target], list[idx]];
      return { ...d, faqs: list.map((f, i) => ({ ...f, sortOrder: i })) };
    });
  };

  return (
    <>
      <PageHeader
        title="FAQ 관리"
        description="자주 묻는 질문을 관리합니다. 챗봇 위젯에서도 자동으로 사용됩니다."
        actions={
          <Button onClick={startNew} variant="primary" disabled={editing !== null}>
            + FAQ 추가
          </Button>
        }
      />

      {editing !== null && (
        <Card className="mb-6 border-accent">
          <h3 className="font-semibold mb-4" style={{ letterSpacing: "-0.02em" }}>
            {editing === "new" ? "새 FAQ 추가" : "FAQ 수정"}
          </h3>
          <Field label="카테고리" hint="예: 진료, 예약, 이용, 보험">
            <TextInput
              value={draft.category}
              onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value }))}
            />
          </Field>
          <Field label="질문">
            <TextInput
              value={draft.question}
              onChange={(e) => setDraft((p) => ({ ...p, question: e.target.value }))}
              placeholder="예: 진료 시간이 어떻게 되나요?"
            />
          </Field>
          <Field label="답변">
            <TextArea
              value={draft.answer}
              onChange={(e) => setDraft((p) => ({ ...p, answer: e.target.value }))}
              rows={5}
            />
          </Field>
          <div className="flex gap-2 mt-2">
            <Button onClick={save}>저장</Button>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              취소
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {sorted.map((f, i) => (
          <Card key={f.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-xs px-2 py-0.5 bg-bg-alt rounded-sm text-ink-soft font-semibold"
                    style={{ letterSpacing: "0.05em" }}
                  >
                    {f.category}
                  </span>
                </div>
                <h3
                  className="font-semibold mb-2"
                  style={{ letterSpacing: "-0.025em" }}
                >
                  Q. {f.question}
                </h3>
                <p
                  className="text-sm text-ink-soft"
                  style={{ lineHeight: 1.7, letterSpacing: "-0.01em" }}
                >
                  A. {f.answer}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => move(f.id, -1)}
                  disabled={i === 0}
                >
                  ↑
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => move(f.id, 1)}
                  disabled={i === sorted.length - 1}
                >
                  ↓
                </Button>
                <Button size="sm" variant="secondary" onClick={() => startEdit(f)}>
                  수정
                </Button>
                <Button size="sm" variant="danger" onClick={() => remove(f.id)}>
                  삭제
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {sorted.length === 0 && (
          <Card className="text-center py-12 text-ink-muted">
            등록된 FAQ가 없습니다.
          </Card>
        )}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

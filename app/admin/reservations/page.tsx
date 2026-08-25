"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Button, TextArea } from "@/components/admin/ui";
import {
  fetchReservationRequests,
  updateReservationStatus,
  updateReservationNote,
  deleteReservationRequest,
} from "@/lib/reservationsApi";
import type { ReservationRequest, ReservationStatus } from "@/lib/reservations";

const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: "확인 대기",
  confirmed: "확정 처리됨",
  cancelled: "취소됨",
};

const STATUS_CLASS: Record<ReservationStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-neutral-200 text-neutral-600",
};

export default function ReservationsAdminPage() {
  const [reservations, setReservations] = useState<ReservationRequest[] | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<ReservationStatus | "all">("pending");

  const load = async () => {
    const res = await fetchReservationRequests();
    if (res) {
      setReservations(res.reservations);
      setSetupRequired(!!res.setupRequired);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id: string, status: ReservationStatus) => {
    const updated = await updateReservationStatus(id, status);
    if (updated) {
      setReservations((prev) => prev?.map((r) => (r.id === id ? updated : r)) ?? prev);
    }
  };

  const saveNote = async (id: string) => {
    const note = noteDrafts[id];
    if (note === undefined) return;
    const updated = await updateReservationNote(id, note);
    if (updated) {
      setReservations((prev) => prev?.map((r) => (r.id === id ? updated : r)) ?? prev);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("이 예약 신청을 삭제하시겠습니까?")) return;
    const ok = await deleteReservationRequest(id);
    if (ok) {
      setReservations((prev) => prev?.filter((r) => r.id !== id) ?? prev);
    }
  };

  if (setupRequired) {
    return (
      <>
        <PageHeader title="예약 신청 관리" description="환자가 홈페이지에서 신청한 예약을 확인·처리합니다." />
        <Card className="text-center py-12">
          <p className="text-ink-soft mb-2">예약 신청 테이블이 아직 생성되지 않았습니다.</p>
          <p className="text-sm text-ink-muted">
            Supabase SQL Editor에서 <code className="px-1.5 py-0.5 bg-bg-alt rounded">supabase-reservations.sql</code>을
            실행해 주세요.
          </p>
        </Card>
      </>
    );
  }

  const list = reservations ?? [];
  const filtered = filter === "all" ? list : list.filter((r) => r.status === filter);
  const pendingCount = list.filter((r) => r.status === "pending").length;

  return (
    <>
      <PageHeader
        title="예약 신청 관리"
        description="환자가 홈페이지에서 신청한 예약을 확인하고, 병원 시스템에 등록한 뒤 상태를 처리하세요."
      />

      <div className="flex gap-2 mb-6 flex-wrap">
        {(["pending", "confirmed", "cancelled", "all"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? "primary" : "secondary"}
            onClick={() => setFilter(s)}
          >
            {s === "all" ? "전체" : STATUS_LABEL[s]}
            {s === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-[240px]">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-sm font-semibold ${STATUS_CLASS[r.status]}`}
                    style={{ letterSpacing: "0.02em" }}
                  >
                    {STATUS_LABEL[r.status]}
                  </span>
                  <span className="text-xs text-ink-muted">
                    신청일 {new Date(r.createdAt).toLocaleString("ko-KR")}
                  </span>
                </div>
                <h3 className="font-semibold mb-1" style={{ letterSpacing: "-0.02em" }}>
                  {r.name} · {r.phone}
                </h3>
                <p className="text-sm text-ink-soft mb-1">
                  희망 일시: {r.desiredDate}
                  {r.desiredTime ? ` (${r.desiredTime})` : ""}
                </p>
                {r.memo && (
                  <p className="text-sm text-ink-muted mt-2" style={{ lineHeight: 1.7, whiteSpace: "pre-line" }}>
                    {r.memo}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5 shrink-0">
                {r.status !== "confirmed" && (
                  <Button size="sm" onClick={() => setStatus(r.id, "confirmed")}>
                    확정 처리
                  </Button>
                )}
                {r.status !== "cancelled" && (
                  <Button size="sm" variant="secondary" onClick={() => setStatus(r.id, "cancelled")}>
                    취소 처리
                  </Button>
                )}
                {r.status !== "pending" && (
                  <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, "pending")}>
                    대기로 되돌리기
                  </Button>
                )}
                <Button size="sm" variant="danger" onClick={() => remove(r.id)}>
                  삭제
                </Button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-line">
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">내부 메모</label>
              <div className="flex gap-2">
                <TextArea
                  value={noteDrafts[r.id] ?? r.adminNote}
                  onChange={(e) => setNoteDrafts((p) => ({ ...p, [r.id]: e.target.value }))}
                  rows={2}
                  placeholder="예: 병원 시스템에 등록 완료, 환자와 통화하여 시간 조정 등"
                />
                <Button size="sm" variant="secondary" onClick={() => saveNote(r.id)} className="self-start">
                  저장
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {reservations !== null && filtered.length === 0 && (
          <Card className="text-center py-12 text-ink-muted">해당 상태의 예약 신청이 없습니다.</Card>
        )}
      </div>
    </>
  );
}

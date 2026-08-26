"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader, Card, Button, TextArea, Field, TextInput } from "@/components/admin/ui";
import {
  fetchReservationRequests,
  updateReservationStatus,
  updateReservationNote,
  deleteReservationRequest,
} from "@/lib/reservationsApi";
import { isValidSigmaDateTime, type ReservationRequest, type ReservationStatus } from "@/lib/reservations";
import { formatKRW } from "@/lib/price";

/** "2026-09-01" → "2026-09" — 월별 필터 키 */
function monthKey(desiredDate: string): string {
  return desiredDate.slice(0, 7);
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  return `${y}년 ${Number(m)}월`;
}

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
  const [monthFilter, setMonthFilter] = useState<string | "all">("all");
  const [noteOpenIds, setNoteOpenIds] = useState<Set<string>>(new Set());

  // "확정 처리"는 시그마(한의원 내부 예약 시스템)에 정확한 예약 일시를
  // 전달해야 하므로, 클릭 즉시 PATCH하지 않고 그 카드 안에 일시 입력
  // UI를 펼친다. confirmingId가 세팅된 카드만 입력 UI를 보여준다.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [reservationDtDrafts, setReservationDtDrafts] = useState<Record<string, string>>({});
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

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

  const startConfirming = (r: ReservationRequest) => {
    setConfirmError(null);
    setConfirmingId(r.id);
    // 기존 값이 있으면(재확정 등) 그대로, 없으면 신청자가 남긴 희망 날짜를 기본값으로 제시한다.
    setReservationDtDrafts((prev) => ({
      ...prev,
      [r.id]: prev[r.id] ?? (r.sigmaReservationDt || `${r.desiredDate} `),
    }));
  };

  const cancelConfirming = () => {
    setConfirmingId(null);
    setConfirmError(null);
  };

  const submitConfirm = async (id: string) => {
    const reservationDt = (reservationDtDrafts[id] ?? "").trim();
    if (!isValidSigmaDateTime(reservationDt)) {
      setConfirmError("예약 일시는 YYYY-MM-DD HH:MM 형식으로 입력해 주세요. (예: 2026-09-01 14:30)");
      return;
    }
    setConfirmError(null);
    setConfirming(true);
    const updated = await updateReservationStatus(id, "confirmed", reservationDt);
    setConfirming(false);
    if (updated) {
      setReservations((prev) => prev?.map((r) => (r.id === id ? updated : r)) ?? prev);
      setConfirmingId(null);
    }
    // 실패 시에는 request() 헬퍼가 이미 전역 에러 토스트를 띄운다
    // (lib/reservationsApi.ts의 notifyError) — 여기서 별도 처리 불필요.
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

  const toggleNoteOpen = (id: string) => {
    setNoteOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (setupRequired) {
    return (
      <>
        <PageHeader title="예약 신청 관리" description="환자가 홈페이지에서 신청한 예약을 확인·처리합니다." />
        <Card className="text-center py-12">
          <p className="text-ink-soft mb-2">예약 신청 테이블이 아직 생성되지 않았습니다.</p>
          <p className="text-sm text-ink-muted">
            Supabase SQL Editor에서 <code className="px-1.5 py-0.5 bg-bg-alt rounded">supabase-schema.sql</code>을
            실행해 주세요.
          </p>
        </Card>
      </>
    );
  }

  const list = reservations ?? [];
  const pendingCount = list.filter((r) => r.status === "pending").length;

  const months = useMemo(() => {
    const keys = new Set(list.map((r) => monthKey(r.desiredDate)).filter(Boolean));
    return [...keys].sort((a, b) => b.localeCompare(a));
  }, [list]);

  const byStatus = filter === "all" ? list : list.filter((r) => r.status === filter);
  const filtered =
    monthFilter === "all" ? byStatus : byStatus.filter((r) => monthKey(r.desiredDate) === monthFilter);

  return (
    <>
      <PageHeader
        title="예약 신청 관리"
        description="환자가 홈페이지에서 신청한 예약을 확인하고, 병원 시스템에 등록한 뒤 상태를 처리하세요."
      />

      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex gap-2 flex-wrap">
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

        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-line bg-surface rounded outline-none focus:border-accent transition-colors"
          style={{ letterSpacing: "-0.01em" }}
          aria-label="희망 월 필터"
        >
          <option value="all">전체 기간</option>
          {months.map((key) => (
            <option key={key} value={key}>
              {monthLabel(key)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const hasNote = !!(noteDrafts[r.id] ?? r.adminNote);
          const noteOpen = noteOpenIds.has(r.id) || hasNote;

          return (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between gap-5 flex-wrap">
                <div className="flex-1 min-w-[240px]">
                  <div className="flex items-center gap-2 mb-2.5 flex-wrap">
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
                  <h3 className="font-semibold mb-1.5" style={{ letterSpacing: "-0.02em", fontSize: "1.0625rem" }}>
                    {r.name} <span className="text-ink-muted font-normal">· {r.phone}</span>
                  </h3>
                  <p className="text-sm text-ink-soft">
                    희망 일시: {r.desiredDate}
                    {r.desiredTime ? ` (${r.desiredTime})` : ""}
                  </p>
                  {r.sigmaReservationDt && (
                    <p className="text-sm text-accent mt-0.5">
                      확정 일시: {r.sigmaReservationDt} (병원 시스템 등록됨)
                    </p>
                  )}
                  {r.memo && (
                    <p className="text-sm text-ink-muted mt-2.5" style={{ lineHeight: 1.7, whiteSpace: "pre-line" }}>
                      {r.memo}
                    </p>
                  )}
                  {r.selectedServices.length > 0 && (
                    <div className="mt-3.5 pt-3.5 border-t border-line">
                      <p className="text-xs font-semibold text-ink-muted mb-1.5" style={{ letterSpacing: "0.02em" }}>
                        선택 시술 {r.selectedServices.length}개
                      </p>
                      <ul className="space-y-1">
                        {r.selectedServices.map((item) => (
                          <li
                            key={`${item.serviceId}_${item.priceId}`}
                            className="flex items-baseline justify-between gap-3 text-sm"
                          >
                            <span className="text-ink-soft truncate">
                              {item.serviceName}
                              {item.priceLabel && <span className="text-ink-muted"> · {item.priceLabel}</span>}
                            </span>
                            <span
                              className="font-semibold shrink-0"
                              style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                              {formatKRW(item.finalPrice)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-stretch gap-2 shrink-0 w-32">
                  <div className="flex flex-col gap-1.5">
                    {r.status !== "confirmed" && (
                      <Button size="sm" onClick={() => startConfirming(r)}>
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
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(r.id)}
                    className="text-red-600 hover:bg-red-50 mt-1 pt-1.5 border-t border-line"
                  >
                    삭제
                  </Button>
                </div>
              </div>

              {confirmingId === r.id && (
                <div className="mt-4 pt-4 border-t border-line bg-bg-alt -mx-5 px-5 pb-1">
                  <Field
                    label="확정 예약 일시 (병원 시스템에 등록할 정확한 시각)"
                    hint="YYYY-MM-DD HH:MM 형식 — 예: 2026-09-01 14:30"
                  >
                    <div className="flex gap-2">
                      <TextInput
                        value={reservationDtDrafts[r.id] ?? ""}
                        onChange={(e) =>
                          setReservationDtDrafts((p) => ({ ...p, [r.id]: e.target.value }))
                        }
                        placeholder="2026-09-01 14:30"
                      />
                      <Button size="sm" onClick={() => submitConfirm(r.id)} disabled={confirming}>
                        {confirming ? "확정 중..." : "확정 확인"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelConfirming} disabled={confirming}>
                        취소
                      </Button>
                    </div>
                  </Field>
                  {confirmError && (
                    <p className="text-sm text-red-600 -mt-3 mb-2" role="alert">
                      {confirmError}
                    </p>
                  )}
                  <p className="text-xs text-ink-muted -mt-3 mb-2">
                    확정하면 이 일시로 한의원 예약 시스템(시그마)에 실제 예약이 생성되고, 병원 시스템이
                    환자에게 확정 문자를 자동으로 보냅니다.
                  </p>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-line">
                {noteOpen ? (
                  <>
                    <label className="block text-xs font-semibold text-ink-muted mb-1.5">내부 메모</label>
                    <div className="flex gap-2">
                      <TextArea
                        value={noteDrafts[r.id] ?? r.adminNote}
                        onChange={(e) => setNoteDrafts((p) => ({ ...p, [r.id]: e.target.value }))}
                        rows={2}
                        placeholder="예: 병원 시스템에 등록 완료, 환자와 통화하여 시간 조정 등"
                        autoFocus={noteOpenIds.has(r.id) && !hasNote}
                      />
                      <Button size="sm" variant="secondary" onClick={() => saveNote(r.id)} className="self-start">
                        저장
                      </Button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleNoteOpen(r.id)}
                    className="text-xs text-ink-muted hover:text-ink transition-colors"
                  >
                    + 내부 메모 추가
                  </button>
                )}
              </div>
            </Card>
          );
        })}

        {reservations !== null && filtered.length === 0 && (
          <Card className="text-center py-12 text-ink-muted">해당 조건의 예약 신청이 없습니다.</Card>
        )}
      </div>
    </>
  );
}

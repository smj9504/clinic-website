"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader, Card, Button, TextArea, Field, TextInput } from "@/components/admin/ui";
import {
  fetchReservationRequests,
  updateReservationStatus,
  updateReservationNote,
  deleteReservationRequest,
  syncReservationsWithSigma,
  fetchReservationSyncLogs,
  type ReservationSyncLogRow,
} from "@/lib/reservationsApi";
import { isValidSigmaDateTime, type ReservationRequest, type ReservationStatus } from "@/lib/reservations";
import { formatKRW } from "@/lib/price";
import { useSiteData } from "@/lib/useSiteData";
import ReservationSlotPicker from "@/components/admin/ReservationSlotPicker";

/** "YYYY-MM-DD HH:MM" → { date, time } — 슬롯 피커의 초기값으로 쓰기 위해 분리한다 */
function splitReservationDt(value: string): { date: string; time?: string } {
  const [date, time] = value.trim().split(" ");
  return { date: date || "", time: time || undefined };
}

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
  return (
    <Suspense fallback={null}>
      <ReservationsAdminPageInner />
    </Suspense>
  );
}

function ReservationsAdminPageInner() {
  const { clinicInfo } = useSiteData();
  const searchParams = useSearchParams();
  const focusId = searchParams.get("id");
  const [reservations, setReservations] = useState<ReservationRequest[] | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  // 이메일 알림의 "이 예약 확정 처리하기" 링크(?id=...)로 들어온 경우, 목록
  // 필터가 "확인 대기"로 좁혀져 있으면 해당 예약이 다른 상태(이미 처리됨)일 때
  // 화면에서 사라져 보인다 — 그 링크로 들어온 세션에서만 필터를 "전체"로 넓힌다.
  const [filter, setFilter] = useState<ReservationStatus | "all">(focusId ? "all" : "pending");
  const [monthFilter, setMonthFilter] = useState<string | "all">("all");
  const [noteOpenIds, setNoteOpenIds] = useState<Set<string>>(new Set());
  const focusedRef = useRef<HTMLDivElement | null>(null);
  const [didAutoFocus, setDidAutoFocus] = useState(false);

  // "확정 처리"는 시그마(한의원 내부 예약 시스템)에 정확한 예약 일시를
  // 전달해야 하므로, 클릭 즉시 PATCH하지 않고 그 카드 안에 일시 입력
  // UI를 펼친다. confirmingId가 세팅된 카드만 입력 UI를 보여준다.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [reservationDtDrafts, setReservationDtDrafts] = useState<Record<string, string>>({});
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  // 시그마(병원 내부 시스템) 상태 동기화 — 진료시간 중 30분마다 자동 실행되고
  // (app/instrumentation.ts), 관리자가 이 버튼으로 즉시 1회 더 돌릴 수도 있다.
  const [syncLogs, setSyncLogs] = useState<ReservationSyncLogRow[] | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncLogOpen, setSyncLogOpen] = useState(false);

  const load = async () => {
    const res = await fetchReservationRequests();
    if (res) {
      setReservations(res.reservations);
      setSetupRequired(!!res.setupRequired);
    }
  };

  const loadSyncLogs = async () => {
    const res = await fetchReservationSyncLogs();
    if (res) setSyncLogs(res.logs);
  };

  useEffect(() => {
    load();
    loadSyncLogs();
  }, []);

  const runSync = async () => {
    setSyncing(true);
    const res = await syncReservationsWithSigma();
    setSyncing(false);
    if (res) {
      setReservations(res.reservations);
      await loadSyncLogs();
    }
  };

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

  // 이메일 알림의 "이 예약 확정 처리하기" 링크로 들어온 경우, 목록 로드가
  // 끝나면 해당 카드로 스크롤하고 — 아직 대기 중이면 확정 일시 입력 UI까지
  // 자동으로 펼쳐 관리자가 바로 확정 처리할 수 있게 한다. 한 세션에서 한
  // 번만 수행한다(didAutoFocus) — 이후 목록이 갱신될 때마다 다시 스크롤·
  // 재오픈되는 것을 막기 위함이다.
  useEffect(() => {
    if (!focusId || didAutoFocus || !reservations) return;
    const target = reservations.find((r) => r.id === focusId);
    if (!target) return;
    setDidAutoFocus(true);
    if (target.status === "pending") startConfirming(target);
    requestAnimationFrame(() => {
      focusedRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, didAutoFocus, reservations]);

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

      {!setupRequired && (
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold" style={{ letterSpacing: "-0.01em" }}>
                병원 시스템(시그마) 동기화
              </p>
              <p className="text-xs text-ink-muted mt-1">
                진료시간 중 30분마다 자동으로 확정 예약 상태를 병원 시스템과 대조합니다. 병원에서 직접
                취소·변경한 예약이 있으면 여기서도 취소로 반영됩니다.
                {syncLogs && syncLogs.length > 0 && (
                  <>
                    {" "}
                    최근 실행: {new Date(syncLogs[0].created_at).toLocaleString("ko-KR")} (확인{" "}
                    {syncLogs[0].checked_count}건, 변경 {syncLogs[0].updated_count}건
                    {syncLogs[0].error_count > 0 ? `, 오류 ${syncLogs[0].error_count}건` : ""})
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="ghost" onClick={() => setSyncLogOpen((v) => !v)}>
                {syncLogOpen ? "이력 닫기" : "이력 보기"}
              </Button>
              <Button size="sm" variant="secondary" onClick={runSync} disabled={syncing}>
                {syncing ? "동기화 중..." : "지금 동기화"}
              </Button>
            </div>
          </div>

          {syncLogOpen && (
            <div className="mt-4 pt-4 border-t border-line">
              {!syncLogs || syncLogs.length === 0 ? (
                <p className="text-sm text-ink-muted">아직 실행 이력이 없습니다.</p>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {syncLogs.map((log) => (
                    <li key={log.id} className="text-sm">
                      <div className="flex items-center gap-2 flex-wrap text-ink-soft">
                        <span className="text-xs text-ink-muted">
                          {new Date(log.created_at).toLocaleString("ko-KR")}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded-sm bg-bg-alt text-ink-muted">
                          {log.trigger === "manual" ? "수동" : "자동"}
                        </span>
                        <span>
                          확인 {log.checked_count}건 · 변경 {log.updated_count}건
                          {log.error_count > 0 ? ` · 오류 ${log.error_count}건` : ""}
                        </span>
                      </div>
                      {log.details.length > 0 && (
                        <ul className="mt-1 ml-1 pl-3 border-l border-line space-y-0.5">
                          {log.details.map((d, i) => (
                            <li key={`${log.id}_${i}`} className="text-xs text-ink-muted">
                              {d.name} ({d.sigmaReservationDt}) —{" "}
                              {d.reason === "cancelled_in_sigma"
                                ? "병원 시스템에서 취소 확인됨 → 취소 처리"
                                : "병원 시스템 조회 실패"}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card>
      )}

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
          const isFocused = focusId === r.id;

          return (
            <div key={r.id} ref={isFocused ? focusedRef : undefined}>
            <Card
              className={`p-5 ${isFocused ? "ring-2 ring-accent" : ""}`}
            >
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
                  <Field label="확정 예약 일시 (병원 시스템에 등록할 정확한 시각)">
                    {(() => {
                      const { date, time } = splitReservationDt(reservationDtDrafts[r.id] ?? r.desiredDate);
                      return (
                        <ReservationSlotPicker
                          initialDate={date}
                          initialTime={time}
                          clinicHours={clinicInfo.hours}
                          onChange={(reservationDt) =>
                            setReservationDtDrafts((p) => ({ ...p, [r.id]: reservationDt ?? "" }))
                          }
                        />
                      );
                    })()}
                  </Field>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={() => submitConfirm(r.id)} disabled={confirming}>
                      {confirming ? "확정 중..." : "확정 확인"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelConfirming} disabled={confirming}>
                      취소
                    </Button>
                  </div>
                  {confirmError && (
                    <p className="text-sm text-red-600 mt-2" role="alert">
                      {confirmError}
                    </p>
                  )}
                  <p className="text-xs text-ink-muted mt-2">
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
            </div>
          );
        })}

        {reservations !== null && filtered.length === 0 && (
          <Card className="text-center py-12 text-ink-muted">해당 조건의 예약 신청이 없습니다.</Card>
        )}
      </div>
    </>
  );
}

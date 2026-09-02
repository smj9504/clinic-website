import { NextRequest, NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/adminAuth";
import { listSigmaReservations } from "@/lib/sigma";

export const dynamic = "force-dynamic";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/admin/available-slots?date=YYYY-MM-DD — 관리자 전용
 * Header: x-admin-password
 *
 * 시그마(한의원 내부 예약 시스템)에서 해당 날짜에 이미 잡혀 있는 예약
 * 시각을 조회해, 관리자가 확정 처리 시 시간 슬롯 그리드에서 "예약됨"
 * 표시를 할 수 있게 한다(app/admin/reservations/page.tsx).
 *
 * 시그마 조회가 실패해도 200으로 응답하고 upstreamFailed: true만 표시한다
 * — 병원 내부망 서버 특성상 연결이 끊길 수 있는데, 그렇다고 관리자가
 * 확정 처리 자체를 못 하게 막으면 안 된다(진료 업무가 이 화면에 막혀선
 * 안 됨). 프런트는 이 플래그를 보고 "조회 실패, 제한 없이 표시"로
 * 폴백한다.
 */
export async function GET(request: NextRequest) {
  const denied = await requireAdminRequest(request);
  if (denied) return denied;

  const date = request.nextUrl.searchParams.get("date")?.trim();
  if (!date || !DATE_PATTERN.test(date)) {
    return NextResponse.json({ error: "date는 YYYY-MM-DD 형식으로 입력해주세요." }, { status: 400 });
  }

  if (!process.env.SIGMA_API_BASE_URL || !process.env.SIGMA_API_KEY) {
    return NextResponse.json({ bookedTimes: [], upstreamFailed: true });
  }

  const result = await listSigmaReservations(date);
  if (!result.ok) {
    console.error(`[available-slots] 시그마 조회 실패: ${result.error}`);
    return NextResponse.json({ bookedTimes: [], upstreamFailed: true });
  }

  // "YYYY-MM-DD HH:MM" → "HH:MM"만 추린다. 형식이 예상과 다른 항목은 조용히 건너뛴다.
  const bookedTimes = result.reservations
    .map((r) => r.reservationDt.split(" ")[1])
    .filter((time): time is string => Boolean(time && /^\d{2}:\d{2}$/.test(time)));

  return NextResponse.json({ bookedTimes });
}

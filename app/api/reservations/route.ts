import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/reservations
 *
 * 원내 예약 서버(POST /external/v2/reservations)로 예약 생성을 중계한다.
 * 브라우저는 이 라우트만 호출하므로 API 키가 클라이언트로 노출되지 않는다.
 *
 * 필요한 환경변수 (Vercel 프로젝트 설정에 등록):
 *   RESERVATION_API_BASE_URL  예) https://api.example.com   ← 외부에서 접근 가능한 주소여야 함
 *   RESERVATION_API_KEY       예) sigma_...
 */

const UPSTREAM_PATH = "/external/v2/reservations";
const UPSTREAM_TIMEOUT_MS = 15_000;

/** 문서상 형식: YYYY-MM-DD HH:MM */
const RESERVATION_DT_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

/**
 * 최소한의 스팸 방어. Vercel은 인스턴스마다 메모리가 분리되고 수시로 재생성되므로
 * 이 카운터는 "같은 인스턴스로 들어온 연속 요청"만 막는 best-effort 수단이다.
 * 실제 서비스 오픈 전에는 캡차나 Supabase 기반 카운터 등 영속 저장소를 쓴 제한이 필요하다.
 */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const recentRequests = new Map<string, number[]>();

function isRateLimited(ip: string, now: number): boolean {
  const hits = (recentRequests.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  hits.push(now);
  recentRequests.set(ip, hits);

  // 오래된 IP 정리 — 메모리 누수 방지
  if (recentRequests.size > 1000) {
    for (const [key, times] of recentRequests) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) recentRequests.delete(key);
    }
  }
  return hits.length > RATE_LIMIT_MAX;
}

function bad(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const baseUrl = process.env.RESERVATION_API_BASE_URL;
  const apiKey = process.env.RESERVATION_API_KEY;

  if (!baseUrl || !apiKey) {
    return bad("예약 기능이 아직 설정되지 않았습니다.", 503);
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (isRateLimited(ip, Date.now())) {
    return bad("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", 429);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("요청 형식이 올바르지 않습니다.", 400);
  }

  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

  const reservationDt = str(body.reservation_dt);
  if (!reservationDt || !RESERVATION_DT_PATTERN.test(reservationDt)) {
    return bad("예약 일시를 YYYY-MM-DD HH:MM 형식으로 입력해주세요.", 400);
  }

  const patientUuid = str(body.patient_uuid);
  const reservationName = str(body.reservation_name);
  const reservationPhone = str(body.reservation_phone);

  // 초진 예약은 이름 또는 전화번호 중 하나 이상이 있어야 한다
  if (!patientUuid && !reservationName && !reservationPhone) {
    return bad("이름 또는 연락처를 입력해주세요.", 400);
  }

  // 화이트리스트한 필드만 그대로 전달한다 — 클라이언트가 임의 필드를 주입하지 못하게
  const payload = {
    reservation_dt: reservationDt,
    ...(patientUuid && { patient_uuid: patientUuid }),
    ...(str(body.doctor_uuid) && { doctor_uuid: str(body.doctor_uuid) }),
    ...(reservationName && { reservation_name: reservationName }),
    ...(reservationPhone && { reservation_phone: reservationPhone }),
    ...(str(body.reservation_memo) && { reservation_memo: str(body.reservation_memo) }),
    reservation_source: str(body.reservation_source) || "homepage",
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(`${baseUrl.replace(/\/+$/, "")}${UPSTREAM_PATH}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await upstream.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!upstream.ok) {
      // 예약 서버의 오류 메시지는 연동 디버깅에 필요하므로 문자열일 때만 그대로 전달
      const upstreamError =
        data && typeof data === "object" && "error" in data && typeof data.error === "string"
          ? data.error
          : upstream.statusText;

      console.error(`[reservations] upstream ${upstream.status}: ${upstreamError}`);

      const res = NextResponse.json(
        { error: upstreamError, upstream_status: upstream.status },
        { status: upstream.status }
      );
      // 429면 예약 서버가 알려준 대기 시간을 그대로 넘겨준다
      const retryAfter = upstream.headers.get("Retry-After");
      if (retryAfter) res.headers.set("Retry-After", retryAfter);
      return res;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    console.error(`[reservations] ${aborted ? "timeout" : "network error"}`);
    return bad(
      aborted
        ? "예약 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요."
        : "예약 서버에 연결하지 못했습니다.",
      aborted ? 504 : 502
    );
  } finally {
    clearTimeout(timer);
  }
}

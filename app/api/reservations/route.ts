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
 *   RESERVATION_API_SOURCE    (선택) 아래 ALLOWED_SOURCES 중 하나. 미설정 시 안 보냄
 */

const UPSTREAM_PATH = "/external/v2/reservations";
const UPSTREAM_TIMEOUT_MS = 15_000;

/** 문서상 형식: YYYY-MM-DD HH:MM */
const RESERVATION_DT_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

/**
 * 예약 서버가 허용하는 reservation_source 값 (2026-08 실측).
 * "homepage" 같은 임의 값을 보내면 400으로 거부된다. 목록에 홈페이지용 값이 없어
 * 기본적으로는 이 필드를 아예 보내지 않고 서버 기본값(internal)에 맡긴다.
 * 업체가 홈페이지용 값을 추가해 주면 RESERVATION_API_SOURCE만 바꾸면 된다.
 */
const ALLOWED_SOURCES = ["internal", "naver", "kakao", "daangn", "doctalk"];

/** source로 구분할 수 없는 동안, 접수 화면에서 알아볼 수 있도록 메모에 남기는 표시 */
const MEMO_PREFIX = "[홈페이지]";

/**
 * 예약 서버는 오류를 RFC 7807(application/problem+json)로 준다.
 * detail에 사람이 읽을 수 있는 한국어 사유가 들어 있어 연동 디버깅에 필요하다.
 */
function upstreamMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    for (const key of ["detail", "title", "error", "message"]) {
      const v = d[key];
      if (typeof v === "string" && v) return v;
    }
  }
  return fallback;
}

/** 업체에 문의할 때 쓸 수 있도록 예약 서버가 준 요청 ID를 꺼낸다 */
function upstreamRequestId(data: unknown): string | undefined {
  if (data && typeof data === "object") {
    const v = (data as Record<string, unknown>).request_id;
    if (typeof v === "string" && v) return v;
  }
  return undefined;
}

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

  // reservation_source는 클라이언트가 정하지 않는다. 이 라우트를 거친 예약은 항상
  // 홈페이지 유입이고, 값을 열어두면 naver/kakao 등으로 위장할 수 있기 때문이다.
  const configured = process.env.RESERVATION_API_SOURCE?.trim();
  const source = configured && ALLOWED_SOURCES.includes(configured) ? configured : undefined;
  if (configured && !source) {
    console.warn(
      `[reservations] RESERVATION_API_SOURCE="${configured}"는 예약 서버가 받지 않는 값이라 생략합니다`
    );
  }

  const memo = str(body.reservation_memo);

  // 화이트리스트한 필드만 그대로 전달한다 — 클라이언트가 임의 필드를 주입하지 못하게
  const payload = {
    reservation_dt: reservationDt,
    ...(patientUuid && { patient_uuid: patientUuid }),
    ...(str(body.doctor_uuid) && { doctor_uuid: str(body.doctor_uuid) }),
    ...(reservationName && { reservation_name: reservationName }),
    ...(reservationPhone && { reservation_phone: reservationPhone }),
    reservation_memo: memo ? `${MEMO_PREFIX} ${memo}` : MEMO_PREFIX,
    ...(source && { reservation_source: source }),
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
      const upstreamError = upstreamMessage(data, upstream.statusText);
      const requestId = upstreamRequestId(data);

      console.error(
        `[reservations] upstream ${upstream.status}: ${upstreamError}` +
          (requestId ? ` (request_id=${requestId})` : "")
      );

      const res = NextResponse.json(
        {
          error: upstreamError,
          upstream_status: upstream.status,
          ...(requestId && { upstream_request_id: requestId }),
        },
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

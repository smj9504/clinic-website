/**
 * 시그마(한의원 내부 예약 시스템) 연동 — 예약 확정 시 실제 병원 시스템에 예약을 생성한다.
 *
 * 배경: 관리자가 홈페이지에서 "확정 처리"를 누르면, 그동안은 우리 DB의
 * status만 confirmed로 바뀌고 실제 병원 예약은 직원이 병원 시스템에 수기로
 * 입력했다(lib/reservations.ts 상단 주석 참고). 이제 시그마가 제공하는
 * POST /external/v2/reservations로 그 수기 입력을 대체한다.
 *
 * 확정 알림 SMS는 더 이상 홈페이지가 보내지 않는다 — 시그마에 예약이
 * 생성되면 병원 내부 시스템이 자체적으로 환자에게 문자를 보낸다
 * (sendReservationConfirmedSms는 제거되었다).
 *
 * 실패 처리: 시그마 호출은 best-effort가 아니다. 실패하면 우리 DB의
 * status도 confirmed로 바꾸면 안 된다 — 실제로는 병원 시스템에 예약이
 * 안 잡혔는데 홈페이지만 "확정"이라고 표시하면 안 되기 때문이다. 호출부
 * (app/api/reservation-requests/[id]/route.ts)가 이 함수의 실패를 보고
 * DB 업데이트 자체를 취소한다.
 */

const BRAND_SOURCE = "홈페이지";

export type CreateSigmaReservationInput = {
  /** "YYYY-MM-DD HH:MM" — 관리자가 확정 처리 시 직접 입력한 정확한 예약 시각 */
  reservationDt: string;
  name: string;
  phone: string;
  memo?: string;
};

export type SigmaReservationResult = {
  reservationUuid: string;
  reservationDt: string;
  reservationStatus: string;
};

export type SigmaCallResult =
  | { ok: true; reservation: SigmaReservationResult }
  | { ok: false; error: string; status?: number };

/** 시그마가 RFC 7807(Problem Details) 형식으로 내려주는 에러 응답 */
type SigmaProblemDetails = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
};

function getBaseUrl(): string {
  const url = process.env.SIGMA_API_BASE_URL;
  if (!url) {
    throw new Error("SIGMA_API_BASE_URL 환경변수가 설정되지 않았습니다.");
  }
  return url.replace(/\/$/, "");
}

function getApiKey(): string {
  const key = process.env.SIGMA_API_KEY;
  if (!key) {
    throw new Error("SIGMA_API_KEY 환경변수가 설정되지 않았습니다.");
  }
  return key;
}

/**
 * 시그마 예약 생성 API를 호출한다.
 *
 * 명세서의 curl 예시가 `-k`(인증서 검증 생략) 옵션을 쓰는 것으로 보아
 * 병원 내부망 서버가 자체서명(self-signed) 인증서를 쓰는 것으로 보인다.
 * 이 앱은 Node.js 런타임(app/api 라우트)에서만 이 함수를 호출하므로,
 * 필요하다면 SIGMA_TLS_REJECT_UNAUTHORIZED=0 환경변수로 인증서 검증을
 * 끌 수 있게 해둔다 — 기본값은 검증을 켠 채로 안전하게 둔다.
 */
export async function createSigmaReservation(
  input: CreateSigmaReservationInput
): Promise<SigmaCallResult> {
  const baseUrl = getBaseUrl();
  const apiKey = getApiKey();

  const rejectUnauthorized = process.env.SIGMA_TLS_REJECT_UNAUTHORIZED !== "0";
  const previousTlsSetting = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  if (!rejectUnauthorized) {
    // Node의 fetch(undici)는 요청 단위 TLS 옵션을 노출하지 않아, 병원 내부망의
    // 자체서명 인증서를 허용하려면 이 프로세스 전역 스위치가 유일한 방법이다.
    // 호출 직후 원래 값으로 복원해 다른 코드(예: Supabase 클라이언트)의
    // TLS 검증에 영향을 주지 않는다.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/external/v2/reservations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reservation_dt: input.reservationDt,
        reservation_name: input.name,
        reservation_phone: input.phone,
        reservation_memo: input.memo?.trim() || undefined,
        reservation_source: BRAND_SOURCE,
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `시그마 서버에 연결할 수 없습니다. (${message})` };
  } finally {
    if (!rejectUnauthorized) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = previousTlsSetting;
    }
  }

  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    const errorCode = response.headers.get("X-RateLimit-Error-Code");
    const waitHint = retryAfter ? ` (${retryAfter}초 후 재시도 가능)` : "";
    return {
      ok: false,
      status: 429,
      error: `시그마 API 요청 한도를 초과했습니다${waitHint}. ${errorCode ?? ""}`.trim(),
    };
  }

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as SigmaProblemDetails | null;
    const detail = problem?.detail || problem?.title || `요청이 거부되었습니다 (${response.status})`;
    return { ok: false, status: response.status, error: detail };
  }

  const data = await response.json().catch(() => null);
  if (!data?.reservation_uuid) {
    return { ok: false, error: "시그마 응답 형식이 올바르지 않습니다." };
  }

  return {
    ok: true,
    reservation: {
      reservationUuid: data.reservation_uuid,
      reservationDt: data.reservation_dt,
      reservationStatus: data.reservation_status,
    },
  };
}

/**
 * SMS 발송 — 솔라피(Solapi)
 *
 * 용도 2가지:
 *   1) 본인인증 인증번호 발송 (app/api/auth/sms/send) — 필수 성공 경로.
 *      실패하면 인증번호가 실제로 전송되지 않은 것이므로 호출부가 에러를
 *      그대로 사용자에게 알려야 한다 (best-effort 아님).
 *   2) 상담 신청 접수 알림 — best-effort 부가 기능. 실패해도 신청 처리
 *      (DB insert) 자체는 정상 진행되어야 하므로 호출부에서 try/catch로
 *      감싼다. lib/email.ts와 동일한 계약.
 *
 * 확정 알림은 여기서 보내지 않는다 — 관리자가 확정 처리를 하면 시그마
 * (한의원 내부 예약 시스템, lib/sigma.ts)에 실제 예약이 생성되고, 그
 * 병원 시스템이 자체적으로 환자에게 확정 문자를 보낸다. 취소는 환자에게
 * 문자로 알리지 않는다.
 */

import { SolapiMessageService, MessageNotReceivedError } from "solapi";
import type { ReservationRequest } from "@/lib/reservations";
import { sendSmsFailureAlertEmail } from "@/lib/email";

const BRAND_NAME = "고운빛한의원";

let cachedService: SolapiMessageService | null = null;

/**
 * 솔라피 메시지 서비스를 지연 초기화한다.
 *
 * `lib/email.ts`의 `getTransporter()`와 동일한 패턴: 환경변수가 없는
 * 상태에서도 모듈이 로드되는 시점(빌드 등)에는 크래시하지 않고, 실제로
 * 문자를 보내려는 시점에만 환경변수를 읽고 없으면 에러를 던진다.
 */
function getMessageService(): SolapiMessageService {
  if (!cachedService) {
    const apiKey = process.env.SOLAPI_API_KEY;
    const apiSecret = process.env.SOLAPI_API_SECRET;
    if (!apiKey || !apiSecret) {
      throw new Error("SOLAPI_API_KEY 또는 SOLAPI_API_SECRET 환경변수가 설정되지 않았습니다.");
    }
    cachedService = new SolapiMessageService(apiKey, apiSecret);
  }
  return cachedService;
}

function getSenderPhone(): string {
  const phone = process.env.SOLAPI_SENDER_PHONE;
  if (!phone) {
    throw new Error("SOLAPI_SENDER_PHONE 환경변수가 설정되지 않았습니다.");
  }
  return phone;
}

const FAILURE_ALERT_INTERVAL_MS = 60 * 60 * 1000;
let lastFailureAlertAt = 0;

/**
 * 문자 발송 실패를 관리자에게 이메일로 알린다(lib/email.ts).
 *
 * 잔액이 바닥나면 환자가 인증번호를 다시 요청할 때마다 실패하므로, 메일이
 * 쌓이지 않게 1시간에 한 번만 보낸다. 이 간격은 서버 메모리 기준이라 서버가
 * 재시작되거나 여러 개 떠 있으면 몇 통 더 갈 수 있다(best-effort). 알림
 * 메일이 실패해도 원래의 문자 실패 에러를 가리지 않도록 여기서 삼킨다.
 */
async function alertSmsFailure(purpose: string, reason: string): Promise<void> {
  const now = Date.now();
  if (now - lastFailureAlertAt < FAILURE_ALERT_INTERVAL_MS) return;
  lastFailureAlertAt = now;
  try {
    await sendSmsFailureAlertEmail(purpose, reason);
  } catch (alertError) {
    lastFailureAlertAt = 0; // 알림이 안 나갔으니 다음 실패 때 다시 시도한다
    console.error("문자 발송 실패 알림 이메일 발송 실패:", alertError);
  }
}

/**
 * 내부 공통 발송 함수 — 개별 함수들이 이걸 감싼다.
 *
 * 발송에 실패하면 관리자에게 이메일로 알린 뒤 에러를 다시 던진다. 솔라피 키가
 * 아예 없는 경우(getMessageService)는 알리지 않는다 — 키 없이 돌리는 로컬
 * 개발 서버에서 인증번호를 테스트할 때마다 관리자에게 메일이 가지 않도록.
 *
 * @param purpose 알림 메일에 표시할 문자 종류
 */
async function sendSms(to: string, text: string, purpose: string): Promise<void> {
  const service = getMessageService();
  try {
    await service.send({ to, from: getSenderPhone(), text });
  } catch (err) {
    // 접수 실패(발신번호 미등록·잔액 부족 등)의 실제 사유는 failedMessageList 안에만 있고
    // 에러 메시지에는 실패 개수만 찍힌다 — 로그에서 원인이 보이도록 사유를 꺼내 다시 던진다.
    // 수신번호(to)는 개인정보라 로그·알림 메일에 남기지 않는다.
    const error =
      err instanceof MessageNotReceivedError
        ? new Error(
            `솔라피 메시지 접수 실패: ${err.failedMessageList
              .map((m) => `[${m.statusCode}] ${m.statusMessage}`)
              .join(", ")}`
          )
        : err;
    await alertSmsFailure(purpose, error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/** 휴대폰 본인인증 — 인증번호 발송 */
export async function sendVerificationCodeSms(phone: string, code: string): Promise<void> {
  await sendSms(
    phone,
    `[${BRAND_NAME}] 인증번호는 [${code}]입니다. 3분 이내에 입력해 주세요.`,
    "휴대폰 인증번호"
  );
}

/** 상담 신청 접수 알림 */
export async function sendReservationCreatedSms(reservation: ReservationRequest): Promise<void> {
  const desiredTime = reservation.desiredTime?.trim() || "상관없음";
  const text = `[${BRAND_NAME}] ${reservation.name}님, 상담 신청이 접수되었습니다. 희망일시: ${reservation.desiredDate} ${desiredTime}. 확인 후 안내드리겠습니다.`;
  await sendSms(reservation.phone, text, "상담 신청 접수 안내");
}

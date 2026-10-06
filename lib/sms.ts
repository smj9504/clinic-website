/**
 * SMS 발송 — 솔라피(Solapi)
 *
 * 용도 2가지:
 *   1) 본인인증 인증번호 발송 (app/api/auth/sms/send) — 필수 성공 경로.
 *      실패하면 인증번호가 실제로 전송되지 않은 것이므로 호출부가 에러를
 *      그대로 사용자에게 알려야 한다 (best-effort 아님).
 *   2) 예약 상태 변경 알림(생성/취소) — best-effort 부가 기능. 실패해도
 *      예약 처리(DB insert/update) 자체는 정상 진행되어야 하므로 호출부에서
 *      try/catch로 감싼다. lib/email.ts와 동일한 계약.
 *
 * 확정 알림은 여기서 보내지 않는다 — 관리자가 확정 처리를 하면 시그마
 * (한의원 내부 예약 시스템, lib/sigma.ts)에 실제 예약이 생성되고, 그
 * 병원 시스템이 자체적으로 환자에게 확정 문자를 보낸다.
 */

import { SolapiMessageService } from "solapi";
import type { ReservationRequest } from "@/lib/reservations";

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

/** 내부 공통 발송 함수 — 개별 함수들이 이걸 감싼다 */
async function sendSms(to: string, text: string): Promise<void> {
  const service = getMessageService();
  await service.send({ to, from: getSenderPhone(), text });
}

/** 휴대폰 본인인증 — 인증번호 발송 */
export async function sendVerificationCodeSms(phone: string, code: string): Promise<void> {
  await sendSms(phone, `[${BRAND_NAME}] 인증번호는 [${code}]입니다. 3분 이내에 입력해 주세요.`);
}

/** 예약 신청 접수 알림 */
export async function sendReservationCreatedSms(reservation: ReservationRequest): Promise<void> {
  const desiredTime = reservation.desiredTime?.trim() || "상관없음";
  const text = `[${BRAND_NAME}] ${reservation.name}님, 예약 신청이 접수되었습니다. 희망일시: ${reservation.desiredDate} ${desiredTime}. 확인 후 안내드리겠습니다.`;
  await sendSms(reservation.phone, text);
}

/** 예약 취소 알림 */
export async function sendReservationCancelledSms(reservation: ReservationRequest): Promise<void> {
  const text = `[${BRAND_NAME}] ${reservation.name}님, 예약이 취소되었습니다. 재예약을 원하시면 홈페이지 또는 전화로 문의해 주세요.`;
  await sendSms(reservation.phone, text);
}

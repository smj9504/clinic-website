/**
 * 예약 신청 관리자 알림 이메일 — Gmail/네이버 SMTP (nodemailer)
 *
 * 환자가 예약을 신청하면 관리자(RESERVATION_NOTIFY_EMAIL, 없으면 발신 계정
 * 자신)에게 접수 내용을 이메일로 발송한다. 이메일 발송은 예약 접수의 부가 기능(best-effort)이며,
 * 실패하더라도 예약 신청 자체(DB insert)는 정상 처리되어야 한다 — 호출부
 * (app/api/reservation-requests/route.ts)에서 try/catch로 감싸 처리한다.
 */

import nodemailer, { type Transporter } from "nodemailer";
import { SIGMA_ENABLED, type ReservationRequest } from "@/lib/reservations";
import { formatKRW } from "@/lib/price";

const BRAND_ACCENT = "#6B4423";
const BRAND_NAME = "고운빛한의원";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gowoonbit-kmc.com";

/**
 * 관리자 페이지 링크 문구. 시그마 연동이 꺼져 있으면 "확정 처리"가 병원
 * 시스템에 예약을 만들지 않으므로, 확정이 아니라 확인하러 가는 링크로 안내한다.
 */
const ADMIN_LINK_LABEL = SIGMA_ENABLED ? "이 예약 확정 처리하기" : "관리자 페이지에서 예약 확인하기";

/** 발신 메일 주소의 도메인 → SMTP 서버. */
const SMTP_HOSTS: Record<string, string> = {
  "gmail.com": "smtp.gmail.com",
  "naver.com": "smtp.naver.com",
};

type Mailer = { transporter: Transporter; senderAddress: string };

let cachedMailer: Mailer | null = null;

/**
 * nodemailer transporter와 발신 주소를 지연 초기화한다.
 *
 * `lib/supabase.ts`의 `getServiceClient()`와 동일한 패턴: 환경변수가 없는
 * 상태에서도 모듈이 로드되는 시점(빌드/다른 API 라우트 임포트 등)에는
 * 크래시하지 않고, 실제로 이메일을 보내려는 시점에만 환경변수를 읽고
 * 없으면 에러를 던진다. 이후 호출에서는 같은 커넥션 풀을 재사용해
 * 매 요청마다 새로 연결하지 않는다.
 *
 * 발신 계정은 MAIL_USER/MAIL_PASSWORD를 우선 쓰고, SMTP 서버는 주소의
 * 도메인(@gmail.com / @naver.com)으로 고른다. MAIL_USER가 없으면 예전
 * 이름인 GMAIL_USER/GMAIL_APP_PASSWORD를 쓰고 SMTP 서버도 예전처럼 항상
 * Gmail로 둔다 — 이미 GMAIL_*로 설정된 서버(구글 워크스페이스의 자체 도메인
 * 주소 포함)가 환경변수를 바꾸기 전까지 그대로 동작하도록. 주소와
 * 비밀번호는 항상 같은 쌍에서 가져와, 네이버 주소에 Gmail 앱 비밀번호가
 * 섞이지 않게 한다.
 */
function getMailer(): Mailer {
  if (!cachedMailer) {
    const usesMailUser = Boolean(process.env.MAIL_USER);
    const [user, pass] = usesMailUser
      ? [process.env.MAIL_USER, process.env.MAIL_PASSWORD]
      : [process.env.GMAIL_USER, process.env.GMAIL_APP_PASSWORD];
    if (!user || !pass) {
      throw new Error(
        "발신 메일 계정이 설정되지 않았습니다. MAIL_USER와 MAIL_PASSWORD 환경변수를 확인해 주세요."
      );
    }

    const host = usesMailUser
      ? SMTP_HOSTS[user.split("@")[1]?.toLowerCase() ?? ""]
      : "smtp.gmail.com";
    if (!host) {
      throw new Error(
        `발신 메일 주소(${user})의 SMTP 서버를 알 수 없습니다. @gmail.com 또는 @naver.com 전체 주소를 넣어 주세요.`
      );
    }

    // port 465 + secure:true (SMTPS) 사용.
    // nodemailer 공식 문서/커뮤니티 관례상 587(STARTTLS)보다 465(암묵적 TLS)가
    // 연결이 평문으로 시작하지 않아 더 안정적이고, Gmail·네이버 모두 465를
    // 공식 지원하며 프록시/방화벽 환경에서 STARTTLS 협상 실패로 인한
    // 간헐적 타임아웃 이슈가 적다.
    cachedMailer = {
      transporter: nodemailer.createTransport({
        host,
        port: 465,
        secure: true,
        auth: { user, pass },
      }),
      senderAddress: user,
    };
  }
  return cachedMailer;
}

/** 쉼표로 구분된 수신 주소 목록을 배열로 바꾼다. */
function parseRecipients(value: string): string[] {
  return value
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCreatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function buildHtmlBody(reservation: ReservationRequest, adminUrl: string | null): string {
  const name = escapeHtml(reservation.name);
  const phone = escapeHtml(reservation.phone);
  const desiredDate = escapeHtml(reservation.desiredDate);
  const desiredTime = escapeHtml(reservation.desiredTime?.trim() || "상관없음");
  const memo = escapeHtml(reservation.memo?.trim() || "없음");
  const createdAt = escapeHtml(formatCreatedAt(reservation.createdAt));

  const selectedServicesRowHtml =
    reservation.selectedServices.length > 0
      ? `<tr>
                    <td style="padding:8px 0;border-bottom:1px solid #eee;color:#888;vertical-align:top;">선택 시술</td>
                    <td style="padding:8px 0;border-bottom:1px solid #eee;">
                      ${reservation.selectedServices
                        .map((item) => {
                          const label = escapeHtml(
                            `${item.serviceName}${item.priceLabel ? ` (${item.priceLabel})` : ""}`
                          );
                          return `<div>${label} — ${formatKRW(item.finalPrice)}</div>`;
                        })
                        .join("")}
                    </td>
                  </tr>`
      : "";

  const linkHtml = adminUrl
    ? `<p style="margin:24px 0 0;">
         <a href="${escapeHtml(adminUrl)}" style="display:inline-block;padding:10px 18px;background:${BRAND_ACCENT};color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;">
           ${ADMIN_LINK_LABEL}
         </a>
       </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="ko">
  <body style="margin:0;padding:0;background:#f7f4f0;font-family:'Malgun Gothic',Apple SD Gothic Neo,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5ded4;">
            <tr>
              <td style="background:${BRAND_ACCENT};padding:18px 24px;">
                <span style="color:#ffffff;font-size:16px;font-weight:bold;">${BRAND_NAME}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <h2 style="margin:0 0 16px;font-size:18px;color:#2b2b2b;">새 예약 신청이 접수되었습니다</h2>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;color:#333333;">
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #eee;color:#888;width:110px;">신청자 이름</td>
                    <td style="padding:8px 0;border-bottom:1px solid #eee;">${name}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #eee;color:#888;">연락처</td>
                    <td style="padding:8px 0;border-bottom:1px solid #eee;">${phone}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #eee;color:#888;">희망 날짜</td>
                    <td style="padding:8px 0;border-bottom:1px solid #eee;">${desiredDate}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #eee;color:#888;">희망 시간대</td>
                    <td style="padding:8px 0;border-bottom:1px solid #eee;">${desiredTime}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #eee;color:#888;vertical-align:top;">증상·요청사항</td>
                    <td style="padding:8px 0;border-bottom:1px solid #eee;white-space:pre-wrap;">${memo}</td>
                  </tr>
                  ${selectedServicesRowHtml}
                  <tr>
                    <td style="padding:8px 0;color:#888;">접수 시각</td>
                    <td style="padding:8px 0;">${createdAt}</td>
                  </tr>
                </table>
                ${linkHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;background:#faf8f5;border-top:1px solid #eee;">
                <span style="font-size:12px;color:#999;">본 메일은 ${BRAND_NAME} 홈페이지 예약 신청 시스템에서 자동으로 발송되었습니다.</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildTextBody(reservation: ReservationRequest, adminUrl: string | null): string {
  const desiredTime = reservation.desiredTime?.trim() || "상관없음";
  const memo = reservation.memo?.trim() || "없음";
  const createdAt = formatCreatedAt(reservation.createdAt);

  const lines = [
    `${BRAND_NAME} — 새 예약 신청이 접수되었습니다`,
    "",
    `신청자 이름: ${reservation.name}`,
    `연락처: ${reservation.phone}`,
    `희망 날짜: ${reservation.desiredDate}`,
    `희망 시간대: ${desiredTime}`,
    `증상·요청사항: ${memo}`,
  ];

  if (reservation.selectedServices.length > 0) {
    lines.push("선택 시술:");
    for (const item of reservation.selectedServices) {
      lines.push(
        `  - ${item.serviceName}${item.priceLabel ? ` (${item.priceLabel})` : ""} ${formatKRW(item.finalPrice)}`
      );
    }
  }

  lines.push(`접수 시각: ${createdAt}`);

  if (adminUrl) {
    lines.push("", `${ADMIN_LINK_LABEL}: ${adminUrl}`);
  }

  return lines.join("\n");
}

/**
 * 새 예약 신청 접수 알림을 관리자 이메일로 발송한다.
 *
 * 관리자 페이지 링크는 요청의 origin이 아니라 사이트 주소(NEXT_PUBLIC_SITE_URL)로
 * 만든다 — 로컬 개발 서버나 프록시 뒤에서 받은 요청은 origin이
 * http://localhost:3000이 되어, 메일을 받은 관리자가 링크를 열 수 없기 때문이다.
 *
 * @param reservation 방금 접수된 예약 신청 (DB insert 후 변환된 결과)
 */
export async function sendReservationNotificationEmail(
  reservation: ReservationRequest
): Promise<void> {
  // 네이버 SMTP는 로그인한 계정과 다른 발신 주소를 거부하므로, 발신 주소는
  // 항상 로그인 계정 주소 그대로 쓴다. 받는 사람을 따로 지정하지 않으면
  // 그 계정 메일함으로 보낸다.
  const { transporter, senderAddress } = getMailer();
  const to = parseRecipients(process.env.RESERVATION_NOTIFY_EMAIL || senderAddress);
  const adminUrl = `${SITE_URL.replace(/\/$/, "")}/admin/reservations?id=${encodeURIComponent(reservation.id)}`;

  await transporter.sendMail({
    from: `"${BRAND_NAME}" <${senderAddress}>`,
    to,
    subject: `[${BRAND_NAME}] 새 예약 신청 - ${reservation.name}님`,
    text: buildTextBody(reservation, adminUrl),
    html: buildHtmlBody(reservation, adminUrl),
  });
}

/**
 * 문자(솔라피) 발송 실패를 관리자 이메일로 알린다.
 *
 * 잔액 부족·발신번호 문제 등으로 문자가 안 나가면 환자는 인증번호를 받지
 * 못해 상담 신청 자체를 할 수 없는데, 그동안은 서버 로그 말고는 알 방법이
 * 없었다. 이메일은 솔라피와 무관한 경로라 문자가 막혀도 도착한다.
 *
 * 받는 사람은 SMS_ALERT_EMAIL → RESERVATION_NOTIFY_EMAIL → 발신 계정 순으로 정한다.
 *
 * @param purpose 실패한 문자의 종류(예: "휴대폰 인증번호")
 * @param reason 솔라피가 돌려준 실패 사유. 수신번호는 담지 않는다.
 */
export async function sendSmsFailureAlertEmail(purpose: string, reason: string): Promise<void> {
  const { transporter, senderAddress } = getMailer();
  const to = parseRecipients(
    process.env.SMS_ALERT_EMAIL || process.env.RESERVATION_NOTIFY_EMAIL || senderAddress
  );

  const text = [
    `${BRAND_NAME} 홈페이지에서 보내는 문자가 발송되지 않았습니다.`,
    "",
    `문자 종류: ${purpose}`,
    `실패 사유: ${reason}`,
    `발생 시각: ${formatCreatedAt(new Date().toISOString())}`,
    "",
    "인증번호 문자가 나가지 않으면 환자가 상담 신청을 할 수 없습니다.",
    "솔라피 콘솔에서 잔액과 발신번호 상태를 확인해 주세요.",
    "",
    "같은 알림은 1시간에 한 번만 보냅니다.",
  ].join("\n");

  await transporter.sendMail({
    from: `"${BRAND_NAME}" <${senderAddress}>`,
    to,
    subject: `[${BRAND_NAME}] 문자 발송 실패 - 확인이 필요합니다`,
    text,
  });
}

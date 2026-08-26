/**
 * 예약 신청 관리자 알림 이메일 — Gmail SMTP (nodemailer)
 *
 * 환자가 예약을 신청하면 관리자(RESERVATION_NOTIFY_EMAIL)에게 접수 내용을
 * 이메일로 발송한다. 이메일 발송은 예약 접수의 부가 기능(best-effort)이며,
 * 실패하더라도 예약 신청 자체(DB insert)는 정상 처리되어야 한다 — 호출부
 * (app/api/reservation-requests/route.ts)에서 try/catch로 감싸 처리한다.
 */

import nodemailer, { type Transporter } from "nodemailer";
import type { ReservationRequest } from "@/lib/reservations";
import { formatKRW } from "@/lib/price";

const BRAND_ACCENT = "#6B4423";
const BRAND_NAME = "고운빛한의원";

let cachedTransporter: Transporter | null = null;

/**
 * nodemailer transporter를 지연 초기화한다.
 *
 * `lib/supabase.ts`의 `getServiceClient()`와 동일한 패턴: 환경변수가 없는
 * 상태에서도 모듈이 로드되는 시점(빌드/다른 API 라우트 임포트 등)에는
 * 크래시하지 않고, 실제로 이메일을 보내려는 시점에만 환경변수를 읽고
 * 없으면 에러를 던진다. 이후 호출에서는 같은 커넥션 풀을 재사용해
 * 매 요청마다 새로 연결하지 않는다.
 */
function getTransporter(): Transporter {
  if (!cachedTransporter) {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) {
      throw new Error(
        "GMAIL_USER 또는 GMAIL_APP_PASSWORD 환경변수가 설정되지 않았습니다."
      );
    }

    // port 465 + secure:true (SMTPS) 사용.
    // nodemailer 공식 문서/커뮤니티 관례상 587(STARTTLS)보다 465(암묵적 TLS)가
    // 연결이 평문으로 시작하지 않아 더 안정적이고, Gmail이 두 포트 모두
    // 공식 지원하지만 465가 프록시/방화벽 환경에서 STARTTLS 협상 실패로
    // 인한 간헐적 타임아웃 이슈가 적다.
    cachedTransporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    });
  }
  return cachedTransporter;
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
           관리자 페이지에서 확인하기
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
    lines.push("", `관리자 페이지: ${adminUrl}`);
  }

  return lines.join("\n");
}

/**
 * 새 예약 신청 접수 알림을 관리자 이메일로 발송한다.
 *
 * @param reservation 방금 접수된 예약 신청 (DB insert 후 변환된 결과)
 * @param origin 요청의 origin(예: https://gounbitclinic.com). 있으면 관리자
 *   페이지 절대 URL을 이메일에 포함시키는 데 사용한다. 없으면 링크를 생략한다.
 */
export async function sendReservationNotificationEmail(
  reservation: ReservationRequest,
  origin?: string | null
): Promise<void> {
  const to = process.env.RESERVATION_NOTIFY_EMAIL || "minjeesong95@gmail.com";
  const from = `"${BRAND_NAME}" <${process.env.GMAIL_USER}>`;

  const base = origin || process.env.NEXT_PUBLIC_SITE_URL || null;
  const adminUrl = base ? `${base.replace(/\/$/, "")}/admin/reservations` : null;

  const transporter = getTransporter();
  await transporter.sendMail({
    from,
    to,
    subject: `[${BRAND_NAME}] 새 예약 신청 - ${reservation.name}님`,
    text: buildTextBody(reservation, adminUrl),
    html: buildHtmlBody(reservation, adminUrl),
  });
}

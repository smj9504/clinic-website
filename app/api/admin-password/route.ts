import { NextRequest, NextResponse } from "next/server";
import {
  adminCheckResponse,
  checkAdminPassword,
  getStoredAdminPassword,
  loginAdmin,
  requireAdmin,
  setAdminPassword,
} from "@/lib/adminAuth";
import { startSession } from "@/lib/adminSession";
import { passwordRuleError } from "@/lib/passwordRule";

/**
 * POST /api/admin-password
 * 로그인 — 비밀번호가 맞으면 관리자 세션 쿠키를 발급한다 (lib/adminSession.ts)
 * Body: { password: string }
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const password = body?.password;
  if (!password) {
    return NextResponse.json({ error: "password required" }, { status: 400 });
  }

  const check = await loginAdmin(password);
  if (!check.ok) {
    return adminCheckResponse(check, check.status === 429 ? { valid: false, error: check.error } : { valid: false });
  }

  return NextResponse.json({ valid: true });
}

/**
 * PUT /api/admin-password
 * 비밀번호 변경 — 로그인한 상태에서 현재 비밀번호를 한 번 더 확인한다.
 * 새 비밀번호는 일방향 해시로 저장하고(lib/adminAuth.ts), 다른 곳에 남아 있던 세션은 모두 무효가 된다.
 * Body: { currentPassword: string, newPassword: string }
 */
export async function PUT(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const currentPassword = body?.currentPassword;
  const newPassword = body?.newPassword;
  if (!currentPassword || typeof newPassword !== "string" || !newPassword) {
    return NextResponse.json({ error: "currentPassword and newPassword required" }, { status: 400 });
  }

  const ruleError = passwordRuleError(newPassword);
  if (ruleError) {
    return NextResponse.json({ error: ruleError }, { status: 400 });
  }

  const check = await checkAdminPassword(currentPassword);
  if (!check.ok) {
    return adminCheckResponse(check, { error: check.status === 429 ? check.error : "현재 비밀번호가 일치하지 않습니다" });
  }

  const { error } = await setAdminPassword(newPassword);
  if (error) {
    console.error("[admin-password] 비밀번호 저장 실패:", error);
    return NextResponse.json({ error: "비밀번호를 저장하지 못했습니다." }, { status: 500 });
  }

  // 지금 이 브라우저는 새 비밀번호 기준 세션으로 계속 쓴다
  await startSession(await getStoredAdminPassword());
  return NextResponse.json({ success: true });
}

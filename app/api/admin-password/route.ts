import { NextRequest, NextResponse } from "next/server";
import { setAdminPassword, verifyAdminPassword } from "@/lib/adminAuth";
import { passwordRuleError } from "@/lib/passwordRule";

/**
 * POST /api/admin-password
 * 비밀번호 검증
 * Body: { password: string }
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const password = body?.password;
  if (!password) {
    return NextResponse.json({ error: "password required" }, { status: 400 });
  }

  if (!(await verifyAdminPassword(password))) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  return NextResponse.json({ valid: true });
}

/**
 * PUT /api/admin-password
 * 비밀번호 변경 — 새 비밀번호는 일방향 해시로 저장한다 (lib/adminAuth.ts)
 * Body: { currentPassword: string, newPassword: string }
 */
export async function PUT(request: NextRequest) {
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

  if (!(await verifyAdminPassword(currentPassword))) {
    return NextResponse.json({ error: "현재 비밀번호가 일치하지 않습니다" }, { status: 401 });
  }

  const { error } = await setAdminPassword(newPassword);
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

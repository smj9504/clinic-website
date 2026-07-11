import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

const CONFIG_KEY = "admin_password";
const DEFAULT_PASSWORD = "admin1234";

/** DB에서 현재 비밀번호 조회 (없으면 기본값) */
async function getStoredPassword(): Promise<string> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("site_data")
    .select("data")
    .eq("locale", "_config")
    .single();
  return data?.data?.[CONFIG_KEY] || DEFAULT_PASSWORD;
}

/**
 * POST /api/admin-password
 * 비밀번호 검증
 * Body: { password: string }
 */
export async function POST(request: NextRequest) {
  const { password } = await request.json();
  if (!password) {
    return NextResponse.json({ error: "password required" }, { status: 400 });
  }

  const stored = await getStoredPassword();
  if (password !== stored) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  return NextResponse.json({ valid: true });
}

/**
 * PUT /api/admin-password
 * 비밀번호 변경
 * Body: { currentPassword: string, newPassword: string }
 */
export async function PUT(request: NextRequest) {
  const { currentPassword, newPassword } = await request.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "currentPassword and newPassword required" }, { status: 400 });
  }

  if (newPassword.length < 4) {
    return NextResponse.json({ error: "비밀번호는 4자 이상이어야 합니다" }, { status: 400 });
  }

  const stored = await getStoredPassword();
  if (currentPassword !== stored) {
    return NextResponse.json({ error: "현재 비밀번호가 일치하지 않습니다" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("site_data")
    .upsert(
      { locale: "_config", data: { [CONFIG_KEY]: newPassword }, updated_at: new Date().toISOString() },
      { onConflict: "locale" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { translateTexts } from "@/lib/translate";

/**
 * POST /api/translate
 * Google Translate 무료 엔드포인트를 사용한 텍스트 번역
 * Body: { texts: string[], source: "ko"|"en", target: "ko"|"en", password: string }
 *
 * 여러 텍스트를 한 번에 번역하여 네트워크 오버헤드 최소화
 */
export async function POST(request: NextRequest) {
  const { texts, source = "ko", target = "en", password } = await request.json();

  const denied = await requireAdmin(password);
  if (denied) return denied;

  if (!Array.isArray(texts) || texts.length === 0) {
    return NextResponse.json({ error: "texts array is required" }, { status: 400 });
  }

  try {
    const translations = await translateTexts(texts, source, target);
    return NextResponse.json({ translations });
  } catch (error) {
    return NextResponse.json(
      { error: "Translation failed", details: String(error) },
      { status: 500 }
    );
  }
}

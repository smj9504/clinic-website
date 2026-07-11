import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

/**
 * POST /api/translate
 * Google Translate 무료 엔드포인트를 사용한 텍스트 번역
 * Body: { texts: string[], source: "ko"|"en", target: "ko"|"en", password: string }
 *
 * 여러 텍스트를 한 번에 번역하여 네트워크 오버헤드 최소화
 */
export async function POST(request: NextRequest) {
  const { texts, source = "ko", target = "en", password } = await request.json();

  const supabase = getServiceClient();
  const { data: configRow } = await supabase
    .from("site_data")
    .select("data")
    .eq("locale", "_config")
    .single();
  const storedPassword = configRow?.data?.admin_password || "admin1234";
  if (password !== storedPassword) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!Array.isArray(texts) || texts.length === 0) {
    return NextResponse.json({ error: "texts array is required" }, { status: 400 });
  }

  // 빈 문자열은 번역 불필요
  const results: string[] = [];

  try {
    for (const text of texts) {
      if (!text || !text.trim()) {
        results.push(text);
        continue;
      }

      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url);

      if (!res.ok) {
        results.push(text); // 실패 시 원본 유지
        continue;
      }

      const data = await res.json();
      // Google Translate 응답: [[["translated text","original text",null,null,10]],null,"ko"]
      const translated = (data[0] as Array<[string]>)
        .map((segment: [string]) => segment[0])
        .join("");
      results.push(translated);
    }

    return NextResponse.json({ translations: results });
  } catch (error) {
    return NextResponse.json(
      { error: "Translation failed", details: String(error) },
      { status: 500 }
    );
  }
}

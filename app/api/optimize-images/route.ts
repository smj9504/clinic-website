import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import sharp from "sharp";

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const WEBP_QUALITY = 80;

/**
 * POST /api/optimize-images
 * Supabase Storage의 기존 이미지를 WebP로 일괄 변환하고
 * site_data 테이블의 URL도 갱신하는 1회성 마이그레이션 API
 */
export async function POST(request: NextRequest) {
  const { password } = await request.json();
  if (password !== "admin1234") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();

  // 1) Storage에서 이미지 목록 조회
  const { data: files, error: listError } = await supabase.storage
    .from("site-assets")
    .list("images", { limit: 200 });

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  // 이미 webp인 파일은 스킵
  const targets = (files || []).filter(
    (f) => !f.name.endsWith(".webp") && !f.name.endsWith(".svg") && f.metadata
  );

  const results: { original: string; optimized: string; saved: string }[] = [];
  const urlMap: Record<string, string> = {}; // oldUrl → newUrl

  for (const file of targets) {
    const oldPath = `images/${file.name}`;

    try {
      // 다운로드
      const { data: blob, error: dlError } = await supabase.storage
        .from("site-assets")
        .download(oldPath);

      if (dlError || !blob) continue;

      const inputBuffer = Buffer.from(await blob.arrayBuffer());
      const originalSize = inputBuffer.length;

      // sharp 변환
      const optimizedBuffer = await sharp(inputBuffer)
        .resize(MAX_WIDTH, MAX_HEIGHT, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();

      const newName = file.name.replace(/\.[^.]+$/, ".webp");
      const newPath = `images/${newName}`;

      // 업로드
      const { error: upError } = await supabase.storage
        .from("site-assets")
        .upload(newPath, optimizedBuffer, {
          contentType: "image/webp",
          upsert: true,
        });

      if (upError) continue;

      const { data: oldUrlData } = supabase.storage
        .from("site-assets")
        .getPublicUrl(oldPath);
      const { data: newUrlData } = supabase.storage
        .from("site-assets")
        .getPublicUrl(newPath);

      urlMap[oldUrlData.publicUrl] = newUrlData.publicUrl;

      const savedPct = Math.round((1 - optimizedBuffer.length / originalSize) * 100);
      results.push({
        original: file.name,
        optimized: newName,
        saved: `${savedPct}% (${Math.round(originalSize / 1024)}KB → ${Math.round(optimizedBuffer.length / 1024)}KB)`,
      });
    } catch {
      continue;
    }
  }

  // 2) site_data 테이블의 URL 치환
  if (Object.keys(urlMap).length > 0) {
    for (const locale of ["ko", "en"]) {
      const { data: row } = await supabase
        .from("site_data")
        .select("data")
        .eq("locale", locale)
        .single();

      if (row?.data) {
        let json = JSON.stringify(row.data);
        for (const [oldUrl, newUrl] of Object.entries(urlMap)) {
          json = json.replaceAll(oldUrl, newUrl);
        }
        await supabase
          .from("site_data")
          .update({ data: JSON.parse(json) })
          .eq("locale", locale);
      }
    }
  }

  return NextResponse.json({
    optimized: results.length,
    skipped: (files || []).length - targets.length,
    results,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

/**
 * POST /api/migrate-images
 * DB에 저장된 base64 이미지를 Supabase Storage로 마이그레이션
 * Body: { password: string }
 */
export async function POST(request: NextRequest) {
  const { password } = await request.json();
  if (password !== "admin1234") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const locales = ["ko", "en"] as const;
  let totalMigrated = 0;

  for (const locale of locales) {
    const { data: row, error } = await supabase
      .from("site_data")
      .select("data")
      .eq("locale", locale)
      .single();

    if (error || !row?.data) continue;

    const siteData = row.data as Record<string, unknown>;
    let json = JSON.stringify(siteData);
    const base64Regex = /"(data:image\/[^;]+;base64,[^"]+)"/g;
    const matches = [...json.matchAll(base64Regex)];

    if (matches.length === 0) continue;

    for (const match of matches) {
      const base64Str = match[1];
      try {
        // Extract mime type and data
        const mimeMatch = base64Str.match(/^data:(image\/[^;]+);base64,(.+)$/);
        if (!mimeMatch) continue;

        const mimeType = mimeMatch[1];
        const base64Data = mimeMatch[2];
        const ext = mimeType.split("/")[1].replace("jpeg", "jpg");
        const fileName = `${locale}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const filePath = `images/${fileName}`;

        const buffer = Buffer.from(base64Data, "base64");

        const { error: uploadError } = await supabase.storage
          .from("site-assets")
          .upload(filePath, buffer, { contentType: mimeType, upsert: false });

        if (uploadError) {
          console.error(`Upload failed for ${filePath}:`, uploadError.message);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("site-assets")
          .getPublicUrl(filePath);

        // Replace base64 with URL in JSON
        json = json.replace(base64Str, urlData.publicUrl);
        totalMigrated++;
      } catch (err) {
        console.error("Migration error for one image:", err);
        continue;
      }
    }

    // Save updated data back to DB
    const updatedData = JSON.parse(json);
    const { error: saveError } = await supabase
      .from("site_data")
      .upsert(
        { locale, data: updatedData, updated_at: new Date().toISOString() },
        { onConflict: "locale" }
      );

    if (saveError) {
      console.error(`Save failed for ${locale}:`, saveError.message);
    }
  }

  return NextResponse.json({
    success: true,
    migrated: totalMigrated,
    message: `${totalMigrated}개의 이미지를 Storage로 마이그레이션했습니다.`,
  });
}

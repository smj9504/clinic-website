import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import sharp from "sharp";

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const WEBP_QUALITY = 80;

/**
 * POST /api/upload
 * 이미지를 리사이즈/WebP 압축 후 Supabase Storage에 업로드하고 공개 URL 반환
 * Body: FormData { file: File, password: string }
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const password = formData.get("password") as string | null;

  if (!file) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  if (password !== "admin1234") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 10MB limit (원본 기준)
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "file too large (max 10MB)" }, { status: 413 });
  }

  const supabase = getServiceClient();

  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  // sharp로 리사이즈 + WebP 변환 (SVG는 제외)
  let optimizedBuffer: Buffer;
  let contentType: string;
  let ext: string;

  const isSvg = file.type === "image/svg+xml";
  if (isSvg) {
    optimizedBuffer = inputBuffer;
    contentType = file.type;
    ext = "svg";
  } else {
    optimizedBuffer = await sharp(inputBuffer)
      .resize(MAX_WIDTH, MAX_HEIGHT, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    contentType = "image/webp";
    ext = "webp";
  }

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filePath = `images/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("site-assets")
    .upload(filePath, optimizedBuffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from("site-assets")
    .getPublicUrl(filePath);

  return NextResponse.json({ url: urlData.publicUrl });
}

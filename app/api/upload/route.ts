import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { MAX_UPLOAD_BYTES } from "@/lib/imageUpload";
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

  // 원본 기준 25MB. 단, Vercel Functions는 요청 본문이 4.5MB를 넘으면 이 핸들러가
  // 실행되기 전에 413으로 끊으므로, admin 화면은 전송 전에 브라우저에서
  // 1920px WebP로 축소해 보낸다 (lib/imageUpload.ts).
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `file too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024}MB)` },
      { status: 413 }
    );
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
      // 휴대폰 원본 사진은 EXIF 방향값을 갖고 있어 회전 없이는 눕는다
      .rotate()
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

import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";
import { MAX_UPLOAD_BYTES } from "@/lib/imageUpload";
import sharp from "sharp";

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const WEBP_QUALITY = 80;

const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB — 시술 홍보 영상 등 짧은 클립 기준

const VIDEO_EXT_BY_TYPE: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

/**
 * POST /api/upload
 * 이미지는 리사이즈/WebP 압축 후, 동영상은 원본 그대로 Supabase Storage에 업로드하고 공개 URL 반환
 * Body: FormData { file: File, password: string }
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const password = formData.get("password") as string | null;

  if (!file) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const denied = await requireAdmin(password);
  if (denied) return denied;

  const isVideo = file.type.startsWith("video/");

  if (isVideo) {
    const videoExt = VIDEO_EXT_BY_TYPE[file.type];
    if (!videoExt) {
      return NextResponse.json({ error: "unsupported video format (mp4, webm, mov only)" }, { status: 415 });
    }
    if (file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json({ error: "file too large (max 100MB)" }, { status: 413 });
    }
  } else if (file.size > MAX_UPLOAD_BYTES) {
    // 원본 기준 25MB. 단, Vercel Functions는 요청 본문이 4.5MB를 넘으면 이 핸들러가
    // 실행되기 전에 413으로 끊으므로, admin 화면은 전송 전에 브라우저에서
    // 1920px WebP로 축소해 보낸다 (lib/imageUpload.ts).
    return NextResponse.json(
      { error: `file too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024}MB)` },
      { status: 413 }
    );
  }

  const supabase = getServiceClient();

  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  // 이미지는 sharp로 리사이즈 + WebP 변환(SVG 제외), 동영상은 트랜스코딩 없이 원본 그대로 저장
  let optimizedBuffer: Buffer;
  let contentType: string;
  let ext: string;

  const isSvg = file.type === "image/svg+xml";
  if (isVideo) {
    optimizedBuffer = inputBuffer;
    contentType = file.type;
    ext = VIDEO_EXT_BY_TYPE[file.type];
  } else if (isSvg) {
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
  const filePath = `${isVideo ? "videos" : "images"}/${fileName}`;

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

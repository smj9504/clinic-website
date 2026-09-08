import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";

const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB — 시술 홍보 영상 등 짧은 클립 기준

const VIDEO_EXT_BY_TYPE: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

/**
 * POST /api/upload-url
 * 동영상 전용 — 브라우저가 파일을 직접 Supabase Storage에 올릴 수 있는 서명된
 * 업로드 URL을 발급한다. /api/upload는 동영상도 서버로 통째로 받아 전달하는데,
 * 병원 내부 서버(또는 그 앞단 리버스 프록시)의 요청 본문 크기 제한에 걸려
 * 수십MB짜리 동영상이 413으로 실패하는 문제가 있었다. 이 라우트는 파일명·용량만
 * 담긴 작은 JSON 요청이라 그 한도와 무관하고, 실제 동영상 바이트는 서명된 URL로
 * 브라우저→Supabase 직접 전송되어 서버를 거치지 않는다.
 * Body: { fileName: string, contentType: string, size: number, password: string }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { fileName, contentType, size, password } = body;

  const denied = await requireAdmin(password);
  if (denied) return denied;

  if (typeof contentType !== "string" || !contentType.startsWith("video/")) {
    return NextResponse.json({ error: "video files only" }, { status: 400 });
  }

  const ext = VIDEO_EXT_BY_TYPE[contentType];
  if (!ext) {
    return NextResponse.json({ error: "unsupported video format (mp4, webm, mov only)" }, { status: 415 });
  }

  if (typeof size !== "number" || size > MAX_VIDEO_SIZE) {
    return NextResponse.json(
      { error: `file too large (max ${MAX_VIDEO_SIZE / 1024 / 1024}MB)` },
      { status: 413 }
    );
  }

  const supabase = getServiceClient();
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filePath = `videos/${safeName}`;

  const { data, error } = await supabase.storage
    .from("site-assets")
    .createSignedUploadUrl(filePath);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(filePath);

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    path: filePath,
    publicUrl: urlData.publicUrl,
  });
}

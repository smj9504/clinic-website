/** 관리자가 선택할 수 있는 원본 이미지 최대 용량 */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = "25MB";

/**
 * Vercel Functions는 요청 본문이 4.5MB를 넘으면 라우트 핸들러가 실행되기도 전에
 * 413(FUNCTION_PAYLOAD_TOO_LARGE)으로 끊는다. 여유를 두고 4MB를 전송 상한으로 잡고,
 * 원본이 그보다 크면 아래 shrinkForUpload()로 미리 줄여서 보낸다.
 * https://vercel.com/docs/functions/limitations#request-body-size
 */
export const MAX_REQUEST_BYTES = 4 * 1024 * 1024;

/** /api/upload가 어차피 이 크기로 리사이즈하므로 미리 줄여도 최종 화질은 같다 */
const MAX_DIMENSION = 1920;
const WEBP_QUALITY = 0.92;

/** 캔버스로 다시 그리면 깨지는 형식 — 벡터(SVG), 애니메이션(GIF) */
const PASSTHROUGH_TYPES = ["image/svg+xml", "image/gif"];

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * 업로드 전 브라우저에서 이미지를 1920px WebP로 축소한다.
 * 디코딩·인코딩할 수 없는 형식(HEIC 등)이면 원본을 그대로 돌려주고,
 * 전송 가능 여부 판단은 호출부에 맡긴다.
 */
export async function shrinkForUpload(file: File): Promise<File> {
  if (PASSTHROUGH_TYPES.includes(file.type)) return file;
  if (typeof createImageBitmap !== "function") return file;

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));

    // 이미 충분히 작고 가벼우면 재인코딩 손실 없이 원본 그대로 보낸다
    if (scale === 1 && file.size <= MAX_REQUEST_BYTES) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    let blob = await toBlob(canvas, "image/webp", WEBP_QUALITY);
    // WebP 인코딩을 지원하지 않는 브라우저는 PNG로 대체된다.
    // 투명도가 없는 원본이면 JPEG로 다시 시도해 전송 용량을 확실히 낮춘다.
    if (blob && blob.type !== "image/webp" && file.type !== "image/png") {
      blob = (await toBlob(canvas, "image/jpeg", 0.9)) ?? blob;
    }
    if (!blob || blob.size >= file.size) return file;

    const ext =
      blob.type === "image/webp" ? "webp" : blob.type === "image/jpeg" ? "jpg" : "png";
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.${ext}`, {
      type: blob.type,
    });
  } catch {
    return file;
  }
}

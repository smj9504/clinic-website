import { NextResponse } from "next/server";

/**
 * 공개 API의 서버 오류 응답.
 * DB 오류 문장(테이블·컬럼 이름, 값 형식 등)을 그대로 돌려주면 내부 구조가 드러나므로
 * 자세한 내용은 서버 로그에만 남기고 방문자에게는 일반 안내만 보낸다.
 * (관리자 전용 API는 직원이 원인을 알 수 있도록 자세한 메시지를 그대로 둔다)
 */
export function publicServerError(context: string, error: unknown, status = 500): NextResponse {
  const detail = error instanceof Error ? error.message : (error as { message?: string } | null)?.message ?? String(error);
  console.error(`[${context}]`, detail);
  return NextResponse.json({ error: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." }, { status });
}

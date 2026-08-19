/**
 * 텍스트 번역 (서버 전용)
 *
 * Google Translate 무료 엔드포인트를 쓴다. 평문 전용이라
 * HTML을 그대로 넘기면 태그와 이미지 주소가 깨진다 — 호출부에서 걸러야 한다.
 */

const ENDPOINT = "https://translate.googleapis.com/translate_a/single";

/** 무료 엔드포인트를 몰아치지 않도록 동시 요청 수를 묶어 둔다 */
const CONCURRENCY = 3;

async function translateOne(text: string, source: string, target: string): Promise<string> {
  if (!text || !text.trim()) return text;
  try {
    const url = `${ENDPOINT}?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) return text; // 실패 시 원문 유지
    const data = await res.json();
    return (data[0] as Array<[string]>).map((segment) => segment[0]).join("");
  } catch {
    return text;
  }
}

/** 입력 순서 그대로 번역 결과를 돌려준다 */
export async function translateTexts(
  texts: string[],
  source = "ko",
  target = "en"
): Promise<string[]> {
  const results: string[] = new Array(texts.length);
  let cursor = 0;

  const worker = async () => {
    while (cursor < texts.length) {
      const index = cursor++;
      results[index] = await translateOne(texts[index], source, target);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, texts.length) }, () => worker())
  );

  return results;
}

/**
 * 이미지 URL 프래그먼트에 크롭 위치(object-position)와 확대 배율(scale)을
 * 함께 인코딩한다. 예: "https://.../photo.webp#pos=30,70,1.4" →
 * object-position: 30% 70%, 배율 1.4배 확대.
 *
 * 별도 DB 필드 대신 URL에 실은 이유 — 이 값을 쓰는 렌더링 지점이 20여 곳
 * (Hero, Equipment, Event, Service, SubPage 등)이라 각 데이터 타입에 필드를
 * 추가하고 그만큼의 컴포넌트 props를 새로 배선하는 대신, "이미지가 있는 곳엔
 * 이미 image: string 필드가 있다"는 사실 하나만으로 위치 정보가 함께 실려
 * 다니게 한다. ImageInput과 각 렌더링 지점만 이 유틸을 거치면 되고 그 사이의
 * 부모 컴포넌트/데이터 타입은 전혀 손댈 필요가 없다.
 *
 * scale은 세 번째 값으로 뒤에 덧붙여, scale 없이 저장된 기존 #pos=x,y 값도
 * (배율 없이 파싱되어) 그대로 호환된다.
 */

const POS_RE = /#pos=(-?[\d.]+),(-?[\d.]+)(?:,(-?[\d.]+))?$/;

export type ImagePosition = { x: number; y: number; scale: number };

const clamp01to100 = (n: number) => Math.min(100, Math.max(0, n));
/**
 * 1 미만(축소)도 허용한다 — 세로로 긴 이미지를 가로형 박스에 억지로 꽉
 * 채우지(cover) 않고, 전체가 잘리지 않게 줄여서(letterbox 여백과 함께)
 * 보여주고 싶을 때 쓴다. getImageCropStyle이 scale<1이면 object-fit을
 * contain으로 전환해 실제로 이미지 전체가 보이게 한다(1 이상에서는
 * 기존처럼 cover 위에서 확대).
 */
export const MIN_SCALE = 0.3;
const MAX_SCALE = 3;
const clampScale = (n: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, n));

/** URL에 실린 크롭 위치·배율을 읽는다. 없으면 null(=기본값 중앙·배율 1로 취급). */
export function parseImagePosition(url: string | null | undefined): ImagePosition | null {
  if (!url) return null;
  const m = url.match(POS_RE);
  if (!m) return null;
  const x = Number(m[1]);
  const y = Number(m[2]);
  const scale = m[3] !== undefined ? Number(m[3]) : 1;
  if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(scale)) return null;
  return { x: clamp01to100(x), y: clamp01to100(y), scale: clampScale(scale) };
}

/** 위치 프래그먼트를 뗀 순수 URL. <img src>/<video src>/업로드 등 실제 리소스를 가리킬 때 사용. */
export function stripImagePosition(url: string): string {
  return url.replace(POS_RE, "");
}


/**
 * object-cover 프레임 안에서 크롭 위치·확대를 함께 적용하는 style 객체.
 * scale >= 1(확대)은 object-position만으로 표현할 수 없어(object-fit: cover는
 * 확대를 지원하지 않음) transform: scale()을 함께 쓴다 — transform-origin을
 * object-position과 동일하게 맞춰야 확대 중심이 사용자가 고른 초점과 일치한다.
 * 배율이 1(기본값)이면 transform을 아예 넣지 않아 기존 렌더링과 100% 동일하다.
 *
 * scale < 1(축소)은 다르게 처리한다 — cover 위에서 그대로 축소하면 이미
 * cover가 잘라낸 결과물을 한 번 더 줄이는 것뿐이라 "전체 보이기"가 안 된다.
 * 대신 object-fit 자체를 contain으로 바꿔 이미지 전체가 프레임 안에 들어가게
 * 하고(모자란 자리는 배경색 여백), objectPosition은 그 안에서 이미지가
 * 붙는 위치로 쓰인다. 세로로 긴 이미지를 가로형 박스에 잘리지 않게 넣고
 * 싶을 때(예: 인물 전신 사진) 이 경로를 쓴다.
 */
export function getImageCropStyle(url: string | null | undefined): {
  objectFit?: "contain";
  objectPosition: string;
  transform?: string;
  transformOrigin?: string;
} {
  const pos = parseImagePosition(url);
  if (!pos) return { objectPosition: "50% 50%" };
  const objectPosition = `${pos.x}% ${pos.y}%`;
  if (pos.scale < 1) return { objectFit: "contain", objectPosition };
  if (pos.scale === 1) return { objectPosition };
  return { objectPosition, transform: `scale(${pos.scale})`, transformOrigin: objectPosition };
}

/** 순수 URL에 새 크롭 위치·배율을 붙인다. 중앙(50,50)·배율 1이면 프래그먼트를 굳이 남기지 않는다. */
export function setImagePosition(url: string, x: number, y: number, scale = 1): string {
  const clean = stripImagePosition(url);
  const cx = clamp01to100(x);
  const cy = clamp01to100(y);
  const cs = clampScale(scale);
  if (cx === 50 && cy === 50 && cs === 1) return clean;
  return `${clean}#pos=${cx.toFixed(1)},${cy.toFixed(1)},${cs.toFixed(2)}`;
}

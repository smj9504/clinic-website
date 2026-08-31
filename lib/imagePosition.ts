/**
 * 이미지 URL 프래그먼트에 크롭 위치(object-position)를 함께 인코딩한다.
 * 예: "https://.../photo.webp#pos=30,70" → object-position: 30% 70%.
 *
 * 별도 DB 필드 대신 URL에 실은 이유 — 이 값을 쓰는 렌더링 지점이 20여 곳
 * (Hero, Equipment, Event, Service, SubPage 등)이라 각 데이터 타입에 필드를
 * 추가하고 그만큼의 컴포넌트 props를 새로 배선하는 대신, "이미지가 있는 곳엔
 * 이미 image: string 필드가 있다"는 사실 하나만으로 위치 정보가 함께 실려
 * 다니게 한다. ImageInput과 각 렌더링 지점만 이 유틸을 거치면 되고 그 사이의
 * 부모 컴포넌트/데이터 타입은 전혀 손댈 필요가 없다.
 */

const POS_RE = /#pos=(-?[\d.]+),(-?[\d.]+)$/;

export type ImagePosition = { x: number; y: number };

const clamp01to100 = (n: number) => Math.min(100, Math.max(0, n));

/** URL에 실린 크롭 위치를 읽는다. 없으면 null(=기본값 중앙으로 취급). */
export function parseImagePosition(url: string | null | undefined): ImagePosition | null {
  if (!url) return null;
  const m = url.match(POS_RE);
  if (!m) return null;
  const x = Number(m[1]);
  const y = Number(m[2]);
  if (Number.isNaN(x) || Number.isNaN(y)) return null;
  return { x: clamp01to100(x), y: clamp01to100(y) };
}

/** 위치 프래그먼트를 뗀 순수 URL. <img src>/<video src>/업로드 등 실제 리소스를 가리킬 때 사용. */
export function stripImagePosition(url: string): string {
  return url.replace(POS_RE, "");
}

/** CSS object-position 값. 위치가 없으면 중앙(기본 object-cover 동작과 동일). */
export function toObjectPosition(url: string | null | undefined): string {
  const pos = parseImagePosition(url);
  if (!pos) return "50% 50%";
  return `${pos.x}% ${pos.y}%`;
}

/** 순수 URL에 새 크롭 위치를 붙인다. 중앙(50,50)이면 프래그먼트를 굳이 남기지 않는다. */
export function setImagePosition(url: string, x: number, y: number): string {
  const clean = stripImagePosition(url);
  const cx = clamp01to100(x);
  const cy = clamp01to100(y);
  if (cx === 50 && cy === 50) return clean;
  return `${clean}#pos=${cx.toFixed(1)},${cy.toFixed(1)}`;
}

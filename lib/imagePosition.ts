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
 * 프레임과 이미지의 실제 크기. scale<1(축소) 구간을 연속적으로 그리려면
 * "얼마나 줄여야 전체가 보이는가"를 알아야 하는데, 그 값이 이미지 비율과
 * 프레임 비율의 관계에서만 나오기 때문에 필요하다.
 */
export type CropFrameMetrics = {
  frameWidth: number;
  frameHeight: number;
  imageWidth: number;
  imageHeight: number;
};

/**
 * contain 기준에서 cover와 똑같이 보이게 만드는 배율.
 * contain은 두 축 중 작은 fit 배율을, cover는 큰 fit 배율을 쓰므로
 * 그 비(比)가 곧 "contain을 cover로 만드는 확대율"이다. 프레임과 이미지
 * 비율이 같으면 1이 되어 축소해도 여백이 생기지 않는다(정상).
 */
function coverOverContain(m: CropFrameMetrics): number | null {
  const { frameWidth, frameHeight, imageWidth, imageHeight } = m;
  if (!(frameWidth > 0 && frameHeight > 0 && imageWidth > 0 && imageHeight > 0)) return null;
  const fitX = frameWidth / imageWidth;
  const fitY = frameHeight / imageHeight;
  const ratio = Math.max(fitX, fitY) / Math.min(fitX, fitY);
  return Number.isFinite(ratio) && ratio > 0 ? ratio : null;
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
 * 붙는 위치로 쓰인다.
 *
 * 다만 contain으로 "전환"만 하면 1.00x → 0.99x에서 이미지가 갑자기 전체
 * 크기로 튀어나온다(cover와 contain 사이가 끊겨 있다). metrics가 주어지면
 * 그 사이를 연속적으로 잇는다 — contain을 기준 레이아웃으로 두되 scale 1.00x
 * 에서는 cover와 똑같아지도록 transform으로 확대해 두고, scale이 MIN_SCALE로
 * 갈수록 그 확대를 1(=순수 contain, 전체 보임)까지 서서히 푼다. 따라서
 * 1.00x에서 여백이 0이고, 슬라이더를 내리는 만큼만 조금씩 여백이 생긴다.
 *
 * metrics가 없으면(이미지 크기를 알 수 없는 서버 렌더링·HTML 직렬화 지점 등)
 * 기존과 동일하게 contain으로 전환하기만 한다 — 호출부를 고치지 않아도
 * 지금까지의 동작이 그대로 유지된다.
 */
export function getImageCropStyle(
  url: string | null | undefined,
  metrics?: CropFrameMetrics | null
): {
  objectFit?: "contain";
  objectPosition: string;
  transform?: string;
  transformOrigin?: string;
} {
  const pos = parseImagePosition(url);
  if (!pos) return { objectPosition: "50% 50%" };
  const objectPosition = `${pos.x}% ${pos.y}%`;
  if (pos.scale === 1) return { objectPosition };
  if (pos.scale > 1) {
    return { objectPosition, transform: `scale(${pos.scale})`, transformOrigin: objectPosition };
  }

  // 여기부터 scale < 1 — 축소 구간
  const ratio = metrics ? coverOverContain(metrics) : null;
  if (ratio === null) return { objectFit: "contain", objectPosition };

  // scale 1 → ratio(=cover와 동일), scale MIN_SCALE → 1(=contain, 전체 보임)
  const t = (pos.scale - MIN_SCALE) / (1 - MIN_SCALE);
  const zoom = 1 + (ratio - 1) * t;
  if (zoom <= 1.0001) return { objectFit: "contain", objectPosition };
  return {
    objectFit: "contain",
    objectPosition,
    transform: `scale(${zoom.toFixed(4)})`,
    transformOrigin: objectPosition,
  };
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

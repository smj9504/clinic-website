/**
 * 게시글 HTML 필터 — 공지·이벤트·시술 상세·서브페이지 본문을 화면에 넣기 전에 거른다.
 *
 * 본문은 관리자 편집기(TipTap)가 만든 HTML을 그대로 dangerouslySetInnerHTML로 출력한다.
 * 관리자 계정이 탈취되면 본문에 스크립트를 심어 방문자를 공격할 수 있으므로(저장형 XSS),
 * 편집기가 만드는 태그·속성만 남기고 나머지는 지운다.
 *
 *   남김: 문단·제목·목록·인용·표·링크·이미지·동영상, style/class/data-* 속성
 *   지움: script·style·iframe·object·embed·form 등 태그, on* 이벤트 속성,
 *         javascript:/vbscript:/data: 링크, CSS 안의 expression()·javascript:
 *
 * 서버·브라우저 어디서 불러도 같은 결과가 나도록 DOM 없이 동작하는 js-xss를 쓴다.
 */

import { FilterXSS, escapeAttrValue, safeAttrValue as defaultSafeAttrValue, type IWhiteList } from "xss";

/** 태그마다 공통으로 허용하는 속성 (data-*는 아래에서 따로 허용) */
const COMMON_ATTRS = ["style", "class", "id", "title", "dir", "lang", "align"];

const TAG_ATTRS: Record<string, string[]> = {
  a: ["href", "target", "rel", "name"],
  img: ["src", "alt", "width", "height", "loading", "decoding"],
  video: ["src", "controls", "poster", "width", "height", "playsinline", "muted", "loop", "autoplay", "preload"],
  source: ["src", "type"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan", "scope"],
  col: ["span", "width"],
  colgroup: ["span"],
  ol: ["start", "type", "reversed"],
  li: ["value"],
};

const TAGS = [
  "p", "br", "hr", "div", "span", "section", "article",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "u", "s", "del", "ins", "mark", "small", "sub", "sup", "code", "pre", "kbd", "q", "cite", "abbr",
  "blockquote", "ul", "ol", "li", "dl", "dt", "dd",
  "a", "img", "figure", "figcaption", "picture", "video", "source",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "colgroup", "col",
];

const whiteList: IWhiteList = Object.fromEntries(TAGS.map((t) => [t, [...COMMON_ATTRS, ...(TAG_ATTRS[t] ?? [])]]));

/** 링크·이미지 주소로 허용하는 형식: http(s), mailto, tel, 사이트 안 경로(/, #, ./) */
const SAFE_URL = /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#|\.\.?\/|[^:]*$)/i;

/** CSS 값 안에 스크립트를 실행하는 표현이 있으면 버린다 */
const UNSAFE_CSS = /expression\s*\(|javascript\s*:|vbscript\s*:|behavior\s*:|-moz-binding|@import|url\s*\(\s*['"]?\s*(?!https?:|\/|data:image\/)/i;

const filter = new FilterXSS({
  whiteList,
  // 허용하지 않은 태그는 글자로 보이게 두지 않고 지운다(안의 글은 남긴다)
  stripIgnoreTag: true,
  // script·style은 안의 내용까지 통째로 지운다
  stripIgnoreTagBody: ["script", "style", "noscript", "template", "iframe", "object", "embed"],
  allowCommentTag: false,
  // style은 편집기가 쓰는 속성(object-position, --image-row-count 등)이 많아
  // CSS 속성 허용 목록 대신 위험한 표현만 따로 걸러낸다
  css: false,
  onIgnoreTagAttr(_tag, name, value) {
    // 편집기의 이미지 자르기·이미지 묶음 정보(data-width, data-slots 등)
    if (/^data-[a-z0-9-]+$/i.test(name)) return `${name}="${escapeAttrValue(value)}"`;
    return undefined; // 그 밖의 속성(on* 등)은 지운다
  },
  safeAttrValue(tag, name, value, cssFilter) {
    const v = value.trim();
    if (name === "style") return UNSAFE_CSS.test(v) ? "" : escapeAttrValue(v);
    if (name === "href" || name === "src" || name === "poster") {
      const compact = v.replace(/[\s\u0000-\u001f]+/g, "");
      if (!SAFE_URL.test(compact)) return "";
    }
    if (name === "target") return v === "_blank" || v === "_self" ? v : "";
    return defaultSafeAttrValue(tag, name, value, cssFilter);
  },
});

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  return filter.process(html);
}

/** <script type="application/ld+json"> 안에 넣을 JSON — 문자열에 </script>가 있어도 태그가 끊기지 않게 한다 */
export function jsonForScriptTag(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

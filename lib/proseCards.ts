/**
 * body richtext 안의 "h2 > img > (h3+p) x N" 패턴을 3열 포인트 카드로,
 * 혹은 태그·장점까지 갖춘 "h2 > img > (h3+p+ul+ul) x N" 패턴을 탭 전환
 * UI로 변환하기 위해, 앞뒤 원본 HTML은 그대로 두고 그 구간만 파싱해
 * 데이터로 뽑아낸다. 카드/탭용 이미지가 콘텐츠에 없어 h2 섹션 공용
 * 이미지를 그대로 재사용한다.
 *
 * 탭 패턴(h3+p 뒤에 ul이 정확히 두 개 연달아 옴)이 감지되면 그 구간 전체를
 * "tabs" 세그먼트로 처리한다 — 첫 번째 ul은 해시태그(#관절교정 등), 두 번째
 * ul은 장점 목록이다. 이 더 엄격한 마크업이 없는 기존 body(h3+p만 있는 경우)는
 * 지금까지처럼 "cards" 세그먼트로 그대로 렌더링되어 회귀가 없다.
 */
export type ProsePoint = { title: string; body: string };

export type ProseCardGroup = {
  /** 클러스터 바로 앞에 h2+안내문이 붙어 있었을 때만 채워진다 (섹션 자체 제목이 없는 경우 빈 문자열) */
  title: string;
  intro: string;
  image: string | null;
  imageAlt: string;
  points: ProsePoint[];
};

export type ProseTabPoint = ProsePoint & {
  tags: string[];
  benefits: string[];
};

export type ProseTabGroup = {
  title: string;
  intro: string;
  image: string | null;
  imageAlt: string;
  points: ProseTabPoint[];
};

export type ProseStepGroup = {
  title: string;
  image: string | null;
  imageAlt: string;
  intro: string;
  steps: string[];
};

export type ProseSegment =
  | { type: "html"; html: string }
  | { type: "cards"; group: ProseCardGroup }
  | { type: "tabs"; group: ProseTabGroup }
  | { type: "steps"; group: ProseStepGroup };

export type ChecklistHeroItem = { label: string; detail: string };

export type ChecklistHeroExtraction = {
  title: string;
  items: ChecklistHeroItem[];
  /** 매칭된 h3+ul 블록을 제거한 나머지 body — 이 문자열을 splitProseIntoSegments에 넘겨 이어서 렌더링한다 */
  remainingHtml: string;
};

const MIN_POINTS = 3;

/**
 * "체크리스트 히어로"(좌측 사진 + 우측 다크 카드 그리드) 전용 추출기.
 * splitProseIntoSegments와 달리 임의의 h3+ul을 전부 승격하지 않고, 정확히
 * 지정된 제목 텍스트에 매칭되는 h3+ul 한 블록만 찾아 제거한다 — 다른
 * 서브페이지의 체크리스트(h3+ul/h2~ul CSS로 이미 스타일링됨)는 이 함수의
 * 대상이 아니므로 호출 지점에서 slug까지 함께 좁혀서 써야 한다.
 * li 안의 "<strong>라벨</strong> — 설명" 패턴은 label/detail로 분리해
 * 카드 안에서도 라벨을 강조 텍스트로 렌더링할 수 있게 한다.
 */
export function extractChecklistHero(html: string, headingText: string): ChecklistHeroExtraction | null {
  if (typeof window === "undefined" || !html.includes("<h3")) return null;

  const doc = new DOMParser().parseFromString(html, "text/html");
  const isBlank = (n: ChildNode) => n.nodeType === Node.TEXT_NODE && !n.textContent?.trim();
  const nodes = Array.from(doc.body.childNodes).filter((n) => !isBlank(n));

  for (let i = 0; i < nodes.length; i++) {
    const h3 = nodes[i] instanceof Element ? (nodes[i] as Element) : null;
    if (h3?.tagName !== "H3" || h3.textContent?.trim() !== headingText) continue;

    const ul = nodes[i + 1] instanceof Element ? (nodes[i + 1] as Element) : null;
    if (ul?.tagName !== "UL") continue;

    const items: ChecklistHeroItem[] = Array.from(ul.querySelectorAll("li")).map((li) => {
      const strong = li.querySelector("strong");
      if (strong) {
        const label = strong.textContent?.trim() ?? "";
        // "<strong>라벨</strong> — 설명" 중 strong을 뺀 나머지 텍스트에서 앞의 구분자(—, -, :)를 정리
        const rest = (li.textContent ?? "").replace(label, "").replace(/^[\s—–\-:]+/, "").trim();
        return { label, detail: rest };
      }
      return { label: li.textContent?.trim() ?? "", detail: "" };
    });

    if (items.length === 0) return null;

    // 매칭된 h3와 ul 두 노드만 원본에서 제거한 나머지를 remainingHtml로 직렬화
    const wrapper = doc.createElement("div");
    nodes.forEach((n) => {
      if (n === h3 || n === ul) return;
      wrapper.appendChild(n.cloneNode(true));
    });

    return { title: h3.textContent?.trim() ?? headingText, items, remainingHtml: wrapper.innerHTML };
  }

  return null;
}

/**
 * BodyAreaMap/TreatmentAreaMap처럼 체크리스트를 완전히 갈음하는 시각적
 * 컴포넌트로 승격할 때 쓰는 범용 h2+ul 추출기. extractChecklistHero와
 * 형제 함수지만 대상 태그가 h3가 아니라 h2라는 점만 다르다 — pain-treatment의
 * "이런 통증으로 고민하고 계신가요"(h2+ul)는 h3+ul 전용인 extractChecklistHero로
 * 잡히지 않으므로 별도로 둔다. 매칭된 h2+ul 두 노드만 제거한 나머지를
 * remainingHtml로 반환해, 맵 컴포넌트가 체크리스트를 완전히 대체하고
 * 원본 텍스트가 중복 렌더링되지 않게 한다.
 */
export function extractH2Checklist(
  html: string,
  headingText: string
): { title: string; items: string[]; remainingHtml: string } | null {
  if (typeof window === "undefined" || !html.includes("<h2")) return null;

  const doc = new DOMParser().parseFromString(html, "text/html");
  const isBlank = (n: ChildNode) => n.nodeType === Node.TEXT_NODE && !n.textContent?.trim();
  const nodes = Array.from(doc.body.childNodes).filter((n) => !isBlank(n));

  for (let i = 0; i < nodes.length; i++) {
    const h2 = nodes[i] instanceof Element ? (nodes[i] as Element) : null;
    if (h2?.tagName !== "H2" || h2.textContent?.trim() !== headingText) continue;

    const ul = nodes[i + 1] instanceof Element ? (nodes[i + 1] as Element) : null;
    if (ul?.tagName !== "UL") continue;

    const items = Array.from(ul.querySelectorAll("li"))
      .map((li) => li.textContent?.trim() ?? "")
      .filter(Boolean);
    if (items.length === 0) return null;

    const wrapper = doc.createElement("div");
    nodes.forEach((n) => {
      if (n === h2 || n === ul) return;
      wrapper.appendChild(n.cloneNode(true));
    });

    return { title: h2.textContent?.trim() ?? headingText, items, remainingHtml: wrapper.innerHTML };
  }

  return null;
}

function listItems(el: Element | null): string[] {
  if (!el || el.tagName !== "UL") return [];
  return Array.from(el.querySelectorAll("li"))
    .map((li) => li.textContent?.trim() ?? "")
    .filter(Boolean);
}

export function splitProseIntoSegments(html: string): ProseSegment[] {
  // h3(cards/tabs) 또는 ol(steps) 둘 중 하나도 없으면 세 패턴 다 매칭될 수
  // 없으므로 DOM 파싱 없이 그대로 반환한다. steps 패턴(약침/추나치료 등)은
  // h3 없이 h2>img>p>ol만으로 이루어져 있어, 기존처럼 "<h3" 유무만 보면
  // 이 페이지들이 파싱을 아예 건너뛰고 세그먼트화되지 않는다.
  if (typeof window === "undefined" || (!html.includes("<h3") && !html.includes("<ol"))) {
    return [{ type: "html", html }];
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  // admin richtext는 태그 사이에 줄바꿈이 들어가 DOMParser가 이를 공백 text
  // 노드로 만든다 — "다음 형제가 h3다" 같은 인접성 검사가 전부 어긋나므로
  // 의미 없는 공백 노드는 애초에 순회 대상에서 제외한다.
  const isBlank = (n: ChildNode) => n.nodeType === Node.TEXT_NODE && !n.textContent?.trim();
  const nodes = Array.from(doc.body.childNodes).filter((n) => !isBlank(n));
  const segments: ProseSegment[] = [];
  let htmlBuffer: ChildNode[] = [];

  const flushHtml = () => {
    if (htmlBuffer.length === 0) return;
    const wrapper = doc.createElement("div");
    htmlBuffer.forEach((n) => wrapper.appendChild(n.cloneNode(true)));
    segments.push({ type: "html", html: wrapper.innerHTML });
    htmlBuffer = [];
  };

  /**
   * cards/tabs 클러스터가 확정된 시점에 호출한다. 기존 동작(이미지만 버퍼에서
   * 제거)은 항상 수행하고, 추가로 그 이미지 바로 앞이 h2이며 이미지와 첫 h3
   * 사이에 안내 문단(p) 정확히 하나(또는 0개)만 있으면 "이 h2 섹션 전체가
   * 카드 클러스터다"로 보고 h2+안내문까지 버퍼에서 함께 제거한다 — 그러지
   * 않으면 admin에서 이 카드를 구조화 필드로 옮겨 렌더링을 건너뛸 때
   * (page.pointCards 등) 섹션 제목과 안내문만 본문에 고아처럼 남는다.
   * h2+안내문 조건에 맞지 않으면(h2가 없거나, p가 둘 이상 끼어 있는 등)
   * title/intro는 빈 문자열로 반환하고 이미지 제거만 수행한다 — 다른
   * 정상 케이스(카드 앞에 h2가 없는 body 등)를 깨지 않기 위해서다.
   */
  const extractClusterHeading = (clusterStartIndex: number): { title: string; intro: string } => {
    if (lastImageIndex < 0 || htmlBuffer[lastImageIndex] !== lastImage) return { title: "", intro: "" };

    const imgPos = nodes.indexOf(lastImage as ChildNode);
    let h2: Element | null = null;
    let introP: ChildNode | undefined;
    if (imgPos >= 1) {
      const candidate = nodes[imgPos - 1];
      if (candidate instanceof Element && candidate.tagName === "H2") {
        const between = nodes.slice(imgPos + 1, clusterStartIndex);
        const onlyIntro = between.length <= 1 && (between.length === 0 || (between[0] instanceof Element && (between[0] as Element).tagName === "P"));
        if (onlyIntro) {
          h2 = candidate;
          introP = between[0];
        }
      }
    }

    if (h2) htmlBuffer.splice(htmlBuffer.indexOf(h2 as ChildNode), 1);
    htmlBuffer.splice(htmlBuffer.indexOf(lastImage as ChildNode), 1); // 기존 동작: 이미지는 항상 제거
    if (introP) htmlBuffer.splice(htmlBuffer.indexOf(introP), 1);

    return {
      title: h2?.textContent?.trim() ?? "",
      intro: introP ? (introP.textContent?.trim() ?? "") : "",
    };
  };

  // "img 바로 다음이 h3다"라고 가정하면 img와 첫 h3 사이에 안내 문단이
  // 끼어 있는 실제 콘텐츠(예: "고운빛한의원의 교통사고 후유증 치료" 섹션처럼
  // img 다음에 소개 p가 오고 그 다음에야 h3+p...가 시작하는 경우)에서
  // 클러스터를 아예 못 찾는다. 대신 img는 일단 평소처럼 버퍼에 순서대로
  // 넣어 두되, 가장 최근 img가 몇 번째로 들어갔는지(lastImageIndex)를
  // 함께 기억한다. 이후 h3 클러스터가 그 이미지를 실제로 가져가게 되면
  // 버퍼에서 도로 빼내 두 번 렌더링되지 않게 한다 — 클러스터가 안 잡히면
  // img는 원래 위치 그대로 일반 HTML 흐름에 남는다.
  let lastImage: Element | null = null;
  let lastImageIndex = -1;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const el = node instanceof Element ? node : null;

    if (el?.tagName === "IMG") {
      htmlBuffer.push(node);
      lastImage = el;
      lastImageIndex = htmlBuffer.length - 1;
      continue;
    }

    // "h2 > img > p > ol" — "약침치료는 이렇게 진행됩니다"처럼 진행 순서를
    // 안내하는 섹션 전용 시그니처. h3+p(cards)나 h3+p+ul+ul(tabs)과 달리
    // h2 자체가 클러스터의 시작이고, 그 h2 섹션 안에 이미지 한 장 + 안내
    // 문단 하나 + 순서 목록 하나가 뒤따르는 정확히 4개 노드 뭉치일 때만
    // 승격한다. ol 뒤에 오는 마무리 문단(예: "1회 시술 시간은...")은 이
    // 클러스터에 포함하지 않고 ol에서 바로 세그먼트를 닫아, 다음 p부터는
    // 지금처럼 일반 prose로 흘러가게 한다.
    if (el?.tagName === "H2") {
      const asEl = (n: ChildNode | undefined) => (n instanceof Element ? n : null);
      const h2 = el;
      const stepImg = asEl(nodes[i + 1]);
      const stepP = asEl(nodes[i + 2]);
      const stepOl = asEl(nodes[i + 3]);

      if (
        stepImg?.tagName === "IMG" &&
        stepP?.tagName === "P" &&
        stepOl?.tagName === "OL"
      ) {
        const steps = Array.from(stepOl.querySelectorAll("li"))
          .map((li) => li.textContent?.trim() ?? "")
          .filter(Boolean);

        if (steps.length >= MIN_POINTS) {
          flushHtml();
          segments.push({
            type: "steps",
            group: {
              title: h2.textContent?.trim() ?? "",
              image: stepImg.getAttribute("src"),
              imageAlt: stepImg.getAttribute("alt") ?? "",
              intro: stepP.textContent?.trim() ?? "",
              steps,
            },
          });
          i += 3; // h2(현재) + img + p + ol 4개 노드를 전부 소비
          continue;
        }
      }
    }

    if (el?.tagName === "H3") {
      const asEl = (n: ChildNode | undefined) => (n instanceof Element ? n : null);

      // 먼저 h3+p+ul+ul(탭) 패턴을 시도하고, 안 맞으면 h3+p(카드) 패턴으로 폴백한다.
      const tabPoints: ProseTabPoint[] = [];
      let jTabs = i;
      while (jTabs + 3 < nodes.length) {
        const h3 = asEl(nodes[jTabs]);
        const p = asEl(nodes[jTabs + 1]);
        const ul1 = asEl(nodes[jTabs + 2]);
        const ul2 = asEl(nodes[jTabs + 3]);
        if (
          h3?.tagName === "H3" &&
          p?.tagName === "P" &&
          ul1?.tagName === "UL" &&
          ul2?.tagName === "UL"
        ) {
          tabPoints.push({
            title: h3.textContent?.trim() ?? "",
            body: p.textContent?.trim() ?? "",
            tags: listItems(ul1),
            benefits: listItems(ul2),
          });
          jTabs += 4;
        } else {
          break;
        }
      }

      if (tabPoints.length >= MIN_POINTS) {
        const heading = extractClusterHeading(i);
        flushHtml();
        segments.push({
          type: "tabs",
          group: {
            title: heading.title,
            intro: heading.intro,
            image: lastImage?.getAttribute("src") ?? null,
            imageAlt: lastImage?.getAttribute("alt") ?? "",
            points: tabPoints,
          },
        });
        lastImage = null;
        lastImageIndex = -1;
        i = jTabs - 1;
        continue;
      }

      const points: ProsePoint[] = [];
      let j = i;
      while (j + 1 < nodes.length) {
        const h3 = asEl(nodes[j]);
        const p = asEl(nodes[j + 1]);
        if (h3?.tagName === "H3" && p?.tagName === "P") {
          points.push({ title: h3.textContent?.trim() ?? "", body: p.textContent?.trim() ?? "" });
          j += 2;
        } else {
          break;
        }
      }

      if (points.length >= MIN_POINTS) {
        const heading = extractClusterHeading(i);
        flushHtml();
        segments.push({
          type: "cards",
          group: {
            title: heading.title,
            intro: heading.intro,
            image: lastImage?.getAttribute("src") ?? null,
            imageAlt: lastImage?.getAttribute("alt") ?? "",
            points,
          },
        });
        lastImage = null;
        lastImageIndex = -1;
        i = j - 1;
        continue;
      }
    }

    htmlBuffer.push(node);
  }

  flushHtml();
  return segments;
}

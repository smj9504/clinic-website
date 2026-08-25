/**
 * Mock data — 실제 운영 시 백엔드 API로 대체됩니다.
 * Admin 페이지에서 수정한 콘텐츠가 이 데이터 구조 그대로 DB에 저장됩니다.
 */

// 폴백용 빈 이미지 객체 — 실제 데이터는 Supabase DB에서 로드
export const sampleImages = {
  hero1: "",
  hero2: "",
  hero3: "",
  event1: "",
  event2: "",
  event3: "",
  director: "",
  facility: "",
  facility2: "",
  facility3: "",
};

export type Event = {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  date: string;
  startDate?: string; // "2026-05-01"
  endDate?: string;   // "2026-05-31"
};

export const events: Event[] = [];

export type Treatment = {
  id: number;
  number: string;
  title: string;
  description: string;
  longDescription?: string;
  slug: string;
  image?: string;
};

export const treatments: Treatment[] = [
  {
    id: 1,
    number: "01",
    title: "통증진료",
    description: "허리·목·관절 등 만성 통증을 근본부터 회복하는 한의 치료",
    slug: "pain",
  },
  {
    id: 2,
    number: "02",
    title: "자동차보험\n진료",
    description: "교통사고 후 통증·후유증을 보험 적용으로 안심 치료",
    slug: "insurance",
  },
  {
    id: 3,
    number: "03",
    title: "다이어트\n진료",
    description: "체질 분석 기반 맞춤 처방으로 건강한 체중 감량",
    slug: "diet",
  },
  {
    id: 4,
    number: "04",
    title: "미용시술\n진료",
    description: "한의 미용 시술로 자연스러운 안면 라인과 피부 관리",
    slug: "beauty",
  },
  {
    id: 5,
    number: "05",
    title: "보약처방",
    description: "개인 체질에 맞춘 보약으로 기력 회복과 면역력 강화",
    slug: "tonic",
  },
];

export type Director = {
  name: string;
  nameEn: string;
  title: string;
  quote: string;
  bio: string[];
  image: string;
};

export const director: Director = {
  name: "허은주",
  nameEn: "HEO EUNJU",
  title: "대표 원장",
  quote:
    "환자분의 몸과 마음을 함께 살피며,\n근본적인 회복을 돕는 진료를 추구합니다.",
  bio: [
    "경희대학교 한의과대학 졸업",
    "경희대학교 대학원 한의학 석·박사 취득",
    "대한스포츠한의학회 팀닥터 과정 수료",
    "척추신경추나의학회 정회원 및 인증의",
    "대한한방내과학회 정회원",
  ],
  image: sampleImages.director,
};

export type Notice = {
  id: number;
  type: "notice" | "event";
  title: string;
  content?: string;
  date: string;
  startDate?: string; // "2026-05-01"
  endDate?: string;   // "2026-05-31"
};

export const notices: Notice[] = [
  {
    id: 1,
    type: "event",
    title: "5월 다이어트 패키지 30% 할인 이벤트 안내",
    content: "한의학적 체질 분석을 바탕으로 한 개인 맞춤 다이어트 프로그램을 5월 한 달간 30% 할인된 가격으로 제공합니다.\n\n대상: 체중 감량을 원하시는 모든 분\n기간: 2026년 5월 1일 ~ 5월 31일\n\n예약 및 상담은 전화 또는 네이버 예약을 이용해 주세요.",
    date: "2026.05.14",
    startDate: "2026-05-01",
    endDate: "2026-05-31",
  },
  {
    id: 2,
    type: "notice",
    title: "석가탄신일 휴진 안내 (5월 25일)",
    content: "석가탄신일(5월 25일, 월요일)은 공휴일로 휴진합니다.\n\n5월 26일(화요일)부터 정상 진료합니다.\n불편을 드려 죄송합니다.",
    date: "2026.05.10",
    startDate: "2026-05-10",
    endDate: "2026-05-25",
  },
  {
    id: 3,
    type: "notice",
    title: "진료 시간 변경 안내 - 토요일 오후 진료 추가",
    content: "환자분들의 요청에 따라 토요일 오후 진료를 추가합니다.\n\n변경 전: 토요일 09:00 ~ 13:00\n변경 후: 토요일 09:00 ~ 16:00\n\n적용일: 2026년 5월 3일(토)부터\n점심시간(13:00~14:00)은 동일하게 운영됩니다.",
    date: "2026.05.02",
    startDate: "2026-05-02",
  },
  {
    id: 4,
    type: "notice",
    title: "신규 한의사 부원장 부임 안내",
    content: "안녕하세요, 고운빛한의원입니다.\n\n2026년 4월 21일부터 새로운 부원장님이 합류하셨습니다.\n보다 전문적이고 세심한 진료를 위해 최선을 다하겠습니다.\n\n감사합니다.",
    date: "2026.04.20",
    startDate: "2026-04-20",
  },
];

export type HeroSlide = {
  id: number;
  label: string;
  title: string;
  subtitle: string;
  image: string;
  linkLabel?: string;
  linkUrl?: string;
};

export const heroSlides: HeroSlide[] = [
  {
    id: 1,
    label: "Korean Medicine Clinic",
    title: "지친 마음을 먼저 헤아리는\n한 첩의 위로와 회복",
    subtitle:
      "오늘의 아픔이 내일의 걸림돌이 되지 않도록\n잊고 지냈던 건강하고 활기찬 일상을 당신께 돌려드립니다",
    image: sampleImages.hero1,
    linkLabel: "진료 안내",
    linkUrl: "/treatments",
  },
  {
    id: 2,
    label: "Tradition meets Modern",
    title: "몸과 마음의 쉼표가 되는 곳\n온전한 회복을 처방합니다",
    subtitle:
      "전통 한의학의 지혜와 현대 의학의 정밀함을 함께 담아\n당신의 건강한 일상을 처방합니다",
    image: sampleImages.hero2,
    linkLabel: "진료 안내",
    linkUrl: "/treatments",
  },
  {
    id: 3,
    label: "Care from the Root",
    title: "시간이 빚어낸 정성으로\n건강의 뿌리를 다스립니다",
    subtitle:
      "당신의 체질과 일상을 깊이 살피며\n근본적인 회복을 도와드립니다",
    image: sampleImages.hero3,
    linkLabel: "진료 안내",
    linkUrl: "/treatments",
  },
];

export type SubPage = {
  id: string;
  slug: string;
  parentMenuId: string;
  title: string;
  intro?: string;
  body: string;
  image?: string;
  /** 허브 페이지(피부미용/한방치료)에서 이 항목 블록 아래에 좌우 꽉 채워 표시하는 이미지 */
  fullBleedImage?: string;
  isHidden: boolean;
  sortOrder: number;
};

export const subPages: SubPage[] = [
  {
    id: "sp1",
    slug: "lifting",
    parentMenuId: "m7",
    title: "리프팅",
    intro:
      "탄력이 무너지면 표정과 인상까지 달라 보입니다.\n고운빛한의원은 피부 처짐의 원인을 층위별로 살펴, HIFU·고주파 장비와 한방 순환 관리를 함께 활용해 무리 없는 탄력 개선을 돕습니다.\n자연스러운 변화가 오래 이어질 수 있도록 함께합니다.",
    body: `<p>피부 탄력은 어느 날 갑자기 사라지지 않습니다. 콜라겐과 탄력섬유가 서서히 줄어들며 처짐과 윤곽 흐트러짐으로 나타나는데, 원인이 되는 피부층은 사람마다 다릅니다. 고운빛한의원은 피부 상태를 정밀하게 진단한 뒤, 그에 맞는 리프팅 장비를 선택해 무리하지 않는 개선을 제안합니다.</p>
<h3>이런 변화가 고민이신가요</h3>
<ul>
<li>볼과 턱선이 처지며 윤곽이 흐트러진 느낌이 드는 경우</li>
<li>탄력이 떨어지며 잔주름이 도드라지는 경우</li>
<li>피부에 힘이 없고 칙칙해 보이는 경우</li>
<li>수술 없이 자연스러운 개선을 원하는 경우</li>
</ul>
<h3>고운빛의 리프팅 접근</h3>
<p>HIFU(고강도 집속 초음파)와 고주파 장비로 피부 깊은 층에 에너지를 전달해 탄력 개선을 유도하고, 시술 부위와 강도는 피부 두께와 처짐 정도에 따라 다르게 설계합니다. 시술 후에는 한방 순환 관리를 더해 회복을 돕고, 개선된 컨디션이 오래 유지될 수 있도록 관리합니다.</p>
<img src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&auto=format&fit=crop&q=75" alt="리프팅 장비 시술 모습" />
<h3>이런 분들께 권해드립니다</h3>
<ul>
<li>처진 피부와 흐트러진 윤곽 개선을 원하는 분</li>
<li>다운타임 부담 없이 관리받고 싶은 분</li>
<li>일시적인 효과보다 꾸준한 관리를 원하는 분</li>
</ul>
<p>정확한 시술 방식과 예상 회복 기간은 피부 상태에 따라 달라질 수 있어, 상담을 통해 개인별로 안내해 드립니다.</p>`,
    image: "https://images.unsplash.com/photo-1616394158624-0ecca9ea6a30?w=1200&auto=format&fit=crop&q=75",
    fullBleedImage: "https://images.unsplash.com/photo-1616394158624-0ecca9ea6a30?w=1920&auto=format&fit=crop&q=75",
    isHidden: false,
    sortOrder: 0,
  },
  {
    id: "sp2",
    slug: "laser",
    parentMenuId: "m7",
    title: "레이저",
    intro:
      "기미와 잡티, 모공과 흉터까지 — 피부 고민은 저마다 원인이 다릅니다.\n고운빛한의원은 피부 진단을 먼저 거쳐 고민에 맞는 레이저를 선택하고, 최소한의 자극으로 개선을 이끌어냅니다.\n피부가 편안하게 회복될 수 있도록 세심하게 살피겠습니다.",
    body: `<p>레이저는 파장과 에너지에 따라 작용하는 피부층과 효과가 달라집니다. 고운빛한의원은 색소·모공·흉터 등 고민의 종류를 먼저 구분하고, 피부 두께와 민감도를 함께 살펴 적합한 레이저를 선택합니다. 자극을 최소화하면서 꾸준히 관리하는 방식을 우선합니다.</p>
<h3>레이저로 다가가는 피부 고민</h3>
<ul>
<li><strong>색소 고민</strong> — 기미·잡티·주근깨 등 칙칙함이 신경 쓰이는 경우</li>
<li><strong>모공·흉터 고민</strong> — 넓어진 모공, 여드름 자국으로 피부결이 고르지 않은 경우</li>
<li><strong>피부 톤 관리</strong> — 전체적인 피부 톤과 결을 부드럽게 정리하고 싶은 경우</li>
<li><strong>제모</strong> — 반복되는 제모 관리에서 벗어나고 싶은 경우</li>
</ul>
<h3>고운빛의 레이저 접근</h3>
<p>같은 고민이라도 피부 상태에 따라 필요한 파장과 강도는 다릅니다. 상담과 진단을 거쳐 개인에게 맞는 레이저를 선택하고, 회복 기간과 자극을 고려해 시술 주기를 함께 안내합니다.</p>
<img src="https://images.unsplash.com/photo-1598440947619-2c35bc9430c0?w=1200&auto=format&fit=crop&q=75" alt="레이저 시술 모습" />
<h3>이런 분들께 권해드립니다</h3>
<ul>
<li>색소나 흉터로 피부 톤이 고르지 않은 분</li>
<li>민감한 피부라 자극이 적은 관리가 필요한 분</li>
<li>일상에 지장 없이 꾸준히 관리하고 싶은 분</li>
</ul>
<p>보유 장비와 시술 방식은 장비소개 페이지에서 자세히 확인하실 수 있습니다.</p>`,
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=1200&auto=format&fit=crop&q=75",
    fullBleedImage: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=1920&auto=format&fit=crop&q=75",
    isHidden: false,
    sortOrder: 1,
  },
  {
    id: "sp3",
    slug: "skin-booster",
    parentMenuId: "m7",
    title: "스킨부스터",
    intro:
      "건조함과 잔주름은 피부 속 힘이 약해졌다는 신호입니다.\n고운빛한의원은 피부 속 환경을 채우는 스킨부스터와 한방 보습 관리를 함께 더해, 속부터 편안한 피부 컨디션을 만들어 갑니다.\n무리한 자극 없이, 꾸준히 좋아지는 관리를 제안합니다.",
    body: `<p>스킨부스터는 피부 속에 보습·영양 성분을 전달해 피부 컨디션을 관리하는 주사 시술입니다. 시술 후 바로 일상으로 복귀할 수 있을 만큼 부담이 적어, 정기적인 피부 관리 방법으로 많이 찾으시는 시술입니다.</p>
<h3>이런 고민에 도움이 될 수 있어요</h3>
<ul>
<li>계절이 바뀔 때마다 건조함이 심해지는 경우</li>
<li>세안 후 당김이 있고 피부에 힘이 없는 경우</li>
<li>잔주름과 칙칙함이 함께 신경 쓰이는 경우</li>
<li>화장이 잘 뜨고 피부 결이 고르지 않은 경우</li>
</ul>
<h3>고운빛의 스킨부스터 접근</h3>
<p>피부 상태와 고민에 따라 성분과 시술 부위, 주기를 다르게 설계합니다. 일반적으로 2~4주 간격으로 3회 내외 진행하며, 이후에는 컨디션에 맞춰 유지 관리를 안내해 드립니다. 시술과 함께 생활 속 보습 관리 방법도 함께 안내합니다.</p>
<img src="https://images.unsplash.com/photo-1620331311520-246422fd82f9?w=1200&auto=format&fit=crop&q=75" alt="스킨부스터 시술 모습" />
<h3>이런 분들께 권해드립니다</h3>
<ul>
<li>피부가 예민해 자극적인 시술이 부담스러운 분</li>
<li>건조함과 잔주름을 함께 관리하고 싶은 분</li>
<li>정기적인 피부 컨디션 관리를 원하는 분</li>
</ul>
<p>시술 종류와 주기는 피부 상태에 따라 달라질 수 있어, 상담을 통해 자세히 안내해 드립니다.</p>`,
    image: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=1200&auto=format&fit=crop&q=75",
    fullBleedImage: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=1920&auto=format&fit=crop&q=75",
    isHidden: false,
    sortOrder: 2,
  },
  {
    id: "sp4",
    slug: "pain-treatment",
    parentMenuId: "m8",
    title: "통증치료",
    intro:
      "목과 허리, 어깨와 무릎까지 우리 몸은 크고 작은 통증으로 신호를 보냅니다.\n고운빛한의원은 정밀한 진단으로 통증의 원인을 살펴, 침·약침, 추나요법, 부항·온열요법, 한약 등을 통합적으로 활용해 통증 완화와 기능 회복을 함께 관리합니다.\n통증 없이 편안한 일상으로 돌아가실 수 있도록 함께합니다.",
    body: "",
    image: "https://images.unsplash.com/photo-1559825481-12a05cc00344?w=1200&auto=format&fit=crop&q=75",
    isHidden: false,
    sortOrder: 0,
  },
  { id: "sp5", slug: "traffic-accident", parentMenuId: "m8", title: "교통사고 후유증", intro: "", body: "", image: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=1200&auto=format&fit=crop&q=75", isHidden: false, sortOrder: 1 },
  { id: "sp6", slug: "herbal-clinic", parentMenuId: "m8", title: "한약클리닉", intro: "", body: "", image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=1200&auto=format&fit=crop&q=75", isHidden: false, sortOrder: 2 },
  { id: "sp7", slug: "chuna", parentMenuId: "m8", title: "추나치료", intro: "", body: "", image: "https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=1200&auto=format&fit=crop&q=75", isHidden: false, sortOrder: 3 },
  {
    id: "sp8",
    slug: "pharmacopuncture",
    parentMenuId: "m8",
    title: "약침치료",
    intro:
      "약침치료는 정제된 한약 성분을 경혈에 직접 주입해 침과 한약의 효과를 함께 이끌어내는 한방 치료입니다. 통증 부위에 집중적으로 작용해 침 치료보다 더 빠르고 강한 자극을 줄 수 있어, 목·허리·관절 통증은 물론 다양한 증상에 폭넓게 활용됩니다. 고운빛한의원은 환자의 상태에 맞는 약침을 선별해 정밀하게 시술합니다.",
    body: `<p>약침치료는 한약재에서 유효 성분을 정제·추출해 경혈이나 통증 부위에 직접 주입하는 시술입니다. 일반 침 치료의 자극 효과와 한약의 약리 작용을 함께 이끌어낼 수 있어, 통증과 염증이 있는 부위에 보다 집중적으로 작용합니다.</p>
<h2>이런 증상에 활용됩니다</h2>
<ul>
<li>목·허리 디스크, 퇴행성관절염 등 근골격계 통증</li>
<li>오십견, 섬유근통 등 만성 통증</li>
<li>신경염, 두통 등 신경계 증상</li>
<li>만성피로, 비염 등 전신 컨디션 관리</li>
</ul>
<h2>약침치료는 이렇게 진행됩니다</h2>
<img src="https://images.unsplash.com/photo-1583912267670-46b6e0197ba3?w=1200&auto=format&fit=crop&q=75" alt="경혈에 약침을 주입하는 모습">
<p>고운빛한의원의 약침치료는 다음과 같은 순서로 이루어집니다.</p>
<ol>
<li>정밀한 진단을 통해 통증의 원인과 증상을 파악합니다.</li>
<li>환자의 체질과 증상에 맞는 약침의 종류를 선별합니다.</li>
<li>통증 부위나 관련 경혈에 소량씩 정밀하게 주입합니다.</li>
<li>필요에 따라 침·추나 등 다른 치료와 함께 병행합니다.</li>
</ol>
<p>1회 시술 시간은 짧은 편이며, 증상과 경과에 따라 여러 차례 진행하는 경우가 많습니다. 정확한 치료 계획은 진료 후 상담을 통해 안내해 드립니다.</p>
<h2>알아두시면 좋은 점</h2>
<p>약침치료는 건강보험이 적용되지 않는 비급여 치료입니다. 또한 한약재 알레르기 이력이 있으신 경우 사전에 반드시 말씀해 주시기 바랍니다. 임신 중이시거나 다른 지병이 있으신 경우에도 진료 전 상담을 통해 안전하게 안내해 드립니다.</p>
<hr>
<p>약침치료를 포함한 모든 치료는 환자 개개인의 상태에 대한 정확한 진단을 바탕으로 진행됩니다. 통증이나 만성 증상으로 불편을 느끼신다면, 고운빛한의원에서 상담받아 보시기 바랍니다.</p>`,
    image: "https://images.unsplash.com/photo-1583912267670-46b6e0197ba3?w=1200&auto=format&fit=crop&q=75",
    isHidden: false,
    sortOrder: 4,
  },
];

export const subPagesEn: SubPage[] = [
  {
    id: "sp1",
    slug: "lifting",
    parentMenuId: "m7",
    title: "Lifting",
    intro:
      "When elasticity fades, it shows in your expression and overall impression.\nGowoonbit examines the source of skin sagging layer by layer, combining HIFU and RF devices with Korean medicine circulation care for gentle, lasting improvement.\nWe work with you so natural change can last.",
    body: `<p>Skin elasticity doesn't disappear overnight. As collagen and elastic fibers gradually decline, sagging and blurred contours appear — and the skin layer responsible differs from person to person. Gowoonbit begins with a precise diagnosis, then selects the lifting equipment suited to your skin for gentle, considered improvement.</p>
<h3>Is this you?</h3>
<ul>
<li>Cheeks and jawline feel like they're sagging, blurring your contour</li>
<li>Reduced elasticity is making fine lines more noticeable</li>
<li>Skin feels weak and looks dull</li>
<li>You want natural improvement without surgery</li>
</ul>
<h3>Gowoonbit's approach to lifting</h3>
<p>HIFU and RF devices deliver energy deep into the skin to encourage elasticity improvement, with treatment area and intensity designed around your skin's thickness and degree of sagging. Afterward, Korean medicine circulation care supports recovery and helps your improved condition last longer.</p>
<img src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&auto=format&fit=crop&q=75" alt="Lifting treatment in progress" />
<h3>Recommended for</h3>
<ul>
<li>Those looking to improve sagging skin and blurred contours</li>
<li>Those who want care without downtime concerns</li>
<li>Those seeking steady care over one-time results</li>
</ul>
<p>The exact treatment approach and expected recovery time vary by skin condition, so we'll guide you individually during a consultation.</p>`,
    image: "https://images.unsplash.com/photo-1616394158624-0ecca9ea6a30?w=1200&auto=format&fit=crop&q=75",
    fullBleedImage: "https://images.unsplash.com/photo-1616394158624-0ecca9ea6a30?w=1920&auto=format&fit=crop&q=75",
    isHidden: false,
    sortOrder: 0,
  },
  {
    id: "sp2",
    slug: "laser",
    parentMenuId: "m7",
    title: "Laser",
    intro:
      "Pigmentation, blemishes, pores, and scars each have different causes.\nGowoonbit starts with a skin diagnosis, selects the laser suited to your concern, and works to improve it with minimal irritation.\nWe'll look after your skin carefully so it can recover comfortably.",
    body: `<p>Lasers act on different skin layers and produce different effects depending on wavelength and energy. Gowoonbit first identifies the type of concern — pigmentation, pores, or scarring — and considers your skin's thickness and sensitivity before selecting the right laser. We prioritize a steady approach that keeps irritation to a minimum.</p>
<h3>Skin concerns we address with laser</h3>
<ul>
<li><strong>Pigmentation</strong> — melasma, blemishes, freckles, and overall dullness</li>
<li><strong>Pores &amp; scarring</strong> — enlarged pores and acne marks causing uneven texture</li>
<li><strong>Skin tone care</strong> — smoothing and evening overall skin tone and texture</li>
<li><strong>Hair removal</strong> — for those looking to move on from repeated hair removal routines</li>
</ul>
<h3>Gowoonbit's approach to laser treatment</h3>
<p>Even the same concern can call for different wavelengths and intensities depending on skin condition. After consultation and diagnosis, we select the laser suited to you and guide you on treatment intervals with recovery and sensitivity in mind.</p>
<img src="https://images.unsplash.com/photo-1598440947619-2c35bc9430c0?w=1200&auto=format&fit=crop&q=75" alt="Laser treatment in progress" />
<h3>Recommended for</h3>
<ul>
<li>Those with uneven skin tone from pigmentation or scarring</li>
<li>Those with sensitive skin who need low-irritation care</li>
<li>Those who want steady care that fits into daily life</li>
</ul>
<p>You can find more detail on our equipment and treatment approach on the equipment page.</p>`,
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=1200&auto=format&fit=crop&q=75",
    fullBleedImage: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=1920&auto=format&fit=crop&q=75",
    isHidden: false,
    sortOrder: 1,
  },
  {
    id: "sp3",
    slug: "skin-booster",
    parentMenuId: "m7",
    title: "Skin Booster",
    intro:
      "Dryness and fine lines are a sign that your skin's inner strength has weakened.\nGowoonbit combines skin boosters that replenish the skin's inner environment with Korean medicine hydration care, building a comfortable skin condition from within.\nWe recommend steady care that improves gradually, without unnecessary irritation.",
    body: `<p>Skin boosters are injectable treatments that deliver hydrating and nourishing ingredients into the skin to support its condition. With minimal downtime, they're a treatment many choose for regular skin maintenance.</p>
<h3>This may help if</h3>
<ul>
<li>Dryness worsens noticeably with each change of season</li>
<li>Your skin feels tight after cleansing and lacks vitality</li>
<li>Fine lines and dullness are both a concern</li>
<li>Makeup doesn't sit well and texture feels uneven</li>
</ul>
<h3>Gowoonbit's approach to skin boosters</h3>
<p>We design the ingredients, treatment area, and interval around your skin condition and concerns. Typically administered over about 3 sessions spaced 2–4 weeks apart, followed by maintenance care tailored to your ongoing condition. Alongside treatment, we also guide you on everyday hydration habits.</p>
<img src="https://images.unsplash.com/photo-1620331311520-246422fd82f9?w=1200&auto=format&fit=crop&q=75" alt="Skin booster treatment in progress" />
<h3>Recommended for</h3>
<ul>
<li>Those with sensitive skin for whom stronger treatments feel like too much</li>
<li>Those wanting to address dryness and fine lines together</li>
<li>Those seeking regular skin condition maintenance</li>
</ul>
<p>The specific treatment and interval can vary by skin condition, so we'll go over the details during a consultation.</p>`,
    image: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=1200&auto=format&fit=crop&q=75",
    fullBleedImage: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=1920&auto=format&fit=crop&q=75",
    isHidden: false,
    sortOrder: 2,
  },
  { id: "sp4", slug: "pain-treatment", parentMenuId: "m8", title: "Pain Treatment", intro: "", body: "", image: "https://images.unsplash.com/photo-1559825481-12a05cc00344?w=1200&auto=format&fit=crop&q=75", isHidden: false, sortOrder: 0 },
  { id: "sp5", slug: "traffic-accident", parentMenuId: "m8", title: "Traffic Accident Aftereffects", intro: "", body: "", image: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=1200&auto=format&fit=crop&q=75", isHidden: false, sortOrder: 1 },
  { id: "sp6", slug: "herbal-clinic", parentMenuId: "m8", title: "Herbal Medicine Clinic", intro: "", body: "", image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=1200&auto=format&fit=crop&q=75", isHidden: false, sortOrder: 2 },
  { id: "sp7", slug: "chuna", parentMenuId: "m8", title: "Chuna Therapy", intro: "", body: "", image: "https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=1200&auto=format&fit=crop&q=75", isHidden: false, sortOrder: 3 },
  {
    id: "sp8",
    slug: "pharmacopuncture",
    parentMenuId: "m8",
    title: "Pharmacopuncture",
    intro:
      "Pharmacopuncture injects purified herbal medicine extract directly into acupuncture points, combining the effects of acupuncture and herbal medicine in one treatment. It acts more intensively on the affected area than acupuncture alone, and is used for a wide range of conditions from neck, back, and joint pain to other symptoms. Gowoonbit carefully selects the right pharmacopuncture formula for each patient's condition.",
    body: `<p>Pharmacopuncture is a treatment that extracts and purifies active compounds from herbal medicine, then injects them directly into acupuncture points or the affected area. It combines the stimulating effect of acupuncture with the pharmacological action of herbal medicine, allowing it to act more intensively on areas with pain or inflammation.</p>
<h2>Conditions this is used for</h2>
<ul>
<li>Musculoskeletal pain such as neck and back disc issues, degenerative arthritis</li>
<li>Chronic pain such as frozen shoulder, fibromyalgia</li>
<li>Neurological symptoms such as neuritis and headaches</li>
<li>Overall condition management for chronic fatigue, rhinitis, and similar concerns</li>
</ul>
<h2>How pharmacopuncture treatment proceeds</h2>
<img src="https://images.unsplash.com/photo-1583912267670-46b6e0197ba3?w=1200&auto=format&fit=crop&q=75" alt="Pharmacopuncture being administered at an acupuncture point">
<p>Gowoonbit's pharmacopuncture treatment follows these steps.</p>
<ol>
<li>A precise diagnosis identifies the cause and nature of the pain.</li>
<li>The right type of pharmacopuncture is selected for your constitution and symptoms.</li>
<li>Small, precise amounts are injected into the affected area or related acupuncture points.</li>
<li>It's combined with other treatments such as acupuncture or Chuna therapy as needed.</li>
</ol>
<p>Each session is relatively short, though multiple sessions are often needed depending on symptoms and progress. We'll outline a precise treatment plan during a consultation.</p>
<h2>Good to know</h2>
<p>Pharmacopuncture is not covered by national health insurance (비급여) and is a fully patient-responsibility treatment. Please let us know in advance if you have a history of herbal medicine allergies. If you are pregnant or have other underlying conditions, we'll guide you safely through a consultation before treatment.</p>
<hr>
<p>All treatments, including pharmacopuncture, are based on a precise diagnosis of each patient's individual condition. If you're experiencing pain or chronic symptoms, we invite you to consult with Gowoonbit.</p>`,
    image: "https://images.unsplash.com/photo-1583912267670-46b6e0197ba3?w=1200&auto=format&fit=crop&q=75",
    isHidden: false,
    sortOrder: 4,
  },
];

export type Equipment = {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  tags: string[];
  /** 이 장비를 사용하는 시술의 id 목록 (services 테이블 참조, locale 무관) */
  serviceIds?: string[];
  description: string;
  isHidden: boolean;
  sortOrder: number;
};

export const equipment: Equipment[] = [
  {
    id: "eq1",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&auto=format&fit=crop&q=75",
    title: "볼뉴머",
    subtitle: "HIFU 리프팅",
    tags: ["리프팅", "탄력개선", "윤곽정리", "비수술"],
    description:
      "고강도 집속 초음파(HIFU)로 피부 깊은 층에 열 에너지를 전달해 콜라겐 재생을 유도합니다. 처짐 없이 자연스러운 탄력과 윤곽 개선 효과를 기대할 수 있습니다.",
    isHidden: false,
    sortOrder: 0,
  },
  {
    id: "eq2",
    image: "https://images.unsplash.com/photo-1616391182219-e080b4d1043a?w=1200&auto=format&fit=crop&q=75",
    title: "슈링크",
    subtitle: "HIFU 리프팅",
    tags: ["리프팅", "탄력관리", "동안케어", "회복빠름"],
    description:
      "미세 초음파로 근막층까지 자극해 탄력을 끌어올리는 리프팅 장비입니다. 다운타임이 적어 시술 후 바로 일상 복귀가 가능합니다.",
    isHidden: false,
    sortOrder: 1,
  },
  {
    id: "eq3",
    image: "https://images.unsplash.com/photo-1598440947619-2c35bc9430c0?w=1200&auto=format&fit=crop&q=75",
    title: "샤인필",
    subtitle: "고주파 점 제거",
    tags: ["점제거", "쥐젖제거", "비립종", "정밀시술"],
    description:
      "고주파 에너지로 점·쥐젖·비립종 등을 정밀하게 제거하는 장비입니다. 출혈과 흉터 부담이 적어 얼굴 부위에도 안전하게 사용할 수 있습니다.",
    isHidden: false,
    sortOrder: 2,
  },
  {
    id: "eq4",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=1200&auto=format&fit=crop&q=75",
    title: "CO2 레이저",
    subtitle: "탄산가스 레이저",
    tags: ["점제거", "사마귀제거", "피부재생", "정밀절제"],
    description:
      "탄산가스 레이저로 병변 부위만 정밀하게 절제하는 시술입니다. 크기와 깊이가 있는 점·사마귀 제거에도 효과적입니다.",
    isHidden: false,
    sortOrder: 3,
  },
  {
    id: "eq5",
    image: "https://images.unsplash.com/photo-1620331311520-246422fd82f9?w=1200&auto=format&fit=crop&q=75",
    title: "피코라이트",
    subtitle: "피코초 레이저",
    tags: ["색소개선", "기미완화", "피부톤정리", "저자극"],
    description:
      "짧은 파장의 피코초 레이저로 색소만 선택적으로 파괴합니다. 자극이 적어 기미·잡티 개선과 맑은 피부톤 관리에 두루 활용됩니다.",
    isHidden: false,
    sortOrder: 4,
  },
  {
    id: "eq6",
    image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=1200&auto=format&fit=crop&q=75",
    title: "노블린",
    subtitle: "다이오드 레이저 제모",
    tags: ["제모", "저자극", "모든피부타입", "빠른시술"],
    description:
      "다이오드 레이저로 모낭까지 열 에너지를 전달해 제모 효과를 높인 장비입니다. 냉각 시스템이 함께 작동해 통증과 자극을 줄여줍니다.",
    isHidden: false,
    sortOrder: 5,
  },
];

export const equipmentEn: Equipment[] = [
  {
    id: "eq1",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&auto=format&fit=crop&q=75",
    title: "Volnewmer",
    subtitle: "HIFU Lifting",
    tags: ["Lifting", "Elasticity", "Contouring", "Non-surgical"],
    description:
      "High-intensity focused ultrasound (HIFU) delivers heat energy deep into the skin to stimulate collagen regeneration. Improves elasticity and facial contour without sagging.",
    isHidden: false,
    sortOrder: 0,
  },
  {
    id: "eq2",
    image: "https://images.unsplash.com/photo-1616391182219-e080b4d1043a?w=1200&auto=format&fit=crop&q=75",
    title: "Shurink",
    subtitle: "HIFU Lifting",
    tags: ["Lifting", "Firmness", "Anti-aging", "Fast recovery"],
    description:
      "A lifting device that stimulates the fascia layer with micro-focused ultrasound to boost elasticity. Minimal downtime allows patients to return to daily life right after treatment.",
    isHidden: false,
    sortOrder: 1,
  },
  {
    id: "eq3",
    image: "https://images.unsplash.com/photo-1598440947619-2c35bc9430c0?w=1200&auto=format&fit=crop&q=75",
    title: "Shine Peel",
    subtitle: "Radiofrequency Mole Removal",
    tags: ["Mole removal", "Skin tag", "Milia", "Precision"],
    description:
      "Uses radiofrequency energy to precisely remove moles, skin tags, and milia. Minimal bleeding and scarring make it safe for use on facial areas.",
    isHidden: false,
    sortOrder: 2,
  },
  {
    id: "eq4",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=1200&auto=format&fit=crop&q=75",
    title: "CO2 Laser",
    subtitle: "Carbon Dioxide Laser",
    tags: ["Mole removal", "Wart removal", "Skin renewal", "Precise excision"],
    description:
      "A carbon dioxide laser that precisely excises only the lesion area. Effective for removing larger or deeper moles and warts.",
    isHidden: false,
    sortOrder: 3,
  },
  {
    id: "eq5",
    image: "https://images.unsplash.com/photo-1620331311520-246422fd82f9?w=1200&auto=format&fit=crop&q=75",
    title: "PicoLite",
    subtitle: "Picosecond Laser",
    tags: ["Pigmentation", "Melasma care", "Skin tone", "Low irritation"],
    description:
      "A picosecond laser with an ultra-short wavelength that selectively targets pigment. Gentle enough for melasma, blemishes, and overall skin tone care.",
    isHidden: false,
    sortOrder: 4,
  },
  {
    id: "eq6",
    image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=1200&auto=format&fit=crop&q=75",
    title: "Noblin",
    subtitle: "Diode Laser Hair Removal",
    tags: ["Hair removal", "Low irritation", "All skin types", "Fast sessions"],
    description:
      "A diode laser that delivers heat energy directly to the hair follicle for effective hair removal. Built-in cooling reduces pain and skin irritation.",
    isHidden: false,
    sortOrder: 5,
  },
];

export const clinicInfo = {
  name: "고운빛한의원",
  phone: "02-XXX-XXXX",
  address: "서울특별시 ○○구 ○○대로 123",
  hours: {
    weekday: "평일 09:00 – 19:00",
    saturday: "토요일 09:00 – 14:00",
    closed: "일·공휴일 휴진",
  },
  reservationUrl: "https://m.place.naver.com/place/2015359820/booking?entry=plt",
  socialLinks: {
    blog: "#",
    instagram: "#",
    kakao: "#",
  },
  bannerImages: {
    events: sampleImages.facility,
    treatments: sampleImages.facility,
    about: sampleImages.facility,
    community: sampleImages.facility,
  },
  defaultImage: "",
};

// ─── English Defaults ───

export const eventsEn: Event[] = [];

export const treatmentsEn: Treatment[] = [
  {
    id: 1,
    number: "01",
    title: "Pain Treatment",
    description: "Korean medicine treatment for chronic pain in the back, neck, and joints",
    slug: "pain",
  },
  {
    id: 2,
    number: "02",
    title: "Auto Insurance\nTreatment",
    description: "Post-accident pain and aftereffect treatment covered by auto insurance",
    slug: "insurance",
  },
  {
    id: 3,
    number: "03",
    title: "Diet\nProgram",
    description: "Healthy weight loss through personalized prescriptions based on body constitution",
    slug: "diet",
  },
  {
    id: 4,
    number: "04",
    title: "Cosmetic\nTreatment",
    description: "Natural facial contouring and skin care through Korean medicine aesthetics",
    slug: "beauty",
  },
  {
    id: 5,
    number: "05",
    title: "Herbal Tonic",
    description: "Customized herbal tonics for energy recovery and immune system support",
    slug: "tonic",
  },
];

export const directorEn: Director = {
  name: "Eunju Heo",
  nameEn: "HEO EUNJU",
  title: "Director",
  quote:
    "I pursue treatment that cares for both\nbody and mind, helping fundamental recovery.",
  bio: [
    "Graduated from Kyung Hee University, College of Korean Medicine",
    "M.S. & Ph.D. in Korean Medicine, Kyung Hee University",
    "Sports Korean Medicine Team Doctor Certification",
    "Certified Member, Spinal Nerve Chuna Medicine Society",
    "Member, Korean Society of Oriental Internal Medicine",
  ],
  image: sampleImages.director,
};

export const noticesEn: Notice[] = [
  {
    id: 1,
    type: "event",
    title: "May Diet Package - 30% Off Promotion",
    content: "We are offering a personalized diet program based on constitutional analysis at a 30% discount throughout May.\n\nTarget: Anyone looking to manage their weight\nPeriod: May 1 – May 31, 2026\n\nPlease book via phone or Naver Reservation.",
    date: "2026.05.14",
    startDate: "2026-05-01",
    endDate: "2026-05-31",
  },
  {
    id: 2,
    type: "notice",
    title: "Closed on Buddha's Birthday (May 25)",
    content: "We will be closed on May 25 (Monday) for Buddha's Birthday.\n\nRegular hours resume on May 26 (Tuesday).\nWe apologize for any inconvenience.",
    date: "2026.05.10",
    startDate: "2026-05-10",
    endDate: "2026-05-25",
  },
  {
    id: 3,
    type: "notice",
    title: "Schedule Change - Saturday Afternoon Hours Added",
    content: "Based on patient requests, we are extending Saturday hours.\n\nBefore: Saturday 09:00 – 13:00\nAfter: Saturday 09:00 – 16:00\n\nEffective: May 3, 2026 (Saturday)\nLunch break (13:00–14:00) remains the same.",
    date: "2026.05.02",
    startDate: "2026-05-02",
  },
  {
    id: 4,
    type: "notice",
    title: "New Associate Director Joining Announcement",
    content: "Hello, this is Gowoonbit Korean Medicine Clinic.\n\nA new associate director has joined our team starting April 21, 2026.\nWe will continue to provide specialized and attentive care.\n\nThank you.",
    date: "2026.04.20",
    startDate: "2026-04-20",
  },
];

export const heroSlidesEn: HeroSlide[] = [
  {
    id: 1,
    label: "Korean Medicine Clinic",
    title: "A Prescription of\nComfort and Recovery",
    subtitle:
      "So today's pain doesn't become tomorrow's obstacle\nWe restore the vibrant daily life you've been missing",
    image: sampleImages.hero1,
    linkLabel: "Our Treatments",
    linkUrl: "/treatments",
  },
  {
    id: 2,
    label: "Tradition meets Modern",
    title: "A Place of Rest for\nBody and Mind",
    subtitle:
      "Combining the wisdom of traditional Korean medicine\nwith modern precision for your healthy life",
    image: sampleImages.hero2,
    linkLabel: "Our Treatments",
    linkUrl: "/treatments",
  },
  {
    id: 3,
    label: "Care from the Root",
    title: "Treating Health\nat Its Roots",
    subtitle:
      "We carefully examine your constitution and lifestyle\nto support fundamental recovery",
    image: sampleImages.hero3,
    linkLabel: "Our Treatments",
    linkUrl: "/treatments",
  },
];

export const clinicInfoEn = {
  name: "Gowoonbit Korean Medicine Clinic",
  phone: "02-XXX-XXXX",
  address: "123, OO-daero, OO-gu, Seoul, South Korea",
  hours: {
    weekday: "Weekdays 09:00 – 19:00",
    saturday: "Saturday 09:00 – 14:00",
    closed: "Sun & Holidays Closed",
  },
  reservationUrl: "https://m.place.naver.com/place/2015359820/booking?entry=plt",
  socialLinks: {
    blog: "#",
    instagram: "#",
    kakao: "#",
  },
  bannerImages: {
    events: sampleImages.facility,
    treatments: sampleImages.facility,
    about: sampleImages.facility,
    community: sampleImages.facility,
  },
  defaultImage: "",
};

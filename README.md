# 한의원 홈페이지 (Clinic Website) — v2

신규 한의원 공식 홈페이지 + Admin 페이지 통합 프로젝트.

## 핵심 변경사항 (v1 → v2)

- ✨ **Admin 페이지 추가** — 모든 콘텐츠를 클라이언트가 직접 관리
- ✨ **메뉴 동적 관리** — 이름·순서·표시여부 모두 Admin에서 변경
- ✨ **모든 텍스트·이미지·진료 항목** — Admin에서 편집 가능
- ✨ **데이터 추상화 레이어** (`lib/storage.ts`) — 추후 백엔드 API로 교체 시 한 파일만 수정

## 실행 방법

```bash
npm install
npm run dev
# http://localhost:3000 — 공개 사이트
# http://localhost:3000/admin — Admin (비밀번호: admin1234)
```

## Admin 페이지 기능

| 페이지 | 경로 | 기능 |
|---|---|---|
| 대시보드 | `/admin` | 콘텐츠 통계 한눈에 보기 |
| **메뉴 관리** | `/admin/menus` | 메뉴 이름 변경, 순서 변경 (↑↓), 표시/숨김 토글, 추가/삭제 |
| 이벤트 | `/admin/events` | 이벤트 CRUD, 이미지 업로드, 순서 변경 |
| 대표원장 | `/admin/director` | 사진·이름·약력 편집, 약력 순서 변경 |
| 공지사항 | `/admin/notices` | 공지/이벤트 CRUD |
| FAQ | `/admin/faqs` | 질문/답변 CRUD, 순서 변경 |
| 팝업 | `/admin/popups` | 이달의 이벤트 팝업 편집, 활성화 토글 |
| **사이트 설정** | `/admin/settings` | 한의원 기본정보, 히어로 슬라이드, 진료 5종, 한의원 소개 |

### 모두 변경 가능한 항목

**텍스트:**
- 한의원 이름, 전화, 주소, 진료 시간
- 히어로 슬라이드 카피 (라벨/제목/부제)
- 이벤트 제목/부제/설명
- 진료 5종 (통증/자동차/다이어트/미용/보약) 제목·설명
- 대표원장 이름·영문명·직함·진료철학·약력
- 진료 철학 본문
- 공지사항/FAQ 제목·내용
- 팝업 제목·본문
- 푸터 소셜 링크

**이미지:**
- 히어로 슬라이드 배경 (3장)
- 이벤트 카드 이미지
- 대표원장 프로필 사진
- 시설 사진 (다수)
- 팝업 이미지

업로드 방식: 파일 선택 (25MB 이하) 또는 URL 직접 입력

> 선택한 이미지는 업로드 직전 브라우저에서 1920px WebP로 축소된 뒤 전송됩니다.
> Vercel Functions의 요청 본문 한도가 4.5MB이기 때문이며, 서버(`/api/upload`)가
> 어차피 같은 크기·포맷으로 재변환하므로 최종 이미지 품질은 달라지지 않습니다.

**메뉴:**
- 메뉴명 변경 (예: "한의원 소개" → "병원 소개")
- 순서 변경 (↑↓ 버튼)
- 표시/숨김 토글 (임시 비활성화)
- 추가/삭제

## 기술 스택

- Next.js 15 App Router + React 19 + TypeScript
- TailwindCSS 3.4 + CSS Variables 디자인 토큰
- Pretendard Variable 폰트
- 데이터 저장: LocalStorage (데모) → FastAPI + PostgreSQL (운영 시)

## 디렉토리 구조

```
clinic-website/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx                       # 홈
│   ├── events/page.tsx                # 이벤트
│   ├── treatments/page.tsx            # 진료 내용
│   ├── about/page.tsx                 # 한의원 소개
│   ├── community/
│   │   ├── notice/page.tsx
│   │   └── faq/page.tsx
│   └── admin/                         # ─── Admin ─────────────
│       ├── layout.tsx
│       ├── login/page.tsx
│       ├── page.tsx                   # 대시보드
│       ├── menus/page.tsx             # 메뉴 관리
│       ├── events/page.tsx
│       ├── director/page.tsx
│       ├── notices/page.tsx
│       ├── faqs/page.tsx
│       ├── popups/page.tsx
│       └── settings/page.tsx          # 사이트 설정 (탭 4개)
├── components/
│   ├── SiteShell.tsx                  # /admin 라우트에서 Nav/Footer 숨김
│   ├── Nav.tsx                        # 동적 메뉴 (useSiteData)
│   ├── Footer.tsx
│   ├── FloatingActions.tsx
│   ├── PopupModal.tsx
│   ├── sections/                      # 홈 페이지 섹션들
│   │   ├── Hero.tsx
│   │   ├── EventsSection.tsx
│   │   ├── TreatmentsSection.tsx
│   │   ├── DirectorFeature.tsx
│   │   └── NoticeSection.tsx
│   └── admin/                         # ─── Admin 컴포넌트 ────
│       ├── AdminLayout.tsx            # 사이드바, 인증 체크
│       └── ui.tsx                     # PageHeader, Field, TextInput, Button, ImageInput 등
├── lib/
│   ├── data.ts                        # 기본 mock 데이터
│   ├── storage.ts                     # ★ 데이터 추상화 (LocalStorage)
│   └── useSiteData.ts                 # React Hook
├── tailwind.config.ts
├── next.config.mjs
└── package.json
```

## 데이터 흐름 설명

```
[Admin 페이지에서 편집]
        ↓
   updateSiteData()
        ↓
  LocalStorage에 저장
        ↓
"siteDataUpdated" 이벤트 발생
        ↓
  useSiteData() 훅이 감지
        ↓
[공개 페이지 자동 리렌더]
```

즉, Admin에서 메뉴명을 바꾸면 새로고침 없이 사이트가 즉시 반영됩니다.

## 예약 API 연동 (`/api/reservations`)

원내 예약 서버로 예약 생성을 중계하는 서버 라우트입니다. 브라우저는 이 라우트만
호출하므로 API 키가 클라이언트에 노출되지 않습니다.

```
환자 브라우저 → /api/reservations (Vercel, 키 보관) → 예약 서버 POST /external/v2/reservations
```

Vercel 프로젝트 환경변수에 아래 두 개를 등록해야 동작합니다. 미설정 시 503을 반환합니다.

| 환경변수 | 필수 | 설명 |
|---|---|---|
| `RESERVATION_API_BASE_URL` | 필수 | 예약 서버 주소. **외부에서 접근 가능한 주소여야 합니다** (`192.168.x.x` 같은 사설 IP는 Vercel에서 닿지 않음) |
| `RESERVATION_API_KEY` | 필수 | 예약 서버 API 키 (`sigma_...`) |
| `RESERVATION_API_SOURCE` | 선택 | 아래 허용값 중 하나. 미설정 시 전송하지 않아 예약 서버 기본값(`internal`)이 적용됨 |

요청 본문은 `reservation_dt`(`YYYY-MM-DD HH:MM`)가 필수이고,
`patient_uuid` · `reservation_name` · `reservation_phone` 중 최소 하나가 필요합니다.
허용된 필드만 예약 서버로 전달됩니다.

### reservation_source 주의

예약 서버는 이 값을 정해진 목록으로만 받습니다 (2026-08 실측).

```
internal, naver, kakao, daangn, doctalk
```

홈페이지용 값이 목록에 없어서 **기본적으로 이 필드를 보내지 않습니다.** 임의 값
(`homepage` 등)을 보내면 예약이 400으로 거부되기 때문입니다. 업체가 홈페이지용 값을
추가해 주면 `RESERVATION_API_SOURCE`만 설정하면 되고, 허용되지 않는 값이 들어오면
경고 로그를 남기고 생략해 예약 자체는 성공시킵니다.

그동안 접수 화면에서 홈페이지 예약을 구분할 수 있도록 **메모 앞에 `[홈페이지]`를
붙여서** 전송합니다. 불필요하면 `MEMO_PREFIX` 상수를 지우면 됩니다.

생성된 예약은 확정이 아니라 `예약중` 상태로 들어가므로, 직원이 확인·확정하는
절차가 필요합니다.

| 응답 | 의미 |
|---|---|
| 201 | 생성 성공. 본문은 예약 서버 응답 그대로 |
| 400 | 입력값 오류 |
| 429 | 요청 과다 (자체 제한 또는 예약 서버 제한) |
| 502 / 504 | 예약 서버 연결 실패 / 응답 지연 |
| 503 | 위 환경변수 미설정 |

> 이 라우트는 인증 없이 공개됩니다. 실제 오픈 전에는 캡차 등 추가 방어를 붙이세요.
> 현재 IP당 분당 5회 제한은 서버리스 인스턴스 메모리 기반이라 best-effort입니다.

## 추후 백엔드 연동

`lib/storage.ts`의 함수들만 fetch() 호출로 교체하면 백엔드 연동 완료:

```typescript
// Before (LocalStorage)
export function getSiteData(): SiteData {
  return JSON.parse(localStorage.getItem(KEY) || "{}");
}

// After (API)
export async function getSiteData(): Promise<SiteData> {
  const res = await fetch("/api/v1/site");
  return res.json();
}
```

스키마와 API 명세는 `한의원_홈페이지_기술명세서_v1.2.md` 4~5장 참고.

## 미팅 활용 시나리오

```bash
npm run dev
```

브라우저 두 개 열기:
- 창 1: http://localhost:3000 (공개 사이트, 클라이언트에게 보여주는 화면)
- 창 2: http://localhost:3000/admin (Admin, 직접 시연)

시연 흐름:
1. Admin에서 메뉴 "진행중인 이벤트" → "이벤트 안내"로 변경 → 공개 사이트 새로고침 → 즉시 반영
2. 메뉴 순서 변경 → 즉시 반영
3. 이벤트 추가 → 홈페이지 카드 3개에 자동 노출
4. 대표원장 사진 교체 → 한의원 소개 페이지 즉시 반영
5. 팝업 비활성화 → 새 세션에서 팝업 안 보임

이렇게 보여주면 클라이언트가 "내가 직접 다 바꿀 수 있구나"를 한 번에 이해합니다.

## 라이선스

- Pretendard: SIL OFL 1.1
- 샘플 이미지: Unsplash (실 운영 시 교체)

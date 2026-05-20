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

업로드 방식: 파일 선택 (2MB 이하) 또는 URL 직접 입력

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

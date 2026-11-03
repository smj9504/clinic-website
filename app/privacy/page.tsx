/**
 * 개인정보 처리방침 (「개인정보 보호법」 제30조, 같은 법 시행령 제31조)
 *
 * 개인정보보호위원회 「개인정보 처리방침 작성지침」의 기재사항 순서를 따른다.
 * 해당 없는 항목(추가적 이용·제공 판단 기준, 가명정보, 자동화된 결정, 국내대리인,
 * 민감정보 공개 가능성, 이동형 영상정보처리기기)은 싣지 않는다.
 *
 * 병원 하나에 처리방침은 하나이므로 홈페이지뿐 아니라 내원·진료 과정의 처리까지 담는다.
 * 바뀔 수 있는 사실(업체, 책임자, 보관기간, CCTV, 변경 이력)은 lib/privacy.ts에서 가져온다.
 */

import PrintButton from "@/components/PrintButton";
import {
  CCTV,
  CLINIC,
  OUTSOURCING,
  OVERSEAS_TRANSFERS,
  POLICY_EFFECTIVE_DATE,
  POLICY_HISTORY,
  PRIVACY_OFFICER,
  VENDOR_LOG_RETENTION,
} from "@/lib/privacy";

function toKoreanDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}년 ${m}월 ${d}일`;
}

const EFFECTIVE_DATE_KO = toKoreanDate(POLICY_EFFECTIVE_DATE);

type SectionId =
  | "purpose"
  | "items"
  | "children"
  | "retention"
  | "destruction"
  | "provision"
  | "outsourcing"
  | "overseas"
  | "security"
  | "cookies"
  | "rights"
  | "officer"
  | "remedy"
  | "cctv"
  | "changes";

const SECTIONS: { id: SectionId; title: string }[] = [
  { id: "purpose", title: "개인정보의 처리 목적" },
  { id: "items", title: "처리하는 개인정보의 항목" },
  { id: "children", title: "14세 미만 아동의 개인정보 처리" },
  { id: "retention", title: "개인정보의 처리 및 보유 기간" },
  { id: "destruction", title: "개인정보의 파기 절차 및 방법" },
  { id: "provision", title: "개인정보의 제3자 제공" },
  { id: "outsourcing", title: "개인정보 처리업무의 위탁" },
  { id: "overseas", title: "개인정보의 국외 이전" },
  { id: "security", title: "개인정보의 안전성 확보조치" },
  { id: "cookies", title: "개인정보 자동 수집 장치의 설치·운영 및 거부" },
  { id: "rights", title: "정보주체와 법정대리인의 권리·의무 및 행사 방법" },
  { id: "officer", title: "개인정보 보호책임자 및 고충처리 부서" },
  { id: "remedy", title: "정보주체의 권익침해에 대한 구제 방법" },
  ...(CCTV ? [{ id: "cctv" as const, title: "고정형 영상정보처리기기 운영·관리" }] : []),
  { id: "changes", title: "개인정보 처리방침의 변경" },
];

function articleNo(id: SectionId): number {
  return SECTIONS.findIndex((s) => s.id === id) + 1;
}

/* ─── 주요 개인정보 처리 표시(라벨링) ─────────────────────────── */

const ICON_PATHS: Record<string, React.ReactNode> = {
  person: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  health: <path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11Z M8 12h2.5l1.5-3 2 6 1.5-3H17" />,
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  share: (
    <>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6" />
    </>
  ),
  outsource: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </>
  ),
  headset: (
    <>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="3" y="14" width="4" height="6" rx="1.5" />
      <rect x="17" y="14" width="4" height="6" rx="1.5" />
    </>
  ),
  camera: (
    <>
      <rect x="3" y="7" width="13" height="10" rx="2" />
      <path d="m16 11 5-3v8l-5-3" />
    </>
  ),
};

type Label = { icon: string; title: string; body: React.ReactNode; to: SectionId };

const LABELS: Label[] = [
  { icon: "person", title: "일반 개인정보 수집", body: "성명, 연락처, 주소, 주민등록번호(진료 시)", to: "items" },
  { icon: "health", title: "민감정보 처리", body: "진료·건강에 관한 정보", to: "items" },
  { icon: "target", title: "처리 목적", body: "진료, 진료비 청구, 예약·상담 안내", to: "purpose" },
  { icon: "clock", title: "보유 기간", body: "진료기록부 10년 등 법정 기간, 홈페이지 상담 신청 1년", to: "retention" },
  { icon: "share", title: "제3자 제공", body: "국민건강보험공단·건강보험심사평가원 등(법령 근거)", to: "provision" },
  { icon: "outsource", title: "처리 위탁", body: `${OUTSOURCING.length}개 업체(문자 발송, 메일, 홈페이지 운영)`, to: "outsourcing" },
  {
    icon: "globe",
    title: "국외 이전",
    body: OVERSEAS_TRANSFERS.map((t) => t.country).join("·") + "(홈페이지 운영)",
    to: "overseas",
  },
  {
    icon: "headset",
    title: "고충 처리",
    body: (
      <>
        개인정보 보호책임자 <span className="whitespace-nowrap">{PRIVACY_OFFICER.phone}</span>
      </>
    ),
    to: "officer",
  },
  ...(CCTV ? [{ icon: "camera", title: "영상정보처리기기", body: CCTV.locations, to: "cctv" as const }] : []),
];

function LabelIcon({ name }: { name: string }) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

/* ─── 공통 블록 ─────────────────────────────────────────────── */

function Article({ id, children }: { id: SectionId; children: React.ReactNode }) {
  const s = SECTIONS.find((x) => x.id === id)!;
  return (
    <section id={id} className="scroll-mt-28 mb-12 print:mb-8">
      <h2 className="font-semibold mb-4 print:break-after-avoid" style={{ fontSize: "1.1875rem", letterSpacing: "-0.03em" }}>
        제{articleNo(id)}조 ({s.title})
      </h2>
      <div className="text-ink-soft space-y-3 print:text-black" style={{ lineHeight: 1.85, letterSpacing: "-0.01em" }}>
        {children}
      </div>
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto -mx-1 px-1 print:overflow-visible">
      <table className="w-full min-w-[34rem] print:min-w-0 text-sm border-collapse border-y border-line">
        <thead>
          <tr className="bg-bg-alt">
            {head.map((h) => (
              <th key={h} className="text-left font-semibold text-ink px-3 py-2.5 border-b border-line align-top">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-line last:border-b-0 print:break-inside-avoid">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2.5 align-top" style={{ lineHeight: 1.7 }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {head.length >= 3 && (
        <p className="sm:hidden print:hidden text-xs text-ink-muted mt-1.5">표를 옆으로 밀면 나머지 내용을 볼 수 있습니다.</p>
      )}
    </div>
  );
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="list-decimal pl-5 space-y-1.5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ol>
  );
}

/** 법률용어 뒤에 붙이는 쉬운 설명 */
function Gloss({ children }: { children: React.ReactNode }) {
  return <span className="text-ink-muted">({children})</span>;
}

function Ref({ to }: { to: SectionId }) {
  return (
    <a href={`#${to}`} className="underline underline-offset-2 hover:text-accent">
      제{articleNo(to)}조
    </a>
  );
}

/* ─── 페이지 ────────────────────────────────────────────────── */

export default function PrivacyPage() {
  return (
    <>
      <section
        className="relative pt-32 pb-8 md:pt-44 md:pb-10 overflow-hidden print:hidden"
        style={{ background: "linear-gradient(135deg, #2C2620 0%, #4A3A2E 100%)" }}
      >
        <div className="container-default relative text-ink-inverse">
          <span className="text-xs font-semibold uppercase opacity-70 mb-4 block" style={{ letterSpacing: "0.2em" }}>
            Privacy Policy
          </span>
          <h1
            className="font-display break-keep"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.15 }}
          >
            {CLINIC.name} 개인정보 처리방침
          </h1>
          <p className="mt-5 opacity-80" style={{ letterSpacing: "-0.01em" }}>
            시행일 {EFFECTIVE_DATE_KO}
          </p>
        </div>
      </section>

      <section className="pt-10 pb-16 md:pt-14 md:pb-24 print:pt-0 print:pb-0">
        <div className="container-default max-w-3xl break-keep print:max-w-none print:px-0">
          {/* 인쇄물 제목 — 화면에서는 위 배너가 대신한다 */}
          <div className="hidden print:block mb-6">
            <h1 className="text-2xl font-bold">{CLINIC.name} 개인정보 처리방침</h1>
            <p className="text-sm mt-1">시행일 {EFFECTIVE_DATE_KO}</p>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
            <p className="text-ink-soft flex-1 min-w-[16rem] print:text-black" style={{ lineHeight: 1.85, letterSpacing: "-0.01em" }}>
              {CLINIC.name}(이하 ‘한의원’)은 「개인정보 보호법」 제30조에 따라 정보주체
              <Gloss>개인정보의 주인인 환자·이용자</Gloss>의 개인정보를 보호하고, 개인정보와 관련한 고충을 빠르고 원활하게
              처리할 수 있도록 다음과 같이 개인정보 처리방침을 정하여 공개합니다.
            </p>
            <PrintButton />
          </div>

          {/* 주요 개인정보 처리 표시(라벨링) */}
          <div className="mb-12 print:break-inside-avoid">
            <h2 className="font-semibold mb-1" style={{ fontSize: "1.0625rem", letterSpacing: "-0.03em" }}>
              주요 개인정보 처리 표시
            </h2>
            <p className="text-sm text-ink-muted mb-4 print:hidden">항목을 누르면 자세한 내용으로 이동합니다.</p>
            <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {LABELS.map((l) => (
                <li key={l.title} className="print:break-inside-avoid">
                  <a
                    href={`#${l.to}`}
                    className="h-full flex flex-col items-center text-center gap-1.5 border border-line rounded-lg px-3 py-4 hover:border-accent transition-colors"
                  >
                    <span className="text-accent">
                      <LabelIcon name={l.icon} />
                    </span>
                    <span className="text-sm font-semibold" style={{ letterSpacing: "-0.02em" }}>
                      {l.title}
                    </span>
                    <span className="text-xs text-ink-muted" style={{ lineHeight: 1.6 }}>
                      {l.body}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="목차" className="mb-12 border border-line rounded-lg p-5 bg-bg-alt print:hidden">
            <p className="text-sm font-semibold mb-3">목차</p>
            <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              {SECTIONS.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-ink-soft hover:text-accent hover:underline underline-offset-2">
                    제{i + 1}조 {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <Article id="purpose">
            <p>
              한의원은 다음 목적을 위해서만 개인정보를 처리합니다. 다른 목적으로 이용하게 되면 「개인정보 보호법」 제18조에
              따라 별도의 동의를 받는 등 필요한 조치를 합니다.
            </p>
            <Table
              head={["구분", "처리 목적"]}
              rows={[
                ["진료", "환자 확인, 진찰·치료·처방, 진료기록 작성과 보존, 진단서 등 증명서 발급, 진료비 수납"],
                ["진료비 청구", "국민건강보험공단·건강보험심사평가원에 대한 요양급여비용 청구, 자동차보험 진료수가 청구"],
                ["진료 예약", "전화·네이버 예약으로 받은 예약의 확인과 일정 안내"],
                ["홈페이지 상담 신청", "상담 신청 접수, 휴대폰 본인 확인, 상담 일정 안내 연락(문자·전화)"],
                ["홈페이지 운영", "접속 기록을 이용한 장애 대응과 부정 이용 방지"],
              ]}
            />
          </Article>

          <Article id="items">
            <p>① 한의원은 다음 개인정보를 처리합니다.</p>
            <Table
              head={["구분", "처리 항목", "처리 근거"]}
              rows={[
                [
                  "진료",
                  <>
                    성명, 주민등록번호, 주소, 연락처, 진료·건강에 관한 정보(진료기록, 처방 내용 등)
                    <br />
                    자동차보험 진료 시: 보험회사명, 사고접수번호
                  </>,
                  "「의료법」, 「국민건강보험법」, 「자동차손해배상 보장법」 등 법령(동의 없이 처리)",
                ],
                [
                  "진료 예약",
                  "이름, 연락처, 예약 일시, 요청사항",
                  <>
                    정보주체의 요청에 따른 조치 <Gloss>법 제15조 제1항 제4호</Gloss>
                  </>,
                ],
                [
                  "홈페이지 상담 신청",
                  <>
                    필수: 이름, 휴대폰 번호, 희망 상담 일자
                    <br />
                    선택: 희망 시간대, 관심 시술
                    <br />
                    선택(별도 동의): 증상·요청사항에 적은 건강에 관한 정보
                  </>,
                  "정보주체의 동의",
                ],
                ["휴대폰 본인 확인", "휴대폰 번호, 인증번호", "정보주체의 동의(상담 신청 동의에 포함)"],
                [
                  "홈페이지 이용(자동 생성)",
                  "접속 IP 주소, 접속 일시, 브라우저 정보",
                  <>
                    홈페이지 보안 유지 <Gloss>법 제15조 제1항 제6호, 개인정보처리자의 정당한 이익</Gloss>
                  </>,
                ],
              ]}
            />
            <p>
              ② 개인정보는 내원 시 접수·진료 과정, 전화, 네이버 예약(네이버가 전달하는 예약자 정보), 홈페이지 상담 신청을
              통해 수집합니다.
            </p>
            <p>
              ③ <strong className="text-ink">민감정보</strong>
              <Gloss>건강 상태처럼 사생활을 크게 침해할 수 있는 정보</Gloss>: 진료에 필요한 건강에 관한 정보는 「의료법」에
              근거하여 처리합니다. 홈페이지 상담 신청의 ‘증상·요청사항’에 적은 건강 정보는 「개인정보 보호법」 제23조에 따라
              다른 동의와 따로 동의를 받은 경우에만 처리합니다.
            </p>
            <p>
              ④ <strong className="text-ink">고유식별정보</strong>
              <Gloss>주민등록번호처럼 개인을 고유하게 구별하는 번호</Gloss>: 「의료법 시행령」 제42조의2 등 법령에 근거하여
              진료와 진료비 청구에 필요한 범위에서 주민등록번호를 처리합니다. 홈페이지에서는 주민등록번호를 받지 않습니다.
            </p>
          </Article>

          <Article id="children">
            <p>
              ① 홈페이지 상담 신청은 만 14세 이상만 할 수 있습니다. 만 14세 미만 아동의 상담은 법정대리인
              <Gloss>부모 등 보호자</Gloss>이 신청해 주셔야 하며, 이때는 법정대리인의 이름과 연락처를 받습니다.
            </p>
            <p>
              ② 만 14세 미만 아동을 진료할 때에는 법령에 따라 진료에 필요한 범위에서 아동의 개인정보를 처리하며, 법정대리인의
              성명과 연락처를 함께 확인합니다.
            </p>
          </Article>

          <Article id="retention">
            <p>① 한의원은 법령에서 정한 기간 또는 정보주체에게 동의받은 기간 동안만 개인정보를 보유합니다.</p>
            <Table
              head={["구분", "보유 기간", "근거"]}
              rows={[
                ["진료기록부", "10년", "「의료법 시행규칙」 제15조"],
                ["환자 명부", "5년", "「의료법 시행규칙」 제15조"],
                ["검사내용 및 검사소견기록", "5년", "「의료법 시행규칙」 제15조"],
                ["방사선 사진(영상물 포함) 및 그 소견서", "5년", "「의료법 시행규칙」 제15조"],
                ["진단서 등의 부본", "3년", "「의료법 시행규칙」 제15조"],
                ["처방전", "2년", "「의료법 시행규칙」 제15조"],
                ["요양급여비용 청구에 관한 서류", "요양급여가 끝난 날부터 5년", "「국민건강보험법」"],
                [
                  "진료 예약 정보",
                  "예약일로부터 1년(내원하신 경우 위 진료 관련 기록의 보존 기간에 따름)",
                  "정보주체의 요청에 따른 조치",
                ],
                ["홈페이지 상담 신청 정보", "신청일로부터 1년", "정보주체의 동의"],
                ["휴대폰 인증번호 기록", "발급 후 24시간", "정보주체의 동의"],
                [
                  "상담 신청 알림 문자 발송 기록",
                  "발송일로부터 1년(솔라피 주식회사 보관)",
                  "수탁자의 발송 내역 보관 정책",
                ],
                [
                  "홈페이지 접속 기록",
                  `Vercel ${VENDOR_LOG_RETENTION.vercel}, Supabase ${VENDOR_LOG_RETENTION.supabase}`,
                  "수탁자의 기록 보관 정책",
                ],
              ]}
            />
            <p>
              ② 네이버 예약을 통한 예약 정보는 한의원과 별도로 네이버 주식회사가 자체 개인정보 처리방침에 따라 보관합니다.
            </p>
          </Article>

          <Article id="destruction">
            <p>① 보유 기간이 지나거나 처리 목적을 달성하는 등 개인정보가 필요 없게 되면 지체 없이 파기합니다.</p>
            <p>
              ② <strong className="text-ink">파기 절차</strong>: 파기할 개인정보를 정하고, 개인정보 보호책임자의 확인을 거쳐
              파기합니다. 홈페이지 상담 신청 정보와 휴대폰 인증번호 기록은 보유 기간이 지나면 시스템이 자동으로 삭제합니다.
            </p>
            <p>
              ③ <strong className="text-ink">파기 방법</strong>: 전자 파일은 다시 복구할 수 없도록 삭제하고, 종이 문서는
              분쇄하거나 소각합니다.
            </p>
            <p>
              ④ 처리 목적을 달성했더라도 다른 법령에 따라 보존해야 하는 개인정보는 다른 개인정보와 분리하여 보관하고, 그
              법령에서 정한 목적으로만 이용합니다.
            </p>
          </Article>

          <Article id="provision">
            <p>
              ① 한의원은 정보주체의 개인정보를 <Ref to="purpose" />의 목적 범위에서만 처리하며, 정보주체의 동의가 있거나
              법률에 특별한 규정이 있는 경우 등 「개인정보 보호법」 제17조·제18조에 해당하는 경우에만 제3자에게 제공합니다.
            </p>
            <p>② 한의원은 다음과 같이 법령에 근거하여 개인정보를 제공합니다.</p>
            <Table
              head={["제공받는 자", "제공 목적", "제공 항목", "근거"]}
              rows={[
                [
                  "국민건강보험공단, 건강보험심사평가원",
                  "요양급여비용 청구 및 심사",
                  "성명, 주민등록번호, 진료 내역 등 청구에 필요한 정보",
                  "「국민건강보험법」",
                ],
                [
                  "자동차보험회사 및 공제조합",
                  "자동차보험 진료수가 청구",
                  "성명, 사고접수번호, 진료 내역 등 청구에 필요한 정보",
                  "「자동차손해배상 보장법」",
                ],
              ]}
            />
            <p>③ 그 밖에 「의료법」 제21조 등 법령에 근거한 요청이 있으면 법령에서 정한 범위에서 제공합니다.</p>
          </Article>

          <Article id="outsourcing">
            <p>
              ① 한의원은 업무를 원활하게 처리하기 위해 다음과 같이 개인정보 처리업무를 위탁
              <Gloss>외부 업체에 업무를 맡김</Gloss>하고 있습니다.
            </p>
            <Table head={["수탁자(맡은 업체)", "위탁 업무"]} rows={OUTSOURCING.map((o) => [o.company, o.task])} />
            <p>
              ② 한의원은 위탁 계약 시 「개인정보 보호법」 제26조에 따라 위탁 업무 외 목적의 처리 금지, 안전성 확보조치, 재위탁
              제한, 수탁자 관리·감독, 손해배상 책임 등을 문서로 정하고, 수탁자가 개인정보를 안전하게 처리하는지 감독합니다.
            </p>
            <p>③ 위탁 업무나 수탁자가 바뀌면 이 처리방침을 고쳐 지체 없이 공개합니다.</p>
          </Article>

          <Article id="overseas">
            <p>
              ① 한의원은 홈페이지 운영을 위해 다음과 같이 개인정보를 국외에 위탁·보관합니다
              <Gloss>「개인정보 보호법」 제28조의8 제1항 제3호</Gloss>. 진료 관련 정보는 국외로 이전하지 않습니다.
            </p>
            <Table
              head={["이전받는 자(연락처)", "국가", "이전 항목", "이전 일시·방법", "이용 목적", "보유·이용 기간"]}
              rows={OVERSEAS_TRANSFERS.map((t) => [
                <>
                  {t.company}
                  <br />({t.contact})
                </>,
                t.country,
                t.items,
                t.when,
                t.purpose,
                t.period,
              ])}
            />
            <p>
              ② <strong className="text-ink">거부 방법</strong>: 국외 이전을 원하지 않으시면 홈페이지 상담 신청 대신
              전화({CLINIC.phone})나 내원으로 상담을 신청하실 수 있습니다. 이 경우 상담 신청 정보는 국외로 이전되지 않습니다.
              다만 홈페이지를 보는 것만으로도 접속 정보는 위 업체를 거치므로, 이를 원하지 않으시면 홈페이지 이용을 삼가 주시기
              바랍니다.
            </p>
          </Article>

          <Article id="security">
            <p>한의원은 「개인정보의 안전성 확보조치 기준」에 따라 다음 조치를 하고 있습니다.</p>
            <List
              items={[
                <>
                  <strong className="text-ink">관리적 조치</strong>: 개인정보를 다루는 직원을 필요한 최소 인원으로 정하고,
                  개인정보 보호 교육을 합니다.
                </>,
                <>
                  <strong className="text-ink">기술적 조치</strong>: 홈페이지 관리자 화면은 비밀번호로 접근을 통제하며, 비밀번호는
                  작성 규칙을 적용하고 복구할 수 없는 방식(일방향 암호화)으로 저장합니다. 홈페이지의 모든 통신은
                  암호화(HTTPS)하고, 데이터베이스는 허가된 서버만 접근할 수 있도록 권한을 제한합니다. 보유 기간이 지난 상담
                  신청 정보는 자동으로 삭제합니다.
                </>,
                <>
                  <strong className="text-ink">물리적 조치</strong>: 진료기록 등 종이 서류는 외부인이 접근할 수 없는 곳에
                  보관합니다.
                </>,
              ]}
            />
          </Article>

          <Article id="cookies">
            <p>
              ① 한의원 홈페이지는 이용자를 식별하거나 이용 행태를 추적하는 쿠키
              <Gloss>홈페이지가 이용자 브라우저에 저장하는 작은 파일</Gloss>를 사용하지 않습니다.
            </p>
            <p>
              ② 언어 설정과 관심 시술 목록은 이용자의 브라우저에만 저장되며, 상담 신청 시 이용자가 제출하는 경우에만
              한의원으로 전송됩니다. 브라우저 설정에서 이 사이트의 데이터를 삭제하면 지워집니다.
            </p>
            <p>
              ③ 한의원은 광고·분석 업체 등 제3자가 홈페이지에서 이용자의 행태정보<Gloss>방문 기록, 이용 패턴 등</Gloss>를
              수집하도록 허용하지 않습니다.
            </p>
          </Article>

          <Article id="rights">
            <p>
              ① 정보주체는 언제든지 한의원에 자신의 개인정보 <strong className="text-ink">열람, 정정·삭제, 처리정지</strong>
              를 요구하거나 <strong className="text-ink">동의를 철회</strong>할 수 있습니다.
            </p>
            <p>② 요구 방법은 다음과 같으며, 홈페이지 상담 신청과 같이 별도 서식 없이 하실 수 있습니다.</p>
            <Table
              head={["방법", "연락처", "본인 확인"]}
              rows={[
                ["전화", CLINIC.phone, "이름과 상담 신청·진료 때 쓴 연락처 확인"],
                [
                  "카카오톡 채널",
                  <a key="kakao" href={CLINIC.kakaoChannel} className="underline underline-offset-2" target="_blank" rel="noopener noreferrer">
                    {CLINIC.name} 채널
                  </a>,
                  "이름과 연락처 확인 후 필요하면 전화로 재확인",
                ],
                ["방문", `${CLINIC.address} ${CLINIC.name}`, "신분증 확인"],
              ]}
            />
            <p>
              ③ 한의원은 요구를 받은 날부터 <strong className="text-ink">10일 이내</strong>에 조치하고 결과를 알려 드립니다.
              기간 안에 처리하기 어려운 사정이 있으면 그 사유와 처리 가능한 날짜를 먼저 알려 드립니다. 홈페이지 상담 신청
              정보의 삭제나 동의 철회는 요청하시는 즉시 처리합니다.
            </p>
            <p>
              ④ 법정대리인이나 위임을 받은 분도 권리를 행사할 수 있으며, 이때는 위임장과 대리인의 신분증을 확인합니다.
            </p>
            <p>
              ⑤ 진료기록의 열람과 사본 발급은 「의료법」 제21조에서 정한 절차에 따릅니다. 본인은 신분증을, 대리인은 「의료법」
              에서 정한 동의서·위임장 등을 제출해야 합니다.
            </p>
            <p>
              ⑥ 진료기록처럼 다른 법령에서 보존하도록 정한 개인정보는 그 기간 동안 삭제를 요구할 수 없으며, 법령에서 정한
              경우 열람이나 처리정지 요구가 제한될 수 있습니다. 이 경우 그 사유를 알려 드립니다.
            </p>
            <p>⑦ 정보주체는 자신이나 다른 사람의 개인정보를 침해하거나 거짓 정보를 제공해서는 안 됩니다.</p>
          </Article>

          <Article id="officer">
            <p>
              ① 한의원은 개인정보 처리에 관한 업무를 총괄하고, 정보주체의 고충 처리와 피해 구제를 위해 개인정보 보호책임자를
              다음과 같이 지정합니다. 소규모 의료기관으로 별도 담당 부서 없이 개인정보 보호책임자가 직접 열람 청구 접수·처리와
              고충 처리를 맡습니다.
            </p>
            <Table
              head={["구분", "내용"]}
              rows={[
                ["개인정보 보호책임자", `${PRIVACY_OFFICER.name} (${PRIVACY_OFFICER.position})`],
                ["연락처", PRIVACY_OFFICER.phone],
                ["열람 청구·고충 접수", `대표전화 ${CLINIC.phone}, 카카오톡 채널, 방문`],
              ]}
            />
            <p>② 개인정보와 관련한 문의, 불만, 피해 구제 요청은 위 연락처로 하시면 지체 없이 답변하고 처리해 드립니다.</p>
          </Article>

          <Article id="remedy">
            <p>개인정보 침해로 피해 구제나 상담이 필요하시면 아래 기관에 문의하실 수 있습니다.</p>
            <Table
              head={["기관", "연락처"]}
              rows={[
                ["개인정보분쟁조정위원회", "(국번 없이) 1833-6972 · www.kopico.go.kr"],
                ["개인정보침해신고센터", "(국번 없이) 118 · privacy.kisa.or.kr"],
                ["대검찰청", "(국번 없이) 1301 · www.spo.go.kr"],
                ["경찰청", "(국번 없이) 182 · ecrm.police.go.kr"],
              ]}
            />
          </Article>

          {CCTV && (
            <Article id="cctv">
              <p>한의원은 다음과 같이 고정형 영상정보처리기기(CCTV)를 설치·운영합니다.</p>
              <Table
                head={["구분", "내용"]}
                rows={[
                  ["설치 목적", CCTV.purpose],
                  ["설치 대수·위치", `${CCTV.count}대 · ${CCTV.locations}`],
                  ["촬영 범위", CCTV.range],
                  ["촬영 시간", CCTV.recordingHours],
                  ["보관 기간", `촬영일로부터 ${CCTV.retentionDays}일`],
                  ["보관 장소·처리 방법", CCTV.storage],
                  ["관리책임자", `${CCTV.manager.name} (${CCTV.manager.position}) ${CCTV.manager.phone}`],
                ]}
              />
              <p>
                영상 열람·존재 확인·삭제는 관리책임자에게 요청하실 수 있으며, 본인이 촬영된 경우나 명백히 정보주체의 급박한
                생명·신체·재산 이익을 위해 필요한 경우에 한해 열람을 허용합니다.
              </p>
            </Article>
          )}

          <Article id="changes">
            <p>① 이 개인정보 처리방침은 {EFFECTIVE_DATE_KO}부터 적용됩니다.</p>
            <p>② 내용을 바꾸는 경우 시행 7일 전부터 홈페이지를 통해 변경 내용과 시행일을 알려 드립니다.</p>
            <Table
              head={["시행일", "변경 내용"]}
              rows={POLICY_HISTORY.map((h) => [toKoreanDate(h.date), h.summary])}
            />
          </Article>
        </div>
      </section>
    </>
  );
}

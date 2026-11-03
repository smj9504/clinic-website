/**
 * 개인정보 처리방침 (「개인정보 보호법」 제30조)
 *
 * 병원 하나에 처리방침은 하나이므로 홈페이지뿐 아니라 내원·진료 과정의 처리까지 담는다.
 * 병원 정보·책임자·보관기간 같은 값은 lib/privacy.ts에서 가져온다.
 * 내용을 바꾸면 lib/privacy.ts의 POLICY_EFFECTIVE_DATE를 새 시행일로 올린다.
 */

import {
  CLINIC,
  POLICY_EFFECTIVE_DATE,
  PRIVACY_OFFICER,
  RESERVATION_RETENTION_DAYS,
  SMS_VERIFICATION_RETENTION_HOURS,
} from "@/lib/privacy";

const [effY, effM, effD] = POLICY_EFFECTIVE_DATE.split("-").map(Number);
const EFFECTIVE_DATE_KO = `${effY}년 ${effM}월 ${effD}일`;
const RESERVATION_RETENTION_KO = RESERVATION_RETENTION_DAYS === 365 ? "1년" : `${RESERVATION_RETENTION_DAYS}일`;

const SECTIONS = [
  { id: "purpose", title: "개인정보의 처리 목적" },
  { id: "items", title: "처리하는 개인정보의 항목 및 수집 방법" },
  { id: "retention", title: "개인정보의 처리 및 보유 기간" },
  { id: "provision", title: "개인정보의 제3자 제공" },
  { id: "outsourcing", title: "개인정보 처리업무의 위탁" },
  { id: "overseas", title: "개인정보의 국외 이전" },
  { id: "destruction", title: "개인정보의 파기 절차 및 방법" },
  { id: "sensitive", title: "민감정보 및 고유식별정보의 처리" },
  { id: "rights", title: "정보주체와 법정대리인의 권리·의무 및 행사 방법" },
  { id: "security", title: "개인정보의 안전성 확보조치" },
  { id: "cookies", title: "개인정보 자동 수집 장치의 설치·운영 및 거부" },
  { id: "officer", title: "개인정보 보호책임자" },
  { id: "remedy", title: "권익침해 구제 방법" },
  { id: "changes", title: "개인정보 처리방침의 변경" },
] as const;

function Article({ n, children }: { n: number; children: React.ReactNode }) {
  const s = SECTIONS[n - 1];
  return (
    <section id={s.id} className="scroll-mt-28 mb-12">
      <h2 className="font-semibold mb-4" style={{ fontSize: "1.1875rem", letterSpacing: "-0.03em" }}>
        제{n}조 ({s.title})
      </h2>
      <div className="text-ink-soft space-y-3" style={{ lineHeight: 1.85, letterSpacing: "-0.01em" }}>
        {children}
      </div>
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <table className="w-full min-w-[34rem] text-sm border-collapse border-y border-line">
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
            <tr key={i} className="border-b border-line last:border-b-0">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2.5 align-top" style={{ lineHeight: 1.7 }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
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

export default function PrivacyPage() {
  return (
    <>
      <section
        className="relative pt-32 pb-8 md:pt-44 md:pb-10 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2C2620 0%, #4A3A2E 100%)" }}
      >
        <div className="container-default relative text-ink-inverse">
          <span className="text-xs font-semibold uppercase opacity-70 mb-4 block" style={{ letterSpacing: "0.2em" }}>
            Privacy Policy
          </span>
          <h1
            className="font-display"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.15 }}
          >
            개인정보 처리방침
          </h1>
          <p className="mt-5 opacity-80" style={{ letterSpacing: "-0.01em" }}>
            시행일 {EFFECTIVE_DATE_KO}
          </p>
        </div>
      </section>

      <section className="pt-10 pb-16 md:pt-14 md:pb-24">
        <div className="container-default max-w-3xl break-keep">
          <p className="text-ink-soft mb-10" style={{ lineHeight: 1.85, letterSpacing: "-0.01em" }}>
            {CLINIC.name}(이하 ‘한의원’)은 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한
            고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보 처리방침을 수립·공개합니다.
          </p>

          <nav aria-label="목차" className="mb-12 border border-line rounded-lg p-5 bg-bg-alt">
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

          <Article n={1}>
            <p>
              한의원은 다음 목적을 위하여 개인정보를 처리합니다. 처리한 개인정보는 다음 목적 이외의 용도로는 이용하지
              않으며, 이용 목적이 바뀌는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를
              이행합니다.
            </p>
            <List
              items={[
                "진료 및 진료 관련 업무: 환자 확인, 진료·처방, 진료기록 작성·보존, 진단서 등 각종 증명서 발급, 진료비 수납",
                "진료비 청구: 국민건강보험공단·건강보험심사평가원, 자동차보험회사 등에 대한 진료비 청구",
                "홈페이지 상담 신청 처리: 상담 신청 접수, 휴대폰 본인 확인, 상담 일정 안내 연락",
                "민원 처리: 민원인 확인, 민원 사항 확인, 처리 결과 통보",
              ]}
            />
          </Article>

          <Article n={2}>
            <Table
              head={["구분", "처리 항목"]}
              rows={[
                [
                  "내원·진료",
                  <>
                    성명, 주민등록번호, 주소, 연락처, 진료 및 건강에 관한 정보(진료기록, 처방 내용 등)
                    <br />
                    자동차보험 진료 시: 보험회사명, 사고접수번호
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
                ],
                ["휴대폰 본인 확인", "휴대폰 번호, 인증번호"],
                ["홈페이지 이용 시 자동 생성", "접속 IP 주소, 접속 일시, 브라우저 정보(서버 접속 기록)"],
              ]}
            />
            <p>
              개인정보는 내원 시 접수·진료 과정, 홈페이지 상담 신청, 전화 상담, 네이버 예약 등 외부 예약 서비스를 통한
              예약(해당 서비스가 전달하는 예약자 정보)을 통해 수집합니다. 홈페이지에서는 주민등록번호를 수집하지 않습니다.
            </p>
          </Article>

          <Article n={3}>
            <p>
              ① 한의원은 법령에 따른 보존 기간 또는 정보주체에게 동의받은 기간 동안 개인정보를 처리·보유합니다.
            </p>
            <p>② 진료 관련 기록은 「의료법」 제22조 및 같은 법 시행규칙 제15조에 따라 다음 기간 동안 보존합니다.</p>
            <Table
              head={["기록", "보존 기간"]}
              rows={[
                ["진료기록부", "10년"],
                ["환자 명부", "5년"],
                ["검사내용 및 검사소견기록", "5년"],
                ["방사선 사진(영상물 포함) 및 그 소견서", "5년"],
                ["진단서 등의 부본", "3년"],
                ["처방전", "2년"],
              ]}
            />
            <p>
              ③ 홈페이지 상담 신청 정보는 신청일로부터 {RESERVATION_RETENTION_KO}간 보유하며, 기간이 지나면 자동으로
              파기합니다. 상담 후 진료를 받으신 경우 진료 관련 기록은 ②에 따릅니다.
            </p>
            <p>④ 휴대폰 본인 확인을 위한 인증번호 기록은 발급 후 {SMS_VERIFICATION_RETENTION_HOURS}시간 이내에 파기합니다.</p>
            <p>⑤ 서버 접속 기록은 홈페이지 호스팅 업체(Vercel Inc.)의 보관 정책에 따라 단기간 보관된 뒤 삭제됩니다.</p>
          </Article>

          <Article n={4}>
            <p>
              ① 한의원은 정보주체의 개인정보를 제1조의 목적 범위에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등
              「개인정보 보호법」 제17조 및 제18조에 해당하는 경우에만 제3자에게 제공합니다.
            </p>
            <p>② 한의원은 다음과 같이 법령에 근거하여 개인정보를 제공합니다.</p>
            <Table
              head={["제공받는 자", "목적", "근거"]}
              rows={[
                ["국민건강보험공단, 건강보험심사평가원", "요양급여비용 청구 및 심사", "「국민건강보험법」"],
                ["자동차보험회사 및 공제조합", "자동차보험 진료수가 청구", "「자동차손해배상 보장법」"],
              ]}
            />
            <p>③ 그 밖에 「의료법」 제21조 등 법령에 근거한 요청이 있는 경우 그 범위에서 제공할 수 있습니다.</p>
          </Article>

          <Article n={5}>
            <p>① 한의원은 원활한 업무 처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
            <Table
              head={["수탁자", "위탁 업무"]}
              rows={[
                ["솔라피 주식회사", "휴대폰 인증번호 및 상담 신청 안내 문자 발송"],
                ["네이버 주식회사", "상담 신청 알림 이메일 발송·수신(네이버 메일)"],
                ["Vercel Inc.", "홈페이지 서버 운영(호스팅)"],
                ["Supabase Pte. Ltd.", "홈페이지 데이터베이스 운영(상담 신청 정보 보관)"],
              ]}
            />
            <p>
              ② 한의원은 위탁 계약 시 「개인정보 보호법」 제26조에 따라 위탁업무 수행 목적 외 개인정보 처리 금지, 안전성
              확보조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 문서에 명시하고, 수탁자가
              개인정보를 안전하게 처리하는지 감독합니다.
            </p>
            <p>③ 위탁 업무의 내용이나 수탁자가 바뀌는 경우에는 지체 없이 이 개인정보 처리방침을 통하여 공개합니다.</p>
          </Article>

          <Article n={6}>
            <p>
              ① 한의원은 홈페이지 운영을 위하여 다음과 같이 개인정보를 국외에 위탁·보관합니다(「개인정보 보호법」
              제28조의8 제1항 제3호).
            </p>
            <Table
              head={["이전받는 자(연락처)", "국가", "이전 항목", "이전 일시·방법", "목적", "보유·이용 기간"]}
              rows={[
                [
                  <>
                    Supabase Pte. Ltd.
                    <br />
                    (privacy@supabase.com)
                  </>,
                  "싱가포르",
                  "상담 신청 정보(이름, 휴대폰 번호, 희망 일시, 관심 시술, 증상·요청사항), 휴대폰 인증 기록",
                  "상담 신청 시 정보통신망으로 전송",
                  "데이터베이스 보관",
                  "제3조 ③·④의 기간",
                ],
                [
                  <>
                    Vercel Inc.
                    <br />
                    (privacy@vercel.com)
                  </>,
                  "미국",
                  "상담 신청 정보(전송 과정), 서버 접속 기록(IP 주소, 접속 일시, 브라우저 정보)",
                  "홈페이지 이용 시 정보통신망으로 전송",
                  "홈페이지 서버 운영",
                  "제3조 ⑤의 기간",
                ],
              ]}
            />
            <p>
              ② 국외 이전을 원하지 않으시면 홈페이지 상담 신청 대신 전화({CLINIC.phone}) 또는 내원으로 상담을 신청하실 수
              있습니다. 이 경우 상담 신청 정보는 국외로 이전되지 않습니다.
            </p>
          </Article>

          <Article n={7}>
            <p>
              ① 한의원은 보유 기간이 지나거나 처리 목적이 달성되는 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당
              개인정보를 파기합니다.
            </p>
            <p>
              ② 보유 기간이 지났거나 처리 목적이 달성되었음에도 다른 법령에 따라 보존해야 하는 경우에는 해당 개인정보를
              별도로 분리하여 보존합니다.
            </p>
            <p>
              ③ 전자적 파일은 복구·재생할 수 없도록 기술적 방법으로 삭제하고, 종이 문서는 분쇄하거나 소각하여 파기합니다.
              홈페이지 상담 신청 정보와 인증번호 기록은 보유 기간이 지나면 시스템에서 자동으로 삭제됩니다.
            </p>
          </Article>

          <Article n={8}>
            <p>
              ① 한의원은 진료를 위하여 건강에 관한 정보(민감정보)를 「의료법」 등 법령에 근거하여 처리합니다. 홈페이지
              상담 신청 시 ‘증상·요청사항’에 적으신 건강에 관한 정보는 다른 개인정보와 구분하여 별도의 동의를 받아
              처리합니다.
            </p>
            <p>
              ② 한의원은 「의료법 시행령」 제42조의2 등 법령에 근거하여 진료 및 진료비 청구에 필요한 범위에서
              주민등록번호를 처리합니다.
            </p>
          </Article>

          <Article n={9}>
            <p>
              ① 정보주체는 한의원에 대하여 언제든지 개인정보 열람, 정정·삭제, 처리정지 및 동의 철회를 요구할 수 있습니다.
            </p>
            <p>
              ② 권리 행사는 서면, 전화, 방문 등의 방법으로 하실 수 있으며, 한의원은 이에 대해 지체 없이 조치합니다.
              정보주체의 법정대리인이나 위임을 받은 자를 통해서도 하실 수 있으며, 이 경우 위임장을 제출하셔야 합니다.
            </p>
            <p>③ 진료기록의 열람 및 사본 발급은 「의료법」 제21조에서 정한 절차에 따릅니다.</p>
            <p>
              ④ 다른 법령에서 보존하도록 정한 개인정보(진료기록 등)는 그 보존 기간 동안 삭제를 요구할 수 없으며, 법령에서
              정한 경우 처리정지 요구가 거절될 수 있습니다.
            </p>
            <p>⑤ 홈페이지 상담 신청은 만 14세 이상만 하실 수 있으며, 만 14세 미만 아동은 법정대리인이 신청해 주셔야 합니다.</p>
          </Article>

          <Article n={10}>
            <p>한의원은 개인정보의 안전성 확보를 위해 다음과 같은 조치를 하고 있습니다.</p>
            <List
              items={[
                "관리적 조치: 개인정보를 취급하는 직원의 최소화 및 교육",
                "기술적 조치: 관리자 화면 접근 시 비밀번호 인증, 비밀번호 일방향 암호화 저장, 전 구간 암호화 통신(HTTPS), 데이터베이스 접근 권한 통제",
                "보유 기간이 지난 홈페이지 상담 신청 정보의 자동 파기",
              ]}
            />
          </Article>

          <Article n={11}>
            <p>
              한의원 홈페이지는 이용자를 식별하거나 이용 행태를 추적하는 쿠키를 사용하지 않습니다. 언어 설정과 관심 시술
              목록은 이용자의 브라우저에만 저장되며, 상담 신청 시 이용자가 제출하는 경우에만 한의원으로 전송됩니다. 이
              정보는 브라우저 설정에서 사이트 데이터를 삭제하여 지울 수 있습니다.
            </p>
          </Article>

          <Article n={12}>
            <p>
              한의원은 개인정보 처리에 관한 업무를 총괄하여 책임지고, 개인정보 처리와 관련한 정보주체의 불만 처리 및
              피해 구제를 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
            </p>
            <Table
              head={["구분", "내용"]}
              rows={[
                ["성명", PRIVACY_OFFICER.name],
                ["직책", PRIVACY_OFFICER.position],
                ["연락처", PRIVACY_OFFICER.phone],
                ["주소", `${CLINIC.address} ${CLINIC.name}`],
              ]}
            />
            <p>정보주체는 개인정보 열람 청구, 문의, 불만 처리, 피해 구제 등을 개인정보 보호책임자에게 요청하실 수 있습니다.</p>
          </Article>

          <Article n={13}>
            <p>개인정보 침해에 대한 피해 구제, 상담 등이 필요하신 경우 아래 기관에 문의하실 수 있습니다.</p>
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

          <Article n={14}>
            <p>이 개인정보 처리방침은 {EFFECTIVE_DATE_KO}부터 적용됩니다.</p>
          </Article>
        </div>
      </section>
    </>
  );
}

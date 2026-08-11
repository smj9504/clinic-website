import { getServiceClient } from "@/lib/supabase";
import { clinicInfo as defaultClinicInfo } from "@/lib/data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gowoonbit-kmc.com";

/** admin에서 저장한 실제 진료 시간(clinicInfo.hours)을 읽어온다. 실패 시 기본값으로 폴백. */
async function getClinicHours(): Promise<typeof defaultClinicInfo.hours> {
  try {
    const supabase = getServiceClient();
    const { data } = await supabase
      .from("site_data")
      .select("data")
      .eq("locale", "ko")
      .single();
    return data?.data?.clinicInfo?.hours ?? defaultClinicInfo.hours;
  } catch {
    return defaultClinicInfo.hours;
  }
}

/** "평일 10:30 – 20:00" 같은 자유 텍스트에서 시작/종료 시각만 추출. 형식이 안 맞으면 null. */
function parseHoursRange(text: string): { opens: string; closes: string } | null {
  const matches = text.match(/\d{1,2}:\d{2}/g);
  if (!matches || matches.length < 2) return null;
  return { opens: matches[0], closes: matches[1] };
}

function buildOpeningHours(hours: typeof defaultClinicInfo.hours) {
  const weekday = parseHoursRange(hours.weekday);
  const saturday = parseHoursRange(hours.saturday);
  return [
    weekday && {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: weekday.opens,
      closes: weekday.closes,
    },
    saturday && {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: saturday.opens,
      closes: saturday.closes,
    },
  ].filter((v): v is NonNullable<typeof v> => Boolean(v));
}

function buildLocalBusinessSchema(hours: typeof defaultClinicInfo.hours) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    "@id": `${SITE_URL}/#clinic`,
    name: "고운빛한의원",
    alternateName: "Gowoonbit Korean Medicine Clinic",
    url: SITE_URL,
    logo: `${SITE_URL}/og-image.jpg`,
    image: `${SITE_URL}/og-image.jpg`,
    description:
      "여의도 고운빛한의원 — 통증치료, 추나요법, 자동차보험치료, 다이어트, 점빼기, 리프팅, 레이저 시술 전문 한의원",
    telephone: "02-783-7525",
    address: {
      "@type": "PostalAddress",
      streetAddress: "서울시 영등포구 국회대로62길 15, 광복회관 지하1층",
      addressLocality: "영등포구",
      addressRegion: "서울특별시",
      postalCode: "07236",
      addressCountry: "KR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 37.5219,
      longitude: 126.9245,
    },
    openingHoursSpecification: buildOpeningHours(hours),
    priceRange: "$$",
    currenciesAccepted: "KRW",
    paymentAccepted: "Cash, Credit Card",
    medicalSpecialty: [
      "Korean Medicine",
      "Pain Management",
      "Dermatology",
    ],
    availableService: [
      { "@type": "MedicalProcedure", name: "통증치료" },
      { "@type": "MedicalProcedure", name: "추나요법" },
      { "@type": "MedicalProcedure", name: "자동차보험치료" },
      { "@type": "MedicalProcedure", name: "다이어트 프로그램" },
      { "@type": "MedicalProcedure", name: "점빼기" },
      { "@type": "MedicalProcedure", name: "리프팅" },
      { "@type": "MedicalProcedure", name: "레이저 시술" },
      { "@type": "MedicalProcedure", name: "침치료" },
      { "@type": "MedicalProcedure", name: "한약 처방" },
    ],
    areaServed: {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        latitude: 37.5219,
        longitude: 126.9245,
      },
      geoRadius: "5000",
    },
    sameAs: [],
  };
}

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "고운빛한의원",
  url: SITE_URL,
  inLanguage: "ko",
  publisher: {
    "@type": "Organization",
    name: "고운빛한의원",
    url: SITE_URL,
  },
};

export default async function JsonLd() {
  const hours = await getClinicHours();
  const localBusinessSchema = buildLocalBusinessSchema(hours);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}

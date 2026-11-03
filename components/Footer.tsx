"use client";

import Link from "next/link";
import { useSiteData } from "@/lib/useSiteData";
import { useT } from "@/lib/i18n";

export default function Footer() {
  const { clinicInfo } = useSiteData();
  const t = useT();

  return (
    <footer className="bg-surface-dark text-ink-inverse pt-20 pb-12">
      <div className="container-default">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-12 mb-16">
          <div>
            <div
              className="font-display mb-6"
              style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.04em" }}
            >
              {clinicInfo.name}
            </div>
            <p
              className="opacity-60 max-w-xs"
              style={{ fontSize: "0.9rem", lineHeight: 1.7, letterSpacing: "-0.01em" }}
            >
              {t("footer.description")}
            </p>
          </div>

          <div>
            <h4
              className="text-xs font-semibold uppercase opacity-60 mb-5"
              style={{ letterSpacing: "0.15em" }}
            >
              {t("footer.contact")}
            </h4>
            <ul className="space-y-3 list-none">
              <li className="opacity-85 text-sm">{clinicInfo.phone}</li>
              <li className="opacity-85 text-sm">{clinicInfo.address}</li>
            </ul>
          </div>

          <div>
            <h4
              className="text-xs font-semibold uppercase opacity-60 mb-5"
              style={{ letterSpacing: "0.15em" }}
            >
              {t("footer.hours")}
            </h4>
            <ul className="space-y-3 list-none">
              <li className="opacity-85 text-sm">{clinicInfo.hours.weekday}</li>
              <li className="opacity-85 text-sm">{clinicInfo.hours.saturday}</li>
              <li className="opacity-85 text-sm">{clinicInfo.hours.closed}</li>
            </ul>
          </div>

          <div>
            <h4
              className="text-xs font-semibold uppercase opacity-60 mb-5"
              style={{ letterSpacing: "0.15em" }}
            >
              {t("footer.follow")}
            </h4>
            <ul className="space-y-3 list-none">
              <li>
                <Link
                  href={clinicInfo.socialLinks.blog}
                  className="opacity-85 text-sm hover:opacity-100"
                >
                  {t("footer.blog")}
                </Link>
              </li>
              <li>
                <Link
                  href={clinicInfo.socialLinks.instagram}
                  className="opacity-85 text-sm hover:opacity-100"
                >
                  {t("footer.instagram")}
                </Link>
              </li>
              <li>
                <Link
                  href={clinicInfo.socialLinks.kakao}
                  className="opacity-85 text-sm hover:opacity-100"
                >
                  {t("footer.kakao")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="pt-8 border-t flex flex-wrap items-center gap-x-6 gap-y-2"
          style={{ borderColor: "rgba(251, 250, 247, 0.1)", fontSize: "0.8rem" }}
        >
          {/* 처리방침 작성지침: 처리방침 링크는 다른 고지사항과 구분되게(굵게·밝게) 표시한다.
              오른쪽 아래는 플로팅 버튼(FloatingActions)이 가리므로 왼쪽에 둔다. */}
          <Link href="/privacy" className="font-bold opacity-90 hover:opacity-100 hover:underline underline-offset-2">
            {t("footer.privacy")}
          </Link>
          <span className="opacity-50">&copy; 2026 {clinicInfo.name}. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

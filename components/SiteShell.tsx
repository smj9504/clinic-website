"use client";

import { usePathname } from "next/navigation";
import { LocaleProvider } from "@/lib/i18n";
import Nav from "./Nav";
import Footer from "./Footer";
import FloatingActions from "./FloatingActions";
import PopupModal from "./PopupModal";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const isAdmin = pathname.startsWith("/admin");

  return (
    <LocaleProvider>
      {isAdmin ? (
        <>{children}</>
      ) : (
        <>
          <Nav />
          <main>{children}</main>
          <Footer />
          <FloatingActions />
          <PopupModal />
        </>
      )}
    </LocaleProvider>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { LocaleProvider } from "@/lib/i18n";
import { CartProvider } from "@/lib/cart";
import { useSiteData } from "@/lib/useSiteData";
import Nav from "./Nav";
import Footer from "./Footer";
import FloatingActions from "./FloatingActions";
import PopupModal from "./PopupModal";
import PageTransition from "./PageTransition";
import LoadingScreen from "./LoadingScreen";

/** DB 데이터 로드가 끝나기 전까지는 기본값 대신 로딩 스크린을 보여준다. */
function PublicSite({ children }: { children: React.ReactNode }) {
  const { loaded } = useSiteData();

  if (!loaded) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Nav />
      <main>
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <FloatingActions />
      <PopupModal />
    </>
  );
}

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const isAdmin = pathname.startsWith("/admin");

  return (
    <LocaleProvider>
      <CartProvider>
        {isAdmin ? <>{children}</> : <PublicSite>{children}</PublicSite>}
      </CartProvider>
    </LocaleProvider>
  );
}

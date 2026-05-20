"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [animKey, setAnimKey] = useState(pathname);

  useEffect(() => {
    setAnimKey(pathname || "/");
  }, [pathname]);

  return (
    <div key={animKey} className="page-transition-enter">
      {children}
    </div>
  );
}

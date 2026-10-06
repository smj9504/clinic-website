"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [animKey, setAnimKey] = useState(pathname);
  const [animating, setAnimating] = useState(true);

  useEffect(() => {
    setAnimKey(pathname || "/");
    setAnimating(true);
  }, [pathname]);

  return (
    <div
      key={animKey}
      className={animating ? "page-transition-enter" : undefined}
      onAnimationEnd={() => setAnimating(false)}
    >
      {children}
    </div>
  );
}

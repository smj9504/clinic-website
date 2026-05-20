"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations, type TranslationKey } from "./translations";

export type Locale = "ko" | "en";

const LOCALE_KEY = "clinic_locale";

type LocaleContextType = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
};

const LocaleContext = createContext<LocaleContextType>({
  locale: "ko",
  setLocale: () => {},
  t: (key) => key,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ko");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_KEY) as Locale | null;
    if (stored === "ko" || stored === "en") {
      setLocaleState(stored);
    }
    setHydrated(true);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(LOCALE_KEY, l);
    window.dispatchEvent(new CustomEvent("localeChanged", { detail: l }));
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      const current = hydrated ? locale : "ko";
      return translations[current]?.[key] ?? translations.ko[key] ?? key;
    },
    [locale, hydrated]
  );

  return (
    <LocaleContext.Provider value={{ locale: hydrated ? locale : "ko", setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function useT() {
  const { t } = useContext(LocaleContext);
  return t;
}

"use client";

import { createContext, useContext, useState } from "react";
import type { Locale } from "./i18n";

type AdminLocaleContextType = {
  editingLocale: Locale;
  setEditingLocale: (l: Locale) => void;
};

const AdminLocaleContext = createContext<AdminLocaleContextType>({
  editingLocale: "ko",
  setEditingLocale: () => {},
});

export function AdminLocaleProvider({ children }: { children: React.ReactNode }) {
  const [editingLocale, setEditingLocale] = useState<Locale>("ko");

  return (
    <AdminLocaleContext.Provider value={{ editingLocale, setEditingLocale }}>
      {children}
    </AdminLocaleContext.Provider>
  );
}

export function useAdminLocale() {
  return useContext(AdminLocaleContext);
}

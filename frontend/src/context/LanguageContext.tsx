import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { copy, type Copy } from "../i18n/copy.ts";
import type { Language } from "../types/catalog.ts";
type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Copy;
};
const LanguageContext = createContext<LanguageContextValue | null>(null);
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const value = useMemo(
    () => ({ language, setLanguage, t: copy[language] }),
    [language],
  );
  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}
export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
import type { Language } from "../types/catalog.ts";

const locales: Record<Language, string> = {
  en: "en-IN",
  te: "te-IN",
  ta: "ta-IN",
};

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatWhen(iso: string, language: Language): string {
  return new Intl.DateTimeFormat(locales[language], {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

import { useLanguage } from "../context/LanguageContext.tsx";
import type { Language } from "../types/catalog.ts";

type LanguageSelectorProps = {
  compact?: boolean;
};

export function LanguageSelector({ compact = false }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useLanguage();
  const options: { id: Language; label: string }[] = [
    { id: "en", label: t.english },
    { id: "te", label: t.telugu },
    { id: "ta", label: t.tamil },
  ];

  return (
    <div>
      <p
        className={`font-semibold text-grove-dark ${compact ? "sr-only" : "mb-3 text-xl"}`}
      >
        {t.language}
      </p>
      <div
        className={`flex flex-wrap gap-2 ${compact ? "" : "justify-center"}`}
        role="group"
        aria-label={t.language}
      >
        {options.map((option) => {
          const selected = option.id === language;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setLanguage(option.id)}
              className={`rounded-2xl font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grove ${
                compact ? "min-h-12 px-3 text-base" : "min-h-14 px-5 text-xl"
              } ${
                selected
                  ? "bg-grove text-white shadow-md"
                  : "border-2 border-grove bg-white text-grove hover:bg-grove-soft"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

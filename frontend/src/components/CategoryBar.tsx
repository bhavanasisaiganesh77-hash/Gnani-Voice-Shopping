import { useLanguage } from "../context/LanguageContext.tsx";
import { categoryIds, type CategoryFilter } from "../types/catalog.ts";

type CategoryBarProps = {
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
};

export function CategoryBar({ value, onChange }: CategoryBarProps) {
  const { t } = useLanguage();
  const options: CategoryFilter[] = ["all", ...categoryIds];

  return (
    <div className="mt-4">
      <p className="text-lg font-semibold text-grove-dark">{t.categories}</p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {options.map((option) => {
          const selected = option === value;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option)}
              className={`shrink-0 rounded-2xl px-4 py-3 text-lg font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grove ${
                selected
                  ? "bg-citrus text-white shadow-md"
                  : "bg-white text-grove ring-1 ring-green-200 hover:bg-grove-soft"
              }`}
            >
              {t[option]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

import { useLanguage } from "../context/LanguageContext.tsx";

type CategoryBarProps = {
  value: string;
  onChange: (value: string) => void;
  categories: string[];
};

export function CategoryBar({
  value,
  onChange,
  categories,
}: CategoryBarProps) {
  const { t } = useLanguage();

  const options = [
    "all",
    ...Array.from(
      new Set(
        categories
          .map((category) => category.trim())
          .filter(Boolean)
      )
    ),
  ];

  const getCategoryLabel = (category: string) => {
    if (category === "all") {
      return t.all;
    }

    return category
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  return (
    <div className="mt-4">
      <p className="text-lg font-semibold text-grove-dark">
        {t.categories}
      </p>

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
              {getCategoryLabel(option)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
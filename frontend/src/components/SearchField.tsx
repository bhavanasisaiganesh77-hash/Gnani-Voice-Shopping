import { Search } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.tsx";

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchField({ value, onChange }: SearchFieldProps) {
  const { t } = useLanguage();

  return (
    <label className="block">
      <span className="text-lg font-semibold text-grove-dark">
        {t.searchLabel}
      </span>
      <span className="mt-2 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-md ring-1 ring-green-100 focus-within:ring-2 focus-within:ring-grove">
        <Search aria-hidden="true" className="text-grove" size={24} />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full bg-transparent text-xl text-grove-dark outline-none placeholder:text-slate-400"
        />
      </span>
    </label>
  );
}

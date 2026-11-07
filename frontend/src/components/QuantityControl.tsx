import { Minus, Plus } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.tsx";

type QuantityControlProps = {
  quantity: number;
  max: number;
  onDecrease: () => void;
  onIncrease: () => void;
};

export function QuantityControl({
  quantity,
  max,
  onDecrease,
  onIncrease,
}: QuantityControlProps) {
  const { t } = useLanguage();

  return (
    <div className="inline-flex items-center gap-2 rounded-2xl bg-grove-soft p-1">
      <button
        type="button"
        aria-label={t.decrease}
        onClick={onDecrease}
        className="grid h-12 w-12 place-items-center rounded-xl bg-white text-grove shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grove"
      >
        <Minus aria-hidden="true" size={22} />
      </button>
      <span className="min-w-10 text-center text-xl font-bold" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        aria-label={t.increase}
        onClick={onIncrease}
        disabled={quantity >= max}
        className="grid h-12 w-12 place-items-center rounded-xl bg-white text-grove shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grove disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus aria-hidden="true" size={22} />
      </button>
    </div>
  );
}

import { useLanguage } from "../context/LanguageContext.tsx";
import { formatMoney } from "../lib/format.ts";
import { cardClass } from "../ui/styles.ts";

type OrderSummaryProps = {
  subtotal: number;
  total: number;
  itemCount: number;
};

export function OrderSummary({
  subtotal,
  total,
  itemCount,
}: OrderSummaryProps) {
  const { t } = useLanguage();

  return (
    <section className={cardClass}>
      <dl className="space-y-3 text-lg">
        <div className="flex items-center justify-between gap-4">
          <dt>{t.items}</dt>
          <dd className="font-semibold">{itemCount}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt>{t.subtotal}</dt>
          <dd className="font-semibold">{formatMoney(subtotal)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-green-100 pt-3 text-2xl font-bold text-grove">
          <dt>{t.total}</dt>
          <dd>{formatMoney(total)}</dd>
        </div>
      </dl>
    </section>
  );
}

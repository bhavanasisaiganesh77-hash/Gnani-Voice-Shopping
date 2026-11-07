import { useLanguage } from "../context/LanguageContext.tsx";
import { formatMoney } from "../lib/format.ts";
import type { Product } from "../types/catalog.ts";
import { cardClass, primaryButton } from "../ui/styles.ts";

type ProductCardProps = {
  product: Product;
  quantityInCart: number;
  onAdd: () => void;
};

export function ProductCard({
  product,
  quantityInCart,
  onAdd,
}: ProductCardProps) {
  const { language, t } = useLanguage();
  const atLimit = product.stock < 1 || quantityInCart >= product.stock;

  return (
    <article className={`${cardClass} flex h-full flex-col`}>
      <p className="text-sm font-semibold uppercase tracking-wide text-citrus">
        {t[product.category]}
      </p>
      <h2 className="mt-2 text-2xl font-bold text-grove-dark">
        {product.names[language]}
      </h2>
      <p className="mt-2 text-lg text-slate-600">
        {t.brandLabel}: {product.brand}
      </p>
      <p className="mt-3 text-2xl font-semibold text-grove">
        <span className="sr-only">{t.price}: </span>
        {formatMoney(product.price)}
      </p>
      <p className="text-base text-slate-500">{product.unit}</p>
      <p className="mt-2 text-lg">
        {t.stock}: {product.stock}
      </p>
      {quantityInCart > 0 ? (
        <p className="mt-1 text-base font-semibold text-citrus">
          {t.inCart}: {quantityInCart}
        </p>
      ) : null}
      <button
        type="button"
        className={`${primaryButton} mt-4 w-full`}
        onClick={onAdd}
        disabled={atLimit}
      >
        {atLimit && product.stock < 1 ? t.outOfStock : t.add}
      </button>
    </article>
  );
}

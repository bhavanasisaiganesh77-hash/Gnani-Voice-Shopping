import { Trash } from "lucide-react";
import { Link } from "react-router-dom";
import { KioskFrame } from "../components/KioskHeader.tsx";
import { OrderSummary } from "../components/OrderSummary.tsx";
import { QuantityControl } from "../components/QuantityControl.tsx";
import { useCart } from "../context/CartContext.tsx";
import { useLanguage } from "../context/LanguageContext.tsx";
import { formatMoney } from "../lib/format.ts";
import { cardClass, primaryButton, secondaryButton } from "../ui/styles.ts";

export function CartPage() {
  const { t, language } = useLanguage();
  const {
    products,
    lines,
    subtotal,
    total,
    itemCount,
    increase,
    decrease,
    remove,
  } = useCart();

  return (
    <KioskFrame>
      <h1 className="text-3xl font-bold text-grove sm:text-4xl">{t.cart}</h1>
      {lines.length === 0 ? (
        <div className={`${cardClass} mt-6`}>
          <p className="text-xl">{t.emptyCart}</p>
          <Link to="/shop" className={`${primaryButton} mt-6`}>
            {t.continueShopping}
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <ul className="space-y-4">
            {lines.map((line) => {
              const product = products.find((item) => item.id === line.productId);
              if (!product) return null;
              return (
                <li key={line.productId} className={cardClass}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold">
                        {product.names[language]}
                      </h2>
                      <p className="mt-1 text-lg text-slate-600">
                        {t.brandLabel}: {product.brand}
                      </p>
                      <p className="mt-1 text-lg">
                        {formatMoney(product.price)} · {product.unit}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-grove">
                      <span className="sr-only">{t.lineTotal}: </span>
                      {formatMoney(product.price * line.quantity)}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span className="sr-only">{t.quantity}</span>
                    <QuantityControl
                      quantity={line.quantity}
                      max={product.stock}
                      onDecrease={() => decrease(line.productId)}
                      onIncrease={() => increase(line.productId)}
                    />
                    <button
                      type="button"
                      onClick={() => remove(line.productId)}
                      className="inline-flex min-h-12 items-center gap-2 rounded-2xl px-4 text-lg font-semibold text-citrus hover:bg-orange-50"
                    >
                      <Trash aria-hidden="true" size={20} />
                      {t.remove}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="space-y-4">
            <OrderSummary
              subtotal={subtotal}
              total={total}
              itemCount={itemCount}
            />
            <Link to="/checkout" className={`${primaryButton} w-full`}>
              {t.checkout}
            </Link>
            <Link to="/shop" className={`${secondaryButton} w-full`}>
              {t.continueShopping}
            </Link>
          </div>
        </div>
      )}
    </KioskFrame>
  );
}

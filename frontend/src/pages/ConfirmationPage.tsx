import { CircleCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

import { KioskFrame } from "../components/KioskHeader.tsx";
import { OrderSummary } from "../components/OrderSummary.tsx";
import { useCart } from "../context/CartContext.tsx";
import { useLanguage } from "../context/LanguageContext.tsx";
import { formatMoney, formatWhen } from "../lib/format.ts";
import { cardClass, primaryButton } from "../ui/styles.ts";

export function ConfirmationPage() {
  const { t, language } = useLanguage();
  const { lastOrder, clearOrder } = useCart();
  const navigate = useNavigate();

  function startNewOrder() {
    clearOrder();
    navigate("/");
  }

  if (!lastOrder) {
    return (
      <KioskFrame>
        <div className={`${cardClass} mx-auto max-w-xl text-center`}>
          <p className="text-xl">{t.emptyOrder}</p>
          <Link to="/" className={`${primaryButton} mt-6`}>
            {t.home}
          </Link>
        </div>
      </KioskFrame>
    );
  }

  const itemCount = lastOrder.lines.reduce(
    (sum, line) => sum + line.quantity,
    0
  );

  const isUpi = lastOrder.payment_method === "upi";
  const hasUpiQr = isUpi && Boolean(lastOrder.upi_payment_uri);

  return (
    <KioskFrame>
      <section className="mx-auto max-w-3xl">
        <div className="text-center">
          <CircleCheck
            className="mx-auto text-grove"
            size={72}
            aria-hidden="true"
          />

          <h1 className="mt-3 text-3xl font-bold text-grove sm:text-4xl">
            {t.orderConfirmed}
          </h1>

          <p className="mt-3 text-lg text-slate-600">
            {t.confirmationNote}
          </p>
        </div>

        <div className={`${cardClass} mt-6`}>
          <p className="text-lg text-slate-600">{t.orderNumber}</p>

          <p className="mt-1 text-3xl font-bold tracking-wide text-grove-dark">
            {lastOrder.id}
          </p>

          <p className="mt-2 text-lg text-slate-600">
            {formatWhen(lastOrder.placedAt, language)}
          </p>

          <ul className="mt-6 space-y-3 border-t border-green-100 pt-4">
            {lastOrder.lines.map((line) => (
              <li
                key={line.productId}
                className="flex flex-wrap items-center justify-between gap-3 text-lg"
              >
                <span>
                  {line.name}
                  <span className="block text-base text-slate-600">
                    {line.brand} · {line.quantity} × {formatMoney(line.price)}
                  </span>
                </span>

                <span className="font-semibold">
                  {formatMoney(line.price * line.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4">
          <OrderSummary
            subtotal={lastOrder.subtotal}
            total={lastOrder.total}
            itemCount={itemCount}
          />
        </div>

        {isUpi && (
          <div className={`${cardClass} mt-6 text-center`}>
            <h2 className="text-2xl font-bold text-grove-dark">
              Pay using UPI
            </h2>

            <p className="mt-2 text-slate-600">
              Scan this QR code using any UPI payment app.
            </p>

            <p className="mt-4 text-3xl font-bold text-grove">
              {formatMoney(lastOrder.total)}
            </p>

            {hasUpiQr ? (
              <>
                <div className="mx-auto mt-5 inline-block rounded-xl border border-green-100 bg-white p-4">
                  <QRCodeSVG
                    value={lastOrder.upi_payment_uri!}
                    size={240}
                    level="H"
                    includeMargin
                  />
                </div>

                <p className="mt-4 font-medium text-grove-dark">
                  Your order amount is prefilled in the QR code.
                </p>

                <a
                  href={lastOrder.upi_payment_uri!}
                  className={`${primaryButton} mt-5 inline-flex`}
                >
                  Open UPI App
                </a>

                <p className="mt-4 text-sm text-slate-600">
                  After payment, show the payment confirmation to the shop
                  worker. Your payment will be verified manually.
                </p>
              </>
            ) : (
              <p className="mt-4 text-red-600">
                The payment QR could not be generated. Please contact the
                shop worker before making payment.
              </p>
            )}
          </div>
        )}

        {lastOrder.payment_method === "cash" && (
          <div className={`${cardClass} mt-6 text-center`}>
            <h2 className="text-2xl font-bold text-grove-dark">
              Cash Payment
            </h2>

            <p className="mt-3 text-lg text-slate-600">
              Please pay {formatMoney(lastOrder.total)} at the billing counter.
            </p>
          </div>
        )}

        <button
          type="button"
          className={`${primaryButton} mt-6 w-full`}
          onClick={startNewOrder}
        >
          {t.newOrder}
        </button>
      </section>
    </KioskFrame>
  );
}
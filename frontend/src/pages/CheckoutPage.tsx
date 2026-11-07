import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KioskFrame } from "../components/KioskHeader.tsx";
import { OrderSummary } from "../components/OrderSummary.tsx";
import { useCart } from "../context/CartContext.tsx";
import { useLanguage } from "../context/LanguageContext.tsx";
import { formatMoney } from "../lib/format.ts";
import type { PaymentMethod } from "../types/catalog.ts";
import {
  cardClass,
  primaryButton,
  secondaryButton,
} from "../ui/styles.ts";

export function CheckoutPage() {
  const { t, language } = useLanguage();

  const {
    products,
    lines,
    subtotal,
    total,
    itemCount,
    confirmOrder,
  } = useCart();

  const navigate = useNavigate();

  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cash");

  const [customerPhone, setCustomerPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  async function handleConfirm() {
    if (placing || lines.length === 0) return;

    const cleanPhone = customerPhone.replace(/\D/g, "");

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setPhoneError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    setPhoneError("");
    setPlacing(true);

    try {
      const order = await confirmOrder(
        language,
        paymentMethod,
        cleanPhone
      );

      if (order) {
        navigate("/order");
        return;
      }
    } catch (error: any) {
      console.error("Order placement failed:", error);

      setPhoneError(
        error?.response?.data?.detail ||
        "Unable to place your order. Please try again."
      );
    }

    setPlacing(false);
  }

  return (
    <KioskFrame>
      <h1 className="text-3xl font-bold text-grove sm:text-4xl">
        {t.checkout}
      </h1>

      <p className="mt-2 text-xl text-slate-600">
        {t.reviewOrder}
      </p>

      {lines.length === 0 ? (
        <div className={`${cardClass} mt-6`}>
          <p className="text-xl">{t.emptyCart}</p>

          <Link to="/shop" className={`${primaryButton} mt-6`}>
            {t.continueShopping}
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">

            <ul className="space-y-3">
              {lines.map((line) => {
                const product = products.find(
                  (item) => item.id === line.productId
                );

                if (!product) return null;

                return (
                  <li
                    key={line.productId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-5 py-4 shadow-md ring-1 ring-green-100"
                  >
                    <div>
                      <p className="text-xl font-bold">
                        {product.names[language]}
                      </p>

                      <p className="text-lg text-slate-600">
                        {product.brand} · {t.quantity} {line.quantity}
                      </p>
                    </div>

                    <p className="text-xl font-semibold text-grove">
                      {formatMoney(product.price * line.quantity)}
                    </p>
                  </li>
                );
              })}
            </ul>

            <section className={cardClass}>
              <h2 className="text-2xl font-bold text-grove">
                Customer Mobile Number
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Enter your mobile number to track your order.
              </p>

              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={customerPhone}
                onChange={(event) => {
                  setCustomerPhone(
                    event.target.value.replace(/\D/g, "").slice(0, 10)
                  );
                  setPhoneError("");
                }}
                placeholder="Enter 10-digit mobile number"
                className="mt-4 w-full rounded-xl border border-slate-300 p-4 text-lg outline-none focus:border-green-700"
              />

              {phoneError && (
                <p className="mt-2 text-sm font-semibold text-red-600">
                  {phoneError}
                </p>
              )}
            </section>

            <section className={cardClass}>
              <h2 className="text-2xl font-bold text-grove">
                Choose Payment Method
              </h2>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("upi")}
                  aria-pressed={paymentMethod === "upi"}
                  className={`rounded-2xl border-2 p-5 text-left ${
                    paymentMethod === "upi"
                      ? "border-grove bg-green-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <span className="block text-xl font-bold">
                    UPI Payment
                  </span>

                  <span className="mt-1 block text-base text-slate-600">
                    Pay using UPI QR
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  aria-pressed={paymentMethod === "cash"}
                  className={`rounded-2xl border-2 p-5 text-left ${
                    paymentMethod === "cash"
                      ? "border-grove bg-green-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <span className="block text-xl font-bold">
                    Cash at Shop
                  </span>

                  <span className="mt-1 block text-base text-slate-600">
                    Pay at billing counter
                  </span>
                </button>
              </div>

              {paymentMethod === "upi" && (
                <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
                  <h3 className="text-xl font-bold text-grove">
                    Order-Specific UPI QR
                  </h3>

                  <p className="mt-2 text-slate-700">
                    Your QR code will be generated after you confirm
                    your order.
                  </p>

                  <p className="mt-4 text-sm text-slate-600">
                    Exact amount to be prefilled:
                  </p>

                  <p className="mt-1 text-3xl font-bold text-grove">
                    {formatMoney(total)}
                  </p>

                  <p className="mt-4 text-sm font-semibold text-amber-700">
                    You can scan the QR on the next page. No need
                    to enter the amount manually.
                  </p>
                </div>
              )}

              {paymentMethod === "cash" && (
                <div className="mt-5 rounded-xl bg-green-50 p-4">
                  <p className="font-semibold text-grove">
                    Cash Payment
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Pay {formatMoney(total)} at the billing counter.
                    The shopkeeper will confirm receipt.
                  </p>
                </div>
              )}
            </section>
          </div>

          <div className="space-y-4">
            <OrderSummary
              subtotal={subtotal}
              total={total}
              itemCount={itemCount}
            />

            <button
              type="button"
              className={`${primaryButton} w-full`}
              onClick={handleConfirm}
              disabled={placing}
            >
              {placing ? "Placing Order..." : t.confirmOrder}
            </button>

            <Link
              to="/cart"
              className={`${secondaryButton} w-full`}
            >
              {t.backToCart}
            </Link>
          </div>
        </div>
      )}
    </KioskFrame>
  );
}
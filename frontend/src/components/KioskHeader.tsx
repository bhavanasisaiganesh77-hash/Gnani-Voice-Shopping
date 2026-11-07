import type { ReactNode } from "react";
import { ShoppingCart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext.tsx";
import { useLanguage } from "../context/LanguageContext.tsx";
import { LanguageSelector } from "./LanguageSelector.tsx";

function navClass(active: boolean): string {
  return `inline-flex min-h-12 items-center gap-2 rounded-2xl px-4 text-lg font-semibold transition ${
    active
      ? "bg-grove text-white"
      : "bg-grove-soft text-grove hover:bg-green-100"
  }`;
}

export function KioskHeader() {
  const { t } = useLanguage();
  const { itemCount } = useCart();
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-20 border-b border-green-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="text-left">
          <span className="block text-lg font-bold tracking-wide text-grove sm:text-xl">
            GNANI
          </span>
          <span className="block text-xs font-semibold tracking-wide text-citrus sm:text-sm">
            VOICE SHOPPING
          </span>
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <LanguageSelector compact />
          <nav className="flex items-center gap-2" aria-label={t.shop}>
            <Link to="/shop" className={navClass(pathname === "/shop")}>
              {t.shop}
            </Link>
            <Link to="/cart" className={navClass(pathname === "/cart")}>
              <ShoppingCart aria-hidden="true" size={22} />
              {t.cart}
              <span className="rounded-full bg-citrus px-2 py-0.5 text-sm text-white">
                {itemCount}
              </span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

export function KioskFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-grove-soft text-grove-dark">
      <KioskHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}

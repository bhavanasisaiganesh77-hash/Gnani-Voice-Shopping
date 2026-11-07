import { Link } from "react-router-dom";
import { LanguageSelector } from "../components/LanguageSelector.tsx";
import { useLanguage } from "../context/LanguageContext.tsx";
import { primaryButton } from "../ui/styles.ts";

export function HomePage() {
  const { t } = useLanguage();

  return (
    <main className="flex min-h-screen items-center justify-center bg-grove-soft px-4 py-10">
      <section className="w-full max-w-3xl rounded-3xl bg-white px-6 py-10 text-center shadow-xl ring-1 ring-green-100 sm:px-12 sm:py-14">
        <p className="text-sm font-bold tracking-[0.18em] text-citrus">GNANI</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight text-grove sm:text-5xl">
          {t.brand}
        </h1>
        <p className="mt-4 text-xl leading-snug text-grove-dark sm:text-2xl">
          {t.tagline}
        </p>
        <p className="mt-3 text-lg text-slate-600">{t.welcome}</p>
        <div className="mt-8">
          <LanguageSelector />
        </div>
        <Link to="/shop" className={`${primaryButton} mt-10 min-h-16 px-10 text-2xl`}>
          {t.startShopping}
        </Link>
      </section>
    </main>
  );
}

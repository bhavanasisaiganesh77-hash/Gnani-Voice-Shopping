import { useMemo, useState } from "react";
import { CategoryBar } from "../components/CategoryBar.tsx";
import { KioskFrame } from "../components/KioskHeader.tsx";
import { MicPrompt } from "../components/MicPrompt.tsx";
import { ProductCard } from "../components/ProductCard.tsx";
import { SearchField } from "../components/SearchField.tsx";
import { useCart } from "../context/CartContext.tsx";
import { useLanguage } from "../context/LanguageContext.tsx";
import { copy } from "../i18n/copy.ts";

export function ShopPage() {
  const { t } = useLanguage();
  const { products, ready, lines, addProduct } = useCart();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");

  // Automatically collect categories from available products.
  const categories = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((product) => product.category?.trim())
          .filter((item): item is string => Boolean(item))
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return products.filter((product) => {
      if (category !== "all" && product.category !== category) {
        return false;
      }

      if (!needle) return true;

      const haystack = [
        product.names.en,
        product.names.te,
        product.names.ta,
        product.brand,
        product.category,
        copy.en[product.category],
        copy.te[product.category],
        copy.ta[product.category],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [products, query, category]);

  return (
    <KioskFrame>
      <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <MicPrompt />

        <div>
          <SearchField value={query} onChange={setQuery} />

          <CategoryBar
            value={category}
            onChange={setCategory}
            categories={categories}
          />

          {!ready ? (
            <p className="mt-8 text-xl">{t.loading}</p>
          ) : visible.length === 0 ? (
            <p className="mt-8 text-xl">{t.noResults}</p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantityInCart={
                    lines.find(
                      (line) => line.productId === product.id
                    )?.quantity ?? 0
                  }
                  onAdd={() => addProduct(product.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </KioskFrame>
  );
}
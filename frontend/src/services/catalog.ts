import { api } from "./api";
import type { Product, CategoryId, Language } from "../types/catalog";

type ApiProduct = {
  id: number;
  name: string;
  brand: string | null;
  category: string;
  price: number;
  unit: string | null;
  stock: number;
};

const translations: Record<string, Record<Language, string>> = {
  "urad-dal": {
    en: "Urad Dal",
    te: "మినపప్పు",
    ta: "உளுத்தம் பருப்பு",
  },
  "aashirvaad-atta": {
    en: "Aashirvaad Atta",
    te: "ఆశీర్వాద్ ఆటా",
    ta: "ஆசிர்வாத் ஆட்டா",
  },
  "upma-rava": {
    en: "Upma Rava",
    te: "ఉప్మా రవ్వ",
    ta: "உப்மா ரவை",
  },
  rice: {
    en: "Rice",
    te: "బియ్యం",
    ta: "அரிசி",
  },
  "toor-dal": {
    en: "Toor Dal",
    te: "కంది పప్పు",
    ta: "துவரம் பருப்பு",
  },
  sugar: {
    en: "Sugar",
    te: "చక్కెర",
    ta: "சர்க்கரை",
  },
};

function toProduct(item: ApiProduct): Product {
  const id = item.name.toLowerCase().replace(/\s+/g, "-");

  return {
    id,
    brand: item.brand ?? "Local",
    category: (
      ["pulses", "grains", "essentials", "dairy"].includes(
        item.category.toLowerCase()
      )
        ? item.category.toLowerCase()
        : "essentials"
    ) as CategoryId,
    price: Number(item.price),
    unit: item.unit ?? "1 unit",
    stock: item.stock,
    names: translations[id] ?? {
      en: item.name,
      te: item.name,
      ta: item.name,
    },
  };
}

export async function fetchProducts(): Promise<Product[]> {
  const response = await api.get<ApiProduct[]>("/products");
  return response.data.map(toProduct);
}
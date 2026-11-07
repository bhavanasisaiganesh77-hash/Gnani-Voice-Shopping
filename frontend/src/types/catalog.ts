export const languages = ["en", "te", "ta"] as const;

export type Language = (typeof languages)[number];

export const categoryIds = ["pulses", "grains", "essentials", "dairy"] as const;

export type CategoryId = (typeof categoryIds)[number];

export type CategoryFilter = CategoryId | "all";

export type Product = {
  id: string;
  brand: string;
  category: CategoryId;
  price: number;
  unit: string;
  stock: number;
  names: Record<Language, string>;
};

export type CartLine = {
  productId: string;
  quantity: number;
};

export type PaymentMethod = "upi" | "cash";

export type PaymentStatus =
  | "pending"
  | "pending_verification"
  | "paid";

export type OrderLine = {
  productId: string;
  name: string;
  brand: string;
  unit: string;
  price: number;
  quantity: number;
};

export type CustomerOrder = {
  id: string;
  placedAt: string;
  lines: OrderLine[];
  subtotal: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  upi_payment_uri: string | null;
};

export type NewOrder = {
  lines: OrderLine[];
  subtotal: number;
  total: number;
  customer_phone: string;
};
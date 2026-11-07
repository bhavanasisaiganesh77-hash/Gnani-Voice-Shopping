import { api } from "./api";

import type {
  CustomerOrder,
  NewOrder,
  PaymentMethod,
} from "../types/catalog";

export async function placeOrder(
  draft: NewOrder,
  paymentMethod: PaymentMethod
): Promise<CustomerOrder> {
  const response = await api.post<CustomerOrder>("/orders", {
    lines: draft.lines.map((line) => ({
      product_id: line.productId,
      quantity: line.quantity,
    })),

    payment_method: paymentMethod,

    customer_phone: draft.customer_phone,
  });

  return response.data;
}
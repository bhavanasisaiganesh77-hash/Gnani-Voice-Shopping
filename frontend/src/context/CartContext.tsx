import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { fetchProducts } from "../services/catalog.ts";
import { placeOrder } from "../services/orders.ts";

import type {
  CartLine,
  CustomerOrder,
  Language,
  PaymentMethod,
  Product,
} from "../types/catalog.ts";

type CartContextValue = {
  products: Product[];
  lines: CartLine[];
  ready: boolean;
  subtotal: number;
  total: number;
  itemCount: number;
  lastOrder: CustomerOrder | null;

  addProduct: (productId: string) => void;
  increase: (productId: string) => void;
  decrease: (productId: string) => void;
  remove: (productId: string) => void;

  confirmOrder: (
    language: Language,
    paymentMethod: PaymentMethod,
    customerPhone: string
  ) => Promise<CustomerOrder | null>;

  clearOrder: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function findProduct(
  products: Product[],
  productId: string
): Product | undefined {
  return products.find((product) => product.id === productId);
}

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [ready, setReady] = useState(false);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [lastOrder, setLastOrder] =
    useState<CustomerOrder | null>(null);

  useEffect(() => {
    let active = true;

    fetchProducts()
      .then((list) => {
        if (!active) return;

        setProducts(list);
        setReady(true);
      })
      .catch((error) => {
        console.error("Unable to load products:", error);

        if (active) {
          setReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const addProduct = useCallback(
    (productId: string) => {
      const product = findProduct(products, productId);

      if (!product || product.stock < 1) return;

      setLines((current) => {
        const existing = current.find(
          (line) => line.productId === productId
        );

        if (!existing) {
          return [...current, { productId, quantity: 1 }];
        }

        if (existing.quantity >= product.stock) {
          return current;
        }

        return current.map((line) =>
          line.productId === productId
            ? { ...line, quantity: line.quantity + 1 }
            : line
        );
      });
    },
    [products]
  );

  const increase = useCallback(
    (productId: string) => {
      addProduct(productId);
    },
    [addProduct]
  );

  const decrease = useCallback((productId: string) => {
    setLines((current) =>
      current.flatMap((line) => {
        if (line.productId !== productId) return [line];

        if (line.quantity <= 1) return [];

        return [
          {
            ...line,
            quantity: line.quantity - 1,
          },
        ];
      })
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((current) =>
      current.filter((line) => line.productId !== productId)
    );
  }, []);

  const subtotal = useMemo(
    () =>
      lines.reduce((sum, line) => {
        const product = findProduct(products, line.productId);

        if (!product) return sum;

        return sum + product.price * line.quantity;
      }, 0),
    [lines, products]
  );

  const itemCount = useMemo(
    () =>
      lines.reduce(
        (sum, line) => sum + line.quantity,
        0
      ),
    [lines]
  );

  const confirmOrder = useCallback(
    async (
      language: Language,
      paymentMethod: PaymentMethod,
      customerPhone: string
    ) => {
      if (lines.length === 0) return null;

      const orderLines = lines.flatMap((line) => {
        const product = findProduct(
          products,
          line.productId
        );

        if (!product) return [];

        return [
          {
            productId: product.id,
            name: product.names[language],
            brand: product.brand,
            unit: product.unit,
            price: product.price,
            quantity: line.quantity,
          },
        ];
      });

      if (orderLines.length === 0) return null;

      const amount = orderLines.reduce(
        (sum, line) =>
          sum + line.price * line.quantity,
        0
      );

      const order = await placeOrder(
        {
          lines: orderLines,
          subtotal: amount,
          total: amount,
          customer_phone: customerPhone.trim(),
        },
        paymentMethod
      );

      setLastOrder(order);
      setLines([]);

      return order;
    },
    [lines, products]
  );

  const clearOrder = useCallback(() => {
    setLastOrder(null);
  }, []);

  const value = useMemo(
    () => ({
      products,
      lines,
      ready,
      subtotal,
      total: subtotal,
      itemCount,
      lastOrder,
      addProduct,
      increase,
      decrease,
      remove,
      confirmOrder,
      clearOrder,
    }),
    [
      products,
      lines,
      ready,
      subtotal,
      itemCount,
      lastOrder,
      addProduct,
      increase,
      decrease,
      remove,
      confirmOrder,
      clearOrder,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used within CartProvider"
    );
  }

  return context;
}
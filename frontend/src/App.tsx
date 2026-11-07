import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { CartProvider } from "./context/CartContext.tsx";
import { LanguageProvider } from "./context/LanguageContext.tsx";

import { CartPage } from "./pages/CartPage.tsx";
import { CheckoutPage } from "./pages/CheckoutPage.tsx";
import { ConfirmationPage } from "./pages/ConfirmationPage.tsx";
import { HomePage } from "./pages/HomePage.tsx";
import { ShopPage } from "./pages/ShopPage.tsx";

import { WorkerPage } from "./pages/WorkerPage.tsx";
import { ShopkeeperPage } from "./pages/ShopkeeperPage.tsx";
import { ShelfStockerPage } from "./pages/ShelfStockerPage.tsx";

import { StaffLoginPage } from "./pages/StaffLoginPage.tsx";
import { InventoryManagerPage } from "./pages/InventoryManagerPage.tsx";

export default function App() {
  return (
    <LanguageProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Customer */}
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order" element={<ConfirmationPage />} />

            {/* Worker */}
            <Route
              path="/worker-login"
              element={<StaffLoginPage role="worker" />}
            />
            <Route path="/worker" element={<WorkerPage />} />

            {/* Shelf Stocker */}
            <Route
              path="/shelf-stocker-login"
              element={<StaffLoginPage role="shelf_stocker" />}
            />
            <Route path="/shelf-stocker" element={<ShelfStockerPage />} />

            {/* Inventory Manager */}
            <Route
              path="/inventory-manager-login"
              element={<StaffLoginPage role="inventory_manager" />}
            />
            <Route
              path="/inventory-manager"
              element={<InventoryManagerPage />}
            />

            {/* Shopkeeper */}
            <Route
              path="/shopkeeper-login"
              element={<StaffLoginPage role="shopkeeper" />}
            />
            <Route path="/shopkeeper" element={<ShopkeeperPage />} />

            {/* Invalid Routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </LanguageProvider>
  );
}
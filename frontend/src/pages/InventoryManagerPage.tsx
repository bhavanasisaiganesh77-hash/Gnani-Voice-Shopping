import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { inventoryManagerApi } from "../services/api";

interface Product {
  id: number;
  name: string;
  name_en: string;
  name_te: string | null;
  name_ta: string | null;
  brand: string | null;
  category: string | null;
  price: number;
  unit: string | null;
  stock: number;
  is_active: boolean;
  low_stock_threshold: number;
  low_stock: boolean;
}

interface ProductForm {
  name_en: string;
  name_te: string;
  name_ta: string;
  brand: string;
  category: string;
  price: string;
  unit: string;
  stock: string;
  low_stock_threshold: string;
}

const emptyForm: ProductForm = {
  name_en: "",
  name_te: "",
  name_ta: "",
  brand: "",
  category: "",
  price: "",
  unit: "1 unit",
  stock: "0",
  low_stock_threshold: "5",
};

export function InventoryManagerPage() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(emptyForm);

  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockQuantity, setStockQuantity] = useState("");

  const staff = localStorage.getItem("inventory_manager_staff");
  const staffName = staff
    ? JSON.parse(staff).full_name || "Inventory Manager"
    : "Inventory Manager";

  const loadInventory = useCallback(async () => {
    try {
      setError("");
      const response = await inventoryManagerApi.get("/inventory");
      setProducts(response.data);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("inventory_manager_token");
        localStorage.removeItem("inventory_manager_staff");
        navigate("/inventory-manager-login");
        return;
      }

      setError(
        err.response?.data?.detail || "Unable to load inventory."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!localStorage.getItem("inventory_manager_token")) {
      navigate("/inventory-manager-login");
      return;
    }

    void loadInventory();
  }, [loadInventory, navigate]);

  const activeProducts = products.filter((product) => product.is_active);
  const lowStockProducts = products.filter((product) => product.low_stock);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchText = search.toLowerCase();

      const matchesSearch = [
        product.name_en,
        product.name_te || "",
        product.name_ta || "",
        product.brand || "",
        product.category || "",
      ].some((value) => value.toLowerCase().includes(searchText));

      const matchesFilter =
        filter === "all" ||
        (filter === "low" && product.low_stock) ||
        (filter === "active" && product.is_active) ||
        (filter === "inactive" && !product.is_active);

      return matchesSearch && matchesFilter;
    });
  }, [products, search, filter]);

  function openAddForm() {
    setEditingProduct(null);
    setProductForm(emptyForm);
    setShowProductForm(true);
    setError("");
    setSuccess("");
  }

  function openEditForm(product: Product) {
    setEditingProduct(product);

    setProductForm({
      name_en: product.name_en || product.name,
      name_te: product.name_te || "",
      name_ta: product.name_ta || "",
      brand: product.brand || "",
      category: product.category || "",
      price: String(product.price),
      unit: product.unit || "1 unit",
      stock: String(product.stock),
      low_stock_threshold: String(product.low_stock_threshold),
    });

    setShowProductForm(true);
    setError("");
    setSuccess("");
  }

  function updateForm(field: keyof ProductForm, value: string) {
    setProductForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleProductSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name: productForm.name_en.trim(),
        name_en: productForm.name_en.trim(),
        name_te: productForm.name_te.trim() || null,
        name_ta: productForm.name_ta.trim() || null,
        brand: productForm.brand.trim() || null,
        category: productForm.category.trim() || null,
        price: Number(productForm.price),
        unit: productForm.unit.trim() || "1 unit",
        stock: Number(productForm.stock),
        low_stock_threshold: Number(productForm.low_stock_threshold),
      };

      if (editingProduct) {
        await inventoryManagerApi.patch(
          `/products/${editingProduct.id}`,
          payload
        );
        setSuccess("Product updated successfully.");
      } else {
        await inventoryManagerApi.post("/products", payload);
        setSuccess("Product added successfully.");
      }

      setShowProductForm(false);
      setEditingProduct(null);
      setProductForm(emptyForm);
      await loadInventory();
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Unable to save product."
      );
    } finally {
      setSaving(false);
    }
  }

  function openStockForm(product: Product) {
    setStockProduct(product);
    setStockQuantity(String(product.stock));
    setError("");
    setSuccess("");
  }

  async function handleStockSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!stockProduct) return;

    const quantity = Number(stockQuantity);

    if (!Number.isInteger(quantity) || quantity < 0) {
      setError("Enter a valid whole-number stock quantity.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await inventoryManagerApi.patch(
        `/products/${stockProduct.id}/stock`,
        { quantity }
      );

      setStockProduct(null);
      setSuccess(`Stock updated for ${stockProduct.name_en}.`);
      await loadInventory();
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Unable to update stock."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("inventory_manager_token");
    localStorage.removeItem("inventory_manager_staff");
    navigate("/inventory-manager-login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-green-800 px-5 py-5 text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-widest text-green-200">
              GNANI SMART MART
            </p>
            <h1 className="mt-1 text-2xl font-bold">
              Inventory Manager
            </h1>
            <p className="mt-1 text-sm text-green-100">
              Welcome, {staffName}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl bg-white px-5 py-2.5 font-semibold text-green-800 hover:bg-green-50"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
            <button
              onClick={() => setError("")}
              className="ml-3 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            {success}
            <button
              onClick={() => setSuccess("")}
              className="ml-3 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Products</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              {products.length}
            </h2>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Active Products</p>
            <h2 className="mt-2 text-3xl font-bold text-green-700">
              {activeProducts.length}
            </h2>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Low Stock Products</p>
            <h2 className="mt-2 text-3xl font-bold text-red-600">
              {lowStockProducts.length}
            </h2>
          </div>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Product Inventory
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Add products, manage details and update stock.
            </p>
          </div>

          <button
            onClick={openAddForm}
            className="rounded-xl bg-green-700 px-5 py-3 font-bold text-white shadow-sm hover:bg-green-800"
          >
            + Add New Product
          </button>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search English, Telugu, Tamil, brand or category..."
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
          />

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="all">All Products</option>
            <option value="low">Low Stock</option>
            <option value="active">Active Products</option>
            <option value="inactive">Inactive Products</option>
          </select>

          <button
            onClick={() => void loadInventory()}
            className="rounded-xl border border-green-700 px-5 py-3 font-semibold text-green-800 hover:bg-green-50"
          >
            Refresh
          </button>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-bold text-slate-900">
              Inventory List
            </h2>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500">
              Loading inventory...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No products found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-4">Product Names</th>
                    <th className="px-4 py-4">Category</th>
                    <th className="px-4 py-4">Price</th>
                    <th className="px-4 py-4">Stock</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-900">
                          {product.name_en}
                        </p>
                        {product.name_te && (
                          <p className="mt-1 text-slate-600">
                            {product.name_te}
                          </p>
                        )}
                        {product.name_ta && (
                          <p className="mt-1 text-slate-600">
                            {product.name_ta}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-slate-400">
                          {product.brand || "Local"}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {product.category || "General"}
                      </td>

                      <td className="px-4 py-4 font-semibold">
                        ₹{Number(product.price).toFixed(2)}
                        <p className="text-xs font-normal text-slate-400">
                          / {product.unit || "unit"}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-bold text-slate-900">
                          {product.stock}
                        </span>
                        {product.low_stock && (
                          <p className="mt-1 text-xs font-semibold text-red-600">
                            Low stock
                          </p>
                        )}
                        <p className="text-xs text-slate-400">
                          Alert at {product.low_stock_threshold}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        {product.is_active ? (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openEditForm(product)}
                            className="rounded-lg border border-blue-200 px-3 py-2 font-semibold text-blue-700 hover:bg-blue-50"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => openStockForm(product)}
                            className="rounded-lg border border-green-200 px-3 py-2 font-semibold text-green-700 hover:bg-green-50"
                          >
                            Update Stock
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

</main>

      {/* Add / Edit Product Modal */}
      {showProductForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-6 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>

              <button
                onClick={() => setShowProductForm(false)}
                className="text-2xl text-slate-400 hover:text-slate-800"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    Product Name (English) *
                  </label>
                  <input
                    required
                    value={productForm.name_en}
                    onChange={(e) => updateForm("name_en", e.target.value)}
                    placeholder="Example: Rice"
                    className="w-full rounded-xl border border-slate-300 px-3 py-3"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    Product Name (Telugu)
                  </label>
                  <input
                    value={productForm.name_te}
                    onChange={(e) => updateForm("name_te", e.target.value)}
                    placeholder="ఉదా: బియ్యం"
                    className="w-full rounded-xl border border-slate-300 px-3 py-3"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    Product Name (Tamil)
                  </label>
                  <input
                    value={productForm.name_ta}
                    onChange={(e) => updateForm("name_ta", e.target.value)}
                    placeholder="எ.கா: அரிசி"
                    className="w-full rounded-xl border border-slate-300 px-3 py-3"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    Brand
                  </label>
                  <input
                    value={productForm.brand}
                    onChange={(e) => updateForm("brand", e.target.value)}
                    placeholder="Brand name"
                    className="w-full rounded-xl border border-slate-300 px-3 py-3"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    Category
                  </label>
                  <input
                    value={productForm.category}
                    onChange={(e) => updateForm("category", e.target.value)}
                    placeholder="Example: Groceries"
                    className="w-full rounded-xl border border-slate-300 px-3 py-3"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) => updateForm("price", e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-300 px-3 py-3"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    Unit
                  </label>
                  <input
                    value={productForm.unit}
                    onChange={(e) => updateForm("unit", e.target.value)}
                    placeholder="1 kg, 1 packet, 1 litre"
                    className="w-full rounded-xl border border-slate-300 px-3 py-3"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    Initial Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={productForm.stock}
                    onChange={(e) => updateForm("stock", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-3"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    Low Stock Alert Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={productForm.low_stock_threshold}
                    onChange={(e) =>
                      updateForm("low_stock_threshold", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-3"
                  />
                </div>
              </div>

              <p className="text-xs text-slate-500">
                English name is required. Telugu and Tamil names are optional.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductForm(false)}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-green-700 px-4 py-3 font-bold text-white hover:bg-green-800 disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingProduct
                      ? "Save Changes"
                      : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Stock Modal */}
      {stockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900">
              Update Product Stock
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {stockProduct.name_en}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Current stock: {stockProduct.stock}
            </p>

            <form onSubmit={handleStockSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  New Total Stock Quantity
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <p className="text-xs text-slate-500">
                Enter the new total quantity available, not the quantity to add.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStockProduct(null)}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-green-700 px-4 py-3 font-bold text-white hover:bg-green-800 disabled:opacity-60"
                >
                  {saving ? "Updating..." : "Update Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryManagerPage;
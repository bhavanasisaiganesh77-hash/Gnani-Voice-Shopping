import { useEffect, useState } from "react";
import { shopkeeperApi } from "../services/api";

type Staff = {
  id: number;
  full_name: string;
  username: string;
  role: string;
};

type Order = {
  id: number;
  order_number: string | null;
  temporary_reference?: string | null;
  total_amount: number | string;
  payment_method: string;
  payment_status: string;
  status: string;
  payment_reference?: string | null;
  created_at?: string;
  items?: {
    product_name: string;
    quantity: number;
    unit_price: number | string;
  }[];
};

type Tab =
  | "dashboard"
  | "orders"
  | "payments"
  | "history"
  | "products"
  | "staff"
  | "reports";

const navigation: { id: Tab; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "▦" },
  { id: "orders", label: "All Orders", icon: "▤" },
  { id: "payments", label: "Pending Payments", icon: "◷" },
  { id: "history", label: "Payment History", icon: "✓" },
  { id: "products", label: "Products", icon: "▣" },
  { id: "staff", label: "Staff Management", icon: "♙" },
  { id: "reports", label: "Sales Reports", icon: "▥" },
];

const colors = {
  green: "#176b45",
  dark: "#123b2b",
  light: "#f4f8f5",
  border: "#e3ebe5",
  muted: "#718078",
  red: "#c0392b",
};

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: `1px solid ${colors.border}`,
  borderRadius: 14,
  padding: 20,
  boxShadow: "0 3px 12px rgba(20,60,40,0.04)",
};

const buttonStyle: React.CSSProperties = {
  background: colors.green,
  color: "#ffffff",
  border: "none",
  borderRadius: 9,
  padding: "11px 17px",
  cursor: "pointer",
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 11,
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  boxSizing: "border-box",
  outlineColor: colors.green,
};

export function ShopkeeperPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [staff, setStaff] = useState<Staff | null>(() => {
    try {
      const saved = localStorage.getItem("shopkeeper_staff");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentReferences, setPaymentReferences] = useState<
    Record<number, string>
  >({});

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [ordersError, setOrdersError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [newStaff, setNewStaff] = useState({
  full_name: "",
  username: "",
  password: "",
  role: "worker",
});

const [staffCreating, setStaffCreating] = useState(false);
const [staffError, setStaffError] = useState("");
const [staffSuccess, setStaffSuccess] = useState("");

async function handleCreateStaff(
  event: React.FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  setStaffError("");
  setStaffSuccess("");

  if (
    !newStaff.full_name.trim() ||
    !newStaff.username.trim() ||
    !newStaff.password.trim()
  ) {
    setStaffError("Please fill in all fields.");
    return;
  }

  setStaffCreating(true);

  try {
    await shopkeeperApi.post("/staff", {
      full_name: newStaff.full_name.trim(),
      username: newStaff.username.trim(),
      password: newStaff.password,
      role: newStaff.role,
    });

    setStaffSuccess("Staff account created successfully!");

    setNewStaff({
      full_name: "",
      username: "",
      password: "",
      role: "worker",
    });

  } catch (error: any) {
    setStaffError(
      error.response?.data?.detail ||
      "Unable to create staff account."
    );
  } finally {
    setStaffCreating(false);
  }
}

  async function loadOrders() {
    setLoading(true);
    setOrdersError("");

    try {
      const response = await shopkeeperApi.get("/orders");

      const data = response.data;
      const orderList = Array.isArray(data)
        ? data
        : Array.isArray(data.orders)
          ? data.orders
          : [];

      setOrders(orderList);
    } catch (err: any) {
      setOrdersError(
        err.response?.data?.detail ||
          "Unable to load orders. Please check the backend."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (staff) {
      loadOrders();
    }
  }, [staff]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await shopkeeperApi.post("/staff/login", {
        username: username.trim(),
        password,
      });

      const loggedInStaff = response.data.staff;

      if (loggedInStaff.role !== "shopkeeper") {
        setError("This account is not a Shopkeeper account.");
        return;
      }

      localStorage.setItem(
        "shopkeeper_token",
        response.data.access_token
      );

      localStorage.setItem(
        "shopkeeper_staff",
        JSON.stringify(loggedInStaff)
      );

      setStaff(loggedInStaff);
      setPassword("");
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Login failed. Please check your username and password."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("shopkeeper_token");
    localStorage.removeItem("shopkeeper_staff");
    setStaff(null);
    setOrders([]);
    setActiveTab("dashboard");
  }

async function verifyPayment(order: Order) {
  if (!order.order_number?.trim()) {
    setOrdersError("Order number is missing. Please refresh the orders.");
    return;
  }

  const isUpi = order.payment_method.toLowerCase() === "upi";

  const confirmed = window.confirm(
    isUpi
      ? `Have you heard the PhonePe payment confirmation and verified receipt of ₹${Number(order.total_amount).toFixed(2)}?`
      : `Have you physically received ₹${Number(order.total_amount).toFixed(2)} in cash?`
  );

  if (!confirmed) return;

  setActionLoading(order.id);
  setOrdersError("");
  setSuccessMessage("");

  try {
    await shopkeeperApi.patch(
      `/orders/${encodeURIComponent(order.order_number)}/payment`,
      {
        payment_status: "paid",
        payment_reference: null,
      }
    );

    setSuccessMessage(
      isUpi
        ? "PhonePe payment confirmed successfully!"
        : "Cash payment marked as paid successfully!"
    );

    await loadOrders();
  } catch (err: any) {
    setOrdersError(
      err.response?.data?.detail ||
        "Payment confirmation failed. Please try again."
    );
  } finally {
    setActionLoading(null);
  }
}

  const pendingPayments = orders.filter(
    (order) => order.payment_status?.toLowerCase() !== "paid"
  );

  const paidOrders = orders.filter(
    (order) => order.payment_status?.toLowerCase() === "paid"
  );

  const totalPaid = paidOrders.reduce(
    (sum, order) => sum + Number(order.total_amount || 0),
    0
  );

  const pageTitle =
    navigation.find((item) => item.id === activeTab)?.label ||
    "Dashboard";

  function renderDashboard() {
    const metrics = [
      { label: "Total Orders", value: orders.length, icon: "▤" },
      { label: "Pending Payments", value: pendingPayments.length, icon: "◷" },
      { label: "Paid Orders", value: paidOrders.length, icon: "✓" },
      {
        label: "Total Paid Amount",
        value: `₹${totalPaid.toFixed(2)}`,
        icon: "₹",
      },
    ];

    return (
      <>
        <div className="shop-metrics">
          {metrics.map((item) => (
            <div style={cardStyle} key={item.label}>
              <div className="metric-heading">
                <span>{item.label}</span>
                <span className="metric-icon">{item.icon}</span>
              </div>
              <h2 className="metric-value">{item.value}</h2>
            </div>
          ))}
        </div>

        <div style={{ ...cardStyle, marginTop: 22 }}>
          <h3>Welcome, {staff?.full_name}!</h3>
          <p style={{ color: colors.muted, lineHeight: 1.7 }}>
            Manage your shop, monitor customer orders, verify
            PhonePe and cash payments, and review sales.
          </p>
          <button
            style={buttonStyle}
            onClick={() => setActiveTab("payments")}
          >
            Review Pending Payments
          </button>
        </div>

        <div style={{ ...cardStyle, marginTop: 22 }}>
          <h3>Recent Orders</h3>
          {orders.slice(0, 5).map((order) => (
            <div className="recent-order" key={order.id}>
              <div>
                <strong>
                  {order.order_number || `Order #${order.id}`}
                </strong>
                <div className="muted-text">
                  {order.payment_method.toUpperCase()}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <strong>
                  ₹{Number(order.total_amount).toFixed(2)}
                </strong>
                <div className="muted-text">
                  {order.payment_status}
                </div>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <p className="muted-text">No orders available.</p>
          )}
        </div>
      </>
    );
  }

  function renderOrders() {
    return (
      <div style={cardStyle}>
        <div className="section-heading">
          <h3>All Orders</h3>
          <button style={buttonStyle} onClick={loadOrders}>
            Refresh
          </button>
        </div>

        {orders.length === 0 ? (
          <p className="muted-text">No orders found.</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Payment Status</th>
                  <th>Order Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      {order.order_number || `Missing (#${order.id})`}
                    </td>
                    <td>
                      ₹{Number(order.total_amount).toFixed(2)}
                    </td>
                    <td>{order.payment_method}</td>
                    <td><Status value={order.payment_status} /></td>
                    <td><Status value={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  function renderPayments() {
    return (
      <div style={cardStyle}>
        <div className="section-heading">
          <div>
            <h3>Pending Payment Verification</h3>
            <p className="muted-text">
              Verify the actual payment before confirming it.
            </p>
          </div>
          <button style={buttonStyle} onClick={loadOrders}>
            Refresh
          </button>
        </div>

        {pendingPayments.length === 0 ? (
          <p className="muted-text">There are no pending payments.</p>
        ) : (
          <div className="payment-list">
            {pendingPayments.map((order) => (
              <div className="payment-card" key={order.id}>
                <div className="payment-top">
                  <div>
                    <strong>
                      {order.order_number || `Order #${order.id}`}
                    </strong>
                    <p className="muted-text">
                      Payment: {order.payment_method.toUpperCase()}
                    </p>
                  </div>
                  <h3>
                    ₹{Number(order.total_amount).toFixed(2)}
                  </h3>
                </div>

                <div className="payment-details">
                  <span>
                    Payment status: <Status value={order.payment_status} />
                  </span>
                  <span>
                    Order status: <Status value={order.status} />
                  </span>
                </div>

                {order.payment_method.toLowerCase() === "upi" && (
                  <div style={{ marginTop: 15 }}>
                    <label className="field-label">
                      PhonePe transaction reference
                    </label>
                    <input
                      style={inputStyle}
                      placeholder="Enter transaction reference"
                      value={paymentReferences[order.id] || ""}
                      onChange={(event) =>
                        setPaymentReferences((previous) => ({
                          ...previous,
                          [order.id]: event.target.value,
                        }))
                      }
                    />
                  </div>
                )}

                {!order.order_number && (
                  <p className="error-message">
                    This order has no order number. Verification
                    is disabled until the backend order data is fixed.
                  </p>
                )}

                <button
                  style={{
                    ...buttonStyle,
                    marginTop: 15,
                    opacity: actionLoading === order.id || !order.order_number ? 0.55 : 1,
                    cursor: actionLoading === order.id || !order.order_number ? "not-allowed" : "pointer",
                  }}
                  disabled={
                    actionLoading === order.id || !order.order_number
                  }
                  onClick={() => verifyPayment(order)}
                >
                  {actionLoading === order.id
                    ? "Verifying..."
                    : "Verify Payment"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
function renderHistory() {
    return (
      <div style={cardStyle}>
        <h3>Payment History</h3>
        <p className="muted-text">
          Payments successfully verified by the shopkeeper.
        </p>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Payment Reference</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paidOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    {order.order_number || `Order #${order.id}`}
                  </td>
                  <td>{order.payment_reference || "—"}</td>
                  <td>{order.payment_method}</td>
                  <td>
                    ₹{Number(order.total_amount).toFixed(2)}
                  </td>
                  <td>
                    <Status value={order.payment_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paidOrders.length === 0 && (
          <p className="muted-text">No verified payments yet.</p>
        )}
      </div>
    );
  }

  function renderPlaceholder(title: string, description: string) {
    return (
      <div style={cardStyle}>
        <h3>{title}</h3>
        <p className="muted-text">{description}</p>
        <p>
          This section will be connected to the backend in the
          next development step.
        </p>
      </div>
    );
  }
  
  function renderStaffManagement() {
  return (
    <div className="staff-management">
      <div style={cardStyle}>
        <h2>Create Staff Account</h2>

        <p className="muted-text">
          Create login accounts for your shop staff.
        </p>

        <form onSubmit={handleCreateStaff}>
          <div className="staff-form-grid">
            <div>
              <label>Full Name</label>
              <input
                type="text"
                value={newStaff.full_name}
                onChange={(e) =>
                  setNewStaff({
                    ...newStaff,
                    full_name: e.target.value,
                  })
                }
                placeholder="Enter full name"
                required
              />
            </div>

            <div>
              <label>Username</label>
              <input
                type="text"
                value={newStaff.username}
                onChange={(e) =>
                  setNewStaff({
                    ...newStaff,
                    username: e.target.value,
                  })
                }
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label>Password</label>
              <input
                type="password"
                value={newStaff.password}
                onChange={(e) =>
                  setNewStaff({
                    ...newStaff,
                    password: e.target.value,
                  })
                }
                placeholder="Minimum 8 characters"
                minLength={8}
                required
              />
            </div>

            <div>
              <label>Staff Role</label>
              <select
                value={newStaff.role}
                onChange={(e) =>
                  setNewStaff({
                    ...newStaff,
                    role: e.target.value,
                  })
                }
              >
                <option value="inventory_manager">
                  Inventory Manager
                </option>

                <option value="worker">
                  Worker
                </option>

                <option value="shelf_stocker">
                  Shelf Stocker
                </option>
              </select>
            </div>
          </div>

          {staffError && (
            <p style={{ color: "#dc2626" }}>
              {staffError}
            </p>
          )}

          {staffSuccess && (
            <p style={{ color: "#16a34a" }}>
              {staffSuccess}
            </p>
          )}

          <button
            type="submit"
            disabled={staffCreating}
          >
            {staffCreating
              ? "Creating Account..."
              : "Create Staff Account"}
          </button>
        </form>
      </div>

      <div className="staff-role-grid">
        <div style={cardStyle}>
          <div className="staff-role-icon">📦</div>
          <h3>Inventory Manager</h3>
          <p>Manage products, prices and stock quantities.</p>
        </div>

        <div style={cardStyle}>
          <div className="staff-role-icon">🛒</div>
          <h3>Worker</h3>
          <p>Manage customer orders and order processing.</p>
        </div>

        <div style={cardStyle}>
          <div className="staff-role-icon">🏷️</div>
          <h3>Shelf Stocker</h3>
          <p>Manage rack assignments and shelf handover.</p>
        </div>
      </div>
    </div>
  );
}

  if (!staff) {
    return (
      <div className="shop-login-page">
        <style>{shopkeeperStyles}</style>

        <div className="login-card">
          <div className="login-logo">🌾</div>
          <h1>Gnani Smart Mart</h1>
          <p className="muted-text">Shopkeeper Portal</p>

          <form onSubmit={handleLogin}>
            <label className="field-label">Username</label>
            <input
              style={inputStyle}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter username"
              required
            />

            <label className="field-label">Password</label>
            <input
              style={inputStyle}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              required
            />

            {error && (
              <p className="error-message">{error}</p>
            )}

            <button
              type="submit"
              style={{
                ...buttonStyle,
                width: "100%",
                marginTop: 22,
              }}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login to Dashboard"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-layout">
      <style>{shopkeeperStyles}</style>

      <aside className="shop-sidebar">
        <div className="sidebar-brand">
          <span>🌾</span>
          <div>
            <strong>Gnani Smart Mart</strong>
            <small>Shopkeeper Panel</small>
          </div>
        </div>

        <div className="sidebar-label">MAIN MENU</div>

        {navigation.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${
              activeTab === item.id ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab(item.id);
              setOrdersError("");
              setSuccessMessage("");
            }}
          >
            <span>{item.icon}</span>
            {item.label}

            {item.id === "payments" &&
              pendingPayments.length > 0 && (
                <span className="nav-count">
                  {pendingPayments.length}
                </span>
              )}
          </button>
        ))}

        <div className="sidebar-bottom">
          <div className="staff-profile">
            <div className="profile-avatar">
              {staff.full_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{staff.full_name}</strong>
              <small>Shopkeeper</small>
            </div>
          </div>

          <button className="logout-button" onClick={handleLogout}>
            ↪ Logout
          </button>
        </div>
      </aside>

      <main className="shop-main">
        <header className="shop-header">
          <div>
            <h1>{pageTitle}</h1>
            <p>Manage your store operations</p>
          </div>

          <button style={buttonStyle} onClick={loadOrders}>
            ↻ Refresh Data
          </button>
        </header>

        {ordersError && (
          <div className="alert-error">{ordersError}</div>
        )}

        {successMessage && (
          <div className="alert-success">{successMessage}</div>
        )}

        {loading && (
          <p className="muted-text">
            Loading order information...
          </p>
        )}

        {!loading && activeTab === "dashboard" && renderDashboard()}
        {!loading && activeTab === "orders" && renderOrders()}
        {!loading && activeTab === "payments" && renderPayments()}
        {!loading && activeTab === "history" && renderHistory()}

        {!loading && activeTab === "products" &&
          renderPlaceholder(
            "Product Management",
            "Manage product names, prices, categories and availability."
          )}

        {!loading && activeTab === "staff" &&
          renderStaffManagement()}

        {!loading && activeTab === "reports" &&
          renderPlaceholder(
            "Sales Reports",
            "Review daily sales and payment summaries."
          )}
      </main>
    </div>
  );
}

function Status({ value }: { value: string }) {
  const normalized = (value || "unknown").toLowerCase();
  const isPaid = normalized === "paid";
  const isRejected = normalized === "rejected";

  return (
    <span
      className={`status-pill ${
        isPaid ? "paid" : isRejected ? "rejected" : "pending"
      }`}
    >
      {normalized.replaceAll("_", " ")}
    </span>
  );
}

const shopkeeperStyles = `
* { box-sizing: border-box; }

.shop-login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #e8f4eb, #f7faf7);
  font-family: Arial, sans-serif;
}

.login-card {
  width: 100%;
  max-width: 410px;
  padding: 35px;
  border-radius: 20px;
  background: white;
  box-shadow: 0 12px 45px rgba(20, 60, 40, 0.10);
}

.login-card h1 {
  color: #123b2b;
  text-align: center;
}

.login-card > p {
  text-align: center;
  margin-bottom: 28px;
}

.login-logo {
  text-align: center;
  font-size: 42px;
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin: 18px 0 7px;
  color: #344b3d;
}

.shop-layout {
  display: flex;
  min-height: 100vh;
  background: #f4f8f5;
  font-family: Arial, sans-serif;
  color: #20372a;
}

.shop-sidebar {
  width: 250px;
  flex-shrink: 0;
  background: #123b2b;
  color: white;
  padding: 22px 14px;
  display: flex;
  flex-direction: column;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 8px 10px 25px;
  font-size: 16px;
}

.sidebar-brand > span {
  font-size: 29px;
}

.sidebar-brand small,
.staff-profile small {
  display: block;
  color: #b7d0c0;
  font-size: 11px;
  margin-top: 5px;
}

.sidebar-label {
  font-size: 10px;
  letter-spacing: 1.4px;
  color: #a9c6b4;
  padding: 15px 12px 10px;
}

.nav-item {
  width: 100%;
  padding: 12px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #e0eee5;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 5px;
  cursor: pointer;
  font-size: 13px;
}

.nav-item.active,
.nav-item:hover {
  background: #246447;
  color: white;
}

.nav-count {
  margin-left: auto;
  background: #f0b94b;
  color: #26382d;
  border-radius: 20px;
  padding: 2px 7px;
  font-size: 11px;
}

.sidebar-bottom {
  margin-top: auto;
}

.staff-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 7px;
  border-top: 1px solid #345b46;
  font-size: 12px;
}

.profile-avatar {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #d5ebdc;
  color: #123b2b;
  font-weight: bold;
}

.logout-button {
  width: 100%;
  padding: 11px;
  background: #204b36;
  border: 1px solid #4d765d;
  color: white;
  border-radius: 8px;
  cursor: pointer;
}

.shop-main {
  flex: 1;
  min-width: 0;
  padding: 30px;
}

.shop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 27px;
}

.shop-header h1 {
  margin: 0;
  font-size: 25px;
  color: #123b2b;
}

.shop-header p {
  margin: 7px 0 0;
  color: #718078;
  font-size: 13px;
}

.shop-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 15px;
}

.metric-heading {
  display: flex;
  justify-content: space-between;
  color: #718078;
  font-size: 13px;
  gap: 8px;
}

.metric-icon {
  color: #176b45;
  font-size: 23px;
}

.metric-value {
  font-size: 26px;
  margin: 15px 0 3px;
  color: #123b2b;
}

.recent-order {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #edf1ee;
  font-size: 13px;
}

.muted-text {
  color: #718078;
  font-size: 13px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.section-heading h3 {
  margin: 0;
}

.payment-list {
  display: grid;
  gap: 15px;
}

.payment-card {
  border: 1px solid #e3ebe5;
  padding: 18px;
  border-radius: 12px;
  background: #fbfdfb;
}

.payment-top,
.payment-details {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.payment-top h3 {
  color: #176b45;
}

.payment-details {
  flex-wrap: wrap;
  font-size: 12px;
  color: #718078;
}

.status-pill {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 20px;
  font-size: 11px;
  text-transform: capitalize;
}

.status-pill.paid {
  background: #dff4e6;
  color: #176b45;
}

.status-pill.pending {
  background: #fff1d5;
  color: #94620a;
}

.status-pill.rejected {
  background: #fde5e2;
  color: #b52c24;
}

.table-scroll {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th,
td {
  padding: 13px 12px;
  border-bottom: 1px solid #edf1ee;
  text-align: left;
  white-space: nowrap;
}

th {
  color: #718078;
  font-weight: 600;
  background: #f8faf8;
}

.alert-error,
.alert-success {
  padding: 13px 16px;
  border-radius: 9px;
  margin-bottom: 17px;
  font-size: 13px;
}

.alert-error,
.error-message {
  background: #fff0ee;
  color: #b52c24;
}

.alert-success {
  background: #e4f6e9;
  color: #176b45;
}

.error-message {
  padding: 10px;
  border-radius: 8px;
  font-size: 12px;
}

@media (max-width: 900px) {
  .shop-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 650px) {
  .shop-layout {
    display: block;
  }

  .shop-sidebar {
    width: 100%;
    padding: 12px;
    display: block;
  }

  .sidebar-brand {
    padding-bottom: 12px;
  }

  .sidebar-label,
  .sidebar-bottom {
    display: none;
  }

  .nav-item {
    display: inline-flex;
    width: auto;
    margin: 3px;
    padding: 10px;
    font-size: 11px;
  }

  .shop-main {
    padding: 17px;
  }

  .shop-header {
    align-items: flex-start;
  }

  .shop-header h1 {
    font-size: 21px;
  }

  .shop-metrics {
    grid-template-columns: 1fr 1fr;
    gap: 9px;
  }

  .metric-value {
    font-size: 21px;
  }

  .payment-top {
    align-items: flex-start;
  }
}
/* STAFF MANAGEMENT */

.staff-management {
  display: grid;
  gap: 20px;
}

.staff-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 18px;
}

.staff-role-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 15px;
}

.staff-role-icon {
  font-size: 28px;
}

.staff-management label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
}

.staff-management input,
.staff-management select {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-sizing: border-box;
}

.staff-management button {
  margin-top: 18px;
  padding: 12px 22px;
  border: none;
  border-radius: 8px;
  background: #16834a;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.staff-management button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .staff-role-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 650px) {
  .staff-form-grid {
    grid-template-columns: 1fr;
  }
}
`;
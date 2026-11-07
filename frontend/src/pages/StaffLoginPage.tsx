import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

interface StaffLoginPageProps {
  role: "shopkeeper" | "worker" | "shelf_stocker" | "inventory_manager";
}

export function StaffLoginPage({ role }: StaffLoginPageProps) {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roleDetails = {
    shopkeeper: {
      title: "Shopkeeper Login",
      icon: "🏪",
      tokenKey: "shopkeeper_token",
      staffKey: "shopkeeper_staff",
      route: "/shopkeeper",
    },
    worker: {
      title: "Worker Login",
      icon: "👷",
      tokenKey: "worker_token",
      staffKey: "worker_staff",
      route: "/worker",
    },
    shelf_stocker: {
      title: "Shelf Stocker Login",
      icon: "📦",
      tokenKey: "shelf_stocker_token",
      staffKey: "shelf_stocker_staff",
      route: "/shelf-stocker",
    },
    inventory_manager: {
      title: "Inventory Manager Login",
      icon: "📋",
      tokenKey: "inventory_manager_token",
      staffKey: "inventory_manager_staff",
      route: "/inventory-manager",
    },
  };

  const currentRole = roleDetails[role];

  // Restore an existing login session.
  useEffect(() => {
    const savedToken = localStorage.getItem(currentRole.tokenKey);

    if (savedToken) {
      navigate(currentRole.route, { replace: true });
    }
  }, [currentRole.tokenKey, currentRole.route, navigate]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/staff/login", {
        username: username.trim(),
        password,
      });

      const loggedInStaff = response.data.staff;
      const accessToken = response.data.access_token;

      if (loggedInStaff.role !== role) {
        setError(
          `This account is not a ${currentRole.title.replace(" Login", "")} account.`
        );
        return;
      }

      if (!accessToken) {
        setError("Login token was not received from the server.");
        return;
      }

      // Save this role's session without deleting other staff sessions.
      localStorage.setItem(currentRole.tokenKey, accessToken);

      localStorage.setItem(
        currentRole.staffKey,
        JSON.stringify(loggedInStaff)
      );

      setPassword("");

      navigate(currentRole.route, { replace: true });
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Login failed. Check your username and password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-xl sm:p-9">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-3xl">
            {currentRole.icon}
          </div>

          <p className="text-sm font-bold uppercase tracking-widest text-green-700">
            GNANI SMART MART
          </p>

          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            {currentRole.title}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Sign in using your staff account.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter your username"
              required
              autoComplete="username"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-green-700 px-5 py-3.5 font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-6 w-full text-center text-sm font-medium text-slate-500 hover:text-green-700"
        >
          ← Back to Customer Home
        </button>
      </div>
    </div>
  );
}

export default StaffLoginPage;
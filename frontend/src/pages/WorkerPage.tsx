import { useEffect, useState } from "react";
import { workerApi } from "../services/api";

type OrderItem = {
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

type WorkerOrder = {
  id: string;
  status: string;
  placedAt: string | null;
  total: number;
  items: OrderItem[];
  payment_method: "upi" | "cash";
  payment_status: "pending" | "pending_verification" | "paid";
};

const statusSteps = [
  "pending",
  "accepted",
  "preparing",
  "packed",
];

export function WorkerPage() {
  const [orders, setOrders] = useState<WorkerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState("");
  const [success, setSuccess] = useState("");

  // LOAD ORDERS
  async function loadOrders() {
    try {
      setError("");

      const response =
        await workerApi.get<WorkerOrder[]>("/orders");

      setOrders(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Unable to load orders. Check whether the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  // UPDATE ORDER STATUS
  async function updateStatus(
    orderId: string,
    status: string
  ) {
    try {
      setUpdating(orderId);
      setError("");
      setSuccess("");

      await workerApi.patch(
        `/orders/${encodeURIComponent(orderId)}/status`,
        { status }
      );

      setSuccess(
        `Order ${orderId} updated successfully.`
      );

      await loadOrders();
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          `Could not update order ${orderId}. Please try again.`
      );
    } finally {
      setUpdating("");
    }
  }

  // INITIAL LOAD
  useEffect(() => {
    loadOrders();
  }, []);

  // NEXT STATUS
  function nextStatus(status: string) {
    const index = statusSteps.indexOf(status);

    return index >= 0 &&
      index < statusSteps.length - 1
      ? statusSteps[index + 1]
      : null;
  }

  // PAYMENT METHOD
  function paymentMethodLabel(method: string) {
    return method === "upi"
      ? "PhonePe UPI"
      : "Cash";
  }

  // ORDER STATUS LABEL
  function statusLabel(status: string) {
    if (status === "packed") return "Packed";
    if (status === "preparing") return "Preparing";
    if (status === "accepted") return "Accepted";
    if (status === "rejected") return "Rejected";
    return "New Order";
  }

  // ONLY PAID ORDERS
  const paidOrders = orders.filter(
    (order) => order.payment_status === "paid"
  );

  const activeOrders = paidOrders.filter(
    (order) => order.status !== "rejected"
  );

  const pendingCount = activeOrders.filter(
    (order) => order.status === "pending"
  ).length;

  const preparingCount = activeOrders.filter(
    (order) => order.status === "preparing"
  ).length;

  const packedCount = activeOrders.filter(
    (order) => order.status === "packed"
  ).length;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
              GNANI VOICE SHOPPING
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Worker Dashboard
            </h1>

            <p className="mt-1 text-slate-600">
              Process confirmed customer orders and update their progress.
            </p>
          </div>

          <button
            onClick={loadOrders}
            disabled={loading}
            className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
          >
            Refresh Orders
          </button>
        </header>

        {/* DASHBOARD COUNTS */}
        <section className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              label: "Paid Orders",
              value: paidOrders.length,
            },
            {
              label: "New Orders",
              value: pendingCount,
            },
            {
              label: "Preparing",
              value: preparingCount,
            },
            {
              label: "Packed",
              value: packedCount,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">
                {item.label}
              </p>

              <p className="mt-2 text-3xl font-bold">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-5 rounded-xl bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {success && (
          <div className="mb-5 rounded-xl bg-green-100 p-4 text-green-800">
            {success}
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center">
            Loading customer orders...
          </div>
        ) : paidOrders.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center">
            <h2 className="text-xl font-bold">
              No confirmed orders yet
            </h2>

            <p className="mt-2 text-slate-600">
              Orders will appear here after the shopkeeper confirms payment.
            </p>
          </div>
        ) : (

          /* ORDER LIST */
          <section className="space-y-5">
            {paidOrders.map((order) => {
              const next = nextStatus(order.status);

              return (
                <article
                  key={order.id}
                  className="rounded-2xl bg-white p-5 shadow-sm sm:p-6"
                >

                  {/* ORDER HEADER */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">
                        Order Number
                      </p>

                      <h2 className="text-xl font-bold">
                        {order.id}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {order.placedAt
                          ? new Date(
                              order.placedAt
                            ).toLocaleString()
                          : "Time unavailable"}
                      </p>
                    </div>

                    <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800">
                      {statusLabel(order.status)}
                    </span>
                  </div>

                  <div className="my-5 border-t border-slate-200" />

                  {/* ORDER ITEMS */}
                  <h3 className="mb-3 font-semibold">
                    Ordered Items
                  </h3>

                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div
                        key={`${order.id}-${index}`}
                        className="flex flex-wrap justify-between gap-2 text-sm"
                      >
                        <div>
                          <p className="font-medium">
                            {item.product_name}
                          </p>

                          <p className="text-slate-500">
                            Quantity: {item.quantity} × ₹
                            {Number(
                              item.unit_price
                            ).toFixed(2)}
                          </p>
                        </div>

                        <p className="font-semibold">
                          ₹
                          {Number(
                            item.subtotal
                          ).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="my-5 border-t border-slate-200" />

                  {/* PAYMENT DETAILS */}
                  <section className="rounded-xl bg-green-50 p-4">
                    <h3 className="font-semibold">
                      Payment Details
                    </h3>

                    <div className="mt-3 flex flex-wrap justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-500">
                          Payment Method
                        </p>

                        <p className="font-semibold">
                          {paymentMethodLabel(
                            order.payment_method
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Payment Status
                        </p>

                        <span className="mt-1 inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                          Paid
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-green-800">
                      Payment confirmed by shopkeeper.
                    </p>
                  </section>

                  <div className="my-5 border-t border-slate-200" />

                  {/* TOTAL AND ACTIONS */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <p className="text-lg font-bold">
                      Total: ₹
                      {Number(order.total).toFixed(2)}
                    </p>

                    <div className="flex flex-wrap gap-2">

                      {/* REJECT ORDER */}
                      {order.status === "pending" && (
                        <button
                          onClick={() =>
                            updateStatus(
                              order.id,
                              "rejected"
                            )
                          }
                          disabled={
                            updating === order.id
                          }
                          className="rounded-xl border border-red-300 px-4 py-2 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Reject Order
                        </button>
                      )}

                      {/* ACCEPT / PREPARE / PACK */}
                      {next && (
                        <button
                          onClick={() =>
                            updateStatus(
                              order.id,
                              next
                            )
                          }
                          disabled={
                            updating === order.id
                          }
                          className="rounded-xl bg-green-700 px-4 py-2 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                        >
                          {updating === order.id
                            ? "Updating..."
                            : order.status === "pending"
                              ? "Accept Order"
                              : order.status === "accepted"
                                ? "Start Preparing"
                                : "Mark as Packed"}
                        </button>
                      )}
                    </div>
                  </div>

                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
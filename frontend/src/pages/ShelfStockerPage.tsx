import { useEffect, useState } from "react";
import { shelfStockerApi } from "../services/api";

interface OrderItem {
  product_name?: string;
  name?: string;
  quantity: number;
}

interface Order {
  id: string;
  order_number?: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total?: number;
  total_amount?: number;
  placedAt?: string;
  rack_number?: string | null;
  customer_phone?: string | null;
  items: OrderItem[];
}

export function ShelfStockerPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [rackNumbers, setRackNumbers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadOrders() {
    try {
      setError("");

      const response = await shelfStockerApi.get<Order[]>("/orders");
      setOrders(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Unable to load orders."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();

    const interval = window.setInterval(loadOrders, 15000);

    return () => window.clearInterval(interval);
  }, []);

  const shelfOrders = orders.filter(
    (order) =>
      order.payment_status === "paid" &&
      ["packed", "rack_assigned", "ready_for_pickup"].includes(
        order.status.toLowerCase()
      )
  );

  const packedCount = shelfOrders.filter(
    (order) => order.status.toLowerCase() === "packed"
  ).length;

  const rackAssignedCount = shelfOrders.filter(
    (order) => order.status.toLowerCase() === "rack_assigned"
  ).length;

  const readyCount = shelfOrders.filter(
    (order) => order.status.toLowerCase() === "ready_for_pickup"
  ).length;

  // ASSIGN RACK NUMBER
  async function assignRack(order: Order) {
    const rackNumber = rackNumbers[order.id]?.trim();

    if (!rackNumber) {
      setError("Please enter a rack number.");
      return;
    }

    if (
      !window.confirm(
        `Assign order ${order.order_number || order.id} to rack ${rackNumber}?`
      )
    ) {
      return;
    }

    setActionLoading(order.id);
    setError("");
    setSuccess("");

    try {
      await shelfStockerApi.patch(
        `/orders/${encodeURIComponent(order.order_number || order.id)}/rack`,
        { rack_number: rackNumber }
      );

      setSuccess(`Rack ${rackNumber} assigned successfully.`);
      await loadOrders();
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Rack assignment failed."
      );
    } finally {
      setActionLoading(null);
    }
  }

  // CONFIRM RACK PLACEMENT
  async function confirmPlacement(order: Order) {
    if (
      !window.confirm(
        `Have you physically placed order ${
          order.order_number || order.id
        } in rack ${order.rack_number}?`
      )
    ) {
      return;
    }

    setActionLoading(order.id);
    setError("");
    setSuccess("");

    try {
      await shelfStockerApi.patch(
        `/orders/${encodeURIComponent(order.order_number || order.id)}/status`,
        { status: "ready_for_pickup" }
      );

      setSuccess("Order is now ready for customer pickup.");
      await loadOrders();
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Could not confirm rack placement."
      );
    } finally {
      setActionLoading(null);
    }
  }

  // SEND WHATSAPP RACK NOTIFICATION
  function sendWhatsAppNotification(order: Order) {
    const phone = (order.customer_phone || "").replace(/\D/g, "");

    if (!phone) {
      setError("Customer mobile number is not available.");
      return;
    }

    if (phone.length !== 10) {
      setError(
        "Customer mobile number must be a valid 10-digit Indian number."
      );
      return;
    }

    if (!order.rack_number) {
      setError("Rack number is not assigned.");
      return;
    }

    const message = `
GNANI SMART MART

Hello Customer! 

Your order has been successfully placed in our pickup shelf.

Order ID: #${order.order_number || order.id}
Rack Number: ${order.rack_number}
Status: Ready for Pickup 

Please collect your items from Rack ${order.rack_number}.

Thank you for shopping with us! 
    `.trim();

    const whatsappUrl =
      `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  // CONFIRM CUSTOMER HANDOVER
  async function confirmHandover(order: Order) {
    if (
      !window.confirm(
        `Have you physically handed order ${
          order.order_number || order.id
        } to the customer?`
      )
    ) {
      return;
    }

    setActionLoading(order.id);
    setError("");
    setSuccess("");

    try {
      await shelfStockerApi.patch(
        `/orders/${encodeURIComponent(order.order_number || order.id)}/status`,
        { status: "collected" }
      );

      setSuccess("Customer handover confirmed successfully.");
      await loadOrders();
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Could not confirm customer handover."
      );
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
              GNANI SMART MART
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Shelf Stocker Dashboard
            </h1>

            <p className="mt-2 text-slate-600">
              Manage rack placement and customer order handover.
            </p>
          </div>

          <button
            onClick={loadOrders}
            disabled={loading}
            className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
          >
            Refresh Orders
          </button>
        </div>

        {/* ORDER COUNTS */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Packed Orders</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {packedCount}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Rack Assigned</p>
            <p className="mt-2 text-3xl font-bold text-blue-700">
              {rackAssignedCount}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Ready for Pickup</p>
            <p className="mt-2 text-3xl font-bold text-green-700">
              {readyCount}
            </p>
          </div>
        </div>

        {/* ERROR AND SUCCESS */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
            {success}
          </div>
        )}

        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            Orders to Process
          </h2>

          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
            {shelfOrders.length} Orders
          </span>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center text-slate-500">
            Loading orders...
          </div>
        ) : shelfOrders.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="mb-3 text-4xl">📦</div>

            <h3 className="text-lg font-bold text-slate-800">
              No orders waiting
            </h3>

            <p className="mt-2 text-slate-500">
              Paid and packed orders will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {shelfOrders.map((order) => {
              const status = order.status.toLowerCase();
              const orderNumber = order.order_number || order.id;

              return (
                <div
                  key={order.id}
                  className="rounded-2xl bg-white p-5 shadow-sm md:p-6"
                >
                  {/* ORDER HEADER */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">
                        Order Number
                      </p>

                      <h3 className="text-xl font-bold text-slate-900">
                        {orderNumber}
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold uppercase text-green-800">
                        Paid
                      </span>

                      <p className="mt-2 text-sm font-semibold text-slate-600">
                        {status.replaceAll("_", " ")}
                      </p>
                    </div>
                  </div>

                  <div className="my-4 border-t border-slate-100" />

                  {/* CUSTOMER MOBILE */}
                  <div className="mb-4 rounded-lg bg-slate-50 p-3">
                    <p className="text-sm text-slate-500">
                      Customer Mobile Number
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {order.customer_phone || "Not available"}
                    </p>
                  </div>

                  {/* ORDER ITEMS */}
                  <div>
                    <h4 className="mb-3 font-semibold text-slate-800">
                      Order Items
                    </h4>

                    <div className="space-y-2">
                      {order.items?.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between rounded-lg bg-slate-50 p-3 text-sm"
                        >
                          <span className="text-slate-700">
                            {item.product_name || item.name || "Product"}
                          </span>

                          <span className="font-semibold text-slate-900">
                            × {item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PAYMENT DETAILS */}
                  <div className="mt-4 flex flex-wrap justify-between gap-3">
                    <p className="text-sm text-slate-600">
                      Payment:{" "}
                      <strong className="uppercase">
                        {order.payment_method}
                      </strong>
                    </p>

                    <p className="font-bold text-slate-900">
                      Total: ₹
                      {Number(
                        order.total_amount ?? order.total ?? 0
                      ).toFixed(2)}
                    </p>
                  </div>

                  {/* ASSIGN RACK */}
                  {status === "packed" && (
                    <div className="mt-5 rounded-xl bg-blue-50 p-4">
                      <h4 className="font-bold text-blue-900">
                        Assign Rack Number
                      </h4>

                      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                        <input
                          type="text"
                          placeholder="Example: A-01"
                          value={rackNumbers[order.id] || ""}
                          onChange={(e) =>
                            setRackNumbers((previous) => ({
                              ...previous,
                              [order.id]: e.target.value,
                            }))
                          }
                          className="min-w-0 flex-1 rounded-lg border border-blue-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
                        />

                        <button
                          onClick={() => assignRack(order)}
                          disabled={actionLoading === order.id}
                          className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                        >
                          {actionLoading === order.id
                            ? "Please wait..."
                            : "Assign Rack"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* RACK ASSIGNED */}
                  {status === "rack_assigned" && (
                    <div className="mt-5 rounded-xl bg-blue-50 p-4">
                      <p className="font-semibold text-blue-900">
                        Assigned Rack: {order.rack_number}
                      </p>

                      <p className="mt-1 text-sm text-blue-800">
                        Place the order physically in this rack.
                      </p>

                      <button
                        onClick={() => confirmPlacement(order)}
                        disabled={actionLoading === order.id}
                        className="mt-4 w-full rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                      >
                        {actionLoading === order.id
                          ? "Please wait..."
                          : "Confirm Rack Placement"}
                      </button>
                    </div>
                  )}

                  {/* READY FOR PICKUP */}
                  {status === "ready_for_pickup" && (
                    <div className="mt-5 rounded-xl bg-green-50 p-4">
                      <p className="font-bold text-green-900">
                        Ready for Customer Pickup
                      </p>

                      <p className="mt-1 text-sm text-green-800">
                        Rack Number: {order.rack_number}
                      </p>

                      {/* WHATSAPP NOTIFICATION */}
                      <button
                        onClick={() => sendWhatsAppNotification(order)}
                        disabled={!order.customer_phone || !order.rack_number}
                        className="mt-4 w-full rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        💬 Send WhatsApp Notification
                      </button>

                      <p className="mt-2 text-xs text-green-800">
                        WhatsApp will open with the customer's rack details.
                        Press Send in WhatsApp to deliver the message.
                      </p>

                      {/* CUSTOMER HANDOVER */}
                      <button
                        onClick={() => confirmHandover(order)}
                        disabled={actionLoading === order.id}
                        className="mt-4 w-full rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                      >
                        {actionLoading === order.id
                          ? "Please wait..."
                          : "Confirm Handover to Customer"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-8 text-center text-sm text-slate-500">
          Payment verification is handled only by the shopkeeper.
        </p>
      </div>
    </div>
  );
}

export default ShelfStockerPage;
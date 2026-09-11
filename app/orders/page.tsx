"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  product?: {
    id: string;
    name: string;
    image?: string;
  };
};

type Order = {
  id: string;
  totalAmount: number;
  status: string;
  address: string;
  createdAt: string;

  // PHASE 12-E PAYMENT
  paymentMethod?: "COD" | "UPI" | "CARD" | "WALLET" | string | null;
  paymentStatus?:
    | "PENDING"
    | "PAID"
    | "FAILED"
    | "CANCELLED"
    | string
    | null;

  deliveredAt?: string | null;
  returnDeadline?: string | null;
  returnStatus?: string | null;

  items: OrderItem[];
};

const STATUS_ORDER = [
  "PENDING",
  "CONFIRMED",
  "READY_FOR_PICKUP",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const TRACKING_STEPS = [
  {
    status: "PENDING",
    label: "Order Placed",
  },
  {
    status: "CONFIRMED",
    label: "Confirmed",
  },
  {
    status: "PICKED_UP",
    label: "Picked Up",
  },
  {
    status: "OUT_FOR_DELIVERY",
    label: "Out for Delivery",
  },
  {
    status: "DELIVERED",
    label: "Delivered",
  },
];

const CANCEL_ALLOWED_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "READY_FOR_PICKUP",
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null
  );

  // Used to refresh the 2-hour return countdown.
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/orders", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Orders load failed");
      }

      const data = await response.json();

      const orderList = Array.isArray(data)
        ? data
        : Array.isArray(data.orders)
        ? data.orders
        : [];

      setOrders(orderList);
    } catch (error) {
      console.error(error);
      setError("Orders load nahi ho paaye.");
    } finally {
      setLoading(false);
    }
  }

  async function cancelOrder(orderId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) return;

    try {
      setCancellingOrderId(orderId);

      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Order cancel nahi ho paaya.");
        return;
      }

      alert("Order cancelled successfully.");

      await loadOrders();
    } catch (error) {
      console.error(error);
      alert("Something went wrong while cancelling the order.");
    } finally {
      setCancellingOrderId(null);
    }
  }

  function formatDate(date: string) {
    try {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return date;
    }
  }

  function formatDateTime(date?: string | null) {
    if (!date) return "";

    try {
      return new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case "PENDING":
        return "Order Placed";

      case "CONFIRMED":
        return "Confirmed";

      case "READY_FOR_PICKUP":
        return "Ready for Pickup";

      case "PICKED_UP":
        return "Picked Up";

      case "OUT_FOR_DELIVERY":
        return "Out for Delivery";

      case "DELIVERED":
        return "Delivered";

      case "CANCELLED":
        return "Cancelled";

      default:
        return status.replaceAll("_", " ");
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "DELIVERED":
        return "bg-green-100 text-green-700";

      case "OUT_FOR_DELIVERY":
      case "PICKED_UP":
        return "bg-blue-100 text-blue-700";

      case "CANCELLED":
        return "bg-red-100 text-red-700";

      case "CONFIRMED":
      case "READY_FOR_PICKUP":
        return "bg-yellow-100 text-yellow-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  // ============================================================
  // PHASE 12-E
  // PAYMENT STATUS UI
  // ============================================================

  function getPaymentInfo(order: Order) {
    const method = order.paymentMethod || "COD";
    const status = order.paymentStatus || "PENDING";

    let statusText = "Payment Pending";
    let statusClass = "bg-yellow-100 text-yellow-700";
    let icon = "🟡";

    switch (status) {
      case "PAID":
        statusText = "Payment Successful";
        statusClass = "bg-green-100 text-green-700";
        icon = "🟢";
        break;

      case "FAILED":
        statusText = "Payment Failed";
        statusClass = "bg-red-100 text-red-700";
        icon = "🔴";
        break;

      case "CANCELLED":
        statusText = "Payment Cancelled";
        statusClass = "bg-gray-100 text-gray-700";
        icon = "⚫";
        break;

      case "PENDING":
      default:
        statusText =
          method === "COD"
            ? "Payment Pending — COD"
            : "Payment Pending";

        statusClass = "bg-yellow-100 text-yellow-700";
        icon = "🟡";
        break;
    }

    let methodText = "Cash on Delivery";

    switch (method) {
      case "UPI":
        methodText = "UPI";
        break;

      case "CARD":
        methodText = "Credit / Debit Card";
        break;

      case "WALLET":
        methodText = "Wallet";
        break;

      case "COD":
      default:
        methodText = "Cash on Delivery";
        break;
    }

    return {
      status,
      method,
      statusText,
      statusClass,
      icon,
      methodText,
    };
  }

  function getReturnInfo(order: Order) {
    if (order.returnStatus === "REQUESTED") {
      return {
        text: "Return Requested",
        active: false,
        expired: false,
      };
    }

    if (order.returnStatus === "APPROVED") {
      return {
        text: "Return Approved",
        active: false,
        expired: false,
      };
    }

    if (order.returnStatus === "COMPLETED") {
      return {
        text: "Return Completed",
        active: false,
        expired: false,
      };
    }

    if (order.returnStatus === "REJECTED") {
      return {
        text: "Return Rejected",
        active: false,
        expired: false,
      };
    }

    if (order.returnStatus === "EXPIRED") {
      return {
        text: "Return Window Expired",
        active: false,
        expired: true,
      };
    }

    if (order.status !== "DELIVERED") {
      return {
        text: "",
        active: false,
        expired: false,
      };
    }

    if (!order.returnDeadline) {
      return {
        text: "Return window started after delivery",
        active: true,
        expired: false,
      };
    }

    const deadline = new Date(order.returnDeadline).getTime();
    const remaining = deadline - now;

    if (remaining <= 0) {
      return {
        text: "Return Window Expired",
        active: false,
        expired: true,
      };
    }

    const totalSeconds = Math.floor(remaining / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      text: `Return available • ${String(hours).padStart(
        2,
        "0"
      )}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(
        2,
        "0"
      )}s left`,
      active: true,
      expired: false,
    };
  }

  function getItemCount(order: Order) {
    return order.items.reduce(
      (total, item) => total + Number(item.quantity || 0),
      0
    );
  }

  function getOrderSubtotal(order: Order) {
    return order.items.reduce(
      (total, item) =>
        total + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );
  }

  function canCancel(order: Order) {
    return CANCEL_ALLOWED_STATUSES.includes(order.status);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f7fb]">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="h-32 animate-pulse rounded-3xl bg-[#07152f]" />

          <div className="mt-8 space-y-5">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-3xl bg-white shadow-sm"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] text-gray-900">
      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="text-2xl font-black tracking-wide text-[#07152f]"
          >
            CLOTHTYM
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden rounded-xl border-2 border-[#07152f] px-5 py-2.5 text-sm font-black text-[#07152f] sm:block"
            >
              Continue Shopping
            </Link>

            <Link
              href="/cart"
              className="rounded-xl bg-[#07152f] px-5 py-2.5 text-sm font-black text-white"
            >
              Cart
            </Link>
          </div>
        </div>
      </header>

      {/* PAGE */}

      <div className="mx-auto max-w-7xl px-4 py-7 sm:py-10">
        {/* TITLE */}

        <div className="rounded-3xl bg-[#07152f] p-6 text-white shadow-lg sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-300">
            CLOTHTYM ACCOUNT
          </p>

          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-black sm:text-4xl">
                My Orders
              </h1>

              <p className="mt-2 text-sm text-gray-300 sm:text-base">
                Track your orders, delivery progress, payment details and
                returns — all in one place.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 px-5 py-3">
              <p className="text-xs font-bold text-gray-300">
                TOTAL ORDERS
              </p>

              <p className="mt-1 text-2xl font-black">{orders.length}</p>
            </div>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-black">{error}</p>

            <button
              onClick={loadOrders}
              className="mt-3 rounded-xl bg-red-600 px-5 py-2.5 font-black text-white"
            >
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY */}

        {!error && orders.length === 0 && (
          <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <div className="text-7xl">📦</div>

            <h2 className="mt-5 text-2xl font-black text-[#07152f]">
              No orders yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-gray-500">
              Once you place an order, your complete order history will
              appear here.
            </p>

            <Link
              href="/"
              className="mt-7 inline-block rounded-xl bg-[#07152f] px-7 py-3.5 font-black text-white"
            >
              Start Shopping →
            </Link>
          </div>
        )}

        {/* ORDERS */}

        {!error && orders.length > 0 && (
          <div className="mt-8 space-y-6">
            {orders.map((order) => {
              const subtotal = getOrderSubtotal(order);
              const itemCount = getItemCount(order);
              const returnInfo = getReturnInfo(order);
              const paymentInfo = getPaymentInfo(order);
              const currentIndex = STATUS_ORDER.indexOf(order.status);

              return (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"
                >
                  {/* ORDER HEADER */}

                  <div className="border-b border-gray-200 bg-gray-50 px-5 py-5 sm:px-7">
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                          Order ID
                        </p>

                        <p className="mt-1 break-all text-sm font-black text-[#07152f]">
                          #{order.id}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                          Order Date
                        </p>

                        <p className="mt-1 text-sm font-bold">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                          Total Amount
                        </p>

                        <p className="mt-1 text-lg font-black text-[#07152f]">
                          ₹
                          {Number(order.totalAmount).toLocaleString(
                            "en-IN"
                          )}
                        </p>
                      </div>

                      {/* PAYMENT STATUS */}

                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                          Payment
                        </p>

                        <div className="mt-1">
                          <span
                            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ${paymentInfo.statusClass}`}
                          >
                            {paymentInfo.icon}{" "}
                            {paymentInfo.statusText}
                          </span>
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <span
                          className={`inline-flex rounded-full px-4 py-2 text-xs font-black ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusText(order.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* DELIVERY STATUS */}

                  <div className="border-b border-gray-200 px-5 py-5 sm:px-7">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                          Delivery Status
                        </p>

                        <h2 className="mt-1 text-xl font-black text-[#07152f]">
                          {getStatusText(order.status)}
                        </h2>

                        {order.deliveredAt && (
                          <p className="mt-1 text-sm text-gray-500">
                            Delivered on{" "}
                            {formatDateTime(order.deliveredAt)}
                          </p>
                        )}
                      </div>

                      {/* RETURN INFORMATION */}

                      {order.status === "DELIVERED" && (
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            returnInfo.expired
                              ? "bg-gray-100"
                              : "bg-orange-50"
                          }`}
                        >
                          <p
                            className={`text-sm font-black ${
                              returnInfo.expired
                                ? "text-gray-600"
                                : "text-orange-700"
                            }`}
                          >
                            ↩{" "}
                            {returnInfo.text ||
                              "2-hour return window active"}
                          </p>

                          {order.returnDeadline &&
                            !returnInfo.expired && (
                              <p className="mt-1 text-xs text-orange-600">
                                Return deadline:{" "}
                                {formatDateTime(
                                  order.returnDeadline
                                )}
                              </p>
                            )}

                          {!order.returnDeadline &&
                            !returnInfo.expired && (
                              <p className="mt-1 text-xs text-orange-600">
                                Your return timeline has started after
                                delivery.
                              </p>
                            )}
                        </div>
                      )}
                    </div>

                    {/* PRE-DELIVERY RETURN MESSAGE */}

                    {order.status !== "DELIVERED" &&
                      order.status !== "CANCELLED" && (
                        <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                          <p className="text-sm font-black text-blue-800">
                            ↩ 2-Hour Return Window
                          </p>

                          <p className="mt-1 text-xs leading-5 text-blue-600">
                            Your return timeline will automatically start
                            after your order is delivered. Once delivery is
                            completed, you will get a 2-hour return window.
                          </p>
                        </div>
                      )}

                    {/* TRACKING */}

                    <div className="mt-7 hidden md:block">
                      <div className="flex items-start">
                        {TRACKING_STEPS.map((step, index) => {
                          const stepIndex = STATUS_ORDER.indexOf(
                            step.status
                          );

                          const active =
                            order.status !== "CANCELLED" &&
                            currentIndex >= stepIndex;

                          const completed =
                            order.status !== "CANCELLED" &&
                            currentIndex > stepIndex;

                          return (
                            <div
                              key={step.status}
                              className="flex flex-1 items-start"
                            >
                              <div className="flex flex-col items-center">
                                <div
                                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${
                                    active
                                      ? "bg-[#07152f] text-white"
                                      : "border-2 border-gray-200 bg-white text-gray-400"
                                  }`}
                                >
                                  {active ? "✓" : index + 1}
                                </div>

                                <p
                                  className={`mt-2 whitespace-nowrap text-xs font-bold ${
                                    active
                                      ? "text-[#07152f]"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {step.label}
                                </p>
                              </div>

                              {index <
                                TRACKING_STEPS.length - 1 && (
                                <div
                                  className={`mt-4 h-1 flex-1 ${
                                    completed
                                      ? "bg-[#07152f]"
                                      : "bg-gray-200"
                                  }`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* CANCELLED MESSAGE */}

                    {order.status === "CANCELLED" && (
                      <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
                        <p className="text-sm font-black text-red-700">
                          Order Cancelled
                        </p>

                        <p className="mt-1 text-xs text-red-600">
                          This order has been cancelled and is no longer
                          eligible for delivery or return.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* PRODUCTS */}

                  <div className="px-5 py-6 sm:px-7">
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-black text-[#07152f]">
                          Order Details
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          {itemCount}{" "}
                          {itemCount === 1 ? "item" : "items"} in this
                          order
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-gray-200 p-4"
                        >
                          <div className="flex gap-4">
                            {/* PRODUCT IMAGE */}

                            <div className="h-28 w-24 shrink-0 overflow-hidden rounded-2xl bg-gray-100 sm:h-36 sm:w-32">
                              {item.product?.image ? (
                                <img
                                  src={item.product.image}
                                  alt={
                                    item.product.name ||
                                    "Product"
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-4xl">
                                  👕
                                </div>
                              )}
                            </div>

                            {/* PRODUCT DETAILS */}

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col justify-between gap-3 sm:flex-row">
                                <div>
                                  <h4 className="text-lg font-black text-[#07152f]">
                                    {item.product?.name ||
                                      "Product"}
                                  </h4>

                                  <p className="mt-2 text-sm text-gray-500">
                                    Quantity:{" "}
                                    <span className="font-black text-gray-800">
                                      {item.quantity}
                                    </span>
                                  </p>
                                </div>

                                <div className="sm:text-right">
                                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Price
                                  </p>

                                  <p className="mt-1 text-xl font-black text-[#07152f]">
                                    ₹
                                    {Number(
                                      item.price
                                    ).toLocaleString("en-IN")}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-5 border-t border-gray-100 pt-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-500">
                                    Item Total
                                  </span>

                                  <span className="font-black">
                                    ₹
                                    {(
                                      Number(item.price) *
                                      Number(item.quantity)
                                    ).toLocaleString("en-IN")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PRICE DETAILS */}

                  <div className="border-t border-gray-200 bg-gray-50 px-5 py-6 sm:px-7">
                    <div className="grid gap-7 lg:grid-cols-2">
                      {/* ADDRESS */}

                      <div>
                        <h3 className="text-lg font-black text-[#07152f]">
                          Delivery Address
                        </h3>

                        <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-4">
                          <p className="text-sm leading-6 text-gray-600">
                            {order.address ||
                              "Address not available"}
                          </p>
                        </div>
                      </div>

                      {/* PRICE */}

                      <div>
                        <h3 className="text-lg font-black text-[#07152f]">
                          Price Details
                        </h3>

                        <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-4">
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                Product Price
                              </span>

                              <span className="font-bold">
                                ₹
                                {subtotal.toLocaleString(
                                  "en-IN"
                                )}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                Delivery Charges
                              </span>

                              <span className="font-bold text-green-600">
                                FREE
                              </span>
                            </div>

                            <div className="border-t border-gray-200 pt-3">
                              <div className="flex justify-between">
                                <span className="font-black">
                                  Total Amount
                                </span>

                                <span className="text-xl font-black text-[#07152f]">
                                  ₹
                                  {Number(
                                    order.totalAmount
                                  ).toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* PAYMENT DETAILS */}

                          <div
                            className={`mt-4 rounded-xl p-4 ${
                              paymentInfo.status === "PAID"
                                ? "bg-green-50"
                                : paymentInfo.status === "FAILED"
                                ? "bg-red-50"
                                : paymentInfo.status === "CANCELLED"
                                ? "bg-gray-100"
                                : "bg-yellow-50"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p
                                  className={`text-sm font-black ${
                                    paymentInfo.status === "PAID"
                                      ? "text-green-700"
                                      : paymentInfo.status === "FAILED"
                                      ? "text-red-700"
                                      : paymentInfo.status === "CANCELLED"
                                      ? "text-gray-700"
                                      : "text-yellow-700"
                                  }`}
                                >
                                  {paymentInfo.icon}{" "}
                                  {paymentInfo.methodText}
                                </p>

                                <p
                                  className={`mt-1 text-xs ${
                                    paymentInfo.status === "PAID"
                                      ? "text-green-600"
                                      : paymentInfo.status === "FAILED"
                                      ? "text-red-600"
                                      : paymentInfo.status === "CANCELLED"
                                      ? "text-gray-500"
                                      : "text-yellow-700"
                                  }`}
                                >
                                  {paymentInfo.status === "PAID"
                                    ? "Payment has been successfully received."
                                    : paymentInfo.status === "FAILED"
                                    ? "Payment failed. Please try again."
                                    : paymentInfo.status === "CANCELLED"
                                    ? "This payment has been cancelled."
                                    : paymentInfo.method === "COD"
                                    ? "Payment will be collected on delivery."
                                    : "Payment is awaiting confirmation."}
                                </p>
                              </div>

                              <span
                                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${paymentInfo.statusClass}`}
                              >
                                {paymentInfo.statusText}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FOOTER ACTIONS */}

                  <div className="flex flex-col gap-4 border-t border-gray-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <div>
                      <p className="text-xs font-bold text-gray-400">
                        ORDER PLACED
                      </p>

                      <p className="mt-1 text-sm font-black text-gray-700">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {/* CANCEL */}

                      {canCancel(order) && (
                        <button
                          onClick={() => cancelOrder(order.id)}
                          disabled={
                            cancellingOrderId === order.id
                          }
                          className="rounded-xl border-2 border-red-500 px-5 py-2.5 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {cancellingOrderId === order.id
                            ? "Cancelling..."
                            : "Cancel Order"}
                        </button>
                      )}

                      {/* RETURN */}

                      {order.status === "DELIVERED" &&
                        !returnInfo.expired &&
                        order.returnStatus !== "COMPLETED" &&
                        order.returnStatus !== "REJECTED" && (
                          <Link
                            href={`/orders/${order.id}`}
                            className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-orange-600"
                          >
                            ↩ Return / Help
                          </Link>
                        )}

                      {/* VIEW DETAILS */}

                      <Link
                        href={`/orders/${order.id}`}
                        className="rounded-xl bg-[#07152f] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#10234b]"
                      >
                        View Order Details →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
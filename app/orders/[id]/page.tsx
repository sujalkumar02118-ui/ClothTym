"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Product = {
  id: string;
  name: string;
  image?: string;
};

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  product?: Product | null;
};

type Order = {
  id: string;
  totalAmount: number;
  status: string;
  address: string;
  createdAt: string;
  deliveredAt?: string | null;
  returnDeadline?: string | null;
  returnStatus?: string | null;
  returnRequestedAt?: string | null;
  returnReason?: string | null;
  returnRejectedReason?: string | null;
  returnCompletedAt?: string | null;
  items: OrderItem[];
};

const RETURN_REASONS = [
  "Size / fit issue",
  "Wrong size received",
  "Wrong product received",
  "Product looks different from images",
  "Colour is different from what I expected",
  "Product quality is not as expected",
  "Product is damaged",
  "Product is defective",
  "Product has stains / marks",
  "Product has missing parts / accessories",
  "Product received is incomplete",
  "Changed my mind",
  "Ordered by mistake",
  "No longer required",
  "Found a better product / price",
  "Other",
];

const STATUS_STEPS = [
  ["PENDING", "Order Placed"],
  ["CONFIRMED", "Confirmed"],
  ["READY_FOR_PICKUP", "Ready for Pickup"],
  ["PICKED_UP", "Picked Up"],
  ["OUT_FOR_DELIVERY", "Out for Delivery"],
  ["DELIVERED", "Delivered"],
];

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = String(params.id || "");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showReturn, setShowReturn] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnMessage, setReturnMessage] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (orderId) loadOrder();
  }, [orderId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  async function loadOrder() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/orders/${orderId}`, {
        cache: "no-store",
      });

      const rawText = await response.text();

      let data: any = null;

      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        console.error(
          "ORDER API RETURNED NON-JSON:",
          rawText.slice(0, 500)
        );

        throw new Error(
          `Order API returned an invalid response (${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message || "Order details load failed."
        );
      }

      setOrder(data?.order || data);
    } catch (error) {
      console.error("ORDER DETAILS ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Order details load nahi ho paaye."
      );
    } finally {
      setLoading(false);
    }
  }

  function formatDateTime(date?: string | null) {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function statusText(status?: string) {
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
        return status?.replaceAll("_", " ") || "Unknown";
    }
  }

  const itemCount = useMemo(() => {
    return (
      order?.items?.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
      ) || 0
    );
  }, [order]);

  const subtotal = useMemo(() => {
    return (
      order?.items?.reduce(
        (total, item) =>
          total +
          Number(item.price || 0) *
            Number(item.quantity || 0),
        0
      ) || 0
    );
  }, [order]);

  const returnTimeLeft = useMemo(() => {
    if (!order?.returnDeadline) return 0;

    return Math.max(
      0,
      new Date(order.returnDeadline).getTime() - now
    );
  }, [order, now]);

  const returnAvailable =
    order?.status === "DELIVERED" &&
    !!order.returnDeadline &&
    returnTimeLeft > 0 &&
    order.returnStatus !== "REQUESTED" &&
    order.returnStatus !== "APPROVED" &&
    order.returnStatus !== "COMPLETED" &&
    order.returnStatus !== "REJECTED" &&
    order.returnStatus !== "EXPIRED";

  const returnExpired =
    order?.status === "DELIVERED" &&
    !!order.returnDeadline &&
    returnTimeLeft <= 0;

  function formatCountdown(milliseconds: number) {
    const totalSeconds = Math.floor(milliseconds / 1000);

    const hours = Math.floor(totalSeconds / 3600);

    const minutes = Math.floor(
      (totalSeconds % 3600) / 60
    );

    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function getStatusIndex(status: string) {
    return STATUS_STEPS.findIndex(
      ([value]) => value === status
    );
  }

  async function submitReturnRequest() {
    if (!order) return;

    let reason = selectedReason;

    if (selectedReason === "Other") {
      reason = otherReason.trim();
    }

    if (!reason) {
      setReturnMessage("Please select a return reason.");
      return;
    }

    try {
      setSubmittingReturn(true);
      setReturnMessage("");

      const response = await fetch("/api/delivery/return", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          reason,
        }),
      });

      const rawText = await response.text();

      let data: any = null;

      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        throw new Error(
          "Return API returned an invalid response."
        );
      }

      if (!response.ok) {
        setReturnMessage(
          data?.message ||
            "Return request submit nahi ho paayi."
        );
        return;
      }

      setOrder((previous) =>
        previous
          ? {
              ...previous,
              returnStatus:
                data?.order?.returnStatus || "APPROVED",
              returnRequestedAt:
                data?.order?.returnRequestedAt ||
                new Date().toISOString(),
              returnReason:
                data?.order?.returnReason || reason,
              returnDeadline:
                data?.order?.returnDeadline ||
                previous.returnDeadline,
            }
          : previous
      );

      setShowReturn(false);
      setSelectedReason("");
      setOtherReason("");

      setReturnMessage(
        data?.message ||
          "Return request accepted automatically."
      );
    } catch (error) {
      console.error("RETURN SUBMIT ERROR:", error);

      setReturnMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting the return request."
      );
    } finally {
      setSubmittingReturn(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f7fb]">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="h-24 animate-pulse rounded-3xl bg-[#07152f]" />

          <div className="mt-6 space-y-5">
            <div className="h-52 animate-pulse rounded-3xl bg-white" />
            <div className="h-72 animate-pulse rounded-3xl bg-white" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-[#f6f7fb]">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <Link
              href="/"
              className="text-2xl font-black tracking-wide text-[#07152f]"
            >
              CLOTHTYM
            </Link>

            <Link
              href="/orders"
              className="rounded-xl bg-[#07152f] px-5 py-2.5 text-sm font-black text-white"
            >
              My Orders
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="text-6xl">📦</div>

          <h1 className="mt-5 text-3xl font-black text-[#07152f]">
            Order not found
          </h1>

          <p className="mt-2 text-gray-500">
            {error || "This order could not be found."}
          </p>

          <Link
            href="/orders"
            className="mt-7 inline-block rounded-xl bg-[#07152f] px-7 py-3.5 font-black text-white"
          >
            ← Back to Orders
          </Link>
        </div>
      </main>
    );
  }

  const currentStatusIndex = getStatusIndex(order.status);

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

          <div className="flex gap-2 sm:gap-3">

            <Link
              href="/orders"
              className="rounded-xl border-2 border-[#07152f] px-4 py-2.5 text-sm font-black text-[#07152f]"
            >
              My Orders
            </Link>

            <Link
              href="/cart"
              className="rounded-xl bg-[#07152f] px-4 py-2.5 text-sm font-black text-white"
            >
              Cart
            </Link>

          </div>

        </div>
      </header>

      {/* PAGE */}

      <div className="mx-auto max-w-7xl px-4 py-7 sm:py-10">

        {/* TOP */}

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

          <div>

            <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-500">
              CLOTHTYM • ORDER DETAILS
            </p>

            <h1 className="mt-2 break-all text-2xl font-black text-[#07152f] sm:text-4xl">
              Order #{order.id}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Placed on {formatDateTime(order.createdAt)}
            </p>

          </div>

          <Link
            href="/orders"
            className="w-fit rounded-xl bg-white px-5 py-3 text-sm font-black text-[#07152f] shadow-sm ring-1 ring-gray-200"
          >
            ← Back to Orders
          </Link>

        </div>

        {/* SUCCESS MESSAGE */}

        {returnMessage && !showReturn && (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="font-black text-green-700">
              ✓ {returnMessage}
            </p>
          </div>
        )}

        {/* STATUS CARD */}

        <section className="mt-7 overflow-hidden rounded-3xl bg-[#07152f] text-white shadow-xl">

          <div className="border-b border-white/10 px-5 py-6 sm:px-8">

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                  Current Status
                </p>

                <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                  {statusText(order.status)}
                </h2>
              </div>

              <div className="rounded-2xl bg-white/10 px-5 py-3">

                <p className="text-xs font-bold text-gray-400">
                  ORDER TOTAL
                </p>

                <p className="mt-1 text-2xl font-black">
                  ₹
                  {Number(order.totalAmount).toLocaleString("en-IN")}
                </p>

              </div>

            </div>

          </div>

          {/* TRACKING */}

          <div className="overflow-x-auto px-5 py-7 sm:px-8">

            <div className="flex min-w-[760px] items-start">

              {STATUS_STEPS.map(
                ([status, label], index) => {

                  const active =
                    order.status !== "CANCELLED" &&
                    currentStatusIndex >= index;

                  const isLast =
                    index === STATUS_STEPS.length - 1;

                  return (
                    <div
                      key={status}
                      className="flex flex-1 items-start"
                    >

                      <div className="flex flex-col items-center">

                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full font-black ${
                            active
                              ? "bg-white text-[#07152f]"
                              : "border-2 border-white/20 text-white/40"
                          }`}
                        >
                          {active ? "✓" : index + 1}
                        </div>

                        <p
                          className={`mt-2 whitespace-nowrap text-xs font-bold ${
                            active
                              ? "text-white"
                              : "text-white/40"
                          }`}
                        >
                          {label}
                        </p>

                      </div>

                      {!isLast && (
                        <div
                          className={`mt-5 h-1 flex-1 ${
                            active &&
                            currentStatusIndex > index
                              ? "bg-white"
                              : "bg-white/15"
                          }`}
                        />
                      )}

                    </div>
                  );
                }
              )}

            </div>

          </div>

        </section>

        {/* RETURN TIMELINE */}

        {order.status === "DELIVERED" && (
          <section className="mt-6 rounded-3xl border border-orange-200 bg-white p-5 shadow-sm sm:p-7">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-xs font-black uppercase tracking-wider text-orange-500">
                  Return Timeline
                </p>

                <h2 className="mt-1 text-xl font-black text-[#07152f]">
                  Your 2-hour return window
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                  Your return window started when
                  your order was delivered. Valid
                  return requests are automatically
                  processed by CLOTHTYM.
                </p>

              </div>

              {returnAvailable && (
                <div className="rounded-2xl bg-orange-50 px-5 py-4 text-center">

                  <p className="text-xs font-black uppercase text-orange-500">
                    Time remaining
                  </p>

                  <p className="mt-1 font-mono text-2xl font-black tracking-wider text-orange-700">
                    {formatCountdown(returnTimeLeft)}
                  </p>

                </div>
              )}

              {returnExpired && (
                <div className="rounded-2xl bg-gray-100 px-5 py-4 text-center">

                  <p className="text-xs font-black uppercase text-gray-400">
                    Return status
                  </p>

                  <p className="mt-1 text-lg font-black text-gray-600">
                    Window Expired
                  </p>

                </div>
              )}

            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">

                <p className="text-xs font-black uppercase text-gray-400">
                  Delivered On
                </p>

                <p className="mt-1 font-black text-[#07152f]">
                  {formatDateTime(order.deliveredAt)}
                </p>

              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">

                <p className="text-xs font-black uppercase text-gray-400">
                  Return Deadline
                </p>

                <p className="mt-1 font-black text-[#07152f]">
                  {formatDateTime(order.returnDeadline)}
                </p>

              </div>

            </div>

            {/* APPROVED */}

            {order.returnStatus === "APPROVED" && (
              <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4">

                <p className="font-black text-green-700">
                  ✓ Return Request Accepted
                </p>

                <p className="mt-1 text-sm text-green-600">
                  Your return request was
                  automatically accepted because it
                  satisfied the return policy.
                </p>

                {order.returnReason && (
                  <p className="mt-2 text-sm font-bold text-green-700">
                    Reason: {order.returnReason}
                  </p>
                )}

                {order.returnRequestedAt && (
                  <p className="mt-1 text-xs text-green-600">
                    Requested on:{" "}
                    {formatDateTime(order.returnRequestedAt)}
                  </p>
                )}

              </div>
            )}

            {/* REQUESTED */}

            {order.returnStatus === "REQUESTED" && (
              <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">

                <p className="font-black text-blue-700">
                  ✓ Return Request Submitted
                </p>

                <p className="mt-1 text-sm text-blue-600">
                  Your return request is being
                  processed automatically.
                </p>

                {order.returnReason && (
                  <p className="mt-2 text-sm font-bold text-blue-700">
                    Reason: {order.returnReason}
                  </p>
                )}

              </div>
            )}

            {/* COMPLETED */}

            {order.returnStatus === "COMPLETED" && (
              <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4">

                <p className="font-black text-green-700">
                  ✓ Return Completed
                </p>

                <p className="mt-1 text-sm text-green-600">
                  Your return has been completed
                  successfully.
                </p>

              </div>
            )}

            {/* REJECTED */}

            {order.returnStatus === "REJECTED" && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">

                <p className="font-black text-red-700">
                  Return Request Rejected
                </p>

                <p className="mt-1 text-sm text-red-600">
                  This return request did not satisfy
                  the return policy.
                </p>

                {order.returnRejectedReason && (
                  <p className="mt-2 text-sm font-bold text-red-700">
                    Reason: {order.returnRejectedReason}
                  </p>
                )}

              </div>
            )}

            {/* EXPIRED */}

            {(order.returnStatus === "EXPIRED" ||
              returnExpired) && (
              <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">

                <p className="font-black text-gray-700">
                  Return Window Expired
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  The 2-hour return window has ended.
                  New return requests cannot be
                  submitted.
                </p>

              </div>
            )}

            {/* RETURN BUTTON */}

            {returnAvailable && (
              <button
                type="button"
                onClick={() => {
                  setShowReturn(true);
                  setReturnMessage("");
                }}
                className="mt-5 w-full rounded-xl bg-[#07152f] px-6 py-4 font-black text-white shadow-sm transition hover:opacity-90 sm:w-auto"
              >
                ↩ Return / Request Return
              </button>
            )}

          </section>
        )}

        {/* RETURN FORM */}

        {showReturn && returnAvailable && (
          <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                  RETURN REQUEST
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#07152f]">
                  Why do you want to return this order?
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Select the reason that best
                  describes your issue.
                </p>

              </div>

              <button
                type="button"
                onClick={() => setShowReturn(false)}
                className="rounded-xl px-3 py-2 text-2xl font-black text-gray-400 hover:bg-gray-100"
              >
                ×
              </button>

            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">

              {RETURN_REASONS.map((reason) => (

                <button
                  key={reason}
                  type="button"
                  onClick={() => {
                    setSelectedReason(reason);
                    setReturnMessage("");
                  }}
                  className={`rounded-2xl border-2 p-4 text-left text-sm font-bold transition ${
                    selectedReason === reason
                      ? "border-[#07152f] bg-[#07152f] text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >

                  <div className="flex items-center gap-3">

                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        selectedReason === reason
                          ? "border-white bg-white"
                          : "border-gray-300"
                      }`}
                    >

                      {selectedReason === reason && (
                        <div className="h-2.5 w-2.5 rounded-full bg-[#07152f]" />
                      )}

                    </div>

                    <span>{reason}</span>

                  </div>

                </button>

              ))}

            </div>

            {selectedReason === "Other" && (
              <div className="mt-5">

                <label className="text-sm font-black text-[#07152f]">
                  Tell us more
                </label>

                <textarea
                  value={otherReason}
                  onChange={(event) =>
                    setOtherReason(event.target.value)
                  }
                  placeholder="Please describe your reason..."
                  rows={4}
                  maxLength={500}
                  className="mt-2 w-full rounded-2xl border-2 border-gray-200 p-4 text-sm outline-none transition focus:border-[#07152f]"
                />

                <p className="mt-1 text-right text-xs text-gray-400">
                  {otherReason.length}/500
                </p>

              </div>
            )}

            {returnMessage && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="font-bold text-red-700">
                  {returnMessage}
                </p>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4">

              <p className="font-black text-orange-800">
                ⏱ Return window
              </p>

              <p className="mt-1 text-sm leading-6 text-orange-700">
                Your return request must be
                submitted before{" "}
                <strong>
                  {formatDateTime(order.returnDeadline)}
                </strong>
                .
              </p>

            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                disabled={
                  submittingReturn ||
                  !selectedReason ||
                  (selectedReason === "Other" &&
                    !otherReason.trim())
                }
                onClick={submitReturnRequest}
                className="rounded-xl bg-[#07152f] px-7 py-3.5 font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submittingReturn
                  ? "Checking..."
                  : "Submit Return Request"}
              </button>

              <button
                type="button"
                onClick={() => setShowReturn(false)}
                className="rounded-xl border-2 border-gray-200 px-7 py-3.5 font-black text-gray-700"
              >
                Cancel
              </button>

            </div>

          </section>
        )}

        {/* RETURN PICKUP UI */}

        {order.returnStatus === "APPROVED" && (
          <section className="mt-6 rounded-3xl border border-blue-200 bg-white p-5 shadow-sm sm:p-7">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

              <div>

                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-500">
                  RETURN PICKUP
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#07152f]">
                  Return Pickup
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                  Your return request has been approved.
                  The return pickup will be arranged from
                  your delivery address.
                </p>

              </div>

              <div className="w-fit rounded-2xl bg-blue-50 px-5 py-3">

                <p className="text-xs font-black uppercase text-blue-500">
                  Pickup Status
                </p>

                <p className="mt-1 text-lg font-black text-blue-700">
                  Pickup Pending
                </p>

              </div>

            </div>

            <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4">

              <div className="flex items-start gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
                  ✓
                </div>

                <div>

                  <p className="font-black text-green-700">
                    Return Approved
                  </p>

                  <p className="mt-1 text-sm leading-6 text-green-600">
                    Your return request has been
                    automatically approved according
                    to the return policy.
                  </p>

                  {order.returnReason && (
                    <p className="mt-2 text-sm font-bold text-green-700">
                      Reason: {order.returnReason}
                    </p>
                  )}

                  {order.returnRequestedAt && (
                    <p className="mt-1 text-xs text-green-600">
                      Requested on:{" "}
                      {formatDateTime(
                        order.returnRequestedAt
                      )}
                    </p>
                  )}

                </div>

              </div>

            </div>

            <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-5">

              <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                PICKUP ADDRESS
              </p>

              <h3 className="mt-1 text-lg font-black text-[#07152f]">
                Return Pickup Location
              </h3>

              <p className="mt-3 text-sm leading-7 text-gray-700">
                {order.address || "Address not available"}
              </p>

            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">

              <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-4">

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white">
                  1
                </div>

                <p className="mt-3 font-black text-[#07152f]">
                  Return Approved
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Return request has been approved.
                </p>

              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 font-black text-gray-600">
                  2
                </div>

                <p className="mt-3 font-black text-[#07152f]">
                  Pickup Scheduled
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Pickup will be arranged by the
                  delivery system.
                </p>

              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 font-black text-gray-600">
                  3
                </div>

                <p className="mt-3 font-black text-[#07152f]">
                  Pickup Completed
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Return will move to the next
                  stage after pickup.
                </p>

              </div>

            </div>

            <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4">

              <p className="font-black text-orange-800">
                📦 Keep the product ready
              </p>

              <p className="mt-1 text-sm leading-6 text-orange-700">
                Please keep the product, original
                packaging and included accessories
                ready for the return pickup.
              </p>

            </div>

          </section>
        )}

        {/* ORDER INFORMATION */}

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">

          {/* PRODUCTS */}

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                  PRODUCTS
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#07152f]">
                  Order Details
                </h2>

              </div>

              <div className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-black">
                {itemCount}{" "}
                {itemCount === 1 ? "Item" : "Items"}
              </div>

            </div>

            <div className="mt-6 space-y-4">

              {order.items.map((item) => (

                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-200 p-4"
                >

                  <div className="flex gap-4">

                    <div className="h-28 w-24 shrink-0 overflow-hidden rounded-2xl bg-gray-100 sm:h-36 sm:w-32">

                      {item.product?.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-4xl">
                          👕
                        </div>
                      )}

                    </div>

                    <div className="min-w-0 flex-1">

                      <h3 className="text-lg font-black text-[#07152f]">
                        {item.product?.name || "Product"}
                      </h3>

                      <div className="mt-3 space-y-1 text-sm">

                        <p className="text-gray-500">
                          Quantity:{" "}
                          <span className="font-black text-gray-900">
                            {item.quantity}
                          </span>
                        </p>

                        <p className="text-gray-500">
                          Price:{" "}
                          <span className="font-black text-gray-900">
                            ₹
                            {Number(item.price).toLocaleString("en-IN")}
                          </span>
                        </p>

                      </div>

                      <div className="mt-4 border-t border-gray-100 pt-3">

                        <div className="flex justify-between">

                          <span className="text-sm text-gray-500">
                            Item Total
                          </span>

                          <span className="font-black text-[#07152f]">
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

          {/* PRICE + ADDRESS */}

          <div className="space-y-6">

            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">

              <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                PAYMENT SUMMARY
              </p>

              <h2 className="mt-1 text-xl font-black text-[#07152f]">
                Price Details
              </h2>

              <div className="mt-5 space-y-4 text-sm">

                <div className="flex justify-between">

                  <span className="text-gray-500">
                    Product Price
                  </span>

                  <span className="font-bold">
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>

                </div>

                <div className="flex justify-between">

                  <span className="text-gray-500">
                    Delivery Charges
                  </span>

                  <span className="font-black text-green-600">
                    FREE
                  </span>

                </div>

                <div className="border-t border-gray-200 pt-4">

                  <div className="flex justify-between">

                    <span className="font-black">
                      Total Amount
                    </span>

                    <span className="text-2xl font-black text-[#07152f]">
                      ₹
                      {Number(order.totalAmount).toLocaleString(
                        "en-IN"
                      )}
                    </span>

                  </div>

                </div>

              </div>

              <div className="mt-5 rounded-2xl bg-green-50 p-4">

                <p className="font-black text-green-700">
                  💵 Cash on Delivery
                </p>

                <p className="mt-1 text-xs text-green-600">
                  Payment will be collected when
                  your order is delivered.
                </p>

              </div>

            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">

              <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                DELIVERY
              </p>

              <h2 className="mt-1 text-xl font-black text-[#07152f]">
                Delivery Address
              </h2>

              <div className="mt-4 rounded-2xl bg-gray-50 p-4">

                <p className="text-sm leading-7 text-gray-700">
                  {order.address || "Address not available"}
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* ORDER META */}

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">

          <h2 className="text-xl font-black text-[#07152f]">
            Order Information
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-2xl bg-gray-50 p-4">

              <p className="text-xs font-black uppercase text-gray-400">
                Order ID
              </p>

              <p className="mt-1 break-all text-sm font-black text-[#07152f]">
                #{order.id}
              </p>

            </div>

            <div className="rounded-2xl bg-gray-50 p-4">

              <p className="text-xs font-black uppercase text-gray-400">
                Order Date
              </p>

              <p className="mt-1 text-sm font-black">
                {formatDateTime(order.createdAt)}
              </p>

            </div>

            <div className="rounded-2xl bg-gray-50 p-4">

              <p className="text-xs font-black uppercase text-gray-400">
                Delivery Status
              </p>

              <p className="mt-1 text-sm font-black text-[#07152f]">
                {statusText(order.status)}
              </p>

            </div>

            <div className="rounded-2xl bg-gray-50 p-4">

              <p className="text-xs font-black uppercase text-gray-400">
                Return Status
              </p>

              <p className="mt-1 text-sm font-black text-[#07152f]">
                {order.returnStatus || "Not Eligible"}
              </p>

            </div>

          </div>

        </section>

        {/* BOTTOM */}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">

          <Link
            href="/orders"
            className="rounded-xl bg-[#07152f] px-6 py-3.5 text-center font-black text-white"
          >
            ← My Orders
          </Link>

          <Link
            href="/"
            className="rounded-xl border-2 border-[#07152f] px-6 py-3.5 text-center font-black text-[#07152f]"
          >
            Continue Shopping
          </Link>

        </div>

      </div>

    </main>
  );
}
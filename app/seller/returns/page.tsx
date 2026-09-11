"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ReturnRequest = {
  id: string;
  orderId?: string;
  productName?: string;
  reason?: string;
  status?: string;
  createdAt?: string;
};

export default function SellerReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReturns() {
      try {
        const response = await fetch("/api/delivery/return", {
          cache: "no-store",
        });

        if (!response.ok) {
          setReturns([]);
          return;
        }

        const data = await response.json();

        const list =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.returns)
              ? data.returns
              : Array.isArray(data?.data)
                ? data.data
                : [];

        setReturns(list);
      } catch (error) {
        console.error("SELLER RETURNS LOAD ERROR:", error);
        setReturns([]);
      } finally {
        setLoading(false);
      }
    }

    loadReturns();
  }, []);

  function getStatusStyle(status?: string) {
    const value = String(status || "").toUpperCase();

    if (
      value === "APPROVED" ||
      value === "PICKED_UP" ||
      value === "COMPLETED"
    ) {
      return "bg-green-100 text-green-700";
    }

    if (
      value === "REJECTED" ||
      value === "CANCELLED"
    ) {
      return "bg-red-100 text-red-700";
    }

    return "bg-yellow-100 text-yellow-700";
  }

  return (
    <div className="min-h-screen bg-[#f3f4f7] text-[#111827]">

      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">

          <Link
            href="/seller"
            className="text-2xl font-black text-[#07152f] sm:text-3xl"
          >
            ClothTym
          </Link>

          <div className="flex items-center gap-3">

            <Link
              href="/seller"
              className="rounded-xl border border-gray-300 px-4 py-2 font-bold text-[#111827] transition hover:bg-gray-100"
            >
              ← Dashboard
            </Link>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#07152f] font-black text-white">
              S
            </div>

          </div>
        </div>
      </header>


      {/* MAIN */}
      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* PAGE HEADER */}
        <section className="mb-6">

          <p className="text-sm font-bold uppercase tracking-wider text-[#64748b]">
            Seller Panel
          </p>

          <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <h1 className="text-3xl font-black text-[#07152f] sm:text-4xl">
                Returns
              </h1>

              <p className="mt-2 text-gray-600">
                Manage customer return requests and their status.
              </p>
            </div>

            <Link
              href="/seller/orders"
              className="inline-flex w-fit items-center rounded-xl bg-[#07152f] px-5 py-3 font-bold text-white transition hover:bg-[#10244b]"
            >
              View Orders
            </Link>

          </div>

        </section>


        {/* SUMMARY CARDS */}
        <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">

          <div className="rounded-2xl border border-gray-300 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-[#64748b]">
              Total Returns
            </p>

            <h2 className="mt-2 text-3xl font-black text-[#07152f]">
              {loading ? "—" : returns.length}
            </h2>
          </div>


          <div className="rounded-2xl border border-gray-300 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-[#64748b]">
              Pending
            </p>

            <h2 className="mt-2 text-3xl font-black text-yellow-600">
              {loading
                ? "—"
                : returns.filter(
                    (item) =>
                      String(item.status || "").toUpperCase() ===
                        "PENDING"
                  ).length}
            </h2>
          </div>


          <div className="rounded-2xl border border-gray-300 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-[#64748b]">
              Approved
            </p>

            <h2 className="mt-2 text-3xl font-black text-green-600">
              {loading
                ? "—"
                : returns.filter(
                    (item) =>
                      String(item.status || "").toUpperCase() ===
                        "APPROVED"
                  ).length}
            </h2>
          </div>


          <div className="rounded-2xl border border-gray-300 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-[#64748b]">
              Rejected
            </p>

            <h2 className="mt-2 text-3xl font-black text-red-600">
              {loading
                ? "—"
                : returns.filter(
                    (item) =>
                      String(item.status || "").toUpperCase() ===
                        "REJECTED"
                  ).length}
            </h2>
          </div>

        </section>


        {/* RETURNS LIST */}
        <section className="overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm">

          <div className="border-b border-gray-200 px-5 py-5 sm:px-6">

            <h2 className="text-xl font-black text-[#111827]">
              Return Requests
            </h2>

            <p className="mt-1 text-sm font-medium text-gray-500">
              Customer return requests will appear here.
            </p>

          </div>


          {/* LOADING */}
          {loading && (
            <div className="p-6">

              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="mb-4 animate-pulse rounded-xl border border-gray-200 p-5"
                >
                  <div className="h-5 w-1/3 rounded bg-gray-200" />
                  <div className="mt-3 h-4 w-2/3 rounded bg-gray-200" />
                  <div className="mt-3 h-4 w-1/4 rounded bg-gray-200" />
                </div>
              ))}

            </div>
          )}


          {/* NO RETURNS */}
          {!loading && returns.length === 0 && (
            <div className="px-6 py-20 text-center">

              <div className="mb-4 text-6xl">
                ↩️
              </div>

              <h3 className="text-xl font-black text-[#111827]">
                No return requests
              </h3>

              <p className="mx-auto mt-2 max-w-md text-gray-500">
                Customer return requests will appear here when a
                return is created.
              </p>

            </div>
          )}


          {/* RETURN REQUESTS */}
          {!loading && returns.length > 0 && (
            <div className="divide-y divide-gray-200">

              {returns.map((item) => (

                <div
                  key={item.id}
                  className="p-5 transition hover:bg-gray-50 sm:p-6"
                >

                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <h3 className="font-black text-[#111827]">
                          Return Request
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${getStatusStyle(
                            item.status
                          )}`}
                        >
                          {item.status || "PENDING"}
                        </span>

                      </div>


                      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">

                        <p className="font-medium text-gray-600">
                          <span className="font-bold text-gray-800">
                            Return ID:
                          </span>{" "}
                          {item.id}
                        </p>

                        {item.orderId && (
                          <p className="font-medium text-gray-600">
                            <span className="font-bold text-gray-800">
                              Order ID:
                            </span>{" "}
                            {item.orderId}
                          </p>
                        )}

                        {item.productName && (
                          <p className="font-medium text-gray-600">
                            <span className="font-bold text-gray-800">
                              Product:
                            </span>{" "}
                            {item.productName}
                          </p>
                        )}

                        {item.reason && (
                          <p className="font-medium text-gray-600">
                            <span className="font-bold text-gray-800">
                              Reason:
                            </span>{" "}
                            {item.reason}
                          </p>
                        )}

                      </div>

                    </div>


                    {item.createdAt && (
                      <p className="shrink-0 text-sm font-semibold text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </p>
                    )}

                  </div>

                </div>

              ))}

            </div>
          )}

        </section>

      </main>


      {/* MOBILE BOTTOM */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-300 bg-white lg:hidden">

        <div className="grid h-[68px] grid-cols-4">

          <Link
            href="/seller"
            className="flex flex-col items-center justify-center text-xs font-semibold text-[#475569]"
          >
            <span className="text-xl">⌂</span>
            Home
          </Link>

          <Link
            href="/seller/orders"
            className="flex flex-col items-center justify-center text-xs font-semibold text-[#475569]"
          >
            <span className="text-xl">▣</span>
            Orders
          </Link>

          <Link
            href="/seller/returns"
            className="flex flex-col items-center justify-center text-xs font-black text-[#07152f]"
          >
            <span className="text-xl">↩</span>
            Returns
          </Link>

          <Link
            href="/seller/products"
            className="flex flex-col items-center justify-center text-xs font-semibold text-[#475569]"
          >
            <span className="text-xl">▤</span>
            Products
          </Link>

        </div>

      </nav>

    </div>
  );
}
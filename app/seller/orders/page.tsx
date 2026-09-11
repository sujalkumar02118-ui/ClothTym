"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Order = {
  id: string;
  status?: string;
  total?: number;
  totalAmount?: number;
  createdAt?: string;
  customer?: {
    name?: string;
  };
};

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await fetch("/api/orders?mine=true", {
          cache: "no-store",
        });

        if (!response.ok) {
          setOrders([]);
          return;
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          setOrders(data);
        } else if (Array.isArray(data.orders)) {
          setOrders(data.orders);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error("SELLER ORDERS LOAD ERROR:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

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

          <Link
            href="/seller"
            className="rounded-xl border border-gray-300 px-4 py-2 font-bold hover:bg-gray-100"
          >
            ← Seller Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* TITLE */}
        <div className="mb-7">
          <p className="text-sm font-extrabold uppercase tracking-widest text-[#64748b]">
            Seller Panel
          </p>

          <h1 className="mt-1 text-3xl font-black text-[#07152f] sm:text-4xl">
            Orders
          </h1>

          <p className="mt-2 font-medium text-gray-600">
            Manage your customer orders from here.
          </p>
        </div>

        {/* STATS */}
        <div className="mb-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-gray-300 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-gray-500">Total Orders</p>
            <h2 className="mt-2 text-3xl font-black text-[#07152f]">
              {orders.length}
            </h2>
          </div>

          <div className="rounded-2xl border border-gray-300 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-gray-500">Pending</p>
            <h2 className="mt-2 text-3xl font-black text-[#07152f]">
              {
                orders.filter(
                  (order) =>
                    String(order.status).toUpperCase() === "PENDING"
                ).length
              }
            </h2>
          </div>

          <div className="rounded-2xl border border-gray-300 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-gray-500">Delivered</p>
            <h2 className="mt-2 text-3xl font-black text-[#07152f]">
              {
                orders.filter(
                  (order) =>
                    String(order.status).toUpperCase() === "DELIVERED"
                ).length
              }
            </h2>
          </div>

          <div className="rounded-2xl border border-gray-300 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-gray-500">Cancelled</p>
            <h2 className="mt-2 text-3xl font-black text-[#07152f]">
              {
                orders.filter(
                  (order) =>
                    String(order.status).toUpperCase() === "CANCELLED"
                ).length
              }
            </h2>
          </div>
        </div>

        {/* ORDERS */}
        <section className="rounded-2xl border border-gray-300 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5 sm:p-6">
            <h2 className="text-xl font-black text-[#111827]">
              All Orders
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center font-bold text-gray-500">
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="p-10 text-center sm:p-16">
              <div className="mb-4 text-5xl">📦</div>

              <h3 className="text-xl font-black text-[#111827]">
                No orders yet
              </h3>

              <p className="mt-2 text-gray-500">
                Customer orders will appear here.
              </p>

              <Link
                href="/seller/products"
                className="mt-6 inline-flex rounded-xl bg-[#07152f] px-5 py-3 font-bold text-white hover:bg-[#10244b]"
              >
                Manage Products
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                >
                  <div>
                    <p className="font-black text-[#07152f]">
                      Order #{order.id}
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-500">
                      {order.customer?.name || "Customer"}
                    </p>

                    {order.createdAt && (
                      <p className="mt-1 text-xs font-medium text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString(
                          "en-IN"
                        )}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-black text-[#07152f]">
                        ₹
                        {Number(
                          order.totalAmount ?? order.total ?? 0
                        ).toLocaleString("en-IN")}
                      </p>

                      <span className="mt-1 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-700">
                        {order.status || "PENDING"}
                      </span>
                    </div>

                    <Link
                      href={`/orders/${order.id}`}
                      className="rounded-xl bg-[#07152f] px-4 py-2 text-sm font-bold text-white hover:bg-[#10244b]"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
"use client";

import Link from "next/link";
import { useState } from "react";

export default function SellerSettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [returnUpdates, setReturnUpdates] = useState(true);

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
              className="rounded-xl border border-gray-300 px-4 py-2 font-bold transition hover:bg-gray-100"
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
      <main className="mx-auto max-w-[1100px] px-4 py-6 pb-24 sm:px-6 sm:py-8 lg:px-8 lg:pb-10">

        {/* TITLE */}
        <section className="mb-6">

          <p className="text-sm font-bold uppercase tracking-wider text-[#64748b]">
            Seller Panel
          </p>

          <h1 className="mt-1 text-3xl font-black text-[#07152f] sm:text-4xl">
            Settings
          </h1>

          <p className="mt-2 text-gray-600">
            Manage your seller panel preferences.
          </p>

        </section>


        {/* ACCOUNT */}
        <section className="mb-5 rounded-2xl border border-gray-300 bg-white shadow-sm">

          <div className="border-b border-gray-200 px-5 py-5 sm:px-6">

            <h2 className="text-xl font-black">
              Account
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage your seller account information.
            </p>

          </div>


          <div className="divide-y divide-gray-200">

            <div className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">

              <div>
                <p className="font-black">
                  Seller Account
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Your seller profile and account settings.
                </p>
              </div>

              <button
                type="button"
                className="w-fit rounded-xl border border-gray-300 px-4 py-2 font-bold transition hover:bg-gray-100"
              >
                Manage
              </button>

            </div>


            <div className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">

              <div>
                <p className="font-black">
                  Store Profile
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Update your store information.
                </p>
              </div>

              <button
                type="button"
                className="w-fit rounded-xl border border-gray-300 px-4 py-2 font-bold transition hover:bg-gray-100"
              >
                Edit Store
              </button>

            </div>

          </div>

        </section>


        {/* NOTIFICATIONS */}
        <section className="mb-5 rounded-2xl border border-gray-300 bg-white shadow-sm">

          <div className="border-b border-gray-200 px-5 py-5 sm:px-6">

            <h2 className="text-xl font-black">
              Notifications
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Choose which seller notifications you want to receive.
            </p>

          </div>


          <div className="divide-y divide-gray-200">

            {/* ALL */}
            <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6">

              <div>
                <p className="font-black">
                  Notifications
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Receive important seller notifications.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setNotifications(!notifications)
                }
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                  notifications
                    ? "bg-[#07152f]"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                    notifications
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>

            </div>


            {/* ORDERS */}
            <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6">

              <div>
                <p className="font-black">
                  Order Updates
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Get notified about new and updated orders.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOrderUpdates(!orderUpdates)
                }
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                  orderUpdates
                    ? "bg-[#07152f]"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                    orderUpdates
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>

            </div>


            {/* RETURNS */}
            <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6">

              <div>
                <p className="font-black">
                  Return Updates
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Get notified when a return request is created or updated.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setReturnUpdates(!returnUpdates)
                }
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                  returnUpdates
                    ? "bg-[#07152f]"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                    returnUpdates
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>

            </div>

          </div>

        </section>


        {/* SELLER NAVIGATION */}
        <section className="rounded-2xl border border-gray-300 bg-white p-5 shadow-sm sm:p-6">

          <h2 className="text-xl font-black">
            Seller Panel
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Quickly access your seller sections.
          </p>


          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

            <Link
              href="/seller/orders"
              className="rounded-xl border border-gray-300 p-4 text-center font-bold transition hover:bg-gray-50"
            >
              📦
              <span className="mt-1 block text-sm">
                Orders
              </span>
            </Link>

            <Link
              href="/seller/returns"
              className="rounded-xl border border-gray-300 p-4 text-center font-bold transition hover:bg-gray-50"
            >
              ↩️
              <span className="mt-1 block text-sm">
                Returns
              </span>
            </Link>

            <Link
              href="/seller/products"
              className="rounded-xl border border-gray-300 p-4 text-center font-bold transition hover:bg-gray-50"
            >
              👕
              <span className="mt-1 block text-sm">
                Products
              </span>
            </Link>

            <Link
              href="/seller/inventory"
              className="rounded-xl border border-gray-300 p-4 text-center font-bold transition hover:bg-gray-50"
            >
              📊
              <span className="mt-1 block text-sm">
                Inventory
              </span>
            </Link>

          </div>

        </section>

      </main>


      {/* MOBILE NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-300 bg-white lg:hidden">

        <div className="grid h-[68px] grid-cols-5">

          <Link
            href="/seller"
            className="flex flex-col items-center justify-center text-xs font-semibold text-gray-500"
          >
            <span className="text-xl">⌂</span>
            Home
          </Link>

          <Link
            href="/seller/orders"
            className="flex flex-col items-center justify-center text-xs font-semibold text-gray-500"
          >
            <span className="text-xl">▣</span>
            Orders
          </Link>

          <Link
            href="/seller/returns"
            className="flex flex-col items-center justify-center text-xs font-semibold text-gray-500"
          >
            <span className="text-xl">↩</span>
            Returns
          </Link>

          <Link
            href="/seller/inventory"
            className="flex flex-col items-center justify-center text-xs font-semibold text-gray-500"
          >
            <span className="text-xl">▤</span>
            Inventory
          </Link>

          <Link
            href="/seller/settings"
            className="flex flex-col items-center justify-center text-xs font-black text-[#07152f]"
          >
            <span className="text-xl">⚙</span>
            Settings
          </Link>

        </div>

      </nav>

    </div>
  );
}
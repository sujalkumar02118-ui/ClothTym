"use client";

import Link from "next/link";

export default function SellerPanel() {
  return (
    <div className="min-h-screen bg-[#f3f4f7] text-[#111827]">

      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">

          <Link
            href="/"
            className="text-2xl font-black text-[#07152f] sm:text-3xl"
          >
            ClothTym
          </Link>

          <div className="flex items-center gap-3">

            <Link
              href="/"
              className="hidden items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 font-bold text-[#111827] hover:bg-gray-100 sm:flex"
            >
              ← Shop
            </Link>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#07152f] font-black text-white">
              S
            </div>

          </div>
        </div>
      </header>


      {/* DESKTOP SIDEBAR */}
      <aside className="fixed bottom-0 left-0 top-[72px] hidden w-[240px] border-r border-gray-200 bg-white lg:block">

        <div className="p-5">

          <p className="mb-4 text-xs font-extrabold uppercase tracking-widest text-[#64748b]">
            SELLER PANEL
          </p>

          <nav className="space-y-2">

            {/* HOME */}
            <Link
              href="/seller"
              className="flex w-full items-center gap-3 rounded-xl bg-[#07152f] px-4 py-3 text-left font-bold text-white"
            >
              <span className="text-lg">⌂</span>
              Home
            </Link>


            {/* ORDERS */}
            <Link
              href="/seller/orders"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-bold text-[#172033] transition hover:bg-gray-100"
            >
              <span className="text-lg">▣</span>
              Orders
            </Link>


            {/* RETURNS */}
            <Link
              href="/seller/returns"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-bold text-[#172033] transition hover:bg-gray-100"
            >
              <span className="text-lg">↩</span>
              Returns
            </Link>


            {/* PRODUCTS */}
            <Link
              href="/seller/products"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-bold text-[#172033] transition hover:bg-gray-100"
            >
              <span className="text-lg">▤</span>
              Products
            </Link>


            {/* INVENTORY */}
            <Link
              href="/seller/inventory"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-bold text-[#172033] transition hover:bg-gray-100"
            >
              <span className="text-lg">▥</span>
              Inventory
            </Link>


            {/* SETTINGS */}
            <Link
              href="/seller/settings"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-bold text-[#172033] transition hover:bg-gray-100"
            >
              <span className="text-lg">⚙</span>
              Settings
            </Link>

          </nav>

        </div>

      </aside>


      {/* MAIN */}
      <main className="pb-24 lg:ml-[240px] lg:pb-10">

        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">


          {/* WELCOME */}
          <section className="mb-6 rounded-2xl bg-[#07152f] p-6 shadow-sm sm:p-7">

            <p className="text-sm font-bold uppercase tracking-wide text-[#b9c9ed]">
              Seller Dashboard
            </p>

            <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl lg:text-4xl">
              Welcome back, ClothTym Seller!
            </h1>

            <p className="mt-2 font-medium text-[#d7e0f4]">
              Manage and grow your fashion business
            </p>

          </section>


          {/* IMPORTANT UPDATE */}
          <section className="mb-7 rounded-2xl border border-[#eadb8a] bg-[#fff8d9] p-4 sm:p-5">

            <div className="flex gap-3">

              <div className="text-xl">
                📢
              </div>

              <div>

                <p className="font-extrabold text-[#3b3210]">
                  Important Update
                </p>

                <p className="mt-1 text-sm font-medium text-[#514a2d] sm:text-base">
                  Keep your inventory and product information updated
                  to provide the best experience to customers.
                </p>

              </div>

            </div>

          </section>


          {/* TO DO LIST */}
          <section>

            <h2 className="mb-4 text-xl font-black text-[#111827] sm:text-2xl">
              To do list
            </h2>

            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">


              {/* PENDING ORDERS */}
              <Link
                href="/seller/orders"
                className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-5"
              >

                <div className="flex items-start justify-between">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#f2d1a6] bg-[#fff0dd] text-xl">
                    📦
                  </div>

                  <span className="text-lg font-bold text-[#334155]">
                    →
                  </span>

                </div>

                <p className="mt-4 font-bold text-[#374151]">
                  Pending Orders
                </p>

                <h3 className="mt-1 text-3xl font-black text-[#07152f]">
                  0
                </h3>

              </Link>


              {/* DOWNLOAD LABELS */}
              <Link
                href="/seller/orders"
                className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-5"
              >

                <div className="flex items-start justify-between">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#bfd5fa] bg-[#e7f0ff] text-xl">
                    🏷️
                  </div>

                  <span className="text-lg font-bold text-[#334155]">
                    →
                  </span>

                </div>

                <p className="mt-4 font-bold text-[#374151]">
                  Download Labels
                </p>

                <h3 className="mt-1 text-3xl font-black text-[#07152f]">
                  0
                </h3>

              </Link>


              {/* OUT OF STOCK */}
              <Link
                href="/seller/inventory"
                className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-5"
              >

                <div className="flex items-start justify-between">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#f4c5ca] bg-[#ffe9eb] text-xl">
                    📋
                  </div>

                  <span className="text-lg font-bold text-[#334155]">
                    →
                  </span>

                </div>

                <p className="mt-4 font-bold text-[#374151]">
                  Out of Stock
                </p>

                <h3 className="mt-1 text-3xl font-black text-[#07152f]">
                  0
                </h3>

              </Link>


              {/* LOW STOCK */}
              <Link
                href="/seller/inventory"
                className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-5"
              >

                <div className="flex items-start justify-between">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#f1d19b] bg-[#fff1d9] text-xl">
                    ⚠️
                  </div>

                  <span className="text-lg font-bold text-[#334155]">
                    →
                  </span>

                </div>

                <p className="mt-4 font-bold text-[#374151]">
                  Low Stock
                </p>

                <h3 className="mt-1 text-3xl font-black text-[#07152f]">
                  0
                </h3>

              </Link>

            </div>

          </section>


          {/* GROW BUSINESS */}
          <section className="mt-8 rounded-2xl border border-gray-300 bg-white p-5 shadow-sm sm:p-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="text-xl font-black text-[#111827] sm:text-2xl">
                  Grow your business
                </h2>

                <p className="mt-1 font-medium text-[#4b5563]">
                  Improve your products to get more customer orders.
                </p>

              </div>

              <Link
                href="/seller/products"
                className="w-full rounded-xl bg-[#07152f] px-5 py-3 text-center font-bold text-white transition hover:bg-[#10244b] sm:w-auto"
              >
                View Suggestions
              </Link>

            </div>


            <div className="mt-5 rounded-xl border border-[#f3c8cc] bg-[#fff0f1] p-4">

              <p className="font-extrabold text-[#9f1d29]">
                ⚠ Improve your listings
              </p>

              <p className="mt-1 font-medium text-[#4b5563]">
                Add quality images, correct prices and complete product
                details to improve your visibility.
              </p>

            </div>

          </section>


          {/* BUSINESS INSIGHTS */}
          <section className="mt-8">

            <div className="mb-4 flex items-center justify-between">

              <h2 className="text-xl font-black text-[#111827] sm:text-2xl">
                Business Insights
              </h2>

              <span className="text-sm font-semibold text-[#475569]">
                Last 7 days
              </span>

            </div>


            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">


              {/* PRODUCT VIEWS */}
              <div className="rounded-2xl border border-gray-300 bg-white p-5 shadow-sm">

                <p className="font-bold text-[#475569]">
                  Product Views
                </p>

                <h3 className="mt-2 text-3xl font-black text-[#07152f]">
                  0
                </h3>

                <p className="mt-1 text-sm font-medium text-[#64748b]">
                  No data yet
                </p>

              </div>


              {/* ORDERS */}
              <Link
                href="/seller/orders"
                className="rounded-2xl border border-gray-300 bg-white p-5 shadow-sm transition hover:shadow-md"
              >

                <p className="font-bold text-[#475569]">
                  Orders
                </p>

                <h3 className="mt-2 text-3xl font-black text-[#07152f]">
                  0
                </h3>

                <p className="mt-1 text-sm font-medium text-[#64748b]">
                  No orders yet
                </p>

              </Link>


              {/* SALES */}
              <div className="rounded-2xl border border-gray-300 bg-white p-5 shadow-sm">

                <p className="font-bold text-[#475569]">
                  Sales
                </p>

                <h3 className="mt-2 text-3xl font-black text-[#07152f]">
                  ₹0
                </h3>

                <p className="mt-1 text-sm font-medium text-[#64748b]">
                  No sales yet
                </p>

              </div>

            </div>


            {/* SALES CHART */}
            <div className="mt-4 rounded-2xl border border-gray-300 bg-white p-5 shadow-sm sm:p-6">

              <div className="flex items-center justify-between">

                <h3 className="font-black text-[#111827]">
                  Sales Overview
                </h3>

                <span className="text-sm font-bold text-[#334155]">
                  ₹0
                </span>

              </div>


              <div className="mt-5 flex h-[230px] items-end gap-3 border-b border-l border-gray-300 px-3 sm:h-[280px] sm:gap-8">

                {[20, 35, 25, 48, 32, 55, 42].map(
                  (height, index) => (

                    <div
                      key={index}
                      className="flex h-full flex-1 items-end"
                    >

                      <div
                        className="w-full rounded-t-lg bg-[#07152f]"
                        style={{ height: `${height}%` }}
                      />

                    </div>

                  )
                )}

              </div>


              <div className="mt-3 flex justify-between text-xs font-semibold text-[#475569]">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>

            </div>

          </section>


          {/* QUICK ACTIONS */}
          <section className="mt-8">

            <h2 className="mb-4 text-xl font-black text-[#111827] sm:text-2xl">
              Quick Actions
            </h2>


            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">


              {/* ADD PRODUCT */}
              <Link
                href="/seller/upload"
                className="rounded-2xl border border-gray-300 bg-white p-5 text-left transition hover:-translate-y-1 hover:shadow-md"
              >

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#07152f] text-xl font-bold text-white">
                  +
                </div>

                <h3 className="mt-3 font-black text-[#111827]">
                  Add Product
                </h3>

                <p className="mt-1 text-sm font-medium text-[#4b5563]">
                  List a new fashion product
                </p>

              </Link>


              {/* MANAGE ORDERS */}
              <Link
                href="/seller/orders"
                className="rounded-2xl border border-gray-300 bg-white p-5 text-left transition hover:-translate-y-1 hover:shadow-md"
              >

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#07152f] text-xl text-white">
                  📦
                </div>

                <h3 className="mt-3 font-black text-[#111827]">
                  Manage Orders
                </h3>

                <p className="mt-1 text-sm font-medium text-[#4b5563]">
                  Check your latest orders
                </p>

              </Link>


              {/* STORE PROFILE */}
              <Link
                href="/seller/settings"
                className="rounded-2xl border border-gray-300 bg-white p-5 text-left transition hover:-translate-y-1 hover:shadow-md"
              >

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#07152f] text-xl text-white">
                  🏪
                </div>

                <h3 className="mt-3 font-black text-[#111827]">
                  Store Profile
                </h3>

                <p className="mt-1 text-sm font-medium text-[#4b5563]">
                  Update your store information
                </p>

              </Link>


              {/* EARNINGS */}
              <Link
                href="/seller/orders"
                className="rounded-2xl border border-gray-300 bg-white p-5 text-left transition hover:-translate-y-1 hover:shadow-md"
              >

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#07152f] text-xl text-white">
                  ₹
                </div>

                <h3 className="mt-3 font-black text-[#111827]">
                  Earnings
                </h3>

                <p className="mt-1 text-sm font-medium text-[#4b5563]">
                  View your earnings
                </p>

              </Link>

            </div>

          </section>

        </div>

      </main>


      {/* MOBILE BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-300 bg-white lg:hidden">

        <div className="grid h-[68px] grid-cols-5">

          <Link
            href="/seller"
            className="flex flex-col items-center justify-center text-xs font-black text-[#07152f]"
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
            href="/seller/products"
            className="flex flex-col items-center justify-center text-xs font-semibold text-[#07152f]"
          >
            <span className="text-xl">▤</span>
            Products
          </Link>


          <Link
            href="/seller/upload"
            className="flex flex-col items-center justify-center text-xs font-semibold text-[#475569]"
          >
            <span className="text-xl">＋</span>
            Add Product
          </Link>


          <Link
            href="/seller/settings"
            className="flex flex-col items-center justify-center text-xs font-semibold text-[#475569]"
          >
            <span className="text-xl">☰</span>
            Menu
          </Link>

        </div>

      </nav>

    </div>
  );
}
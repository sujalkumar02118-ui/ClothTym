"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  category?: {
    name: string;
  };
};

export default function SellerInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInventory() {
      try {
        const response = await fetch("/api/products", {
          cache: "no-store",
        });

        const data = await response.json();

        if (
          data.success &&
          Array.isArray(data.products)
        ) {
          setProducts(data.products);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("INVENTORY LOAD ERROR:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    loadInventory();
  }, []);

  const totalProducts = products.length;

  const outOfStock = products.filter(
    (product) => product.stock <= 0
  ).length;

  const lowStock = products.filter(
    (product) =>
      product.stock > 0 && product.stock <= 5
  ).length;

  const inStock = products.filter(
    (product) => product.stock > 5
  ).length;

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
              className="rounded-xl border border-gray-300 px-4 py-2 font-bold hover:bg-gray-100"
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
      <main className="mx-auto max-w-[1500px] px-4 py-6 pb-24 sm:px-6 sm:py-8 lg:px-8 lg:pb-10">

        {/* TITLE */}
        <section className="mb-6">

          <p className="text-sm font-bold uppercase tracking-wider text-[#64748b]">
            Seller Panel
          </p>

          <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <h1 className="text-3xl font-black text-[#07152f] sm:text-4xl">
                Inventory
              </h1>

              <p className="mt-2 text-gray-600">
                Monitor your product stock and inventory levels.
              </p>

            </div>

            <Link
              href="/seller/upload"
              className="inline-flex w-fit rounded-xl bg-[#07152f] px-5 py-3 font-bold text-white hover:bg-[#10244b]"
            >
              + Add Product
            </Link>

          </div>

        </section>


        {/* SUMMARY */}
        <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">

          <div className="rounded-2xl border border-gray-300 bg-white p-5 shadow-sm">

            <p className="text-sm font-bold text-gray-500">
              Total Products
            </p>

            <h2 className="mt-2 text-3xl font-black text-[#07152f]">
              {loading ? "—" : totalProducts}
            </h2>

          </div>


          <div className="rounded-2xl border border-gray-300 bg-white p-5 shadow-sm">

            <p className="text-sm font-bold text-gray-500">
              In Stock
            </p>

            <h2 className="mt-2 text-3xl font-black text-green-600">
              {loading ? "—" : inStock}
            </h2>

          </div>


          <div className="rounded-2xl border border-gray-300 bg-white p-5 shadow-sm">

            <p className="text-sm font-bold text-gray-500">
              Low Stock
            </p>

            <h2 className="mt-2 text-3xl font-black text-yellow-600">
              {loading ? "—" : lowStock}
            </h2>

          </div>


          <div className="rounded-2xl border border-gray-300 bg-white p-5 shadow-sm">

            <p className="text-sm font-bold text-gray-500">
              Out of Stock
            </p>

            <h2 className="mt-2 text-3xl font-black text-red-600">
              {loading ? "—" : outOfStock}
            </h2>

          </div>

        </section>


        {/* INVENTORY */}
        <section className="overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm">

          <div className="border-b border-gray-200 px-5 py-5 sm:px-6">

            <h2 className="text-xl font-black">
              Product Inventory
            </h2>

            <p className="mt-1 text-sm font-medium text-gray-500">
              Current stock status of your products.
            </p>

          </div>


          {/* LOADING */}
          {loading && (
            <div className="space-y-4 p-5">

              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-xl border border-gray-200 p-4"
                >

                  <div className="flex gap-4">

                    <div className="h-20 w-20 rounded-xl bg-gray-200" />

                    <div className="flex-1">

                      <div className="h-5 w-1/2 rounded bg-gray-200" />

                      <div className="mt-3 h-4 w-1/3 rounded bg-gray-200" />

                      <div className="mt-3 h-4 w-1/4 rounded bg-gray-200" />

                    </div>

                  </div>

                </div>
              ))}

            </div>
          )}


          {/* EMPTY */}
          {!loading && products.length === 0 && (
            <div className="px-6 py-20 text-center">

              <div className="mb-4 text-6xl">
                📦
              </div>

              <h3 className="text-xl font-black">
                No products found
              </h3>

              <p className="mt-2 text-gray-500">
                Add your first product to start managing inventory.
              </p>

              <Link
                href="/seller/upload"
                className="mt-5 inline-flex rounded-xl bg-[#07152f] px-5 py-3 font-bold text-white"
              >
                Add Product
              </Link>

            </div>
          )}


          {/* PRODUCT LIST */}
          {!loading && products.length > 0 && (
            <div className="divide-y divide-gray-200">

              {products.map((product) => {

                const status =
                  product.stock <= 0
                    ? "OUT OF STOCK"
                    : product.stock <= 5
                      ? "LOW STOCK"
                      : "IN STOCK";

                const statusClass =
                  product.stock <= 0
                    ? "bg-red-100 text-red-700"
                    : product.stock <= 5
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700";

                return (
                  <div
                    key={product.id}
                    className="p-5 transition hover:bg-gray-50 sm:p-6"
                  >

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                      {/* IMAGE */}
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">

                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-3xl">
                            👕
                          </div>
                        )}

                      </div>


                      {/* PRODUCT INFO */}
                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="truncate font-black text-[#111827]">
                            {product.name}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${statusClass}`}
                          >
                            {status}
                          </span>

                        </div>


                        {product.category?.name && (
                          <p className="mt-1 text-sm font-semibold text-gray-500">
                            {product.category.name}
                          </p>
                        )}


                        <p className="mt-2 text-sm font-bold text-[#07152f]">
                          ₹{product.price.toLocaleString("en-IN")}
                        </p>

                      </div>


                      {/* STOCK */}
                      <div className="sm:text-right">

                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                          Available Stock
                        </p>

                        <p
                          className={`mt-1 text-2xl font-black ${
                            product.stock <= 0
                              ? "text-red-600"
                              : product.stock <= 5
                                ? "text-yellow-600"
                                : "text-[#07152f]"
                          }`}
                        >
                          {product.stock}
                        </p>

                        <p className="text-xs font-semibold text-gray-400">
                          units
                        </p>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </section>

      </main>


      {/* MOBILE NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-300 bg-white lg:hidden">

        <div className="grid h-[68px] grid-cols-4">

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
            className="flex flex-col items-center justify-center text-xs font-black text-[#07152f]"
          >
            <span className="text-xl">▤</span>
            Inventory
          </Link>

        </div>

      </nav>

    </div>
  );
}
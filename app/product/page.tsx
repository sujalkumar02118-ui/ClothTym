"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  image?: string;
  images?: string | string[];
  category?: {
    id?: string;
    name?: string;
  } | null;
};

export default function ProductPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/products", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || "Products could not be loaded"
          );
        }

        if (Array.isArray(data)) {
          setProducts(data);
        } else if (Array.isArray(data?.products)) {
          setProducts(data.products);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("ALL PRODUCTS ERROR:", err);
        setError("Products could not be loaded.");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#111827]">

      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">

          <Link
            href="/"
            className="flex items-center gap-2 font-black text-[#07152f]"
          >
            <span className="text-2xl">←</span>
            Home
          </Link>

          <Link
            href="/"
            className="text-xl font-black tracking-wide text-[#07152f]"
          >
            CLOTHTYM
          </Link>

          <Link
            href="/cart"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f5f9]"
          >
            🛒
          </Link>

        </div>
      </header>

      {/* MAIN */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">

        {/* TITLE */}
        <div className="mb-8">

          <p className="text-sm font-black uppercase tracking-wider text-gray-500">
            CLOTHTYM FASHION
          </p>

          <h1 className="mt-2 text-3xl font-black text-[#07152f] sm:text-4xl">
            All Products
          </h1>

          <p className="mt-2 text-gray-500">
            Explore all products from our sellers.
          </p>

        </div>

        {/* LOADING */}
        {loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">

            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
              >

                <div className="aspect-[4/5] animate-pulse bg-gray-200" />

                <div className="space-y-3 p-4">

                  <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />

                  <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />

                  <div className="h-4 w-full animate-pulse rounded bg-gray-200" />

                  <div className="h-6 w-1/3 animate-pulse rounded bg-gray-200" />

                </div>

              </div>
            ))}

          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="rounded-3xl border-2 border-red-200 bg-white p-10 text-center">

            <div className="text-5xl">⚠️</div>

            <h2 className="mt-4 text-2xl font-black text-gray-900">
              Something went wrong
            </h2>

            <p className="mt-2 text-gray-500">
              {error}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-[#07152f] px-6 py-3 font-black text-white"
            >
              Try Again
            </button>

          </div>
        )}

        {/* NO PRODUCTS */}
        {!loading && !error && products.length === 0 && (
          <div className="rounded-3xl border-2 border-gray-200 bg-white p-10 text-center">

            <div className="text-6xl">🛍️</div>

            <h2 className="mt-4 text-2xl font-black text-gray-900">
              No products found
            </h2>

            <p className="mt-2 text-gray-500">
              There are currently no products available.
            </p>

            <Link
              href="/"
              className="mt-6 inline-block rounded-xl bg-[#07152f] px-6 py-3 font-black text-white"
            >
              Go Home
            </Link>

          </div>
        )}

        {/* ALL PRODUCTS */}
        {!loading && !error && products.length > 0 && (
          <>

            <div className="mb-5 text-sm font-bold text-gray-500">
              {products.length} products available
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">

              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-xl"
                >

                  {/* IMAGE */}
                  <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">

                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-6xl">
                        👕
                      </div>
                    )}

                    <span className="absolute left-3 top-3 rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                      LIVE
                    </span>

                  </div>

                  {/* DETAILS */}
                  <div className="p-4">

                    {product.category?.name && (
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                        {product.category.name}
                      </p>
                    )}

                    <h2 className="mt-1 line-clamp-1 text-lg font-black text-gray-900">
                      {product.name}
                    </h2>

                    {product.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                        {product.description}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between">

                      <p className="text-xl font-black text-[#07152f]">
                        ₹{product.price.toLocaleString("en-IN")}
                      </p>

                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#07152f] text-white transition group-hover:scale-110">
                        →
                      </span>

                    </div>

                  </div>

                </Link>
              ))}

            </div>

          </>
        )}

      </div>

    </main>
  );
}
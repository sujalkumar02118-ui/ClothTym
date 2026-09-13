"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type WishlistProduct = {
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
  seller?: {
    id: string;
    shopName: string;
    approved: boolean;
  } | null;
};

type WishlistItem = {
  id: string;
  productId: string;
  createdAt: string;
  product: WishlistProduct;
};

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function loadWishlist() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/wishlist", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href =
            "/login?callbackUrl=/wishlist";
          return;
        }

        throw new Error(
          data?.error || "Wishlist could not be loaded."
        );
      }

      setWishlist(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("WISHLIST LOAD ERROR:", err);
      setError("Wishlist could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWishlist();
  }, []);

  async function removeFromWishlist(productId: string) {
    try {
      setRemovingId(productId);

      const response = await fetch("/api/wishlist", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Could not remove product."
        );
      }

      setWishlist((current) =>
        current.filter(
          (item) => item.productId !== productId
        )
      );
    } catch (err) {
      console.error("WISHLIST REMOVE ERROR:", err);
      setError("Product could not be removed from wishlist.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#111827]">

      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">

          <Link
            href="/profile"
            className="flex items-center gap-2 font-black text-[#07152f]"
          >
            <span className="text-2xl">←</span>
            Profile
          </Link>

          <Link
            href="/"
            className="text-xl font-black tracking-wide text-[#07152f]"
          >
            CLOTHTYM
          </Link>

          <Link
            href="/cart"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f5f9] text-lg"
            aria-label="Cart"
          >
            🛒
          </Link>

        </div>
      </header>

      {/* MAIN */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">

        {/* TITLE */}
        <div className="mb-8">

          <p className="text-sm font-black uppercase tracking-[0.18em] text-gray-400">
            CLOTHTYM COLLECTION
          </p>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">

            <div>
              <h1 className="text-3xl font-black tracking-tight text-[#07152f] sm:text-4xl">
                My Wishlist
              </h1>

              <p className="mt-2 text-gray-500">
                Your saved fashion, all in one place.
              </p>
            </div>

            {!loading && wishlist.length > 0 && (
              <div className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#07152f] shadow-sm ring-1 ring-gray-200">
                {wishlist.length}{" "}
                {wishlist.length === 1
                  ? "item"
                  : "items"}
              </div>
            )}

          </div>

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
          <div className="rounded-3xl border border-red-200 bg-white p-10 text-center">

            <div className="text-5xl">⚠️</div>

            <h2 className="mt-4 text-2xl font-black text-gray-900">
              Something went wrong
            </h2>

            <p className="mt-2 text-gray-500">
              {error}
            </p>

            <button
              type="button"
              onClick={loadWishlist}
              className="mt-6 rounded-xl bg-[#07152f] px-6 py-3 font-black text-white transition hover:opacity-90"
            >
              Try Again
            </button>

          </div>
        )}

        {/* EMPTY WISHLIST */}
        {!loading && !error && wishlist.length === 0 && (
          <div className="rounded-3xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">

            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#f1f5f9] text-5xl">
              ♡
            </div>

            <h2 className="mt-6 text-2xl font-black text-[#07152f] sm:text-3xl">
              Your wishlist is empty
            </h2>

            <p className="mx-auto mt-3 max-w-md text-gray-500">
              Save the styles you love and find them here whenever
              you want.
            </p>

            <Link
              href="/product"
              className="mt-7 inline-flex rounded-xl bg-[#07152f] px-7 py-3.5 font-black text-white transition hover:opacity-90"
            >
              Explore Products
            </Link>

          </div>
        )}

        {/* WISHLIST PRODUCTS */}
        {!loading && !error && wishlist.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">

            {wishlist.map((item) => {
              const product = item.product;

              return (
                <div
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-xl"
                >

                  {/* IMAGE */}
                  <Link
                    href={`/product/${product.id}`}
                    className="block"
                  >
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

                      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-[#07152f] shadow-sm">
                        SAVED
                      </span>

                      {/* REMOVE */}
                      <button
                        type="button"
                        aria-label={`Remove ${product.name} from wishlist`}
                        disabled={
                          removingId === product.id
                        }
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          removeFromWishlist(product.id);
                        }}
                        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-xl text-red-500 shadow-sm transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {removingId === product.id
                          ? "..."
                          : "♥"}
                      </button>

                    </div>
                  </Link>

                  {/* DETAILS */}
                  <div className="p-4">

                    {product.category?.name && (
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                        {product.category.name}
                      </p>
                    )}

                    <Link
                      href={`/product/${product.id}`}
                      className="block"
                    >
                      <h2 className="mt-1 line-clamp-1 text-lg font-black text-gray-900 transition group-hover:text-[#07152f]">
                        {product.name}
                      </h2>
                    </Link>

                    {product.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                        {product.description}
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-between gap-2">

                      <p className="text-xl font-black text-[#07152f]">
                        ₹
                        {product.price.toLocaleString(
                          "en-IN"
                        )}
                      </p>

                      {product.stock > 0 ? (
                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-black text-green-700">
                          In stock
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-red-600">
                          Out of stock
                        </span>
                      )}

                    </div>

                    <Link
                      href={`/product/${product.id}`}
                      className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#07152f] px-4 py-3 text-sm font-black text-white transition hover:opacity-90"
                    >
                      View Product
                    </Link>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>

    </main>
  );
}
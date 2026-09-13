"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

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

type WishlistItem = {
  productId: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  Men: "Men",
  Women: "Women",
  Kids: "Kids",
  Footwear: "Footwear",
  Accessories: "Accessories",
};

export default function ProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search =
    searchParams.get("search")?.trim() || "";

  const category =
    searchParams.get("category")?.trim() || "";

  const validCategory =
    CATEGORY_LABELS[category]
      ? category
      : "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Wishlist
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(
    new Set()
  );

  const [wishlistLoading, setWishlistLoading] = useState<
    string | null
  >(null);

  /* =========================================================
     LOAD PRODUCTS
     SEARCH + CATEGORY
  ========================================================= */

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();

        if (search) {
          params.set("search", search);
        }

        if (validCategory) {
          params.set("category", validCategory);
        }

        const queryString = params.toString();

        const url = queryString
          ? `/api/products?${queryString}`
          : "/api/products";

        const response = await fetch(url, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              data?.message ||
              "Products could not be loaded"
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
        console.error(
          "PRODUCT LOAD ERROR:",
          err
        );

        setError(
          "Products could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [search, validCategory]);

  /* =========================================================
     LOAD CURRENT USER WISHLIST
  ========================================================= */

  useEffect(() => {
    async function loadWishlist() {
      try {
        const response = await fetch(
          "/api/wishlist",
          {
            cache: "no-store",
          }
        );

        if (response.status === 401) {
          setWishlistIds(new Set());
          return;
        }

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        if (!Array.isArray(data)) {
          return;
        }

        const ids = new Set(
          data
            .map(
              (item: WishlistItem) =>
                item.productId
            )
            .filter(Boolean)
        );

        setWishlistIds(ids);
      } catch (err) {
        console.error(
          "PRODUCT LIST WISHLIST ERROR:",
          err
        );
      }
    }

    loadWishlist();
  }, []);

  /* =========================================================
     ADD / REMOVE WISHLIST
  ========================================================= */

  const toggleWishlist = async (
    event: React.MouseEvent<HTMLButtonElement>,
    productId: string
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (
      wishlistLoading === productId
    ) {
      return;
    }

    const alreadyWishlisted =
      wishlistIds.has(productId);

    try {
      setWishlistLoading(productId);

      const response = await fetch(
        "/api/wishlist",
        {
          method: alreadyWishlisted
            ? "DELETE"
            : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            productId,
          }),
        }
      );

      let data: {
        success?: boolean;
        message?: string;
        error?: string;
      } = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      if (response.status === 401) {
        const params =
          new URLSearchParams();

        if (search) {
          params.set(
            "search",
            search
          );
        }

        if (validCategory) {
          params.set(
            "category",
            validCategory
          );
        }

        const currentPage =
          params.toString()
            ? `/product?${params.toString()}`
            : "/product";

        router.push(
          `/login?callbackUrl=${encodeURIComponent(
            currentPage
          )}`
        );

        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Wishlist could not be updated."
        );
      }

      setWishlistIds(
        (previous) => {
          const updated =
            new Set(previous);

          if (
            alreadyWishlisted
          ) {
            updated.delete(
              productId
            );
          } else {
            updated.add(
              productId
            );
          }

          return updated;
        }
      );
    } catch (err) {
      console.error(
        "WISHLIST TOGGLE ERROR:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "Wishlist could not be updated."
      );
    } finally {
      setWishlistLoading(null);
    }
  };

  /* =========================================================
     CLEAR SEARCH
  ========================================================= */

  const clearSearch = () => {
    if (validCategory) {
      router.push(
        `/product?category=${encodeURIComponent(
          validCategory
        )}`
      );
    } else {
      router.push("/product");
    }
  };

  /* =========================================================
     CLEAR CATEGORY
  ========================================================= */

  const clearCategory = () => {
    if (search) {
      router.push(
        `/product?search=${encodeURIComponent(
          search
        )}`
      );
    } else {
      router.push("/product");
    }
  };

  /* =========================================================
     VIEW ALL
  ========================================================= */

  const viewAllProducts = () => {
    router.push("/product");
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#111827]">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">

          <Link
            href="/"
            className="flex items-center gap-2 font-black text-[#07152f]"
          >
            <span className="text-2xl">
              ←
            </span>

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

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">

        {/* ===================================================
            TITLE
        =================================================== */}

        <div className="mb-8">

          <p className="text-sm font-black uppercase tracking-wider text-gray-500">
            CLOTHTYM FASHION
          </p>

          {/* CATEGORY + SEARCH */}

          {validCategory && search ? (
            <>
              <h1 className="mt-2 text-3xl font-black text-[#07152f] sm:text-4xl">
                {validCategory} Search Results
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3">

                <span className="rounded-full bg-[#07152f] px-4 py-2 text-sm font-black text-white">
                  {validCategory}
                </span>

                <span className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700">
                  “{search}”
                </span>

                <button
                  type="button"
                  onClick={clearCategory}
                  className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-100"
                >
                  Clear Category
                </button>

                <button
                  type="button"
                  onClick={clearSearch}
                  className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-100"
                >
                  Clear Search
                </button>

              </div>

              <p className="mt-3 text-gray-500">
                Showing {validCategory.toLowerCase()} products matching your search.
              </p>
            </>
          ) : validCategory ? (
            <>
              <h1 className="mt-2 text-3xl font-black text-[#07152f] sm:text-4xl">
                {validCategory}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3">

                <span className="rounded-full bg-[#07152f] px-4 py-2 text-sm font-black text-white">
                  {validCategory}
                </span>

                <button
                  type="button"
                  onClick={clearCategory}
                  className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-100"
                >
                  Clear Category
                </button>

              </div>

              <p className="mt-3 text-gray-500">
                Explore all {validCategory.toLowerCase()} products from our sellers.
              </p>
            </>
          ) : search ? (
            <>
              <h1 className="mt-2 text-3xl font-black text-[#07152f] sm:text-4xl">
                Search Results
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-3">

                <span className="rounded-full bg-[#07152f] px-4 py-2 text-sm font-black text-white">
                  “{search}”
                </span>

                <button
                  type="button"
                  onClick={clearSearch}
                  className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-100"
                >
                  Clear Search
                </button>

              </div>

              <p className="mt-3 text-gray-500">
                Smart results matched to your search.
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-2 text-3xl font-black text-[#07152f] sm:text-4xl">
                All Products
              </h1>

              <p className="mt-2 text-gray-500">
                Explore all products from our sellers.
              </p>
            </>
          )}

        </div>

        {/* ===================================================
            LOADING
        =================================================== */}

        {loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">

            {Array.from({
              length: 8,
            }).map((_, index) => (
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

        {/* ===================================================
            ERROR
        =================================================== */}

        {!loading && error && (
          <div className="rounded-3xl border-2 border-red-200 bg-white p-10 text-center">

            <div className="text-5xl">
              ⚠️
            </div>

            <h2 className="mt-4 text-2xl font-black text-gray-900">
              Something went wrong
            </h2>

            <p className="mt-2 text-gray-500">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="mt-6 rounded-xl bg-[#07152f] px-6 py-3 font-black text-white"
            >
              Try Again
            </button>

          </div>
        )}

        {/* ===================================================
            NO PRODUCTS
        =================================================== */}

        {!loading &&
          !error &&
          products.length === 0 && (
            <div className="rounded-3xl border-2 border-gray-200 bg-white p-10 text-center">

              <div className="text-6xl">
                🔎
              </div>

              <h2 className="mt-4 text-2xl font-black text-gray-900">
                {validCategory
                  ? search
                    ? `No ${validCategory.toLowerCase()} products found`
                    : `No ${validCategory.toLowerCase()} products found`
                  : search
                  ? "No matching products found"
                  : "No products found"}
              </h2>

              <p className="mt-2 text-gray-500">
                {validCategory && search
                  ? `We couldn't find ${validCategory.toLowerCase()} products matching “${search}”.`
                  : validCategory
                  ? `There are currently no ${validCategory.toLowerCase()} products available.`
                  : search
                  ? `We couldn't find products matching “${search}”.`
                  : "There are currently no products available."}
              </p>

              {validCategory ? (
                <button
                  type="button"
                  onClick={search ? clearCategory : viewAllProducts}
                  className="mt-6 rounded-xl bg-[#07152f] px-6 py-3 font-black text-white"
                >
                  {search
                    ? "View Category Products"
                    : "View All Products"}
                </button>
              ) : search ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="mt-6 rounded-xl bg-[#07152f] px-6 py-3 font-black text-white"
                >
                  View All Products
                </button>
              ) : (
                <Link
                  href="/"
                  className="mt-6 inline-block rounded-xl bg-[#07152f] px-6 py-3 font-black text-white"
                >
                  Go Home
                </Link>
              )}

            </div>
          )}

        {/* ===================================================
            PRODUCTS
        =================================================== */}

        {!loading &&
          !error &&
          products.length > 0 && (
            <>

              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-gray-500">

                <span>
                  {products.length}{" "}
                  {products.length === 1
                    ? "product"
                    : "products"}{" "}
                  available
                </span>

                <div className="flex flex-wrap gap-2">

                  {validCategory && (
                    <span className="rounded-full bg-gray-100 px-3 py-1">
                      {validCategory}
                    </span>
                  )}

                  {search && (
                    <span className="rounded-full bg-gray-100 px-3 py-1">
                      Search: “{search}”
                    </span>
                  )}

                </div>

              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">

                {products.map(
                  (product) => {

                    const isWishlisted =
                      wishlistIds.has(
                        product.id
                      );

                    const isLoading =
                      wishlistLoading ===
                      product.id;

                    return (
                      <Link
                        key={
                          product.id
                        }
                        href={`/product/${product.id}`}
                        className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-xl"
                      >

                        {/* IMAGE */}

                        <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">

                          {product.image ? (
                            <img
                              src={
                                product.image
                              }
                              alt={
                                product.name
                              }
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

                          <button
                            type="button"
                            onClick={(
                              event
                            ) =>
                              toggleWishlist(
                                event,
                                product.id
                              )
                            }
                            disabled={
                              isLoading
                            }
                            aria-label={
                              isWishlisted
                                ? "Remove from wishlist"
                                : "Add to wishlist"
                            }
                            className={`absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-xl shadow-md transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60 ${
                              isWishlisted
                                ? "text-red-500"
                                : "text-gray-700"
                            }`}
                          >
                            {isLoading
                              ? "..."
                              : isWishlisted
                              ? "♥"
                              : "♡"}
                          </button>

                        </div>

                        {/* PRODUCT INFO */}

                        <div className="p-4">

                          {product
                            .category
                            ?.name && (
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                              {
                                product
                                  .category
                                  .name
                              }
                            </p>
                          )}

                          <h2 className="mt-1 line-clamp-1 text-lg font-black text-gray-900">
                            {
                              product.name
                            }
                          </h2>

                          {product.description && (
                            <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                              {
                                product.description
                              }
                            </p>
                          )}

                          <div className="mt-3 flex items-center justify-between">

                            <p className="text-xl font-black text-[#07152f]">
                              ₹
                              {Number(
                                product.price
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </p>

                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#07152f] text-white transition group-hover:scale-110">
                              →
                            </span>

                          </div>

                        </div>

                      </Link>
                    );
                  }
                )}

              </div>

            </>
          )}

      </div>
    </main>
  );
}
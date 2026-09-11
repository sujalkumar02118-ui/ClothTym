"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;

  averageRating?: number;
  reviewCount?: number;

  category?: {
    name: string;
  };
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
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
        console.error("PRODUCT LOAD ERROR:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="mb-7 flex items-end justify-between gap-4">

          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#64748b]">
              Latest Collection
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#07152f] sm:text-3xl lg:text-4xl">
              Latest Products
            </h2>

            <p className="mt-2 text-gray-600">
              Discover the latest fashion from our sellers.
            </p>
          </div>

          {products.length > 0 && (
            <span className="hidden text-sm font-bold text-[#475569] sm:block">
              {products.length} Products
            </span>
          )}

        </div>

        {/* LOADING */}
        {loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">

            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white"
              >
                <div className="aspect-[4/5] bg-gray-200" />

                <div className="p-4">
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="mt-3 h-4 w-1/2 rounded bg-gray-200" />
                  <div className="mt-4 h-6 w-1/3 rounded bg-gray-200" />
                </div>
              </div>
            ))}

          </div>
        )}

        {/* PRODUCTS */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">

            {products.map((product) => (

              <Link
                href={`/product/${product.id}`}
                key={product.id}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >

                {/* IMAGE */}
                <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">

                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <div className="text-center">
                        <div className="mb-2 text-5xl">
                          👕
                        </div>

                        <p className="text-sm font-bold text-gray-400">
                          No Image
                        </p>
                      </div>
                    </div>
                  )}

                  {/* LIVE */}
                  <span className="absolute left-3 top-3 rounded-full bg-green-100 px-2.5 py-1 text-xs font-black text-green-700">
                    LIVE
                  </span>

                  {/* STOCK */}
                  {product.stock <= 0 && (
                    <span className="absolute right-3 top-3 rounded-full bg-red-100 px-2.5 py-1 text-xs font-black text-red-700">
                      OUT OF STOCK
                    </span>
                  )}

                </div>

                {/* DETAILS */}
                <div className="p-4">

                  {/* CATEGORY */}
                  {product.category?.name && (
                    <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#64748b]">
                      {product.category.name}
                    </p>
                  )}

                  {/* NAME */}
                  <h3 className="line-clamp-1 text-base font-black text-[#111827] sm:text-lg">
                    {product.name}
                  </h3>

                  {/* DESCRIPTION */}
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                    {product.description}
                  </p>

                  {/* RATING */}
                  <div className="mt-3 flex items-center gap-2">

                    {product.reviewCount &&
                    product.reviewCount > 0 ? (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2 py-1 text-xs font-black text-white">
                          ⭐ {product.averageRating?.toFixed(1)}
                        </span>

                        <span className="text-xs font-semibold text-gray-500">
                          {product.reviewCount}{" "}
                          {product.reviewCount === 1
                            ? "review"
                            : "reviews"}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-gray-400">
                        No ratings yet
                      </span>
                    )}

                  </div>

                  {/* PRICE + ARROW */}
                  <div className="mt-4 flex items-center justify-between">

                    <p className="text-xl font-black text-[#07152f] sm:text-2xl">
                      ₹
                      {product.price.toLocaleString(
                        "en-IN"
                      )}
                    </p>

                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#07152f] font-bold text-white transition group-hover:bg-[#10244b]">
                      →
                    </span>

                  </div>

                </div>

              </Link>

            ))}

          </div>
        )}

        {/* NO PRODUCTS */}
        {!loading && products.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-16 text-center">

            <div className="mb-4 text-5xl">
              🛍️
            </div>

            <h3 className="text-xl font-black text-[#111827]">
              No products available yet
            </h3>

            <p className="mt-2 text-gray-500">
              New products from our sellers will appear here.
            </p>

          </div>
        )}

      </div>
    </section>
  );
}
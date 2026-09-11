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
  createdAt: string;
  category?: {
    id: string;
    name: string;
  } | null;
  seller?: {
    id: string;
    shopName: string;
  } | null;
};

export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  /* =====================================================
     LOAD PRODUCTS
  ===================================================== */

  const loadProducts = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/products", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Products could not be loaded"
        );
      }

      setProducts(data.products || []);
    } catch (error) {
      console.error("LOAD PRODUCTS ERROR:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Products could not be loaded"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  /* =====================================================
     DELETE PRODUCT
  ===================================================== */

  const deleteProduct = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setMessage("");

      const response = await fetch(
        `/api/products?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Product could not be deleted"
        );
      }

      /* Remove immediately from screen */
      setProducts((previous) =>
        previous.filter((product) => product.id !== id)
      );

      setMessage("Product deleted successfully.");
    } catch (error) {
      console.error("DELETE PRODUCT ERROR:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Product could not be deleted"
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main className="min-h-screen bg-[#f3f4f7] text-[#111827]">

      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">

        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">

          <div className="flex items-center gap-3">

            <Link
              href="/seller"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-300 bg-white text-xl font-black hover:bg-gray-100"
            >
              ←
            </Link>

            <div>

              <h1 className="text-xl font-black text-[#07152f] sm:text-2xl">
                My Products
              </h1>

              <p className="text-xs font-semibold text-gray-500 sm:text-sm">
                Manage your published products
              </p>

            </div>

          </div>

          <Link
            href="/seller/upload"
            className="rounded-xl bg-[#07152f] px-4 py-3 text-sm font-black text-white hover:bg-[#10244b] sm:px-5"
          >
            + Add Product
          </Link>

        </div>

      </header>


      {/* CONTENT */}
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">


        {/* TOP BAR */}
        <section className="mb-6 rounded-2xl border border-gray-300 bg-white p-5 shadow-sm sm:p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-sm font-bold uppercase tracking-wide text-gray-500">
                Seller Inventory
              </p>

              <h2 className="mt-1 text-2xl font-black text-[#07152f] sm:text-3xl">
                My Products
              </h2>

              <p className="mt-1 font-medium text-gray-500">
                {products.length}{" "}
                {products.length === 1
                  ? "product"
                  : "products"}{" "}
                published
              </p>

            </div>

            <button
              onClick={loadProducts}
              disabled={loading}
              className="rounded-xl border-2 border-[#07152f] bg-white px-5 py-3 font-black text-[#07152f] hover:bg-gray-100 disabled:opacity-50"
            >
              ↻ Refresh
            </button>

          </div>

        </section>


        {/* MESSAGE */}
        {message && (
          <div className="mb-6 rounded-xl border-2 border-[#c7d2fe] bg-[#eef2ff] px-4 py-3 font-bold text-[#172554]">
            {message}
          </div>
        )}


        {/* LOADING */}
        {loading && (
          <section className="rounded-2xl border border-gray-300 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#07152f]" />

            <p className="mt-4 font-bold text-gray-600">
              Loading your products...
            </p>

          </section>
        )}


        {/* EMPTY */}
        {!loading && products.length === 0 && (
          <section className="rounded-2xl border border-gray-300 bg-white p-10 text-center shadow-sm sm:p-16">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#eef2ff] text-4xl">
              📦
            </div>

            <h2 className="mt-5 text-2xl font-black text-[#07152f]">
              No Products Yet
            </h2>

            <p className="mx-auto mt-2 max-w-md font-medium text-gray-500">
              You haven't published any products yet. Add your first
              fashion product to start selling.
            </p>

            <Link
              href="/seller/upload"
              className="mt-6 inline-flex rounded-xl bg-[#07152f] px-6 py-3 font-black text-white hover:bg-[#10244b]"
            >
              + Add Your First Product
            </Link>

          </section>
        )}


        {/* PRODUCT GRID */}
        {!loading && products.length > 0 && (

          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            {products.map((product) => (

              <article
                key={product.id}
                className="overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm transition hover:shadow-lg"
              >

                {/* IMAGE */}
                <div className="relative h-[280px] w-full bg-[#f8fafc]">

                  {product.image ? (

                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-contain"
                    />

                  ) : (

                    <div className="flex h-full w-full flex-col items-center justify-center text-gray-400">

                      <span className="text-5xl">
                        🖼️
                      </span>

                      <span className="mt-2 text-sm font-bold">
                        No Image
                      </span>

                    </div>

                  )}


                  {/* STOCK BADGE */}
                  <div
                    className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-black ${
                      product.stock === 0
                        ? "bg-red-600 text-white"
                        : product.stock <= 5
                        ? "bg-yellow-400 text-black"
                        : "bg-green-600 text-white"
                    }`}
                  >
                    {product.stock === 0
                      ? "Out of Stock"
                      : `${product.stock} in stock`}
                  </div>

                </div>


                {/* PRODUCT DETAILS */}
                <div className="p-5">

                  {/* CATEGORY */}
                  {product.category?.name && (
                    <p className="text-xs font-black uppercase tracking-wide text-[#64748b]">
                      {product.category.name}
                    </p>
                  )}


                  {/* NAME */}
                  <h3 className="mt-1 line-clamp-2 text-lg font-black text-[#111827]">
                    {product.name}
                  </h3>


                  {/* DESCRIPTION */}
                  <p className="mt-2 line-clamp-2 text-sm font-medium leading-5 text-gray-500">
                    {product.description}
                  </p>


                  {/* PRICE */}
                  <div className="mt-4 flex items-center justify-between">

                    <p className="text-2xl font-black text-[#07152f]">
                      ₹{product.price}
                    </p>

                    <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">
                      Product
                    </span>

                  </div>


                  {/* BUTTONS */}
                  <div className="mt-5 flex gap-2">

                    <Link
                      href={`/product/${product.id}`}
                      className="flex-1 rounded-xl border-2 border-[#07152f] bg-white px-3 py-3 text-center text-sm font-black text-[#07152f] hover:bg-gray-100"
                    >
                      View
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        deleteProduct(
                          product.id,
                          product.name
                        )
                      }
                      disabled={deletingId === product.id}
                      className="flex-1 rounded-xl bg-red-600 px-3 py-3 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingId === product.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>

                  </div>

                </div>

              </article>

            ))}

          </section>

        )}

      </div>

    </main>
  );
}
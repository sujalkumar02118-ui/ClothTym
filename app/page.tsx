"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "./components/Navbar";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  category?: {
    name: string;
  };
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/products", {
          cache: "no-store",
        });

        const data = await response.json();

        if (data.success && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      } catch (error) {
        console.error("Products loading error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-black">

      {/* ================= NAVBAR ================= */}
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">

        {/* ================= HERO ================= */}
        <section className="bg-[#1e3470] rounded-[2rem] p-6 sm:p-8 md:p-14 mt-4 text-white flex flex-col md:flex-row items-center justify-between gap-10">

          <div className="max-w-xl">

            <p className="uppercase tracking-[4px] text-gray-300 text-sm">
              CLOTHTYM FASHION
            </p>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mt-5">
              Fashion Without
              <br />
              Tym Limits
            </h1>

            <p className="text-base sm:text-lg text-gray-200 mt-5">
              India's next generation fashion marketplace
              connecting customers with nearby fashion stores.
            </p>

            <Link
              href="/product"
              className="inline-block bg-white text-black px-8 py-3 rounded-full font-semibold mt-8 hover:bg-gray-100 transition"
            >
              Explore Now
            </Link>

          </div>


          {/* DELIVERY VIDEO */}
          <div className="w-full md:w-[520px] aspect-video rounded-3xl overflow-hidden bg-white/10">

            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            >
              <source src="/delivery.mp4" type="video/mp4" />
            </video>

          </div>

        </section>


        {/* ================= TRENDING PRODUCTS ================= */}
        <section className="mt-16">

          <div className="flex items-center justify-between mb-8">

            <div>
              <h2 className="text-3xl font-bold">
                Trending Products
              </h2>

              <p className="text-gray-500 mt-1">
                Latest products from our sellers
              </p>
            </div>

            <Link
              href="/product"
              className="text-blue-700 font-semibold flex items-center gap-2"
            >
              View All
              <span className="text-xl">→</span>
            </Link>

          </div>


          {/* LOADING */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">

              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="bg-white rounded-3xl p-4 shadow-sm animate-pulse"
                >

                  <div className="w-full aspect-[4/5] bg-gray-200 rounded-2xl" />

                  <div className="h-4 bg-gray-200 rounded mt-5 w-3/4" />

                  <div className="h-4 bg-gray-200 rounded mt-3 w-1/2" />

                  <div className="h-5 bg-gray-200 rounded mt-4 w-1/3" />

                </div>
              ))}

            </div>
          )}


          {/* PRODUCTS */}
          {!loading && products.length > 0 && (

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">

              {products.slice(0, 8).map((product) => (

                <Link
                  href={`/product/${product.id}`}
                  key={product.id}
                  className="bg-white rounded-3xl p-4 shadow-sm hover:shadow-lg transition block"
                >

                  {/* ================= IMAGE ================= */}
                  <div className="w-full aspect-[4/5] bg-white rounded-2xl overflow-hidden flex items-center justify-center relative">

                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}

                    {/* LIVE BADGE */}
                    <span className="absolute top-3 left-3 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                      LIVE
                    </span>

                  </div>


                  {/* ================= PRODUCT DETAILS ================= */}

                  <div className="px-1">

                    <p className="text-xs uppercase tracking-wide text-gray-500 font-medium mt-4">
                      {product.category?.name || "Fashion"}
                    </p>

                    <h3 className="font-bold text-lg mt-1 line-clamp-1">
                      {product.name}
                    </h3>

                    <p className="text-gray-500 text-sm mt-1 line-clamp-1">
                      {product.description}
                    </p>


                    <div className="flex items-center justify-between mt-4">

                      <p className="text-xl font-black">
                        ₹{product.price}
                      </p>

                      <span className="w-9 h-9 rounded-full bg-[#1e3470] text-white flex items-center justify-center text-lg">
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

            <div className="bg-white rounded-3xl p-10 text-center border border-gray-200">

              <div className="text-5xl mb-4">
                🛍️
              </div>

              <h3 className="text-xl font-bold">
                No products available yet
              </h3>

              <p className="text-gray-500 mt-2">
                Products published by sellers will appear here.
              </p>

            </div>

          )}

        </section>


        {/* ================= SELLER BANNER ================= */}
        <section className="mt-16 bg-[#07152f] rounded-[2rem] px-6 sm:px-10 py-7 text-white flex flex-col md:flex-row items-center justify-between gap-6">

          {/* LEFT */}
          <div className="flex items-center gap-6">

            {/* STORE LOGO */}
            <div className="w-20 h-20 rounded-full border-2 border-yellow-400 flex items-center justify-center bg-[#07152f] shrink-0">

              <svg
                width="44"
                height="44"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >

                <path
                  d="M8 20L11 10H37L40 20"
                  stroke="#FACC15"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M10 20V38H38V20"
                  stroke="#FACC15"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M8 20C8 23 10 25 13 25C16 25 18 23 18 20C18 23 20 25 24 25C28 25 30 23 30 20C30 23 32 25 35 25C38 25 40 23 40 20"
                  stroke="#FACC15"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M20 38V29H28V38"
                  stroke="#FACC15"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <circle
                  cx="38"
                  cy="34"
                  r="7"
                  fill="#07152f"
                  stroke="#FACC15"
                  strokeWidth="2"
                />

                <path
                  d="M38 30V38M34 34H42"
                  stroke="#FACC15"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

              </svg>

            </div>


            {/* TEXT */}
            <div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                Become a ClothTym Seller
              </h2>

              <p className="text-gray-300 text-base sm:text-lg mt-1">
                Grow your fashion business with nearby customers
              </p>

            </div>

          </div>


          {/* JOIN NOW */}
          <Link
            href="/seller-register"
            className="bg-white text-black px-9 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 hover:bg-gray-100 transition shrink-0"
          >

            Join Now

            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >

              <path d="M5 12H19" />
              <path d="M13 6L19 12L13 18" />

            </svg>

          </Link>

        </section>

      </main>


      {/* ================= FOOTER ================= */}
      <footer className="bg-[#111827] text-white mt-16 px-8 py-12">

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* BRAND */}
          <div>

            <h2 className="text-2xl font-bold">
              ClothTym
            </h2>

            <p className="text-gray-400 mt-3">
              Fashion without tym limits.
            </p>

          </div>


          {/* SHOP */}
          <div>

            <h3 className="font-bold mb-3">
              Shop
            </h3>

            <p className="text-gray-400">
              Men Wear
            </p>

            <p className="text-gray-400">
              Women Wear
            </p>

            <p className="text-gray-400">
              Kids Wear
            </p>

          </div>


          {/* SUPPORT */}
          <div>

            <h3 className="font-bold mb-3">
              Support
            </h3>

            <p className="text-gray-400">
              Contact Us
            </p>

            <p className="text-gray-400">
              Delivery
            </p>

            <p className="text-gray-400">
              Returns
            </p>

          </div>


          {/* SOCIAL */}
          <div>

            <h3 className="font-bold mb-3">
              Follow Us
            </h3>

            <p className="text-gray-400">
              Instagram
            </p>

            <p className="text-gray-400">
              Facebook
            </p>

          </div>

        </div>


        <div className="text-center text-gray-500 mt-10 pt-6 border-t border-gray-700">
          © 2026 ClothTym. All rights reserved.
        </div>

      </footer>

    </div>
  );
}
"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-[#282c3f]">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back */}
        <Link
          href="/profile"
          className="mb-6 inline-flex text-sm font-medium hover:underline"
        >
          ← Back to Profile
        </Link>

        {/* Hero */}
        <section className="rounded-xl bg-[#fff4f7] px-6 py-10 text-center sm:px-10 sm:py-14">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#ff3f6c]">
            ClothTym
          </p>

          <h1 className="text-3xl font-bold sm:text-5xl">
            Fashion Without Tym Limits
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
            India’s next generation fashion marketplace, connecting customers
            with fashion sellers and bringing more choice closer to you.
          </p>
        </section>

        {/* About */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">About ClothTym</h2>

          <p className="mt-4 text-sm leading-7 text-gray-600 sm:text-base">
            ClothTym is built with a simple idea — make fashion shopping more
            convenient, accessible and connected with the sellers around you.
            We are creating a marketplace where customers can discover fashion
            products from different sellers while sellers get an opportunity
            to take their businesses online.
          </p>

          <p className="mt-4 text-sm leading-7 text-gray-600 sm:text-base">
            From everyday fashion to special occasions, ClothTym aims to bring
            a wide range of styles together in one simple shopping experience.
          </p>
        </section>

        {/* Mission */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Our Mission</h2>

          <p className="mt-4 text-sm leading-7 text-gray-600 sm:text-base">
            Our mission is to build a fashion marketplace that connects
            customers and sellers through technology while making fashion
            shopping faster, simpler and more convenient.
          </p>
        </section>

        {/* What We Do */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">What We Do</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-100 p-5">
              <div className="text-2xl">🛍️</div>

              <h3 className="mt-3 font-semibold">Fashion Marketplace</h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Discover fashion products from multiple sellers in one
                marketplace.
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 p-5">
              <div className="text-2xl">📍</div>

              <h3 className="mt-3 font-semibold">Nearby Sellers</h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Our marketplace is designed to connect customers with sellers
                closer to their location.
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 p-5">
              <div className="text-2xl">🚚</div>

              <h3 className="mt-3 font-semibold">Faster Delivery</h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Local seller fulfilment can help make eligible deliveries
                faster and more convenient.
              </p>
            </div>
          </div>
        </section>

        {/* For Customers */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">For Customers</h2>

          <div className="mt-4 rounded-xl bg-gray-50 p-6">
            <ul className="space-y-3 text-sm leading-6 text-gray-600 sm:text-base">
              <li>• Discover fashion from multiple sellers.</li>
              <li>• Shop from the comfort of your home.</li>
              <li>• Save products to your Wishlist.</li>
              <li>• Track your orders from your account.</li>
              <li>• Manage addresses and account details easily.</li>
            </ul>
          </div>
        </section>

        {/* For Sellers */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">For Sellers</h2>

          <div className="mt-4 rounded-xl bg-gray-50 p-6">
            <p className="text-sm leading-7 text-gray-600 sm:text-base">
              ClothTym gives fashion businesses an opportunity to build their
              online presence and reach customers through a dedicated
              marketplace.
            </p>

            <Link
              href="/seller-register"
              className="mt-5 inline-flex rounded-md bg-[#ff3f6c] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Become a ClothTym Seller
            </Link>
          </div>
        </section>

        {/* Vision */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Our Vision</h2>

          <p className="mt-4 text-sm leading-7 text-gray-600 sm:text-base">
            We envision ClothTym becoming a trusted fashion marketplace where
            customers can discover great fashion and sellers can grow their
            businesses through technology.
          </p>
        </section>

        {/* Closing */}
        <section className="mt-12 rounded-xl border border-gray-100 px-6 py-8 text-center">
          <h2 className="text-xl font-semibold">
            Fashion Without Tym Limits
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Built for the next generation of fashion shopping.
          </p>
        </section>

        <div className="h-8" />
      </div>
    </main>
  );
}
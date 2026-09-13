"use client";

import { useEffect, useRef, useState } from "react";
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

const categories = [
  { name: "Men", letter: "M", image: "/men-category.png" },
  { name: "Women", letter: "W", image: "/women-category.png" },
  { name: "Kids", letter: "K", image: "/kids-category.png" },
  { name: "Footwear", letter: "F", image: "/footwear-category.png" },
  { name: "Accessories", letter: "A", image: "/accessories-category.png" },
  { name: "Sports", letter: "S", image: "/sports-category.png" },
  { name: "Saree", letter: "S", image: "/saree-category.png" },
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [heroSlide, setHeroSlide] = useState(0);
  const [heroDirection, setHeroDirection] = useState<1 | -1>(1);

  const videoRef = useRef<HTMLVideoElement | null>(null);

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

  /*
   * ============================================================
   * HERO AUTO SLIDER
   *
   * Slide 0 = Delivery Video
   * Slide 1 = Fashion Image
   *
   * Video ends -> Image
   * Image stays 7 sec -> Video
   * ============================================================
   */
  useEffect(() => {
    if (heroSlide !== 1) return;

    const timer = window.setTimeout(() => {
      setHeroDirection(-1);
      setHeroSlide(0);
    }, 7000);

    return () => window.clearTimeout(timer);
  }, [heroSlide]);

  /*
   * Start video whenever video slide becomes active.
   */
  useEffect(() => {
    if (heroSlide !== 0 || !videoRef.current) return;

    videoRef.current.currentTime = 0;

    const playPromise = videoRef.current.play();

    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Browser may block autoplay until user interaction.
      });
    }
  }, [heroSlide]);

  function nextHero() {
    setHeroDirection(1);
    setHeroSlide((current) => (current + 1) % 2);
  }

  function previousHero() {
    setHeroDirection(-1);
    setHeroSlide((current) => (current - 1 + 2) % 2);
  }

  function goToHero(slide: number) {
    if (slide === heroSlide) return;

    setHeroDirection(slide > heroSlide ? 1 : -1);
    setHeroSlide(slide);
  }

  function handleVideoEnded() {
    setHeroDirection(1);
    setHeroSlide(1);
  }

  const trendingProducts = products.slice(0, 6);

  return (
    <div className="min-h-screen bg-white text-[#07152f]">
      <Navbar />

      <main>
        {/* =========================================================
            HERO SLIDER
            DO NOT CHANGE HERO SIZE
        ========================================================== */}
        <section className="px-4 sm:px-6 pt-5">
          <div
            className="
              max-w-[1240px]
              mx-auto
              h-[300px]
              sm:h-[330px]
              md:h-[360px]
              lg:h-[375px]
              rounded-[22px]
              overflow-hidden
              relative
              bg-[#07152f]
              [perspective:1800px]
            "
          >
            {/* =====================================================
                SLIDE 1 — VIDEO
                REALISTIC 8D PAGE TURN
            ====================================================== */}
            <div
              className={`
                absolute
                inset-0
                flex
                overflow-hidden
                [transform-style:preserve-3d]
                [backface-visibility:hidden]
                transition-[transform,opacity]
                duration-[1100ms]
                ease-[cubic-bezier(0.22,0.61,0.36,1)]
                ${
                  heroSlide === 0
                    ? "z-20 opacity-100 translate-x-0 rotate-y-0"
                    : heroDirection === 1
                    ? "z-10 opacity-0 origin-left rotate-y-[-100deg] translate-x-[-4%] scale-[0.98]"
                    : "z-10 opacity-0 origin-right rotate-y-[100deg] translate-x-[4%] scale-[0.98]"
                }
              `}
              style={{
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
              }}
            >
              {/* LEFT CONTENT */}
              <div
                className="
                  relative
                  w-[51%]
                  h-full
                  flex
                  items-center
                  overflow-hidden
                  bg-gradient-to-br
                  from-[#07152f]
                  via-[#101d4d]
                  to-[#164e9a]
                "
              >
                {/* Decorative circle */}
                <div
                  className="
                    absolute
                    -left-[110px]
                    -bottom-[150px]
                    w-[390px]
                    h-[390px]
                    rounded-full
                    bg-[#245fbe]/35
                  "
                />

                <div
                  className="
                    relative
                    z-10
                    px-7
                    sm:px-9
                    md:px-10
                    lg:px-12
                    max-w-[600px]
                  "
                >
                  <p
                    className="
                      text-[10px]
                      sm:text-xs
                      md:text-sm
                      font-bold
                      tracking-[4px]
                      text-[#f5b91b]
                      uppercase
                      mb-3
                    "
                  >
                    THE STYLE YOU DESERVE
                  </p>

                  <h1
                    className="
                      text-[32px]
                      sm:text-[38px]
                      md:text-[45px]
                      lg:text-[49px]
                      leading-[0.96]
                      font-black
                      tracking-[-1.8px]
                      text-white
                    "
                  >
                    Fashion That
                    <br />
                    <span className="text-[#ffbd16]">
                      Moves With You
                    </span>
                  </h1>

                  <p
                    className="
                      mt-4
                      text-[11px]
                      sm:text-xs
                      md:text-sm
                      leading-5
                      text-white/85
                      max-w-[500px]
                    "
                  >
                    India&apos;s next generation fashion marketplace
                    connecting customers with nearby fashion stores.
                  </p>

                  <div
                    className="
                      mt-3
                      flex
                      flex-wrap
                      items-center
                      gap-2
                      text-[9px]
                      sm:text-[10px]
                      md:text-xs
                      font-semibold
                      text-white/85
                    "
                  >
                    <span>Trendy Looks</span>
                    <span className="text-white/40">|</span>
                    <span>Premium Quality</span>
                    <span className="text-white/40">|</span>
                    <span>Trusted Sellers</span>
                  </div>

                  <Link
                    href="/product"
                    className="
                      inline-flex
                      items-center
                      gap-2
                      mt-5
                      bg-[#ffbd16]
                      text-[#111827]
                      px-5
                      sm:px-6
                      py-2.5
                      rounded-full
                      text-xs
                      sm:text-sm
                      font-bold
                      hover:bg-[#ffc933]
                      transition
                    "
                  >
                    Shop Now
                    <span className="text-base">→</span>
                  </Link>
                </div>
              </div>

              {/* RIGHT VIDEO */}
              <div className="w-[49%] h-full bg-black overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  preload="auto"
                  onEnded={handleVideoEnded}
                  className="w-full h-full object-cover"
                >
                  <source src="/delivery.mp4" type="video/mp4" />
                </video>
              </div>
            </div>

            {/* =====================================================
                SLIDE 2 — FASHION IMAGE
                REALISTIC 8D PAGE TURN
            ====================================================== */}
            <div
              className={`
                absolute
                inset-0
                overflow-hidden
                [transform-style:preserve-3d]
                [backface-visibility:hidden]
                transition-[transform,opacity]
                duration-[1100ms]
                ease-[cubic-bezier(0.22,0.61,0.36,1)]
                ${
                  heroSlide === 1
                    ? "z-20 opacity-100 translate-x-0 rotate-y-0"
                    : heroDirection === 1
                    ? "z-10 opacity-0 origin-right rotate-y-[100deg] translate-x-[4%] scale-[0.98]"
                    : "z-10 opacity-0 origin-left rotate-y-[-100deg] translate-x-[-4%] scale-[0.98]"
                }
              `}
              style={{
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
              }}
            >
              <img
                src="/hero-fashion.jpg"
                alt="ClothTym fashion collection"
                className="
                  absolute
                  inset-0
                  w-full
                  h-full
                  object-cover
                  object-center
                "
              />

              {/* Dark gradient only on left */}
              <div
                className="
                  absolute
                  inset-0
                  bg-gradient-to-r
                  from-black/90
                  via-black/55
                  to-transparent
                "
              />

              {/* IMAGE SLIDE CONTENT */}
              <div
                className="
                  relative
                  z-10
                  h-full
                  w-full
                  flex
                  items-center
                "
              >
                <div
                  className="
                    px-7
                    sm:px-9
                    md:px-10
                    lg:px-12
                    max-w-[590px]
                    text-white
                  "
                >
                  <p
                    className="
                      text-[10px]
                      sm:text-xs
                      md:text-sm
                      font-bold
                      tracking-[4px]
                      text-[#f5b91b]
                      uppercase
                      mb-3
                    "
                  >
                    THE STYLE YOU DESERVE
                  </p>

                  <h2
                    className="
                      text-[31px]
                      sm:text-[38px]
                      md:text-[45px]
                      lg:text-[50px]
                      leading-[0.95]
                      font-black
                      tracking-[-1.8px]
                    "
                  >
                    Style Beyond
                    <br />
                    <span className="text-[#ffbd16]">
                      Limits
                    </span>
                  </h2>

                  <p
                    className="
                      mt-4
                      text-[11px]
                      sm:text-xs
                      md:text-sm
                      leading-5
                      text-white/85
                      max-w-[430px]
                    "
                  >
                    Discover fashion that matches your style,
                    your personality and your everyday life.
                  </p>

                  <div
                    className="
                      mt-3
                      flex
                      flex-wrap
                      items-center
                      gap-2
                      text-[9px]
                      sm:text-[10px]
                      md:text-xs
                      font-semibold
                      text-white/85
                    "
                  >
                    <span>Premium Fashion</span>
                    <span className="text-white/40">|</span>
                    <span>Latest Styles</span>
                    <span className="text-white/40">|</span>
                    <span>Trusted Sellers</span>
                  </div>

                  <Link
                    href="/product"
                    className="
                      inline-flex
                      items-center
                      gap-2
                      mt-5
                      bg-[#ffbd16]
                      text-[#111827]
                      px-5
                      sm:px-6
                      py-2.5
                      rounded-full
                      text-xs
                      sm:text-sm
                      font-bold
                      hover:bg-[#ffc933]
                      transition
                    "
                  >
                    Explore Collection
                    <span className="text-base">→</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* =====================================================
                PREVIOUS BUTTON
            ====================================================== */}
            <button
              type="button"
              onClick={previousHero}
              aria-label="Previous hero slide"
              className="
                absolute
                left-3
                sm:left-4
                top-1/2
                -translate-y-1/2
                z-40
                w-9
                h-9
                sm:w-10
                sm:h-10
                rounded-full
                bg-black/45
                border
                border-white/30
                text-white
                flex
                items-center
                justify-center
                text-lg
                backdrop-blur-sm
                hover:bg-black/70
                transition
              "
            >
              ←
            </button>

            {/* =====================================================
                NEXT BUTTON
            ====================================================== */}
            <button
              type="button"
              onClick={nextHero}
              aria-label="Next hero slide"
              className="
                absolute
                right-3
                sm:right-4
                top-1/2
                -translate-y-1/2
                z-40
                w-9
                h-9
                sm:w-10
                sm:h-10
                rounded-full
                bg-black/45
                border
                border-white/30
                text-white
                flex
                items-center
                justify-center
                text-lg
                backdrop-blur-sm
                hover:bg-black/70
                transition
              "
            >
              →
            </button>

            {/* =====================================================
                SLIDER DOTS
            ====================================================== */}
            <div
              className="
                absolute
                bottom-4
                left-1/2
                -translate-x-1/2
                z-40
                flex
                items-center
                gap-2
              "
            >
              <button
                type="button"
                aria-label="Show video slide"
                onClick={() => goToHero(0)}
                className={`
                  h-2
                  rounded-full
                  transition-all
                  ${
                    heroSlide === 0
                      ? "w-7 bg-[#ffbd16]"
                      : "w-2 bg-white/60"
                  }
                `}
              />

              <button
                type="button"
                aria-label="Show fashion image slide"
                onClick={() => goToHero(1)}
                className={`
                  h-2
                  rounded-full
                  transition-all
                  ${
                    heroSlide === 1
                      ? "w-7 bg-[#ffbd16]"
                      : "w-2 bg-white/60"
                  }
                `}
              />
            </div>
          </div>
        </section>

        {/* =========================================================
            TRUST STRIP
        ========================================================== */}
        <section className="px-4 sm:px-6 mt-2">
          <div
            className="
              max-w-[1240px]
              mx-auto
              rounded-[18px]
              bg-[#07152f]
              text-white
              min-h-[66px]
              flex
              items-center
              overflow-hidden
            "
          >
            <div className="w-full grid grid-cols-2 md:grid-cols-5">
              <TrustItem
                icon="✓"
                title="Original Products"
                subtitle="Genuine Fashion"
              />

              <TrustItem
                icon="▣"
                title="Secure Payments"
                subtitle="Safe & Trusted"
              />

              <TrustItem
                icon="↻"
                title="Easy Returns"
                subtitle="Hassle-Free"
              />

              <TrustItem
                icon="?"
                title="Customer Support"
                subtitle="We're Here to Help"
              />

              <TrustItem
                icon="★"
                title="Premium Quality"
                subtitle="Best in Class"
              />
            </div>
          </div>
        </section>

        {/* =========================================================
            CATEGORY + SHOP BY CATEGORY BANNER
        ========================================================== */}
        <section className="max-w-[1240px] mx-auto px-4 sm:px-6 mt-8">
          <div
            className="
              grid
              grid-cols-1
              lg:grid-cols-[minmax(0,1fr)_390px]
              gap-5
              items-center
            "
          >
            {/* CATEGORY AREA */}
            <div className="min-w-0">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs font-bold tracking-[3px] text-[#b08a32] uppercase">
                    EXPLORE
                  </p>

                  <h2 className="mt-1 text-2xl sm:text-3xl font-black tracking-[-1px]">
                    Shop by Category
                  </h2>
                </div>

                <Link
                  href="/product"
                  className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-black"
                >
                  View All →
                </Link>
              </div>

              <div className="mt-5 flex gap-4 sm:gap-5 md:gap-6 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((category) => (
                  <Link
                    key={category.name}
                    href={`/product?category=${encodeURIComponent(
                      category.name
                    )}`}
                    className="shrink-0 text-center group"
                  >
                    <div
                      className="
                        w-[68px]
                        h-[68px]
                        sm:w-[76px]
                        sm:h-[76px]
                        md:w-[82px]
                        md:h-[82px]
                        rounded-full
                        border
                        border-gray-200
                        bg-[#fafafa]
                        overflow-hidden
                        flex
                        items-center
                        justify-center
                        group-hover:border-[#07152f]
                        group-hover:bg-gray-100
                        transition
                      "
                    >
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="
                            w-full
                            h-full
                            rounded-full
                            object-cover
                          "
                        />
                      ) : (
                        <span className="text-xl sm:text-2xl font-black text-[#07152f]/75">
                          {category.letter}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-[10px] sm:text-xs font-semibold whitespace-nowrap">
                      {category.name}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* =====================================================
                SHOP BY CATEGORY BANNER
            ====================================================== */}
            <Link
              href="/product"
              className="
                relative
                block
                h-[130px]
                sm:h-[145px]
                md:h-[155px]
                lg:h-[155px]
                rounded-[16px]
                overflow-hidden
                bg-[#07152f]
                group
              "
            >
              <img
                src="/shop-category-banner.jpg"
                alt="Shop by Category"
                className="
                  absolute
                  inset-0
                  w-full
                  h-full
                  object-cover
                  object-center
                  transition
                  duration-500
                  group-hover:scale-[1.02]
                "
              />

              <div
                className="
                  absolute
                  inset-0
                  bg-gradient-to-r
                  from-[#07152f]/95
                  via-[#07152f]/65
                  to-transparent
                "
              />

              <div
                className="
                  relative
                  z-10
                  h-full
                  flex
                  items-center
                  px-6
                  sm:px-7
                  md:px-8
                "
              >
                <div>
                  <p className="text-[9px] sm:text-[10px] tracking-[3px] font-bold text-[#f4bd26] uppercase">
                    CLOTHTYM
                  </p>

                  <h2 className="mt-1 text-xl sm:text-2xl md:text-3xl font-black text-white">
                    Shop by Category
                  </h2>

                  <p className="mt-1 text-xs sm:text-sm text-white/80">
                    Your Style, Your Category
                  </p>

                  <span
                    className="
                      inline-flex
                      mt-3
                      items-center
                      gap-2
                      rounded-full
                      border
                      border-white/50
                      px-4
                      py-1.5
                      text-[10px]
                      sm:text-xs
                      font-semibold
                      text-white
                      group-hover:bg-white
                      group-hover:text-[#07152f]
                      transition
                    "
                  >
                    Explore Now →
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* =========================================================
            PROMOTION ROW
        ========================================================== */}
        <section className="max-w-[1240px] mx-auto px-4 sm:px-6 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <PromoCard
              href="/product"
              className="from-[#cf006d] via-[#ee1870] to-[#ff6b24]"
              small="CLOTHTYM"
              title="Big Fashion Sale"
              main="UP TO 70% OFF"
            />

            <PromoCard
              href="/product?category=Men"
              className="from-[#06182e] via-[#123d69] to-[#245f9b]"
              small="MEN'S WEAR"
              title="Trendy. Bold. You."
              main="Flat 50% OFF"
            />

            <PromoCard
              href="/product?category=Women"
              className="from-[#d91562] via-[#ef4d79] to-[#ff8e98]"
              small="WOMEN'S WEAR"
              title="Style for Every You."
              main="Flat 60% OFF"
            />

            <PromoCard
              href="/product?category=Kids"
              className="from-[#f1aa13] via-[#f6bf27] to-[#f8d75c]"
              small="KIDS FASHION"
              title="Little Styles, Big Smiles"
              main="Up to 50% OFF"
            />

            <PromoCard
              href="/product?category=Footwear"
              className="from-[#07152f] via-[#173b69] to-[#45658e]"
              small="FOOTWEAR"
              title="Step Up Your Style"
              main="Up to 60% OFF"
            />
          </div>
        </section>

        {/* =========================================================
            TRENDING PRODUCTS
            REAL DATABASE PRODUCTS ONLY
        ========================================================== */}
        <section className="max-w-[1240px] mx-auto px-4 sm:px-6 mt-8">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🔥</span>

                <h2 className="text-2xl sm:text-3xl font-black tracking-[-1px]">
                  Trending Now
                </h2>
              </div>

              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Most loved products, just for you
              </p>
            </div>

            <Link
              href="/product"
              className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-black"
            >
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[260px] rounded-xl bg-gray-100 animate-pulse"
                />
              ))}
            </div>
          ) : trendingProducts.length === 0 ? (
            <div className="mt-4 rounded-xl border border-gray-200 p-8 text-center">
              <p className="font-semibold text-gray-700">
                Products will appear here when approved sellers add them.
              </p>

              <p className="text-sm text-gray-500 mt-1">
                No fake products are being shown.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
              {trendingProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="
                    group
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    overflow-hidden
                    hover:border-gray-400
                    transition
                  "
                >
                  <div className="relative aspect-[0.88] bg-gray-100 overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="
                          w-full
                          h-full
                          object-cover
                          group-hover:scale-[1.03]
                          transition
                          duration-300
                        "
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <p className="text-[11px] sm:text-xs text-gray-700 line-clamp-2 min-h-[32px]">
                      {product.name}
                    </p>

                    <p className="mt-2 text-sm sm:text-base font-bold">
                      ₹{product.price.toLocaleString("en-IN")}
                    </p>

                    {product.category?.name && (
                      <p className="mt-1 text-[10px] text-gray-500">
                        {product.category.name}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* =========================================================
            MARKETPLACE / SELLER CTA
        ========================================================== */}
        <section className="max-w-[1240px] mx-auto px-4 sm:px-6 mt-5">
          <div className="grid lg:grid-cols-[1fr_0.34fr] gap-4">
            <div
              className="
                min-h-[135px]
                rounded-[16px]
                overflow-hidden
                bg-gradient-to-r
                from-[#07152f]
                via-[#152f5d]
                to-[#264d82]
                text-white
                p-6
                sm:p-8
                flex
                items-center
                justify-between
                gap-5
              "
            >
              <div>
                <p className="text-[10px] tracking-[3px] font-bold text-[#f5bb21]">
                  CLOTHTYM MARKETPLACE
                </p>

                <h2 className="mt-1 text-xl sm:text-2xl md:text-3xl font-black">
                  Fashion from Trusted Sellers
                </h2>

                <p className="mt-1 text-xs sm:text-sm text-white/70">
                  Discover products available from nearby fashion stores.
                </p>

                <Link
                  href="/product"
                  className="
                    inline-flex
                    mt-4
                    bg-white
                    text-[#07152f]
                    px-4
                    py-2
                    rounded-full
                    text-xs
                    font-bold
                  "
                >
                  Shop Now →
                </Link>
              </div>

              <div className="hidden sm:flex w-28 h-28 rounded-full border border-white/15 items-center justify-center">
                <span className="text-4xl font-black text-white/20">
                  CT
                </span>
              </div>
            </div>

            <Link
              href="/seller-register"
              className="
                min-h-[135px]
                rounded-[16px]
                bg-[#101010]
                text-white
                p-6
                flex
                flex-col
                justify-center
                hover:bg-[#181818]
                transition
              "
            >
              <p className="text-[10px] tracking-[3px] text-[#f5bd24] font-bold">
                SELL ON CLOTHTYM
              </p>

              <h3 className="mt-1 text-xl font-black">
                Become a Seller
              </h3>

              <p className="text-xs text-white/65 mt-1">
                Grow your fashion business with ClothTym.
              </p>

              <span className="mt-3 text-xs font-bold text-[#f5bd24]">
                Join Now →
              </span>
            </Link>
          </div>
        </section>

        {/* =========================================================
            LOWER PROMOTION STRIP
        ========================================================== */}
        <section className="max-w-[1240px] mx-auto px-4 sm:px-6 mt-4 mb-8">
          <div className="grid md:grid-cols-3 gap-3">
            <LowerBanner
              href="/product"
              className="from-[#0b9fc1] to-[#0b6f9d]"
              title="Summer Collection"
              subtitle="Light Looks. Fresh Styles."
            />

            <LowerBanner
              href="/product"
              className="from-[#10284d] to-[#214e8a]"
              title="Shop Anytime"
              subtitle="Discover fashion from trusted sellers."
            />

            <LowerBanner
              href="/product"
              className="from-[#a30e45] to-[#e51c5e]"
              title="Flash Deals"
              subtitle="Prices you'll love."
            />
          </div>
        </section>
      </main>

      {/* =========================================================
          FOOTER
      ========================================================== */}
      <footer className="bg-[#061321] text-white">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <Link
                href="/"
                className="text-2xl font-black tracking-[-1px]"
              >
                ClothTym
              </Link>

              <p className="mt-1 text-xs text-white/60">
                Fashion Without Tym Limits
              </p>

              <p className="mt-5 text-xs text-white/45">
                © {new Date().getFullYear()} ClothTym. All rights reserved.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-sm">Quick Links</h3>

              <div className="mt-3 space-y-2 text-xs text-white/60">
                <Link className="block hover:text-white" href="/">
                  Home
                </Link>

                <Link className="block hover:text-white" href="/product">
                  Products
                </Link>

                <Link className="block hover:text-white" href="/cart">
                  Cart
                </Link>

                <Link
                  className="block hover:text-white"
                  href="/seller-register"
                >
                  Become a Seller
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-sm">Customer Service</h3>

              <div className="mt-3 space-y-2 text-xs text-white/60">
                <span className="block">Help Center</span>
                <span className="block">Return Policy</span>
                <span className="block">Track Order</span>
                <span className="block">Support</span>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-sm">ClothTym</h3>

              <p className="mt-3 text-xs leading-5 text-white/60">
                India&apos;s next generation fashion marketplace connecting
                customers with nearby fashion stores.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ===============================================================
   TRUST ITEM
================================================================ */
function TrustItem({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-2 px-3 sm:px-4 py-3 border-white/10 md:border-r last:border-r-0">
      <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full bg-white text-[#07152f] flex items-center justify-center text-sm font-bold">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[9px] sm:text-[10px] font-bold truncate">
          {title}
        </p>

        <p className="text-[8px] sm:text-[9px] text-white/55 truncate">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/* ===============================================================
   PROMO CARD
================================================================ */
function PromoCard({
  href,
  className,
  small,
  title,
  main,
}: {
  href: string;
  className: string;
  small: string;
  title: string;
  main: string;
}) {
  return (
    <Link
      href={href}
      className={`
        relative
        min-h-[130px]
        rounded-[13px]
        overflow-hidden
        bg-gradient-to-br
        ${className}
        text-white
        p-5
        group
      `}
    >
      <div className="relative z-10">
        <p className="text-[9px] font-bold tracking-wide text-white/80">
          {small}
        </p>

        <h3 className="mt-1 text-lg sm:text-xl font-black leading-tight">
          {main}
        </h3>

        <p className="mt-1 text-[10px] sm:text-xs text-white/80">
          {title}
        </p>

        <span className="inline-flex mt-3 rounded-full bg-white text-black px-3 py-1 text-[9px] font-bold group-hover:px-4 transition-all">
          Shop Now →
        </span>
      </div>
    </Link>
  );
}

/* ===============================================================
   LOWER BANNER
================================================================ */
function LowerBanner({
  href,
  className,
  title,
  subtitle,
}: {
  href: string;
  className: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className={`
        min-h-[105px]
        rounded-[13px]
        bg-gradient-to-r
        ${className}
        text-white
        px-6
        py-5
        flex
        flex-col
        justify-center
        group
      `}
    >
      <h3 className="text-lg sm:text-xl font-black">
        {title}
      </h3>

      <p className="text-xs text-white/75 mt-1">
        {subtitle}
      </p>

      <span className="text-[10px] font-bold mt-3 group-hover:translate-x-1 transition">
        Shop Now →
      </span>
    </Link>
  );
}
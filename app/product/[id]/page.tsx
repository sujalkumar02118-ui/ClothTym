"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ReviewForm from "@/app/components/ReviewForm";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  images?: string | string[];
  sizes?: string | string[];
  colors?: string | string[];
  sizeChart?: string | Record<string, unknown> | null;

  category?: {
    id?: string;
    name: string;
  } | null;

  seller?: {
    id?: string;
    shopName?: string;
    ownerName?: string;
    city?: string;
    address?: string;
  } | null;
};

function parseArray(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value;

  if (!value) return [];

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is string => typeof item === "string"
      );
    }
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getMeasurements(size: string) {
  const measurements: Record<
    string,
    { chest: string; length: string }
  > = {
    "0-1 Years": { chest: '20"', length: '16"' },
    "1-2 Years": { chest: '21"', length: '17"' },
    "2-3 Years": { chest: '22"', length: '18"' },
    "3-4 Years": { chest: '23"', length: '19"' },
    "4-5 Years": { chest: '24"', length: '20"' },
    "5-6 Years": { chest: '25"', length: '21"' },
    "6-7 Years": { chest: '26"', length: '22"' },
    "7-8 Years": { chest: '27"', length: '23"' },
    "8-9 Years": { chest: '28"', length: '24"' },
    S: { chest: '36"', length: '27"' },
    M: { chest: '38"', length: '28"' },
    L: { chest: '40"', length: '29"' },
    XL: { chest: '42"', length: '30"' },
    XXL: { chest: '44"', length: '31"' },
  };

  return (
    measurements[size] || {
      chest: "-",
      length: "-",
    }
  );
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();

  const id = String(params.id);

  const [product, setProduct] = useState<Product | null>(null);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedImage, setSelectedImage] = useState("");

  const [showSizeChart, setShowSizeChart] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  /* ========================================================
     WISHLIST
  ======================================================== */

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);

        const response = await fetch(`/api/products/${id}`, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data) {
          throw new Error("Product could not be loaded");
        }

        setProduct(data);

        if (data.image) {
          setSelectedImage(data.image);
        }

        const productSizes = parseArray(data.sizes);
        const productColors = parseArray(data.colors);

        if (productSizes.length > 0) {
          setSelectedSize(productSizes[0]);
        }

        if (productColors.length > 0) {
          setSelectedColor(productColors[0]);
        }

        const productsResponse = await fetch("/api/products", {
          cache: "no-store",
        });

        if (productsResponse.ok) {
          const productsData = await productsResponse.json();

          if (
            productsData.success &&
            Array.isArray(productsData.products)
          ) {
            const otherProducts = productsData.products.filter(
              (item: Product) => item.id !== id
            );

            setSuggestions(otherProducts);
          }
        }
      } catch (error) {
        console.error("PRODUCT PAGE ERROR:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id]);

  /* ========================================================
     LOAD WISHLIST STATUS
  ======================================================== */

  useEffect(() => {
    async function loadWishlistStatus() {
      try {
        const response = await fetch("/api/wishlist", {
          cache: "no-store",
        });

        if (response.status === 401) {
          setIsWishlisted(false);
          return;
        }

        if (!response.ok) return;

        const data = await response.json();

        if (!Array.isArray(data)) return;

        const saved = data.some(
          (item: { productId?: string }) =>
            item.productId === id
        );

        setIsWishlisted(saved);
      } catch (error) {
        console.error(
          "WISHLIST STATUS ERROR:",
          error
        );
      }
    }

    loadWishlistStatus();
  }, [id]);

  /* ========================================================
     TOGGLE WISHLIST
  ======================================================== */

  const toggleWishlist = async () => {
    if (wishlistLoading) return;

    try {
      setWishlistLoading(true);

      const response = await fetch("/api/wishlist", {
        method: isWishlisted ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: id,
        }),
      });

      let data: {
        success?: boolean;
        message?: string;
        error?: string;
      } = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (response.status === 401) {
        router.push(
          `/login?callbackUrl=/product/${id}`
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

      setIsWishlisted(!isWishlisted);
    } catch (error) {
      console.error(
        "WISHLIST TOGGLE ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Wishlist could not be updated."
      );
    } finally {
      setWishlistLoading(false);
    }
  };

  const productImages = useMemo(() => {
    if (!product) return [];

    const images = parseArray(product.images);

    const allImages = [
      ...(product.image ? [product.image] : []),
      ...images,
    ];

    return [...new Set(allImages)];
  }, [product]);

  const sizes = useMemo(
    () => parseArray(product?.sizes),
    [product]
  );

  const colors = useMemo(
    () => parseArray(product?.colors),
    [product]
  );

  const validateSelection = () => {
    if (!product) return false;

    if (product.stock <= 0) {
      alert("This product is out of stock.");
      return false;
    }

    if (quantity < 1 || quantity > product.stock) {
      alert(`Only ${product.stock} item(s) are available.`);
      return false;
    }

    if (sizes.length > 0 && !selectedSize) {
      alert("Please select a size.");
      return false;
    }

    if (colors.length > 0 && !selectedColor) {
      alert("Please select a colour.");
      return false;
    }

    return true;
  };

  /* ========================================================
     ADD TO CART — DATABASE CART API
  ======================================================== */

  const addToCart = async () => {
    if (!validateSelection() || !product) return;

    try {
      setAddingToCart(true);

      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          size: selectedSize || null,
          color: selectedColor || null,
        }),
      });

      let data: {
        success?: boolean;
        message?: string;
        error?: string;
      } = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (response.status === 401) {
        alert("Please login first to add products to your cart.");
        router.push(`/login?callbackUrl=/product/${product.id}`);
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Product could not be added to cart."
        );
      }

      alert("Product added to cart! 🛒");

      router.push("/cart");
    } catch (error) {
      console.error("ADD CART ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Product could not be added to cart."
      );
    } finally {
      setAddingToCart(false);
    }
  };

  /* ========================================================
     BUY NOW
  ======================================================== */

  const buyNow = () => {
    if (!validateSelection() || !product) return;

    try {
      const item = {
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
        size: selectedSize,
        color: selectedColor,
      };

      localStorage.setItem(
        "clothtym_buy_now",
        JSON.stringify(item)
      );

      router.push("/cart");
    } catch (error) {
      console.error("BUY NOW ERROR:", error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8fafc]">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="animate-pulse">
            <div className="h-6 w-24 rounded bg-gray-200" />

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <div className="aspect-square rounded-3xl bg-gray-200" />

              <div className="space-y-5">
                <div className="h-8 w-3/4 rounded bg-gray-200" />
                <div className="h-5 w-1/2 rounded bg-gray-200" />
                <div className="h-10 w-1/3 rounded bg-gray-200" />
                <div className="h-28 w-full rounded bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4">
        <div className="rounded-3xl border-2 border-gray-200 bg-white p-10 text-center">
          <div className="text-6xl">🛍️</div>

          <h1 className="mt-4 text-2xl font-black text-gray-900">
            Product not found
          </h1>

          <p className="mt-2 text-gray-500">
            This product may have been removed.
          </p>

          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-[#07152f] px-6 py-3 font-black text-white"
          >
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#111827]">

      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">

          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 font-black text-[#111827]"
          >
            <span className="text-2xl">←</span>
            Back
          </button>

          <Link
            href="/"
            className="text-xl font-black tracking-wide text-[#07152f]"
          >
            CLOTHTYM
          </Link>

          <div className="flex items-center gap-3">

            <Link
              href="/login"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f5f9]"
            >
              👤
            </Link>

            <Link
              href="/cart"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f5f9]"
            >
              🛒
            </Link>

          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10">

        <div className="grid gap-8 lg:grid-cols-2">

          {/* IMAGES */}

          <div>

            <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white">

              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="aspect-square w-full object-contain"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center text-7xl">
                  👕
                </div>
              )}

              {/* WISHLIST HEART */}

              <button
                type="button"
                onClick={toggleWishlist}
                disabled={wishlistLoading}
                aria-label={
                  isWishlisted
                    ? "Remove from wishlist"
                    : "Add to wishlist"
                }
                className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-2xl shadow-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {wishlistLoading
                  ? "..."
                  : isWishlisted
                    ? "♥"
                    : "♡"}
              </button>

            </div>

            {productImages.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3">

                {productImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`overflow-hidden rounded-xl border-2 bg-white ${
                      selectedImage === image
                        ? "border-[#07152f]"
                        : "border-gray-200"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="aspect-square w-full object-contain"
                    />
                  </button>
                ))}

              </div>
            )}

          </div>

          {/* DETAILS */}

          <div>

            {product.category?.name && (
              <p className="text-sm font-black uppercase tracking-wider text-[#64748b]">
                {product.category.name}
              </p>
            )}

            <div className="mt-2 flex items-start justify-between gap-4">

              <h1 className="text-3xl font-black text-[#07152f] sm:text-4xl">
                {product.name}
              </h1>

              {/* DESKTOP WISHLIST */}

              <button
                type="button"
                onClick={toggleWishlist}
                disabled={wishlistLoading}
                aria-label={
                  isWishlisted
                    ? "Remove from wishlist"
                    : "Add to wishlist"
                }
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 bg-white text-2xl transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 ${
                  isWishlisted
                    ? "border-red-200 text-red-500"
                    : "border-gray-200 text-gray-500"
                }`}
              >
                {wishlistLoading
                  ? "..."
                  : isWishlisted
                    ? "♥"
                    : "♡"}
              </button>

            </div>

            <div className="mt-3 flex items-center gap-2">

              <span className="rounded-lg bg-green-600 px-2.5 py-1 text-sm font-black text-white">
                0.0 ★
              </span>

              <span className="text-sm font-bold text-gray-500">
                No reviews yet
              </span>

            </div>

            <div className="mt-6">
              <span className="text-4xl font-black text-[#07152f]">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-6">

              <h2 className="text-lg font-black">
                Product Description
              </h2>

              <p className="mt-2 leading-7 text-gray-600">
                {product.description}
              </p>

            </div>

            {/* SIZE */}

            {sizes.length > 0 && (
              <div className="mt-7">

                <div className="mb-3 flex items-center justify-between">

                  <h2 className="text-lg font-black">
                    Select Size
                  </h2>

                  <button
                    type="button"
                    onClick={() => setShowSizeChart(true)}
                    className="font-black text-[#172554] underline"
                  >
                    Size Chart
                  </button>

                </div>

                <div className="flex flex-wrap gap-3">

                  {sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-16 rounded-xl border-2 px-4 py-3 font-black ${
                        selectedSize === size
                          ? "border-[#07152f] bg-[#07152f] text-white"
                          : "border-gray-300 bg-white text-gray-900"
                      }`}
                    >
                      {size}
                    </button>
                  ))}

                </div>

              </div>
            )}

            {/* COLOUR */}

            {colors.length > 0 && (
              <div className="mt-7">

                <h2 className="mb-3 text-lg font-black">
                  Select Colour
                </h2>

                <div className="flex flex-wrap gap-3">

                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`rounded-xl border-2 px-5 py-3 font-black ${
                        selectedColor === color
                          ? "border-[#07152f] bg-[#07152f] text-white"
                          : "border-gray-300 bg-white text-gray-900"
                      }`}
                    >
                      {color}
                    </button>
                  ))}

                </div>

              </div>
            )}

            {/* QUANTITY */}

            <div className="mt-7">

              <h2 className="mb-3 text-lg font-black">
                Quantity
              </h2>

              <div className="flex w-fit items-center overflow-hidden rounded-xl border-2 border-gray-300 bg-white">

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((value) =>
                      Math.max(1, value - 1)
                    )
                  }
                  className="h-12 w-12 text-xl font-black"
                >
                  −
                </button>

                <span className="flex h-12 w-14 items-center justify-center border-x-2 border-gray-300 font-black">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((value) =>
                      Math.min(
                        product.stock > 0
                          ? product.stock
                          : 1,
                        value + 1
                      )
                    )
                  }
                  className="h-12 w-12 text-xl font-black"
                >
                  +
                </button>

              </div>

            </div>

            {/* BUTTONS */}

            <div className="mt-7 grid gap-3 sm:grid-cols-2">

              <button
                type="button"
                onClick={addToCart}
                disabled={
                  addingToCart || product.stock <= 0
                }
                className="rounded-xl border-2 border-[#07152f] bg-white px-6 py-4 font-black text-[#07152f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addingToCart
                  ? "Adding..."
                  : "🛒 Add to Cart"}
              </button>

              <button
                type="button"
                onClick={buyNow}
                disabled={product.stock <= 0}
                className="rounded-xl bg-[#07152f] px-6 py-4 font-black text-white disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {product.stock <= 0
                  ? "Out of Stock"
                  : "Buy Now →"}
              </button>

            </div>

            {/* DELIVERY */}

            <div className="mt-7 grid gap-3 sm:grid-cols-2">

              <div className="rounded-2xl border border-gray-200 bg-white p-4">

                <p className="text-lg">🚚</p>

                <p className="mt-2 font-black">
                  Fast Delivery
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Quick delivery available
                </p>

              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">

                <p className="text-lg">🔒</p>

                <p className="mt-2 font-black">
                  Secure Payment
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Safe & secure checkout
                </p>

              </div>

            </div>

          </div>
        </div>

        {/* SELLER */}

        {product.seller && (
          <div className="mt-10 rounded-3xl border-2 border-gray-200 bg-white p-6">

            <h2 className="text-xl font-black">
              Seller Information
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              <div>
                <p className="text-xs font-bold text-gray-500">
                  Shop Name
                </p>

                <p className="mt-1 font-black">
                  {product.seller.shopName || "Seller"}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500">
                  Owner
                </p>

                <p className="mt-1 font-black">
                  {product.seller.ownerName || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500">
                  City
                </p>

                <p className="mt-1 font-black">
                  {product.seller.city || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500">
                  Address
                </p>

                <p className="mt-1 font-black">
                  {product.seller.address || "—"}
                </p>
              </div>

            </div>

          </div>
        )}

        {/* HIGHLIGHTS */}

        <div className="mt-8 rounded-3xl border-2 border-gray-200 bg-white p-6">

          <h2 className="text-xl font-black">
            Product Highlights
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-2xl">✨</p>
              <p className="mt-2 font-black">
                Quality Product
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-2xl">👕</p>
              <p className="mt-2 font-black">
                Fashionable Design
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-2xl">📦</p>
              <p className="mt-2 font-black">
                Secure Packaging
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-2xl">🚚</p>
              <p className="mt-2 font-black">
                Fast Delivery
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">

              <p className="text-2xl">↩️</p>

              <p className="mt-2 font-black">
                2-Hour Return
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Return request can be raised within 2 hours after delivery.
              </p>

            </div>

          </div>

        </div>

        {/* REVIEWS */}

        <ReviewForm productId={product.id} />

        {/* SUGGESTIONS */}

        {suggestions.length > 0 && (
          <section className="mt-12">

            <div className="mb-6">

              <p className="text-sm font-black uppercase tracking-wider text-gray-500">
                More Products
              </p>

              <h2 className="mt-1 text-2xl font-black text-[#07152f] sm:text-3xl">
                You May Also Like
              </h2>

              <p className="mt-1 text-gray-500">
                More products you may like
              </p>

            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">

              {suggestions.map((item) => (
                <Link
                  key={item.id}
                  href={`/product/${item.id}`}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-xl"
                >

                  <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">

                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl">
                        👕
                      </div>
                    )}

                  </div>

                  <div className="p-4">

                    {item.category?.name && (
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                        {item.category.name}
                      </p>
                    )}

                    <h3 className="mt-1 line-clamp-1 font-black text-gray-900">
                      {item.name}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                      {item.description}
                    </p>

                    <p className="mt-3 text-xl font-black text-[#07152f]">
                      ₹{item.price.toLocaleString("en-IN")}
                    </p>

                  </div>

                </Link>
              ))}

            </div>

          </section>
        )}

      </div>

      {/* SIZE CHART */}

      {showSizeChart && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowSizeChart(false)}
        >

          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >

            <div className="flex items-start justify-between gap-4">

              <div>

                <h2 className="text-2xl font-black text-[#111827]">
                  Size Chart
                </h2>

                <p className="mt-1 text-sm font-semibold text-gray-500">
                  Choose the right size for you
                </p>

              </div>

              <button
                type="button"
                onClick={() => setShowSizeChart(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl font-black"
              >
                ×
              </button>

            </div>

            <div className="mt-6 overflow-x-auto rounded-2xl border-2 border-gray-200">

              <table className="w-full min-w-[420px] border-collapse text-left">

                <thead>

                  <tr className="bg-[#07152f] text-white">

                    <th className="px-4 py-4 font-black">
                      Size
                    </th>

                    <th className="px-4 py-4 font-black">
                      Chest
                    </th>

                    <th className="px-4 py-4 font-black">
                      Length
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {sizes.map((size, index) => {

                    const measurement =
                      getMeasurements(size);

                    return (
                      <tr
                        key={size}
                        className={
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-gray-50"
                        }
                      >

                        <td className="border-t border-gray-200 px-4 py-4 font-black">
                          {size}
                        </td>

                        <td className="border-t border-gray-200 px-4 py-4 font-semibold">
                          {measurement.chest}
                        </td>

                        <td className="border-t border-gray-200 px-4 py-4 font-semibold">
                          {measurement.length}
                        </td>

                      </tr>
                    );

                  })}

                </tbody>

              </table>

            </div>

            <p className="mt-4 text-xs font-semibold text-gray-500">
              Measurements are approximate and may vary slightly depending on the product design.
            </p>

          </div>

        </div>
      )}

    </main>
  );
}
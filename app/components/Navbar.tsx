"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getSession, signOut } from "next-auth/react";

type Suggestion = {
  text: string;
  type: "category" | "product" | "style" | "material" | "occasion" | "colour";
};

const SEARCH_SUGGESTIONS: Suggestion[] = [
  // MEN
  { text: "Men", type: "category" },
  { text: "Men shirts", type: "category" },
  { text: "Men t-shirts", type: "category" },
  { text: "Men jeans", type: "category" },
  { text: "Men pants", type: "category" },
  { text: "Men cargo pants", type: "category" },
  { text: "Men joggers", type: "category" },
  { text: "Men jackets", type: "category" },
  { text: "Men hoodies", type: "category" },
  { text: "Men footwear", type: "category" },
  { text: "Men sneakers", type: "category" },
  { text: "Men formal wear", type: "style" },
  { text: "Men casual wear", type: "style" },
  { text: "Men partywear", type: "style" },
  { text: "Men oversized", type: "style" },
  { text: "Men slim fit", type: "style" },

  // WOMEN
  { text: "Women", type: "category" },
  { text: "Women saree", type: "category" },
  { text: "Women kurti", type: "category" },
  { text: "Women kurta", type: "category" },
  { text: "Women suit", type: "category" },
  { text: "Women salwar suit", type: "category" },
  { text: "Women anarkali", type: "category" },
  { text: "Women lehenga", type: "category" },
  { text: "Women dress", type: "category" },
  { text: "Women gown", type: "category" },
  { text: "Women tops", type: "category" },
  { text: "Women jeans", type: "category" },
  { text: "Women skirts", type: "category" },
  { text: "Women footwear", type: "category" },
  { text: "Women heels", type: "category" },
  { text: "Women flats", type: "category" },
  { text: "Women partywear", type: "style" },
  { text: "Women western wear", type: "style" },
  { text: "Women ethnic wear", type: "style" },

  // KIDS
  { text: "Kids", type: "category" },
  { text: "Boys", type: "category" },
  { text: "Boys shirts", type: "category" },
  { text: "Boys t-shirts", type: "category" },
  { text: "Boys jeans", type: "category" },
  { text: "Boys pants", type: "category" },
  { text: "Boys jackets", type: "category" },
  { text: "Boys footwear", type: "category" },
  { text: "Girls", type: "category" },
  { text: "Girls dresses", type: "category" },
  { text: "Girls frocks", type: "category" },
  { text: "Girls tops", type: "category" },
  { text: "Girls jeans", type: "category" },
  { text: "Girls footwear", type: "category" },
  { text: "Baby clothes", type: "category" },
  { text: "Baby romper", type: "category" },
  { text: "Baby onesie", type: "category" },
  { text: "Toddler clothes", type: "category" },

  // FOOTWEAR
  { text: "Footwear", type: "category" },
  { text: "Shoes", type: "category" },
  { text: "Sneakers", type: "category" },
  { text: "Sports shoes", type: "category" },
  { text: "Running shoes", type: "category" },
  { text: "Sandals", type: "category" },
  { text: "Slippers", type: "category" },
  { text: "Boots", type: "category" },
  { text: "Loafers", type: "category" },
  { text: "Flats", type: "category" },
  { text: "Heels", type: "category" },
  { text: "Jutti", type: "category" },

  // ACCESSORIES
  { text: "Accessories", type: "category" },
  { text: "Bags", type: "category" },
  { text: "Handbags", type: "category" },
  { text: "Backpacks", type: "category" },
  { text: "Wallets", type: "category" },
  { text: "Belts", type: "category" },
  { text: "Watches", type: "category" },
  { text: "Sunglasses", type: "category" },
  { text: "Caps", type: "category" },
  { text: "Hats", type: "category" },
  { text: "Jewellery", type: "category" },
  { text: "Earrings", type: "category" },
  { text: "Necklaces", type: "category" },
  { text: "Bracelets", type: "category" },
  { text: "Rings", type: "category" },

  // ETHNIC
  { text: "Ethnic wear", type: "category" },
  { text: "Saree", type: "category" },
  { text: "Kurta", type: "category" },
  { text: "Kurti", type: "category" },
  { text: "Lehenga", type: "category" },
  { text: "Salwar suit", type: "category" },
  { text: "Anarkali", type: "category" },
  { text: "Dupatta", type: "category" },
  { text: "Palazzo", type: "category" },

  // STYLE
  { text: "Casual wear", type: "style" },
  { text: "Formal wear", type: "style" },
  { text: "Partywear", type: "style" },
  { text: "Wedding wear", type: "occasion" },
  { text: "Festive wear", type: "occasion" },
  { text: "Office wear", type: "occasion" },
  { text: "Daily wear", type: "occasion" },
  { text: "Western wear", type: "style" },
  { text: "Streetwear", type: "style" },
  { text: "Oversized", type: "style" },
  { text: "Slim fit", type: "style" },
  { text: "Regular fit", type: "style" },
  { text: "Relaxed fit", type: "style" },
  { text: "Loose fit", type: "style" },
  { text: "Skinny fit", type: "style" },
  { text: "Straight fit", type: "style" },
  { text: "High waist", type: "style" },
  { text: "Low waist", type: "style" },

  // MATERIAL
  { text: "Cotton", type: "material" },
  { text: "Denim", type: "material" },
  { text: "Silk", type: "material" },
  { text: "Linen", type: "material" },
  { text: "Wool", type: "material" },
  { text: "Rayon", type: "material" },
  { text: "Viscose", type: "material" },
  { text: "Polyester", type: "material" },
  { text: "Georgette", type: "material" },
  { text: "Chiffon", type: "material" },
  { text: "Crepe", type: "material" },
  { text: "Velvet", type: "material" },
  { text: "Satin", type: "material" },
  { text: "Leather", type: "material" },
  { text: "Khadi", type: "material" },
  { text: "Organza", type: "material" },
  { text: "Modal", type: "material" },

  // COLOURS
  { text: "Black", type: "colour" },
  { text: "White", type: "colour" },
  { text: "Red", type: "colour" },
  { text: "Blue", type: "colour" },
  { text: "Navy blue", type: "colour" },
  { text: "Sky blue", type: "colour" },
  { text: "Green", type: "colour" },
  { text: "Olive", type: "colour" },
  { text: "Yellow", type: "colour" },
  { text: "Pink", type: "colour" },
  { text: "Purple", type: "colour" },
  { text: "Orange", type: "colour" },
  { text: "Brown", type: "colour" },
  { text: "Grey", type: "colour" },
  { text: "Beige", type: "colour" },
  { text: "Cream", type: "colour" },
  { text: "Maroon", type: "colour" },
  { text: "Gold", type: "colour" },
  { text: "Silver", type: "colour" },
  { text: "Peach", type: "colour" },
  { text: "Wine", type: "colour" },
  { text: "Rust", type: "colour" },
  { text: "Teal", type: "colour" },
  { text: "Turquoise", type: "colour" },
  { text: "Mustard", type: "colour" },
  { text: "Lavender", type: "colour" },

  // HINDI / HINGLISH
  { text: "ladko ke kapde", type: "category" },
  { text: "ladkiyon ke kapde", type: "category" },
  { text: "boys kapde", type: "category" },
  { text: "girls kapde", type: "category" },
  { text: "bacchon ke kapde", type: "category" },
  { text: "ladko ki shirt", type: "category" },
  { text: "ladko ki t shirt", type: "category" },
  { text: "ladki ki dress", type: "category" },
  { text: "ladki ki kurti", type: "category" },
  { text: "mahila suit", type: "category" },
  { text: "ladies suit", type: "category" },
  { text: "sadi", type: "category" },
  { text: "jutti", type: "category" },
  { text: "juta", type: "category" },
  { text: "chappal", type: "category" },
  { text: "kapde", type: "category" },
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0900-\u097f\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSuggestionIcon(type: Suggestion["type"]) {
  switch (type) {
    case "category":
      return "⌕";
    case "style":
      return "✦";
    case "material":
      return "◇";
    case "occasion":
      return "◈";
    case "colour":
      return "●";
    default:
      return "⌕";
  }
}

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const mobileSearchWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function checkSession() {
      const session = await getSession();

      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }

      setLoading(false);
    }

    checkSession();
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;

      const desktopInside =
        searchWrapperRef.current?.contains(target) ?? false;

      const mobileInside =
        mobileSearchWrapperRef.current?.contains(target) ?? false;

      if (!desktopInside && !mobileInside) {
        setShowSuggestions(false);
        setActiveSuggestion(-1);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  async function handleLogout() {
    await signOut({
      callbackUrl: "/",
    });
  }

  function getSuggestions(value: string) {
    const query = normalizeText(value);

    if (!query) return [];

    const queryWords = query.split(" ").filter(Boolean);

    const results = SEARCH_SUGGESTIONS
      .map((item, index) => {
        const normalized = normalizeText(item.text);

        let score = 0;

        if (normalized === query) {
          score += 1000;
        }

        if (normalized.startsWith(query)) {
          score += 500;
        }

        if (normalized.includes(query)) {
          score += 250;
        }

        for (const word of queryWords) {
          if (normalized.startsWith(word)) {
            score += 100;
          } else if (normalized.includes(word)) {
            score += 50;
          }
        }

        score += Math.max(0, 80 - normalized.length);

        return {
          ...item,
          index,
          score,
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        return a.index - b.index;
      })
      .slice(0, 8);

    return results;
  }

  const suggestions = getSuggestions(search);

  function performSearch(queryValue: string) {
    const query = queryValue.trim();

    if (!query) return;

    setSearch(query);
    setShowSuggestions(false);
    setActiveSuggestion(-1);

    window.location.href = `/product?search=${encodeURIComponent(query)}`;
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    performSearch(search);
  }

  function handleSearchKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Escape") {
        setShowSuggestions(false);
        setActiveSuggestion(-1);
      }

      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();

      setActiveSuggestion((current) => {
        if (current >= suggestions.length - 1) {
          return 0;
        }

        return current + 1;
      });

      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();

      setActiveSuggestion((current) => {
        if (current <= 0) {
          return suggestions.length - 1;
        }

        return current - 1;
      });

      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();

      if (
        activeSuggestion >= 0 &&
        activeSuggestion < suggestions.length
      ) {
        performSearch(suggestions[activeSuggestion].text);
      } else {
        performSearch(search);
      }

      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }
  }

  function handleInputChange(value: string) {
    setSearch(value);
    setActiveSuggestion(-1);

    if (value.trim()) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }

  return (
    <>
      {/* ================= TOP UTILITY BAR ================= */}
      <div className="bg-[#07152f] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-9 flex items-center justify-between text-[11px] sm:text-xs">
          <p className="tracking-wide text-gray-300">
            Fashion Without Tym Limits
          </p>

          <div className="hidden sm:flex items-center gap-5 text-gray-300">
            <span>Fast &amp; Reliable 1–2 Hour Delivery</span>

            <span className="text-gray-600">|</span>

            <span>Premium Fashion. Delivered Fast.</span>
          </div>
        </div>
      </div>

      {/* ================= MAIN NAVBAR ================= */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="min-h-[78px] flex items-center justify-between gap-5">

            {/* ================= LOGO ================= */}
            <Link
              href="/"
              className="shrink-0 text-[27px] sm:text-[31px] font-black tracking-[-1.5px] text-[#07152f]"
            >
              ClothTym
            </Link>

            {/* ================= DESKTOP SEARCH ================= */}
            <div
              ref={searchWrapperRef}
              className="hidden md:flex flex-1 max-w-[560px] relative"
            >
              <form onSubmit={handleSearch} className="w-full">
                <div className="w-full h-[48px] rounded-full border border-gray-300 bg-[#f7f7f7] flex items-center px-4 transition focus-within:border-[#07152f] focus-within:bg-white">

                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-gray-500 shrink-0"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-4-4" />
                  </svg>

                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      handleInputChange(e.target.value)
                    }
                    onFocus={() => {
                      if (search.trim()) {
                        setShowSuggestions(true);
                      }
                    }}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search for fashion, products and more"
                    autoComplete="off"
                    className="flex-1 bg-transparent outline-none px-3 text-sm text-black placeholder:text-gray-500"
                  />

                  {search.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setShowSuggestions(false);
                        setActiveSuggestion(-1);
                      }}
                      aria-label="Clear search"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-black transition mr-1"
                    >
                      ×
                    </button>
                  )}

                  <button
                    type="submit"
                    className="bg-[#07152f] text-white rounded-full px-5 h-[36px] text-sm font-semibold hover:bg-black transition"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* ================= DESKTOP SUGGESTIONS ================= */}
              {showSuggestions && search.trim() && (
                <div className="absolute top-[56px] left-0 right-0 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">

                  {suggestions.length > 0 ? (
                    <>
                      <div className="px-4 py-3 border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Search suggestions
                      </div>

                      <div className="py-1">
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={`${suggestion.text}-${index}`}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              performSearch(suggestion.text);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                              activeSuggestion === index
                                ? "bg-gray-100"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                              {getSuggestionIcon(suggestion.type)}
                            </span>

                            <span className="flex-1 min-w-0">
                              <span className="block text-sm font-medium text-gray-900 truncate">
                                {suggestion.text}
                              </span>

                              <span className="block text-[11px] text-gray-400 capitalize mt-0.5">
                                {suggestion.type}
                              </span>
                            </span>

                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="text-gray-400 shrink-0"
                            >
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                          </button>
                        ))}
                      </div>

                      <div className="px-4 py-2.5 border-t border-gray-100 text-[11px] text-gray-400">
                        Press Enter to search
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        performSearch(search);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 transition"
                    >
                      <span className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                        ⌕
                      </span>

                      <span>
                        <span className="block text-sm font-semibold text-gray-900">
                          Search for “{search.trim()}”
                        </span>

                        <span className="block text-[11px] text-gray-400 mt-0.5">
                          View matching products
                        </span>
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ================= RIGHT ACTIONS ================= */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">

              {/* WISHLIST */}
              <Link
                href="/product"
                aria-label="Wishlist"
                className="hidden sm:flex w-10 h-10 rounded-full items-center justify-center hover:bg-gray-100 transition"
              >
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M20.8 8.7c0 5.5-8.8 10.2-8.8 10.2S3.2 14.2 3.2 8.7A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.6Z" />
                </svg>
              </Link>

              {/* LOGIN */}
              {!loading && !user && (
                <Link
                  href="/login"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 text-sm font-semibold text-black hover:border-black hover:bg-gray-50 transition"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="8" r="3.5" />
                    <path d="M5 20c.8-3.4 3.2-5 7-5s6.2 1.6 7 5" />
                  </svg>
                  Login
                </Link>
              )}

              {/* LOGGED-IN USER */}
              {!loading && user && (
                <div className="hidden sm:flex items-center gap-2">

                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-50 border border-gray-200 hover:bg-gray-100 transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#07152f] text-white flex items-center justify-center">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="8" r="3.5" />
                        <path d="M5 20c.8-3.4 3.2-5 7-5s6.2 1.6 7 5" />
                      </svg>
                    </div>

                    <span className="max-w-[110px] truncate text-sm font-semibold text-black">
                      {user.name || user.email}
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3 py-2 text-sm font-semibold text-gray-600 hover:text-black transition"
                  >
                    Logout
                  </button>
                </div>
              )}

              {/* CART */}
              <Link
                href="/cart"
                className="h-10 px-4 sm:px-5 rounded-full bg-[#07152f] text-white flex items-center gap-2 text-sm font-semibold hover:bg-black transition"
              >
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="9" cy="20" r="1.4" />
                  <circle cx="18" cy="20" r="1.4" />
                  <path d="M3 4h2l2.2 11h11.3l2-8H6" />
                </svg>

                <span>Cart</span>
              </Link>
            </div>
          </div>

          {/* ================= MOBILE SEARCH ================= */}
          <div
            ref={mobileSearchWrapperRef}
            className="md:hidden relative pb-4"
          >
            <form onSubmit={handleSearch}>
              <div className="h-[46px] rounded-full border border-gray-300 bg-[#f7f7f7] flex items-center px-4">

                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-500 shrink-0"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4-4" />
                </svg>

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    handleInputChange(e.target.value)
                  }
                  onFocus={() => {
                    if (search.trim()) {
                      setShowSuggestions(true);
                    }
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search fashion & products..."
                  autoComplete="off"
                  className="flex-1 bg-transparent outline-none px-3 text-sm"
                />

                {search.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setShowSuggestions(false);
                      setActiveSuggestion(-1);
                    }}
                    aria-label="Clear search"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition mr-1"
                  >
                    ×
                  </button>
                )}

                <button
                  type="submit"
                  aria-label="Search"
                  className="w-9 h-9 rounded-full bg-[#07152f] text-white flex items-center justify-center"
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-4-4" />
                  </svg>
                </button>
              </div>
            </form>

            {/* ================= MOBILE SUGGESTIONS ================= */}
            {showSuggestions && search.trim() && (
              <div className="absolute top-[52px] left-0 right-0 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">

                {suggestions.length > 0 ? (
                  <>
                    <div className="px-4 py-3 border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Search suggestions
                    </div>

                    <div className="py-1 max-h-[360px] overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={`mobile-${suggestion.text}-${index}`}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            performSearch(suggestion.text);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                            activeSuggestion === index
                              ? "bg-gray-100"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                            {getSuggestionIcon(suggestion.type)}
                          </span>

                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-medium text-gray-900 truncate">
                              {suggestion.text}
                            </span>

                            <span className="block text-[11px] text-gray-400 capitalize mt-0.5">
                              {suggestion.type}
                            </span>
                          </span>

                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-gray-400 shrink-0"
                          >
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      performSearch(search);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 transition"
                  >
                    <span className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                      ⌕
                    </span>

                    <span>
                      <span className="block text-sm font-semibold text-gray-900">
                        Search for “{search.trim()}”
                      </span>

                      <span className="block text-[11px] text-gray-400 mt-0.5">
                        View matching products
                      </span>
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ================= CATEGORY NAVIGATION ================= */}
          <div className="hidden md:flex items-center justify-center gap-8 border-t border-gray-100 h-[48px]">

            {/* MEN */}
            <Link
              href="/product?search=Men"
              className="text-sm font-semibold text-gray-700 hover:text-black transition"
            >
              Men
            </Link>

            {/* WOMEN */}
            <Link
              href="/product?search=Women"
              className="text-sm font-semibold text-gray-700 hover:text-black transition"
            >
              Women
            </Link>

            {/* KIDS */}
            <Link
              href="/product?search=Kids"
              className="text-sm font-semibold text-gray-700 hover:text-black transition"
            >
              Kids
            </Link>

            {/* FOOTWEAR */}
            <Link
              href="/product?search=Footwear"
              className="text-sm font-semibold text-gray-700 hover:text-black transition"
            >
              Footwear
            </Link>

            {/* ACCESSORIES */}
            <Link
              href="/product?search=Accessories"
              className="text-sm font-semibold text-gray-700 hover:text-black transition"
            >
              Accessories
            </Link>

          </div>
        </div>
      </header>

      {/* ================= MOBILE CATEGORY NAVIGATION ================= */}
      <div className="md:hidden bg-white border-b border-gray-200 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-6 h-[45px] whitespace-nowrap">

          {/* MEN */}
          <Link
            href="/product?search=Men"
            className="text-xs font-semibold text-gray-700"
          >
            Men
          </Link>

          {/* WOMEN */}
          <Link
            href="/product?search=Women"
            className="text-xs font-semibold text-gray-700"
          >
            Women
          </Link>

          {/* KIDS */}
          <Link
            href="/product?search=Kids"
            className="text-xs font-semibold text-gray-700"
          >
            Kids
          </Link>

          {/* FOOTWEAR */}
          <Link
            href="/product?search=Footwear"
            className="text-xs font-semibold text-gray-700"
          >
            Footwear
          </Link>

          {/* ACCESSORIES */}
          <Link
            href="/product?search=Accessories"
            className="text-xs font-semibold text-gray-700"
          >
            Accessories
          </Link>

        </div>
      </div>
    </>
  );
}
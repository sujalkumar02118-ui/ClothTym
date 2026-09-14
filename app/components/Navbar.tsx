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

function SearchIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function UserIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.4 3.2-5 7-5s6.2 1.6 7 5" />
    </svg>
  );
}

function WishlistIcon({ size = 21 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M20.8 8.7c0 5.5-8.8 10.2-8.8 10.2S3.2 14.2 3.2 8.7A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.6Z" />
    </svg>
  );
}

function CartIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M3 4h2l2.2 11h11.3l2-8H6" />
    </svg>
  );
}

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const session = await getSession();

        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      } catch {
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;

      const desktopInside =
        desktopSearchRef.current?.contains(target) ?? false;

      const mobileInside =
        mobileSearchRef.current?.contains(target) ?? false;

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

    return SEARCH_SUGGESTIONS
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

      setActiveSuggestion((current) =>
        current >= suggestions.length - 1 ? 0 : current + 1
      );

      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();

      setActiveSuggestion((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1
      );

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
    setShowSuggestions(Boolean(value.trim()));
  }

  function clearSearch() {
    setSearch("");
    setShowSuggestions(false);
    setActiveSuggestion(-1);
  }

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden">
      {/* TOP UTILITY BAR */}

      <div className="w-full bg-[#07152f] text-white">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 h-8 sm:h-9 flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-[10px] sm:text-xs tracking-wide text-gray-300">
            Fashion Without Tym Limits
          </p>

          <div className="hidden lg:flex items-center gap-5 text-xs text-gray-300 shrink-0">
            <span>Fast &amp; Reliable 1–2 Hour Delivery</span>
            <span className="text-gray-600">|</span>
            <span>Premium Fashion. Delivered Fast.</span>
          </div>
        </div>
      </div>

      {/* MAIN HEADER */}

      <header className="w-full bg-white border-b border-gray-200">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">

          {/* TOP ROW */}

          <div className="min-w-0 min-h-[62px] sm:min-h-[76px] flex items-center gap-2 sm:gap-4">

            {/* LOGO */}

            <Link
              href="/"
              className="shrink-0 whitespace-nowrap text-[22px] xs:text-[23px] sm:text-[28px] lg:text-[31px] font-black tracking-[-1.5px] text-[#07152f]"
            >
              ClothTym
            </Link>

            {/* DESKTOP SEARCH */}

            <div
              ref={desktopSearchRef}
              className="hidden md:flex flex-1 min-w-0 max-w-[600px] mx-auto relative"
            >
              <form onSubmit={handleSearch} className="w-full">
                <div className="w-full h-[46px] lg:h-[48px] rounded-full border border-gray-300 bg-[#f7f7f7] flex items-center px-3 lg:px-4 transition focus-within:border-[#07152f] focus-within:bg-white">

                  <span className="text-gray-500 shrink-0">
                    <SearchIcon size={18} />
                  </span>

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
                    className="min-w-0 flex-1 bg-transparent outline-none px-3 text-sm text-black placeholder:text-gray-500"
                  />

                  {search.trim() && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      aria-label="Clear search"
                      className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
                    >
                      ×
                    </button>
                  )}

                  <button
                    type="submit"
                    className="shrink-0 bg-[#07152f] text-white rounded-full px-4 lg:px-5 h-[36px] text-xs lg:text-sm font-semibold hover:bg-black transition"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* DESKTOP SUGGESTIONS */}

              {showSuggestions && search.trim() && (
                <div className="absolute top-[54px] left-0 right-0 z-[100] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
                  {suggestions.length > 0 ? (
                    <>
                      <div className="px-4 py-3 border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Search suggestions
                      </div>

                      <div className="py-1 max-h-[420px] overflow-y-auto">
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
                              aria-hidden="true"
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
                      <span className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                        ⌕
                      </span>

                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-gray-900 truncate">
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

            {/* DESKTOP ACTIONS */}

            <div className="hidden md:flex items-center gap-1 lg:gap-2 shrink-0">

              {/* WISHLIST */}

              <Link
                href="/wishlist"
                aria-label="Wishlist"
                className="w-10 h-10 lg:w-11 lg:h-11 rounded-full flex items-center justify-center hover:bg-gray-100 transition"
              >
                <WishlistIcon />
              </Link>

              {/* LOGIN */}

              {!loading && !user && (
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-3 lg:px-4 py-2 rounded-full border border-gray-300 text-sm font-semibold text-black hover:border-black hover:bg-gray-50 transition whitespace-nowrap"
                >
                  <UserIcon size={18} />
                  <span>Login</span>
                </Link>
              )}

              {/* LOGGED-IN USER */}

              {!loading && user && (
                <div className="flex items-center gap-1 lg:gap-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-2 lg:px-3 py-2 rounded-full bg-gray-50 border border-gray-200 hover:bg-gray-100 transition max-w-[160px]"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#07152f] text-white flex items-center justify-center shrink-0">
                      <UserIcon size={16} />
                    </div>

                    <span className="max-w-[90px] truncate text-sm font-semibold text-black">
                      {user.name || user.email}
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-2 lg:px-3 py-2 text-sm font-semibold text-gray-600 hover:text-black transition whitespace-nowrap"
                  >
                    Logout
                  </button>
                </div>
              )}

              {/* CART */}

              <Link
                href="/cart"
                className="h-10 lg:h-11 px-3 lg:px-5 rounded-full bg-[#07152f] text-white flex items-center gap-1.5 lg:gap-2 text-xs lg:text-sm font-semibold hover:bg-black transition whitespace-nowrap"
              >
                <CartIcon />
                <span>Cart</span>
              </Link>
            </div>

            {/* MOBILE ACTIONS */}

            <div
              className="
                !flex md:!hidden
                ml-auto
                min-w-0
                items-center
                justify-end
                gap-0.5
                shrink-0
              "
            >

              {/* MOBILE WISHLIST */}

              <Link
                href="/wishlist"
                aria-label="Wishlist"
                className="
                  !flex
                  w-10
                  h-10
                  min-w-10
                  shrink-0
                  rounded-full
                  items-center
                  justify-center
                  text-[#07152f]
                  active:bg-gray-100
                "
              >
                <WishlistIcon size={20} />
              </Link>

              {/* MOBILE LOGIN */}

              {!loading && !user && (
                <Link
                  href="/login"
                  aria-label="Login"
                  className="
                    !flex
                    w-10
                    h-10
                    min-w-10
                    shrink-0
                    rounded-full
                    items-center
                    justify-center
                    text-[#07152f]
                    active:bg-gray-100
                  "
                >
                  <UserIcon size={20} />
                </Link>
              )}

              {/* MOBILE PROFILE */}

              {!loading && user && (
                <Link
                  href="/profile"
                  aria-label="Profile"
                  className="
                    !flex
                    w-10
                    h-10
                    min-w-10
                    shrink-0
                    rounded-full
                    bg-[#07152f]
                    text-white
                    items-center
                    justify-center
                  "
                >
                  <UserIcon size={18} />
                </Link>
              )}

              {/* MOBILE CART */}

              <Link
                href="/cart"
                aria-label="Cart"
                className="
                  !flex
                  h-10
                  min-w-[58px]
                  shrink-0
                  px-2.5
                  rounded-full
                  bg-[#07152f]
                  text-white
                  items-center
                  justify-center
                  gap-1.5
                  text-[11px]
                  font-semibold
                  active:bg-black
                "
              >
                <CartIcon size={17} />
                <span>Cart</span>
              </Link>
            </div>
          </div>

          {/* MOBILE SEARCH */}

          <div
            ref={mobileSearchRef}
            className="md:hidden relative pb-3"
          >
            <form onSubmit={handleSearch}>
              <div className="w-full h-[46px] rounded-full border border-gray-300 bg-[#f7f7f7] flex items-center px-2.5 focus-within:border-[#07152f] focus-within:bg-white">

                <span className="text-gray-500 shrink-0">
                  <SearchIcon size={18} />
                </span>

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
                  className="min-w-0 flex-1 bg-transparent outline-none px-2.5 text-[16px] text-black placeholder:text-gray-500"
                />

                {search.trim() && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    aria-label="Clear search"
                    className="w-8 h-8 min-w-8 shrink-0 rounded-full flex items-center justify-center text-gray-500 active:bg-gray-200 mr-0.5"
                  >
                    ×
                  </button>
                )}

                <button
                  type="submit"
                  aria-label="Search"
                  className="w-9 h-9 min-w-9 shrink-0 rounded-full bg-[#07152f] text-white flex items-center justify-center"
                >
                  <SearchIcon size={17} />
                </button>
              </div>
            </form>

            {/* MOBILE SUGGESTIONS */}

            {showSuggestions && search.trim() && (
              <div className="absolute top-[51px] left-0 right-0 z-[100] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
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
                            aria-hidden="true"
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
                    <span className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                      ⌕
                    </span>

                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-gray-900 truncate">
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

          {/* DESKTOP CATEGORY NAVIGATION */}

          <div className="hidden md:flex items-center justify-center gap-7 lg:gap-9 border-t border-gray-100 h-[46px]">
            <Link
              href="/product?category=Men"
              className="text-sm font-semibold text-gray-700 hover:text-black transition"
            >
              Men
            </Link>

            <Link
              href="/product?category=Women"
              className="text-sm font-semibold text-gray-700 hover:text-black transition"
            >
              Women
            </Link>

            <Link
              href="/product?category=Kids"
              className="text-sm font-semibold text-gray-700 hover:text-black transition"
            >
              Kids
            </Link>

            <Link
              href="/product?category=Footwear"
              className="text-sm font-semibold text-gray-700 hover:text-black transition"
            >
              Footwear
            </Link>

            <Link
              href="/product?category=Accessories"
              className="text-sm font-semibold text-gray-700 hover:text-black transition"
            >
              Accessories
            </Link>
          </div>
        </div>
      </header>

      {/* MOBILE CATEGORY NAVIGATION */}

      <div className="md:hidden w-full max-w-[100vw] bg-white border-b border-gray-200 overflow-x-auto overscroll-x-contain">
        <div className="w-max min-w-full px-4 flex items-center gap-6 h-[43px] whitespace-nowrap">
          <Link
            href="/product?category=Men"
            className="shrink-0 text-xs font-semibold text-gray-700"
          >
            Men
          </Link>

          <Link
            href="/product?category=Women"
            className="shrink-0 text-xs font-semibold text-gray-700"
          >
            Women
          </Link>

          <Link
            href="/product?category=Kids"
            className="shrink-0 text-xs font-semibold text-gray-700"
          >
            Kids
          </Link>

          <Link
            href="/product?category=Footwear"
            className="shrink-0 text-xs font-semibold text-gray-700"
          >
            Footwear
          </Link>

          <Link
            href="/product?category=Accessories"
            className="shrink-0 text-xs font-semibold text-gray-700"
          >
            Accessories
          </Link>
        </div>
      </div>
    </div>
  );
}
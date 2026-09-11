"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSession, signOut } from "next-auth/react";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  async function handleLogout() {
    await signOut({
      callbackUrl: "/",
    });
  }

  return (
    <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between gap-6">

      {/* LOGO */}
      <Link
        href="/"
        className="text-3xl font-bold text-black tracking-tight shrink-0"
      >
        ClothTym
      </Link>


      {/* SEARCH BAR */}
      <div className="hidden md:flex items-center bg-white border-[2.5px] border-black rounded-full w-[420px] h-[52px] px-2 shadow-md">

        {/* Search Icon */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center">
          <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-black"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
        </div>


        {/* Search Input */}
        <input
          type="text"
          placeholder="Search fashion, products..."
          className="flex-1 outline-none text-black font-medium placeholder:text-gray-600 px-2 bg-transparent"
        />


        {/* Search Button */}
        <button
          type="button"
          className="w-11 h-11 rounded-full bg-[#07152f] text-white flex items-center justify-center hover:bg-black transition"
        >
          <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
        </button>

      </div>


      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3 shrink-0">


        {/* LOGIN */}
        {!loading && !user && (
          <Link
            href="/login"
            className="flex items-center gap-2 border-2 border-black px-6 py-2.5 rounded-full font-bold text-black hover:bg-black hover:text-white transition"
          >

            {/* User Icon */}
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20c.8-3.4 3.2-5 7-5s6.2 1.6 7 5" />
            </svg>

            Login

          </Link>
        )}


        {/* LOGGED IN USER */}
        {!loading && user && (
          <div className="flex items-center gap-3">

            {/* USER */}
            <div className="flex items-center gap-3">

              {/* User Icon */}
              <div className="w-11 h-11 rounded-full border-2 border-black flex items-center justify-center bg-white">

                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-black"
                >
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 20c.8-3.4 3.2-5 7-5s6.2 1.6 7 5" />
                </svg>

              </div>


              {/* Welcome + Name */}
              <div className="hidden sm:block leading-tight">

                <p className="text-sm font-bold text-black">
                  Welcome
                </p>

                <p className="text-base font-extrabold text-black">
                  {user.name || user.email}
                </p>

              </div>

            </div>


            {/* LOGOUT */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 border-2 border-black px-5 py-2.5 rounded-full font-bold text-black hover:bg-black hover:text-white transition"
            >

              {/* Logout Icon */}
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
                <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
              </svg>

              Logout

            </button>

          </div>
        )}


        {/* CART */}
        <Link
          href="/cart"
          className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-full font-bold hover:bg-[#07152f] transition"
        >

          {/* Cart Icon */}
          <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.3"
          >
            <circle cx="9" cy="20" r="1.5" />
            <circle cx="18" cy="20" r="1.5" />
            <path d="M3 4h2l2.2 11h11.3l2-8H6" />
          </svg>

          Cart

        </Link>

      </div>

    </nav>
  );
}
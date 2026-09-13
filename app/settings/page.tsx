"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/settings/notifications",
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (response.status === 401) {
          router.push(
            "/login?callbackUrl=/settings"
          );
          return;
        }

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Failed to load settings."
          );
        }

        setEnabled(
          data.notificationsEnabled !== false
        );
      } catch (err) {
        console.error(
          "SETTINGS LOAD ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load settings."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [router]);

  async function toggleNotifications() {
    if (saving) return;

    const newValue = !enabled;

    setSaving(true);
    setError("");

    // Optimistic UI
    setEnabled(newValue);

    try {
      const response = await fetch(
        "/api/settings/notifications",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notificationsEnabled: newValue,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        router.push(
          "/login?callbackUrl=/settings"
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to update notification settings."
        );
      }

      setEnabled(
        data.notificationsEnabled === true
      );
    } catch (err) {
      console.error(
        "SETTINGS UPDATE ERROR:",
        err
      );

      // Roll back if save failed
      setEnabled(!newValue);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update notification settings."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#e5e6e8] text-[#3f4147]">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b border-gray-200 bg-white">

        <div className="mx-auto flex h-[72px] max-w-4xl items-center px-4">

          <Link
            href="/profile"
            aria-label="Back to profile"
            className="mr-5 flex h-11 w-11 items-center justify-center text-4xl font-light text-[#3f4147]"
          >
            ‹
          </Link>

          <h1 className="text-[22px] font-normal tracking-wide">
            SETTINGS
          </h1>

        </div>

      </header>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="mx-auto max-w-4xl px-3 py-3">

        {error && (
          <div className="mb-3 border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {/* ===================================================
            NOTIFICATIONS
        =================================================== */}

        <section className="border border-gray-300 bg-white shadow-sm">

          <button
            type="button"
            onClick={toggleNotifications}
            disabled={loading || saving}
            className="flex min-h-[116px] w-full items-center justify-between px-6 py-5 text-left disabled:cursor-wait"
          >

            <div className="pr-5">

              <h2 className="text-[21px] font-normal text-[#65676c]">
                Notifications
              </h2>

              <p className="mt-1 text-[17px] font-normal text-[#8a8c91]">
                This will not affect any order updates
              </p>

            </div>

            {/* =================================================
                CHECKBOX / TOGGLE
            ================================================= */}

            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] border ${
                enabled
                  ? "border-[#00bfa5] bg-[#00bfa5]"
                  : "border-gray-400 bg-white"
              }`}
            >
              {enabled && (
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12.5 10 17 19 7" />
                </svg>
              )}
            </span>

          </button>

        </section>

      </div>

    </main>
  );
}
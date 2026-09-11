"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SavedRegistration = {
  storeName?: string | null;
  ownerName?: string | null;
  businessName?: string | null;
  businessType?: string | null;
};

export default function SellerDetailsPage() {
  const router = useRouter();

  const [storeName, setStoreName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");

  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Load already saved seller registration details
  useEffect(() => {
    let cancelled = false;

    async function loadRegistration() {
      try {
        const response = await fetch("/api/seller-registration", {
          method: "GET",
          cache: "no-store",
        });

        if (response.status === 401) {
          router.replace(
            "/login?callbackUrl=/seller-register/details"
          );
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || "Unable to load seller details."
          );
        }

        if (cancelled) return;

        const registration =
          data?.registration as SavedRegistration | null;

        if (registration) {
          setStoreName(registration.storeName ?? "");
          setOwnerName(registration.ownerName ?? "");
          setBusinessName(registration.businessName ?? "");
          setBusinessType(registration.businessType ?? "");
        }
      } catch (err) {
        if (cancelled) return;

        console.error(
          "Seller details loading error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load saved seller details."
        );
      } finally {
        if (!cancelled) {
          setPageLoading(false);
        }
      }
    }

    loadRegistration();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function validateForm() {
    const store = storeName.trim();
    const owner = ownerName.trim();
    const business = businessName.trim();

    if (!store) {
      setError("Please enter your store name.");
      return false;
    }

    if (store.length < 2) {
      setError("Store name must contain at least 2 characters.");
      return false;
    }

    if (store.length > 100) {
      setError("Store name cannot exceed 100 characters.");
      return false;
    }

    if (!owner) {
      setError("Please enter the seller/owner name.");
      return false;
    }

    if (owner.length < 2) {
      setError("Please enter a valid seller/owner name.");
      return false;
    }

    if (!business) {
      setError("Please enter your business name.");
      return false;
    }

    if (!businessType) {
      setError("Please select your business type.");
      return false;
    }

    return true;
  }

  async function handleContinue() {
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/seller-registration",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            storeName: storeName.trim(),
            ownerName: ownerName.trim(),
            businessName: businessName.trim(),
            businessType,
          }),
        }
      );

      if (response.status === 401) {
        router.replace(
          "/login?callbackUrl=/seller-register/details"
        );
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to save seller details."
        );
      }

      router.push("/seller-register/review");
    } catch (err) {
      console.error(
        "Seller details save error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save seller details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <div className="mx-auto w-8 h-8 rounded-full border-4 border-gray-200 border-t-gray-900 animate-spin" />

            <p className="mt-4 text-sm font-medium text-gray-600">
              Loading your seller details...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900">
            Seller Details
          </h1>

          <p className="mt-2 text-gray-500">
            Add your seller and store information
          </p>
        </div>

        {/* PROGRESS */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between max-w-3xl mx-auto">

            {[
              ["1", "Mobile"],
              ["2", "Business"],
              ["3", "Address"],
              ["4", "Bank"],
              ["5", "Submit"],
            ].map(([number, label], index) => {
              const active = index === 4;
              const completed = index < 4;

              return (
                <div
                  key={number}
                  className="flex items-center flex-1 last:flex-none"
                >
                  <div className="flex flex-col items-center">

                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center font-bold ${
                        active || completed
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {number}
                    </div>

                    <span
                      className={`mt-2 text-sm font-medium ${
                        active
                          ? "text-gray-900"
                          : "text-gray-500"
                      }`}
                    >
                      {label}
                    </span>

                  </div>

                  {index < 4 && (
                    <div
                      className={`h-0.5 flex-1 mx-3 ${
                        index < 4
                          ? "bg-gray-900"
                          : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}

          </div>
        </div>

        {/* SELLER INFORMATION */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">

          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Seller Information
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Enter the details of the person responsible
              for this ClothTym seller account.
            </p>
          </div>

          <div className="space-y-5">

            {/* OWNER NAME */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Seller / Owner Name *
              </label>

              <input
                type="text"
                value={ownerName}
                onChange={(e) =>
                  setOwnerName(e.target.value)
                }
                placeholder="Enter seller or owner name"
                autoComplete="name"
                className="w-full rounded-xl border border-gray-300 px-4 py-3.5 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
              />

              <p className="mt-1.5 text-xs text-gray-500">
                Enter the legal name of the seller/owner.
              </p>
            </div>

            {/* BUSINESS NAME */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Business Name *
              </label>

              <input
                type="text"
                value={businessName}
                onChange={(e) =>
                  setBusinessName(e.target.value)
                }
                placeholder="Enter registered business name"
                autoComplete="organization"
                className="w-full rounded-xl border border-gray-300 px-4 py-3.5 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
              />
            </div>

            {/* BUSINESS TYPE */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Business Type *
              </label>

              <select
                value={businessType}
                onChange={(e) =>
                  setBusinessType(e.target.value)
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
              >
                <option value="">
                  Select business type
                </option>

                <option value="INDIVIDUAL">
                  Individual
                </option>

                <option value="PROPRIETORSHIP">
                  Proprietorship
                </option>

                <option value="PARTNERSHIP">
                  Partnership
                </option>

                <option value="LLP">
                  LLP
                </option>

                <option value="PRIVATE_LIMITED">
                  Private Limited
                </option>

                <option value="OTHER">
                  Other
                </option>
              </select>
            </div>

          </div>
        </div>

        {/* STORE INFORMATION */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">

          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Store Information
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              This is the name customers will see on
              ClothTym.
            </p>
          </div>

          {/* STORE NAME */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Store Name *
            </label>

            <input
              type="text"
              value={storeName}
              onChange={(e) =>
                setStoreName(e.target.value)
              }
              placeholder="e.g. Gupta Brothers"
              maxLength={100}
              autoComplete="organization"
              className="w-full rounded-xl border border-gray-300 px-4 py-3.5 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
            />

            <div className="flex justify-between mt-1.5">
              <p className="text-xs text-gray-500">
                Choose a professional name for your
                ClothTym store.
              </p>

              <span className="text-xs text-gray-400">
                {storeName.length}/100
              </span>
            </div>
          </div>

          {/* STORE PREVIEW */}
          {storeName.trim() && (
            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5">

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Store Preview
              </p>

              <div className="mt-3 flex items-center gap-4">

                <div className="w-14 h-14 rounded-xl bg-gray-900 text-white flex items-center justify-center text-xl font-bold">
                  {storeName
                    .trim()
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <p className="font-bold text-gray-900">
                    {storeName.trim()}
                  </p>

                  <p className="text-sm text-gray-500">
                    ClothTym Seller
                  </p>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* INFORMATION NOTICE */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5">

          <div className="flex gap-3">

            <div className="text-2xl">
              🏪
            </div>

            <div>
              <h3 className="font-bold text-gray-900">
                Store name matters
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Your store name may be displayed to
                customers on product listings, orders
                and other seller-related areas.
              </p>
            </div>

          </div>

        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* BUTTONS */}
        <div className="flex flex-col-reverse md:flex-row md:justify-between gap-3 pb-10">

          <button
            type="button"
            onClick={() =>
              router.push("/seller-register/bank")
            }
            disabled={loading}
            className="w-full md:w-auto rounded-xl border border-gray-300 bg-white px-7 py-4 font-bold text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={handleContinue}
            disabled={loading}
            className="w-full md:w-auto min-w-[240px] rounded-xl bg-gray-900 text-white px-8 py-4 font-bold hover:bg-gray-800 transition disabled:opacity-60"
          >
            {loading
              ? "Saving..."
              : "Continue to Review →"}
          </button>

        </div>

      </div>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Registration = {
  id?: string;
  status?: string;
  mobileVerified?: boolean;
  businessName?: string | null;
  ownerName?: string | null;
  storeName?: string | null;
  rejectionReason?: string | null;
  submittedAt?: string | null;
};

export default function SellerRegistrationStatusPage() {
  const router = useRouter();

  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadRegistration() {
      try {
        const response = await fetch("/api/seller-registration", {
          method: "GET",
          cache: "no-store",
        });

        if (response.status === 401) {
          router.replace(
            "/login?callbackUrl=/seller-register/status"
          );
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || "Unable to load registration status."
          );
        }

        if (mounted) {
          setRegistration(data?.registration ?? null);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadRegistration();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
          <p className="text-sm text-gray-600">
            Loading your seller registration...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm border border-gray-200">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl">
            !
          </div>

          <h1 className="text-xl font-bold text-gray-900">
            Unable to load status
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  if (!registration) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm border border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">
            Seller Registration
          </h1>

          <p className="mt-3 text-sm text-gray-600">
            No seller registration was found for your account.
          </p>

          <button
            type="button"
            onClick={() => router.push("/seller-register")}
            className="mt-6 rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Start Registration
          </button>
        </div>
      </main>
    );
  }

  const status = registration.status || "DRAFT";

  const isSubmitted =
    status === "SUBMITTED" ||
    status === "UNDER_REVIEW";

  const isApproved = status === "APPROVED";

  const isRejected = status === "REJECTED";

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
            CLOTHTYM
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Seller Registration Status
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Track the status of your ClothTym seller application.
          </p>
        </div>

        {/* Status Card */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-full text-3xl ${
                isApproved
                  ? "bg-green-100"
                  : isRejected
                    ? "bg-red-100"
                    : "bg-amber-100"
              }`}
            >
              {isApproved ? "✓" : isRejected ? "!" : "⏳"}
            </div>

            <h2 className="mt-5 text-2xl font-bold text-gray-900">
              {isApproved
                ? "Application Approved"
                : isRejected
                  ? "Application Rejected"
                  : "Application Under Review"}
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">
              {isApproved
                ? "Congratulations! Your ClothTym seller account has been approved."
                : isRejected
                  ? "Your application needs some changes before it can be approved."
                  : "Your seller application has been submitted successfully and is being reviewed by our team."}
            </p>
          </div>

          {/* Progress */}
          <div className="mt-10">
            <div className="flex items-center justify-between text-xs font-medium text-gray-500">
              <span>Registration</span>
              <span>Review</span>
              <span>Approval</span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all ${
                  isApproved
                    ? "w-full bg-green-500"
                    : isSubmitted
                      ? "w-2/3 bg-amber-500"
                      : isRejected
                        ? "w-2/3 bg-red-500"
                        : "w-1/3 bg-gray-400"
                }`}
              />
            </div>
          </div>

          {/* Application Details */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Business Name
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {registration.businessName || "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Owner Name
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {registration.ownerName || "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Store Name
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {registration.storeName || "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Application Status
              </p>

              <p
                className={`mt-1 font-semibold ${
                  isApproved
                    ? "text-green-600"
                    : isRejected
                      ? "text-red-600"
                      : "text-amber-600"
                }`}
              >
                {status.replaceAll("_", " ")}
              </p>
            </div>
          </div>

          {/* Rejection */}
          {isRejected && registration.rejectionReason && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="text-sm font-semibold text-red-800">
                Reason for rejection
              </p>

              <p className="mt-2 text-sm leading-6 text-red-700">
                {registration.rejectionReason}
              </p>
            </div>
          )}

          {/* Submitted */}
          {registration.submittedAt && (
            <p className="mt-6 text-center text-xs text-gray-500">
              Submitted on{" "}
              {new Date(registration.submittedAt).toLocaleString("en-IN")}
            </p>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {isApproved ? (
              <button
                type="button"
                onClick={() => router.push("/seller")}
                className="rounded-xl bg-black px-7 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Go to Seller Dashboard
              </button>
            ) : isRejected ? (
              <button
                type="button"
                onClick={() => router.push("/seller-register")}
                className="rounded-xl bg-black px-7 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Update Application
              </button>
            ) : (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-xl bg-black px-7 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Refresh Status
              </button>
            )}

            {!isApproved && (
              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-xl border border-gray-300 bg-white px-7 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Back to Home
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
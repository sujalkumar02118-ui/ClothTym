"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SellerBusinessPage() {
  const router = useRouter();

  const [businessType, setBusinessType] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");

  const [hasGst, setHasGst] = useState<boolean | null>(null);
  const [gstin, setGstin] = useState("");

  const [panNumber, setPanNumber] = useState("");
  const [panName, setPanName] = useState("");
  const [panEmail, setPanEmail] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const validateGstin = (value: string) => {
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(
      value
    );
  };

  const validatePan = (value: string) => {
    return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value);
  };

  /* =========================================
     LOAD SAVED DRAFT
  ========================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadRegistration() {
      try {
        const response = await fetch(
          "/api/seller-registration",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Unable to load registration."
          );
        }

        if (
          cancelled ||
          !data.registration
        ) {
          return;
        }

        const registration =
          data.registration;

        setBusinessType(
          registration.businessType || ""
        );

        setBusinessName(
          registration.businessName || ""
        );

        setOwnerName(
          registration.ownerName || ""
        );

        if (
          typeof registration.hasGst ===
          "boolean"
        ) {
          setHasGst(
            registration.hasGst
          );
        }

        setGstin(
          registration.gstin || ""
        );

        setPanNumber(
          registration.panNumber || ""
        );

        setPanName(
          registration.panName || ""
        );

        setPanEmail(
          registration.panEmail || ""
        );
      } catch (error) {
        console.error(
          "Business registration load error:",
          error
        );

        if (!cancelled) {
          setError(
            "Unable to load saved business details."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRegistration();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =========================================
     CONTINUE
  ========================================= */

  const handleContinue = async () => {
    setError("");
    setMessage("");

    if (!businessType) {
      setError(
        "Please select your business type."
      );
      return;
    }

    if (!businessName.trim()) {
      setError(
        "Please enter your business name."
      );
      return;
    }

    if (!ownerName.trim()) {
      setError(
        "Please enter the owner name."
      );
      return;
    }

    if (hasGst === null) {
      setError(
        "Please select whether you have a GST number."
      );
      return;
    }

    const formattedGstin =
      gstin.trim().toUpperCase();

    const formattedPan =
      panNumber.trim().toUpperCase();

    if (hasGst) {
      if (!formattedGstin) {
        setError(
          "Please enter your GSTIN."
        );
        return;
      }

      if (
        !validateGstin(
          formattedGstin
        )
      ) {
        setError(
          "Please enter a valid GSTIN."
        );
        return;
      }
    }

    if (!hasGst) {
      if (!formattedPan) {
        setError(
          "Please enter your PAN number."
        );
        return;
      }

      if (
        !validatePan(
          formattedPan
        )
      ) {
        setError(
          "Please enter a valid PAN number."
        );
        return;
      }

      if (!panName.trim()) {
        setError(
          "Please enter the name as per PAN."
        );
        return;
      }

      if (!panEmail.trim()) {
        setError(
          "Please enter your email address."
        );
        return;
      }

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailRegex.test(
          panEmail.trim()
        )
      ) {
        setError(
          "Please enter a valid email address."
        );
        return;
      }
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/seller-registration",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            businessType,
            businessName:
              businessName.trim(),
            ownerName:
              ownerName.trim(),

            hasGst,

            gstin: hasGst
              ? formattedGstin
              : "",

            panNumber: hasGst
              ? ""
              : formattedPan,

            panName: hasGst
              ? ""
              : panName.trim(),

            panEmail: hasGst
              ? ""
              : panEmail
                  .trim()
                  .toLowerCase(),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to save business details."
        );
      }

      setMessage(
        "Business details saved successfully."
      );

      router.push(
        "/seller-register/address"
      );
    } catch (error) {
      console.error(
        "Business save error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to save business details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     UI
  ========================================= */

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">

        {/* HEADER */}

        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">
            ClothTym Seller
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Business Details
          </h1>

          <p className="mt-2 text-sm text-gray-500 sm:text-base">
            Tell us a little about your business
          </p>
        </div>

        {/* PROGRESS */}

        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">

            {[
              {
                number: 1,
                title: "Mobile",
              },
              {
                number: 2,
                title: "Business",
              },
              {
                number: 3,
                title: "Address",
              },
              {
                number: 4,
                title: "Bank",
              },
              {
                number: 5,
                title: "Submit",
              },
            ].map(
              (step, index) => (
                <div
                  key={step.number}
                  className="flex flex-1 items-center"
                >
                  <div className="flex flex-col items-center">

                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                        step.number <= 2
                          ? "bg-black text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {step.number}
                    </div>

                    <span
                      className={`mt-2 hidden text-xs font-medium sm:block ${
                        step.number <= 2
                          ? "text-black"
                          : "text-gray-400"
                      }`}
                    >
                      {step.title}
                    </span>

                  </div>

                  {index < 4 && (
                    <div
                      className={`mx-2 h-0.5 flex-1 ${
                        step.number < 2
                          ? "bg-black"
                          : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              )
            )}

          </div>
        </div>

        {/* MAIN CARD */}

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xl sm:p-8">

          <div className="mb-7">
            <h2 className="text-xl font-bold text-gray-900">
              Tell us about your business
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Enter your business information carefully.
              These details will be saved to your seller
              registration.
            </p>
          </div>

          {/* BUSINESS TYPE */}

          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-gray-800">
              Business Type{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <select
              value={businessType}
              onChange={(e) =>
                setBusinessType(
                  e.target.value
                )
              }
              disabled={loading}
              className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
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
                Private Limited Company
              </option>

              <option value="OTHER">
                Other
              </option>
            </select>
          </div>

          {/* BUSINESS NAME */}

          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-gray-800">
              Business Name{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <input
              type="text"
              value={businessName}
              onChange={(e) =>
                setBusinessName(
                  e.target.value
                )
              }
              placeholder="Enter your business name"
              disabled={loading}
              className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-2 focus:ring-black/10"
            />
          </div>

          {/* OWNER NAME */}

          <div className="mb-8">
            <label className="mb-2 block text-sm font-semibold text-gray-800">
              Owner Name{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <input
              type="text"
              value={ownerName}
              onChange={(e) =>
                setOwnerName(
                  e.target.value
                )
              }
              placeholder="Enter owner's full name"
              disabled={loading}
              className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-2 focus:ring-black/10"
            />
          </div>

          {/* GST */}

          <div className="border-t border-gray-200 pt-7">

            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                GST Registration
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Do you have a GST number?
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">

              {/* YES */}

              <button
                type="button"
                onClick={() => {
                  setHasGst(true);
                  setError("");
                }}
                disabled={loading}
                className={`rounded-2xl border-2 p-4 text-left transition ${
                  hasGst === true
                    ? "border-black bg-black text-white shadow-lg"
                    : "border-gray-300 bg-white text-gray-900 hover:border-gray-500"
                }`}
              >
                <div className="flex items-center gap-3">

                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      hasGst === true
                        ? "bg-white/15"
                        : "bg-gray-100"
                    }`}
                  >
                    ✓
                  </div>

                  <div>
                    <p className="font-bold">
                      Yes, I have GST
                    </p>

                    <p
                      className={`mt-1 text-xs ${
                        hasGst === true
                          ? "text-gray-300"
                          : "text-gray-500"
                      }`}
                    >
                      Register using your GSTIN
                    </p>
                  </div>

                </div>
              </button>

              {/* NO */}

              <button
                type="button"
                onClick={() => {
                  setHasGst(false);
                  setError("");
                }}
                disabled={loading}
                className={`rounded-2xl border-2 p-4 text-left transition ${
                  hasGst === false
                    ? "border-black bg-black text-white shadow-lg"
                    : "border-gray-300 bg-white text-gray-900 hover:border-gray-500"
                }`}
              >
                <div className="flex items-center gap-3">

                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      hasGst === false
                        ? "bg-white/15"
                        : "bg-gray-100"
                    }`}
                  >
                    →
                  </div>

                  <div>
                    <p className="font-bold">
                      No GST number
                    </p>

                    <p
                      className={`mt-1 text-xs ${
                        hasGst === false
                          ? "text-gray-300"
                          : "text-gray-500"
                      }`}
                    >
                      Continue with PAN details
                    </p>
                  </div>

                </div>
              </button>

            </div>

            {/* GST DETAILS */}

            {hasGst === true && (
              <div className="mt-6 rounded-2xl border-2 border-gray-200 bg-gray-50 p-5">

                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  GSTIN{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  value={gstin}
                  maxLength={15}
                  onChange={(e) =>
                    setGstin(
                      e.target.value
                        .toUpperCase()
                        .replace(
                          /[^A-Z0-9]/g,
                          ""
                        )
                    )
                  }
                  placeholder="Enter 15-digit GSTIN"
                  disabled={loading}
                  className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3.5 text-sm uppercase tracking-wide text-gray-900 outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-400 focus:border-black focus:ring-2 focus:ring-black/10"
                />

                <p className="mt-2 text-xs text-gray-500">
                  GST verification through the
                  official verification system
                  will be connected later.
                </p>

              </div>
            )}

            {/* NO GST */}

            {hasGst === false && (
              <div className="mt-6 rounded-2xl border-2 border-gray-200 bg-gray-50 p-5">

                <div className="mb-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">
                    Selling without GST
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-600">
                    You can continue the seller
                    registration using your PAN
                    details. Government enrolment/
                    verification will be connected
                    later through the appropriate
                    official integration.
                  </p>
                </div>

                {/* PAN */}

                <div className="mb-5">
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    PAN Number{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={panNumber}
                    maxLength={10}
                    onChange={(e) =>
                      setPanNumber(
                        e.target.value
                          .toUpperCase()
                          .replace(
                            /[^A-Z0-9]/g,
                            ""
                          )
                      )
                    }
                    placeholder="ABCDE1234F"
                    disabled={loading}
                    className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3.5 text-sm uppercase tracking-wide text-gray-900 outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-400 focus:border-black focus:ring-2 focus:ring-black/10"
                  />
                </div>

                {/* PAN NAME */}

                <div className="mb-5">
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Name as per PAN{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={panName}
                    onChange={(e) =>
                      setPanName(
                        e.target.value
                      )
                    }
                    placeholder="Enter name exactly as on PAN"
                    disabled={loading}
                    className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-2 focus:ring-black/10"
                  />
                </div>

                {/* EMAIL */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Email Address{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="email"
                    value={panEmail}
                    onChange={(e) =>
                      setPanEmail(
                        e.target.value
                      )
                    }
                    placeholder="Enter your email address"
                    disabled={loading}
                    className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-2 focus:ring-black/10"
                  />
                </div>

              </div>
            )}
          </div>

          {/* MESSAGE */}

          {message && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-sm font-medium text-green-700">
                {message}
              </p>
            </div>
          )}

          {/* ERROR */}

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-600">
                {error}
              </p>
            </div>
          )}

          {/* BUTTONS */}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/seller-register"
                )
              }
              disabled={loading}
              className="rounded-xl border-2 border-gray-300 px-6 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ← Back
            </button>

            <button
              type="button"
              onClick={handleContinue}
              disabled={loading}
              className="rounded-xl bg-black px-8 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : "Save & Continue →"}
            </button>

          </div>

          {/* SECURITY */}

          <div className="mt-7 flex items-start gap-3 rounded-xl bg-gray-50 p-4">
            <div className="mt-0.5 text-lg">
              🔒
            </div>

            <p className="text-xs leading-5 text-gray-500">
              Your business information is
              securely saved to your ClothTym
              seller registration and will only
              be used for seller onboarding and
              verification.
            </p>
          </div>

        </div>

        {/* FOOTER */}

        <p className="mt-6 text-center text-xs text-gray-400">
          ClothTym • Fashion without Tym Limits
        </p>

      </div>
    </main>
  );
}
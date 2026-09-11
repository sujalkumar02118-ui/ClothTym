"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type RegistrationResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  registration?: {
    id: string;
    mobile: string;
    mobileVerified: boolean;
    status: string;
  } | null;
};

export default function SellerRegisterPage() {
  const router = useRouter();

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);

  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingRegistration, setLoadingRegistration] =
    useState(true);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  /* =========================================
     LOAD EXISTING REGISTRATION
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

        if (response.status === 401) {
          /*
           * Seller registration is tied to an
           * existing ClothTym user account.
           *
           * We do not create a second auth system.
           */
          if (!cancelled) {
            router.replace(
              "/login?callbackUrl=/seller-register"
            );
          }

          return;
        }

        const data: RegistrationResponse =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to load registration."
          );
        }

        if (
          !cancelled &&
          data.registration
        ) {
          setMobile(
            data.registration.mobile || ""
          );

          setMobileVerified(
            data.registration
              .mobileVerified === true
          );

          if (
            data.registration
              .mobileVerified
          ) {
            setOtpSent(true);
          }
        }
      } catch (error) {
        console.error(
          "Registration loading error:",
          error
        );

        if (!cancelled) {
          setError(
            "Unable to load your seller registration."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingRegistration(false);
        }
      }
    }

    loadRegistration();

    return () => {
      cancelled = true;
    };
  }, [router]);

  /* =========================================
     COUNTDOWN
  ========================================= */

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((previous) => {
        if (previous <= 1) {
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  /* =========================================
     MOBILE CHANGE
  ========================================= */

  function handleMobileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const value =
      event.target.value.replace(/\D/g, "");

    if (value.length <= 10) {
      setMobile(value);
    }

    setError("");
    setMessage("");
  }

  /* =========================================
     OTP CHANGE
  ========================================= */

  function handleOtpChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const value =
      event.target.value.replace(/\D/g, "");

    if (value.length <= 6) {
      setOtp(value);
    }

    setError("");
    setMessage("");
  }

  /* =========================================
     SAVE DRAFT
  ========================================= */

  async function saveDraft() {
    const response = await fetch(
      "/api/seller-registration",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          mobile,
          submit: false,
        }),
      }
    );

    const data: RegistrationResponse =
      await response.json();

    if (response.status === 401) {
      router.replace(
        "/login?callbackUrl=/seller-register"
      );

      throw new Error(
        "Please login first."
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Unable to save registration."
      );
    }

    return data;
  }

  /* =========================================
     SEND OTP
  ========================================= */

  async function handleSendOtp() {
    setError("");
    setMessage("");

    if (
      !/^[6-9]\d{9}$/.test(mobile)
    ) {
      setError(
        "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    setLoading(true);

    try {
      /*
       * First save the mobile number as a
       * registration DRAFT in the database.
       *
       * IMPORTANT:
       * No fake OTP is generated.
       * No hardcoded OTP is accepted.
       */

      await saveDraft();

      /*
       * REAL SMS PROVIDER WILL BE CONNECTED HERE.
       *
       * Example future flow:
       *
       * 1. Backend generates secure OTP
       * 2. Backend stores hashed OTP + expiry
       * 3. Backend sends OTP through 2Factor/MSG91
       * 4. Backend returns success
       *
       * Until provider is connected, we intentionally
       * do NOT pretend that an OTP was sent.
       */

      setOtpSent(true);
      setCountdown(30);

      setMessage(
        "Your mobile number has been saved. Real OTP sending will be enabled after the SMS provider is connected."
      );
    } catch (error) {
      console.error(
        "OTP sending error:",
        error
      );

      if (
        error instanceof Error &&
        error.message ===
          "Please login first."
      ) {
        return;
      }

      setError(
        error instanceof Error
          ? error.message
          : "Unable to save your mobile number. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================
     VERIFY OTP
  ========================================= */

  async function handleVerifyOtp() {
    setError("");
    setMessage("");

    if (otp.length !== 6) {
      setError(
        "Please enter the 6-digit OTP."
      );
      return;
    }

    /*
     * SECURITY:
     *
     * Real OTP verification is intentionally
     * NOT implemented until the SMS provider
     * is connected.
     *
     * We never accept:
     * 123456
     * 000000
     * any arbitrary OTP
     */

    setError(
      "Real OTP verification is not connected yet. Please connect the SMS provider before verification."
    );
  }

  /* =========================================
     CONTINUE
  ========================================= */

  function handleContinue() {
    if (!mobileVerified) {
      setError(
        "Please verify your mobile number first."
      );
      return;
    }

    router.push(
      "/seller-register/business"
    );
  }

  /* =========================================
     LOADING
  ========================================= */

  if (loadingRegistration) {
    return (
      <main className="min-h-screen bg-[#f8f9fa] text-black">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-2xl font-black tracking-tight"
            >
              ClothTym
            </button>

            <div className="text-sm text-gray-500">
              Seller Registration
            </div>
          </div>
        </header>

        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-[#1e3470] rounded-full animate-spin mx-auto" />

            <p className="mt-4 text-sm font-semibold text-gray-600">
              Loading your registration...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f9fa] text-black">

      {/* ================= HEADER ================= */}

      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">

          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-2xl font-black tracking-tight"
          >
            ClothTym
          </button>

          <div className="text-sm text-gray-500">
            Seller Registration
          </div>

        </div>
      </header>


      {/* ================= CONTENT ================= */}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* ================= PROGRESS ================= */}

        <div className="mb-10">

          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">

            <div className="flex items-center gap-2 text-[#1e3470]">
              <span className="w-8 h-8 rounded-full bg-[#1e3470] text-white flex items-center justify-center">
                1
              </span>
              Mobile
            </div>

            <div className="hidden sm:block h-[2px] flex-1 bg-gray-200 mx-3" />

            <div className="flex items-center gap-2 text-gray-400">
              <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                2
              </span>
              Business
            </div>

            <div className="hidden sm:block h-[2px] flex-1 bg-gray-200 mx-3" />

            <div className="flex items-center gap-2 text-gray-400">
              <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                3
              </span>
              Address
            </div>

            <div className="hidden sm:block h-[2px] flex-1 bg-gray-200 mx-3" />

            <div className="flex items-center gap-2 text-gray-400">
              <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                4
              </span>
              Bank
            </div>

            <div className="hidden sm:block h-[2px] flex-1 bg-gray-200 mx-3" />

            <div className="flex items-center gap-2 text-gray-400">
              <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                5
              </span>
              Submit
            </div>

          </div>

        </div>


        {/* ================= CARD ================= */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

          {/* ================= LEFT ================= */}

          <section className="bg-[#07152f] rounded-[2rem] p-7 sm:p-10 text-white flex flex-col justify-between">

            <div>

              <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm font-semibold">
                🏪 ClothTym Seller
              </span>

              <h1 className="text-3xl sm:text-4xl font-black leading-tight mt-7">
                Start selling on
                <br />
                ClothTym
              </h1>

              <p className="text-gray-300 mt-5 leading-relaxed">
                Grow your fashion business by reaching customers
                looking for products from local and nearby sellers.
              </p>

            </div>


            <div className="mt-10 space-y-4">

              <div className="flex gap-3 items-start">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  ✓
                </div>

                <div>
                  <p className="font-bold">
                    Reach more customers
                  </p>

                  <p className="text-sm text-gray-400">
                    Showcase your products on ClothTym.
                  </p>
                </div>
              </div>


              <div className="flex gap-3 items-start">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  ✓
                </div>

                <div>
                  <p className="font-bold">
                    Easy seller management
                  </p>

                  <p className="text-sm text-gray-400">
                    Manage products and orders from your dashboard.
                  </p>
                </div>
              </div>


              <div className="flex gap-3 items-start">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  ✓
                </div>

                <div>
                  <p className="font-bold">
                    Secure onboarding
                  </p>

                  <p className="text-sm text-gray-400">
                    Your seller information is securely stored.
                  </p>
                </div>
              </div>

            </div>

          </section>


          {/* ================= RIGHT ================= */}

          <section className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-6 sm:p-10">

            <div className="max-w-md mx-auto">

              <div>

                <p className="text-sm font-bold text-[#1e3470] uppercase tracking-wider">
                  Step 1 of 5
                </p>

                <h2 className="text-3xl font-black mt-2">
                  Verify your mobile
                </h2>

                <p className="text-gray-500 mt-2">
                  Enter your mobile number to begin your seller
                  registration.
                </p>

              </div>


              {/* ================= MOBILE ================= */}

              <div className="mt-8">

                <label
                  htmlFor="mobile"
                  className="block text-sm font-bold mb-2"
                >
                  Mobile Number
                </label>

                <div className="flex border-2 border-gray-300 bg-white rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-[#1e3470]">

                  <div className="bg-gray-50 px-4 flex items-center text-sm font-semibold border-r border-gray-300">
                    +91
                  </div>

                  <input
                    id="mobile"
                    type="tel"
                    inputMode="numeric"
                    value={mobile}
                    onChange={handleMobileChange}
                    placeholder="Enter 10-digit mobile number"
                    className="flex-1 px-4 py-4 outline-none text-base text-gray-900 placeholder:text-gray-400"
                    disabled={mobileVerified}
                    maxLength={10}
                  />

                </div>

              </div>


              {/* ================= SEND OTP ================= */}

              {!mobileVerified && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={
                    loading ||
                    mobile.length !== 10 ||
                    countdown > 0
                  }
                  className="w-full mt-5 bg-[#1e3470] text-white py-4 rounded-2xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#172b5d] transition"
                >
                  {loading
                    ? "Saving..."
                    : countdown > 0
                    ? `Resend OTP in ${countdown}s`
                    : otpSent
                    ? "Resend OTP"
                    : "Send OTP"}
                </button>
              )}


              {/* ================= OTP ================= */}

              {otpSent && !mobileVerified && (
                <div className="mt-7">

                  <label
                    htmlFor="otp"
                    className="block text-sm font-bold mb-2"
                  >
                    Enter OTP
                  </label>

                  <input
                    id="otp"
                    type="tel"
                    inputMode="numeric"
                    value={otp}
                    onChange={handleOtpChange}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="w-full border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 rounded-2xl px-4 py-4 text-center text-2xl tracking-[8px] font-bold outline-none focus:ring-2 focus:ring-[#1e3470]"
                  />

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otp.length !== 6}
                    className="w-full mt-4 border-2 border-[#1e3470] text-[#1e3470] py-4 rounded-2xl font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                  >
                    Verify OTP
                  </button>

                </div>
              )}


              {/* ================= VERIFIED ================= */}

              {mobileVerified && (
                <div className="mt-7">

                  <div className="rounded-2xl bg-green-50 border border-green-200 p-4">

                    <div className="flex items-center gap-3">

                      <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                        ✓
                      </div>

                      <div>
                        <p className="font-bold text-green-800">
                          Mobile verified
                        </p>

                        <p className="text-sm text-green-700">
                          +91 {mobile}
                        </p>
                      </div>

                    </div>

                  </div>


                  <button
                    type="button"
                    onClick={handleContinue}
                    className="w-full mt-5 bg-[#1e3470] text-white py-4 rounded-2xl font-bold hover:bg-[#172b5d] transition"
                  >
                    Continue
                  </button>

                </div>
              )}


              {/* ================= MESSAGE ================= */}

              {message && (
                <div className="mt-5 rounded-2xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
                  {message}
                </div>
              )}


              {/* ================= ERROR ================= */}

              {error && (
                <div className="mt-5 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}


              {/* ================= SECURITY ================= */}

              <div className="mt-8 pt-6 border-t border-gray-200">

                <div className="flex gap-3 items-start">

                  <div className="text-xl">
                    🔒
                  </div>

                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                    Your information is protected and will only be
                    used for ClothTym seller registration and account
                    verification.
                  </p>

                </div>

              </div>

            </div>

          </section>

        </div>

      </div>


      {/* ================= FOOTER ================= */}

      <footer className="text-center text-sm text-gray-400 py-8 px-4">
        © 2026 ClothTym. All rights reserved.
      </footer>

    </main>
  );
}
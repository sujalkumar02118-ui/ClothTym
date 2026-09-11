"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SavedRegistration = {
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankIfsc?: string | null;
  bankName?: string | null;
};

export default function SellerBankPage() {
  const router = useRouter();

  const [accountHolderName, setAccountHolderName] =
    useState("");

  const [accountNumber, setAccountNumber] =
    useState("");

  const [confirmAccountNumber, setConfirmAccountNumber] =
    useState("");

  const [ifsc, setIfsc] = useState("");

  const [bankName, setBankName] = useState("");

  const [showAccountNumber, setShowAccountNumber] =
    useState(false);

  const [savedAccountNumber, setSavedAccountNumber] =
    useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const [initialLoading, setInitialLoading] =
    useState(true);

  const inputClass =
    "w-full rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 px-4 py-3.5 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200";

  /*
   * ---------------------------------------------------------
   * LOAD SAVED BANK DETAILS
   * ---------------------------------------------------------
   *
   * Account number is intentionally NOT loaded into the
   * editable field. The API only returns a masked value.
   *
   * This prevents the complete bank account number from
   * being unnecessarily exposed to the browser.
   */

  useEffect(() => {
    let cancelled = false;

    async function loadRegistration() {
      try {
        setInitialLoading(true);

        const response = await fetch(
          "/api/seller-registration",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            router.replace(
              "/login?callbackUrl=/seller-register/bank"
            );
            return;
          }

          throw new Error(
            "Unable to load seller registration."
          );
        }

        const data =
          await response.json();

        if (cancelled) {
          return;
        }

        const registration =
          data?.registration as
            | SavedRegistration
            | null
            | undefined;

        if (!registration) {
          return;
        }

        setAccountHolderName(
          String(
            registration.bankAccountName ??
              ""
          )
        );

        setIfsc(
          String(
            registration.bankIfsc ?? ""
          ).toUpperCase()
        );

        setBankName(
          String(
            registration.bankName ?? ""
          )
        );

        /*
         * Only masked account number can be returned
         * by the server.
         */
        setSavedAccountNumber(
          String(
            registration.bankAccountNumber ??
              ""
          )
        );
      } catch (err) {
        console.error(
          "Seller registration load error:",
          err
        );

        if (!cancelled) {
          setError(
            "Unable to load your saved bank details. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
        }
      }
    }

    void loadRegistration();

    return () => {
      cancelled = true;
    };
  }, [router]);

  /*
   * ---------------------------------------------------------
   * VALIDATION
   * ---------------------------------------------------------
   */

  function validateForm() {
    const holderName =
      accountHolderName.trim();

    const account =
      accountNumber.trim();

    const confirmAccount =
      confirmAccountNumber.trim();

    const ifscCode =
      ifsc.trim().toUpperCase();

    const bank =
      bankName.trim();

    if (!holderName) {
      setError(
        "Please enter the account holder name."
      );
      return false;
    }

    if (holderName.length < 2) {
      setError(
        "Please enter a valid account holder name."
      );
      return false;
    }

    if (
      !/^[0-9]{9,18}$/.test(account)
    ) {
      setError(
        "Please enter a valid bank account number (9–18 digits)."
      );
      return false;
    }

    if (
      account !== confirmAccount
    ) {
      setError(
        "Bank account numbers do not match."
      );
      return false;
    }

    if (
      !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(
        ifscCode
      )
    ) {
      setError(
        "Please enter a valid 11-character IFSC code."
      );
      return false;
    }

    if (!bank) {
      setError(
        "Please enter your bank name."
      );
      return false;
    }

    return true;
  }

  /*
   * ---------------------------------------------------------
   * SAVE BANK DETAILS
   * ---------------------------------------------------------
   */

  async function handleContinue() {
    setError("");

    if (!validateForm()) {
      return;
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
            bankAccountName:
              accountHolderName.trim(),

            bankAccountNumber:
              accountNumber.trim(),

            bankIfsc:
              ifsc.trim().toUpperCase(),

            bankName:
              bankName.trim(),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        if (
          response.status === 401
        ) {
          router.replace(
            "/login?callbackUrl=/seller-register/bank"
          );
          return;
        }

        throw new Error(
          data?.error ||
            "Unable to save bank details."
        );
      }

      /*
       * Clear sensitive values from client state
       * before moving to the next page.
       */
      setAccountNumber("");
      setConfirmAccountNumber("");

      router.push(
        "/seller-register/details"
      );
    } catch (err) {
      console.error(
        "Bank details save error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save bank details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * INPUT HANDLERS
   * ---------------------------------------------------------
   */

  function handleIfscChange(
    value: string
  ) {
    setIfsc(
      value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 11)
    );
  }

  function handleAccountChange(
    value: string
  ) {
    setAccountNumber(
      value
        .replace(/\D/g, "")
        .slice(0, 18)
    );
  }

  function handleConfirmAccountChange(
    value: string
  ) {
    setConfirmAccountNumber(
      value
        .replace(/\D/g, "")
        .slice(0, 18)
    );
  }

  /*
   * ---------------------------------------------------------
   * INITIAL LOADING
   * ---------------------------------------------------------
   */

  if (initialLoading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="bg-white border border-gray-300 rounded-2xl shadow-sm px-8 py-6 text-center">
              <div className="text-2xl mb-2">
                🔒
              </div>

              <p className="text-gray-900 font-bold">
                Loading your bank details...
              </p>

              <p className="text-sm text-gray-600 mt-1">
                Please wait.
              </p>
            </div>
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
            Bank Details
          </h1>

          <p className="mt-2 text-gray-600">
            Add the bank account where your seller
            payments will be settled
          </p>

        </div>

        {/* PROGRESS */}
        <div className="bg-white rounded-2xl border border-gray-300 p-6 mb-6 shadow-sm">

          <div className="flex items-center justify-between max-w-3xl mx-auto">

            {[
              ["1", "Mobile"],
              ["2", "Business"],
              ["3", "Address"],
              ["4", "Bank"],
              ["5", "Submit"],
            ].map(
              ([number, label], index) => {

                const active =
                  number === "4";

                const completed =
                  index < 3;

                return (
                  <div
                    key={number}
                    className="flex items-center flex-1 last:flex-none"
                  >

                    <div className="flex flex-col items-center">

                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center font-bold ${
                          active ||
                          completed
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {number}
                      </div>

                      <span
                        className={`mt-2 text-sm font-medium ${
                          active
                            ? "text-gray-900"
                            : "text-gray-600"
                        }`}
                      >
                        {label}
                      </span>

                    </div>

                    {index < 4 && (
                      <div
                        className={`h-0.5 flex-1 mx-3 ${
                          index < 3
                            ? "bg-gray-900"
                            : "bg-gray-300"
                        }`}
                      />
                    )}

                  </div>
                );
              }
            )}

          </div>

        </div>

        {/* SECURITY NOTICE */}
        <div className="mb-6 rounded-2xl border border-gray-300 bg-white p-5 shadow-sm">

          <div className="flex gap-3">

            <div className="text-2xl">
              🔒
            </div>

            <div>

              <h2 className="font-bold text-gray-900">
                Your bank information
              </h2>

              <p className="text-sm text-gray-600 mt-1">
                Enter your bank details carefully.
                These details will be used for seller
                payment settlement.
              </p>

              <p className="text-xs text-gray-500 mt-2">
                Your complete account number is not
                displayed after it has been saved.
              </p>

            </div>

          </div>

        </div>

        {/* BANK FORM */}
        <div className="bg-white rounded-2xl border border-gray-300 p-6 md:p-8 shadow-sm">

          <h2 className="text-xl font-bold text-gray-900">
            Account Information
          </h2>

          <p className="text-sm text-gray-600 mt-1 mb-6">
            Make sure the account belongs to the
            seller or registered business.
          </p>

          <div className="space-y-5">

            {/* ACCOUNT HOLDER */}
            <div>

              <label className="block text-sm font-bold text-gray-800 mb-2">
                Account Holder Name *
              </label>

              <input
                type="text"
                value={
                  accountHolderName
                }
                onChange={(e) =>
                  setAccountHolderName(
                    e.target.value
                  )
                }
                placeholder="Enter account holder name"
                autoComplete="name"
                className={
                  inputClass
                }
              />

              <p className="mt-1.5 text-xs text-gray-500">
                Enter the name exactly as it
                appears on your bank account.
              </p>

            </div>

            {/* SAVED ACCOUNT NUMBER */}
            {savedAccountNumber && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold text-gray-600">
                  Previously saved account
                </p>

                <p className="mt-1 text-sm font-bold text-gray-900 tracking-wider">
                  {savedAccountNumber}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  For security, enter the complete
                  account number again below to save
                  or update it.
                </p>
              </div>
            )}

            {/* ACCOUNT NUMBER */}
            <div>

              <label className="block text-sm font-bold text-gray-800 mb-2">
                Bank Account Number *
              </label>

              <div className="relative">

                <input
                  type={
                    showAccountNumber
                      ? "text"
                      : "password"
                  }
                  inputMode="numeric"
                  value={
                    accountNumber
                  }
                  onChange={(e) =>
                    handleAccountChange(
                      e.target.value
                    )
                  }
                  placeholder="Enter bank account number"
                  autoComplete="off"
                  className={`${inputClass} pr-24`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowAccountNumber(
                      (previous) =>
                        !previous
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-600 hover:text-gray-900"
                >
                  {showAccountNumber
                    ? "Hide"
                    : "Show"}
                </button>

              </div>

              <p className="mt-1.5 text-xs text-gray-500">
                9–18 digit account number.
              </p>

            </div>

            {/* CONFIRM ACCOUNT */}
            <div>

              <label className="block text-sm font-bold text-gray-800 mb-2">
                Confirm Bank Account Number *
              </label>

              <input
                type={
                  showAccountNumber
                    ? "text"
                    : "password"
                }
                inputMode="numeric"
                value={
                  confirmAccountNumber
                }
                onChange={(e) =>
                  handleConfirmAccountChange(
                    e.target.value
                  )
                }
                placeholder="Re-enter bank account number"
                autoComplete="off"
                className={
                  inputClass
                }
              />

            </div>

            {/* IFSC */}
            <div>

              <label className="block text-sm font-bold text-gray-800 mb-2">
                IFSC Code *
              </label>

              <input
                type="text"
                value={ifsc}
                onChange={(e) =>
                  handleIfscChange(
                    e.target.value
                  )
                }
                placeholder="e.g. SBIN0001234"
                maxLength={11}
                autoCapitalize="characters"
                autoComplete="off"
                className={`${inputClass} uppercase`}
              />

              <p className="mt-1.5 text-xs text-gray-500">
                Enter your bank's 11-character
                IFSC code.
              </p>

            </div>

            {/* BANK NAME */}
            <div>

              <label className="block text-sm font-bold text-gray-800 mb-2">
                Bank Name *
              </label>

              <input
                type="text"
                value={bankName}
                onChange={(e) =>
                  setBankName(
                    e.target.value
                  )
                }
                placeholder="e.g. State Bank of India"
                autoComplete="organization"
                className={
                  inputClass
                }
              />

            </div>

          </div>

          {/* REQUIRED NOTICE */}
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">

            <p className="text-sm text-amber-800">
              <span className="font-bold">
                *
              </span>{" "}
              All bank details marked with *
              are mandatory.
            </p>

          </div>

          {/* ERROR */}
          {error && (
            <div className="mt-5 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {/* BUTTONS */}
          <div className="mt-8 flex flex-col-reverse md:flex-row md:justify-between gap-3">

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/seller-register/address"
                )
              }
              disabled={loading}
              className="w-full md:w-auto rounded-xl border-2 border-gray-300 bg-white px-7 py-4 font-bold text-gray-800 hover:bg-gray-50 transition disabled:opacity-60"
            >
              ← Back
            </button>

            <button
              type="button"
              onClick={
                handleContinue
              }
              disabled={loading}
              className="w-full md:w-auto min-w-[240px] rounded-xl bg-gray-900 text-white px-8 py-4 font-bold hover:bg-gray-800 transition disabled:opacity-60"
            >
              {loading
                ? "Saving bank details..."
                : "Continue to Seller Details →"}
            </button>

          </div>

        </div>

        {/* FOOTER */}
        <div className="text-center mt-6 pb-10">

          <p className="text-xs text-gray-500">
            Your bank details should be entered
            carefully to avoid payment settlement
            issues.
          </p>

        </div>

      </div>
    </main>
  );
}
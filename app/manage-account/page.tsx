"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Account = {
  id: string;
  name: string;
  email: string;
  phone: string;
  alternatePhone: string | null;
  alternatePhoneHint: string | null;
};

export default function ManageAccountPage() {
  const router = useRouter();

  const [account, setAccount] = useState<Account | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [alternatePhone, setAlternatePhone] =
    useState("");
  const [alternatePhoneHint, setAlternatePhoneHint] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadAccount() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/account", {
          cache: "no-store",
        });

        const data = await response.json();

        if (response.status === 401) {
          router.push(
            "/login?callbackUrl=/manage-account"
          );
          return;
        }

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Account details could not be loaded."
          );
        }

        setAccount(data);

        setName(data.name || "");
        setEmail(data.email || "");
        setAlternatePhone(
          data.alternatePhone || ""
        );
        setAlternatePhoneHint(
          data.alternatePhoneHint || ""
        );
      } catch (err) {
        console.error(
          "MANAGE ACCOUNT LOAD ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Account details could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAccount();
  }, [router]);

  async function saveDetails() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          alternatePhone,
          alternatePhoneHint,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        router.push(
          "/login?callbackUrl=/manage-account"
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Account details could not be updated."
        );
      }

      setAccount(data.user);

      setName(data.user.name || "");
      setEmail(data.user.email || "");
      setAlternatePhone(
        data.user.alternatePhone || ""
      );
      setAlternatePhoneHint(
        data.user.alternatePhoneHint || ""
      );

      setSuccess(
        "Account details updated successfully."
      );
    } catch (err) {
      console.error(
        "SAVE ACCOUNT ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Account details could not be updated."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8fafc]">

        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-5">
            <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-4 py-8">

          <div className="animate-pulse rounded-3xl border border-gray-200 bg-white p-6">

            <div className="h-7 w-48 rounded bg-gray-200" />

            <div className="mt-8 space-y-5">

              <div className="h-14 rounded-xl bg-gray-200" />
              <div className="h-14 rounded-xl bg-gray-200" />
              <div className="h-14 rounded-xl bg-gray-200" />
              <div className="h-14 rounded-xl bg-gray-200" />

            </div>

          </div>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#111827]">

      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4">

          <Link
            href="/profile"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f5f9] text-xl font-black"
          >
            ←
          </Link>

          <div>
            <p className="text-xs font-black uppercase tracking-wider text-gray-400">
              CLOTHTYM
            </p>

            <h1 className="text-xl font-black text-[#07152f]">
              Manage Account
            </h1>
          </div>

        </div>

      </header>

      {/* MAIN */}

      <div className="mx-auto max-w-4xl px-4 py-8">

        {/* TITLE */}

        <div className="mb-6">

          <p className="text-sm font-black uppercase tracking-wider text-gray-500">
            Account Settings
          </p>

          <h2 className="mt-1 text-3xl font-black text-[#07152f]">
            Account Details
          </h2>

          <p className="mt-2 text-gray-500">
            Manage your personal account information.
          </p>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
            {success}
          </div>
        )}

        {/* ACCOUNT CARD */}

        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white">

          <div className="border-b border-gray-200 px-5 py-5 sm:px-7">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#07152f] text-2xl font-black text-white">
                {name
                  ? name.charAt(0).toUpperCase()
                  : "U"}
              </div>

              <div>

                <h3 className="text-lg font-black">
                  Personal Information
                </h3>

                <p className="text-sm text-gray-500">
                  Keep your account details updated.
                </p>

              </div>

            </div>

          </div>

          <div className="space-y-6 p-5 sm:p-7">

            {/* MOBILE */}

            <div>

              <label className="mb-2 block text-sm font-black text-gray-700">
                Mobile Number
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">

                <div className="flex min-h-12 flex-1 items-center rounded-xl border border-gray-200 bg-gray-50 px-4">

                  <span className="font-semibold text-gray-800">
                    +91 {account?.phone || ""}
                  </span>

                  <span className="ml-auto rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                    ✓ Verified
                  </span>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    alert(
                      "Mobile number change will be enabled after real OTP verification is connected."
                    )
                  }
                  className="min-h-12 rounded-xl border-2 border-[#07152f] px-5 font-black text-[#07152f]"
                >
                  Change Mobile
                </button>

              </div>

            </div>

            {/* FULL NAME */}

            <div>

              <label className="mb-2 block text-sm font-black text-gray-700">
                Full Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Enter your full name"
                className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base outline-none transition focus:border-[#07152f] focus:ring-2 focus:ring-[#07152f]/10"
              />

            </div>

            {/* EMAIL */}

            <div>

              <label className="mb-2 block text-sm font-black text-gray-700">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Enter your email address"
                className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base outline-none transition focus:border-[#07152f] focus:ring-2 focus:ring-[#07152f]/10"
              />

            </div>

            {/* ALTERNATE MOBILE */}

            <div>

              <label className="mb-2 block text-sm font-black text-gray-700">
                Alternate Mobile Number
              </label>

              <input
                type="tel"
                inputMode="numeric"
                value={alternatePhone}
                onChange={(event) =>
                  setAlternatePhone(
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10)
                  )
                }
                placeholder="Enter alternate mobile number"
                className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base outline-none transition focus:border-[#07152f] focus:ring-2 focus:ring-[#07152f]/10"
              />

              <p className="mt-2 text-xs font-semibold text-gray-500">
                Optional. This number must not belong to another ClothTym account.
              </p>

            </div>

            {/* HINT NAME */}

            <div>

              <label className="mb-2 block text-sm font-black text-gray-700">
                Hint Name
              </label>

              <input
                type="text"
                value={alternatePhoneHint}
                onChange={(event) =>
                  setAlternatePhoneHint(
                    event.target.value.slice(0, 50)
                  )
                }
                placeholder="Example: Dad, Mom, Brother"
                className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base outline-none transition focus:border-[#07152f] focus:ring-2 focus:ring-[#07152f]/10"
              />

              <p className="mt-2 text-xs font-semibold text-gray-500">
                Add a short name to identify your alternate number.
              </p>

            </div>

            {/* SAVE */}

            <div className="border-t border-gray-200 pt-6">

              <button
                type="button"
                onClick={saveDetails}
                disabled={saving}
                className="min-h-12 w-full rounded-xl bg-[#07152f] px-6 py-3 font-black text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:bg-gray-400 sm:w-auto"
              >
                {saving
                  ? "Saving..."
                  : "Save Details"}
              </button>

            </div>

          </div>

        </section>

        {/* DELETE ACCOUNT */}

        <section className="mt-6 rounded-3xl border border-red-200 bg-white p-5 sm:p-7">

          <h3 className="text-lg font-black text-red-600">
            Delete Account
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Permanently deleting your ClothTym account is a separate protected process.
            We will not delete your account from this button until that complete workflow is implemented.
          </p>

          <button
            type="button"
            disabled
            className="mt-5 rounded-xl border-2 border-red-200 px-5 py-3 font-black text-red-400"
          >
            Delete Account
          </button>

        </section>

        {/* ADDRESSES */}

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-5 sm:p-7">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>

              <h3 className="text-lg font-black">
                Addresses
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Manage your saved delivery addresses.
              </p>

            </div>

            <Link
              href="/manage-account/addresses"
              className="rounded-xl border-2 border-[#07152f] px-5 py-3 text-center font-black text-[#07152f]"
            >
              Manage Addresses
            </Link>

          </div>

        </section>

      </div>

    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Address = {
  id: string;
  name: string;
  mobile: string;
  addressLine1: string;
  addressLine2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  type: string;
  isDefault: boolean;
};

type FormData = {
  name: string;
  mobile: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  type: "HOME" | "OFFICE";
  isDefault: boolean;
};

const emptyForm: FormData = {
  name: "",
  mobile: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  type: "HOME",
  isDefault: false,
};

export default function AddressesPage() {
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(
    null
  );

  const [form, setForm] = useState<FormData>(emptyForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadAddresses() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/account/addresses",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        router.push(
          "/login?callbackUrl=/manage-account/addresses"
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to load addresses."
        );
      }

      setAddresses(data);
    } catch (err) {
      console.error(
        "LOAD ADDRESSES ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load addresses."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAddresses();
  }, []);

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(address: Address) {
    setEditingId(address.id);

    setForm({
      name: address.name,
      mobile: address.mobile,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      landmark: address.landmark || "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      type:
        address.type === "OFFICE"
          ? "OFFICE"
          : "HOME",
      isDefault: address.isDefault,
    });

    setError("");
    setSuccess("");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function updateField(
    field: keyof FormData,
    value: string | boolean
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function saveAddress() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const endpoint =
        "/api/account/addresses";

      const method = editingId ? "PATCH" : "POST";

      const body = editingId
        ? {
            id: editingId,
            ...form,
          }
        : form;

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.status === 401) {
        router.push(
          "/login?callbackUrl=/manage-account/addresses"
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Address could not be saved."
        );
      }

      await loadAddresses();

      setSuccess(
        editingId
          ? "Address updated successfully."
          : "Address added successfully."
      );

      closeForm();
    } catch (err) {
      console.error(
        "SAVE ADDRESS ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Address could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  async function makeDefault(id: string) {
    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/account/addresses",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            setDefault: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Could not update default address."
        );
      }

      await loadAddresses();

      setSuccess("Default address updated.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update default address."
      );
    }
  }

  async function removeAddress(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this address?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/account/addresses?id=${encodeURIComponent(
          id
        )}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Address could not be removed."
        );
      }

      await loadAddresses();

      setSuccess("Address removed successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Address could not be removed."
      );
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8fafc]">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-5">
            <div className="h-6 w-44 animate-pulse rounded bg-gray-200" />
          </div>
        </header>

        <div className="mx-auto max-w-4xl space-y-5 px-4 py-8">
          <div className="h-20 animate-pulse rounded-3xl bg-gray-200" />
          <div className="h-52 animate-pulse rounded-3xl bg-gray-200" />
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
            href="/manage-account"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1f5f9] text-xl font-black"
          >
            ←
          </Link>

          <div>
            <p className="text-xs font-black uppercase tracking-wider text-gray-400">
              CLOTHTYM
            </p>

            <h1 className="text-xl font-black text-[#07152f]">
              My Addresses
            </h1>
          </div>

        </div>

      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">

        {/* PAGE INTRO */}

        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

          <div>
            <p className="text-sm font-black uppercase tracking-wider text-gray-500">
              Manage Account
            </p>

            <h2 className="mt-1 text-3xl font-black text-[#07152f]">
              Addresses
            </h2>

            <p className="mt-2 text-gray-500">
              Save addresses for faster checkout.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="min-h-12 rounded-xl bg-[#07152f] px-5 py-3 font-black text-white"
          >
            + ADD NEW ADDRESS
          </button>

        </div>

        {/* MESSAGES */}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
            {success}
          </div>
        )}

        {/* ADD / EDIT FORM */}

        {showForm && (
          <section className="mb-6 overflow-hidden rounded-3xl border border-gray-200 bg-white">

            <div className="border-b border-gray-200 px-5 py-5 sm:px-7">

              <div className="flex items-center justify-between gap-4">

                <div>
                  <h3 className="text-xl font-black text-[#07152f]">
                    {editingId
                      ? "Edit Address"
                      : "Add New Address"}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Enter your complete delivery address.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg font-black"
                >
                  ×
                </button>

              </div>

            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">

              {/* NAME */}

              <div>
                <label className="mb-2 block text-sm font-black">
                  Name
                </label>

                <input
                  value={form.name}
                  onChange={(e) =>
                    updateField("name", e.target.value)
                  }
                  placeholder="Full name"
                  className="min-h-12 w-full rounded-xl border border-gray-300 px-4 outline-none focus:border-[#07152f]"
                />
              </div>

              {/* MOBILE */}

              <div>
                <label className="mb-2 block text-sm font-black">
                  Mobile Number
                </label>

                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.mobile}
                  onChange={(e) =>
                    updateField(
                      "mobile",
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10)
                    )
                  }
                  placeholder="10-digit mobile number"
                  className="min-h-12 w-full rounded-xl border border-gray-300 px-4 outline-none focus:border-[#07152f]"
                />
              </div>

              {/* ADDRESS */}

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-black">
                  Address
                </label>

                <textarea
                  value={form.addressLine1}
                  onChange={(e) =>
                    updateField(
                      "addressLine1",
                      e.target.value
                    )
                  }
                  placeholder="House / Flat / Building, Street"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#07152f]"
                />
              </div>

              {/* ADDRESS LINE 2 */}

              <div>
                <label className="mb-2 block text-sm font-black">
                  Area / Locality
                </label>

                <input
                  value={form.addressLine2}
                  onChange={(e) =>
                    updateField(
                      "addressLine2",
                      e.target.value
                    )
                  }
                  placeholder="Area or locality"
                  className="min-h-12 w-full rounded-xl border border-gray-300 px-4 outline-none focus:border-[#07152f]"
                />
              </div>

              {/* LANDMARK */}

              <div>
                <label className="mb-2 block text-sm font-black">
                  Landmark
                </label>

                <input
                  value={form.landmark}
                  onChange={(e) =>
                    updateField(
                      "landmark",
                      e.target.value
                    )
                  }
                  placeholder="Nearby landmark"
                  className="min-h-12 w-full rounded-xl border border-gray-300 px-4 outline-none focus:border-[#07152f]"
                />
              </div>

              {/* CITY */}

              <div>
                <label className="mb-2 block text-sm font-black">
                  City
                </label>

                <input
                  value={form.city}
                  onChange={(e) =>
                    updateField("city", e.target.value)
                  }
                  placeholder="City"
                  className="min-h-12 w-full rounded-xl border border-gray-300 px-4 outline-none focus:border-[#07152f]"
                />
              </div>

              {/* STATE */}

              <div>
                <label className="mb-2 block text-sm font-black">
                  State
                </label>

                <input
                  value={form.state}
                  onChange={(e) =>
                    updateField("state", e.target.value)
                  }
                  placeholder="State"
                  className="min-h-12 w-full rounded-xl border border-gray-300 px-4 outline-none focus:border-[#07152f]"
                />
              </div>

              {/* PINCODE */}

              <div>
                <label className="mb-2 block text-sm font-black">
                  Pincode
                </label>

                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.pincode}
                  onChange={(e) =>
                    updateField(
                      "pincode",
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6)
                    )
                  }
                  placeholder="6-digit pincode"
                  className="min-h-12 w-full rounded-xl border border-gray-300 px-4 outline-none focus:border-[#07152f]"
                />
              </div>

              {/* ADDRESS TYPE */}

              <div>
                <label className="mb-2 block text-sm font-black">
                  Address Type
                </label>

                <div className="grid grid-cols-2 gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      updateField("type", "HOME")
                    }
                    className={`min-h-12 rounded-xl border-2 font-black ${
                      form.type === "HOME"
                        ? "border-[#07152f] bg-[#07152f] text-white"
                        : "border-gray-200 bg-white text-gray-600"
                    }`}
                  >
                    HOME
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateField("type", "OFFICE")
                    }
                    className={`min-h-12 rounded-xl border-2 font-black ${
                      form.type === "OFFICE"
                        ? "border-[#07152f] bg-[#07152f] text-white"
                        : "border-gray-200 bg-white text-gray-600"
                    }`}
                  >
                    OFFICE
                  </button>

                </div>
              </div>

              {/* DEFAULT */}

              <div className="flex items-center sm:col-span-2">

                <label className="flex cursor-pointer items-center gap-3">

                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) =>
                      updateField(
                        "isDefault",
                        e.target.checked
                      )
                    }
                    className="h-5 w-5 accent-[#07152f]"
                  />

                  <span className="text-sm font-black">
                    Make this my default address
                  </span>

                </label>

              </div>

              {/* BUTTONS */}

              <div className="flex flex-col gap-3 border-t border-gray-200 pt-5 sm:col-span-2 sm:flex-row">

                <button
                  type="button"
                  onClick={saveAddress}
                  disabled={saving}
                  className="min-h-12 rounded-xl bg-[#07152f] px-7 py-3 font-black text-white disabled:bg-gray-400"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "UPDATE ADDRESS"
                    : "SAVE ADDRESS"}
                </button>

                <button
                  type="button"
                  onClick={closeForm}
                  className="min-h-12 rounded-xl border-2 border-gray-200 px-7 py-3 font-black text-gray-700"
                >
                  CANCEL
                </button>

              </div>

            </div>

          </section>
        )}

        {/* NO ADDRESSES */}

        {addresses.length === 0 && !showForm && (
          <section className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl">
              📍
            </div>

            <h3 className="mt-5 text-xl font-black text-[#07152f]">
              No saved addresses
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Add your home or office address to make checkout faster.
            </p>

            <button
              type="button"
              onClick={openAddForm}
              className="mt-6 rounded-xl bg-[#07152f] px-6 py-3 font-black text-white"
            >
              + ADD NEW ADDRESS
            </button>

          </section>
        )}

        {/* DEFAULT ADDRESS */}

        {addresses.some(
          (address) => address.isDefault
        ) && (
          <section className="mb-6">

            <div className="mb-3 flex items-center gap-2">
              <span className="text-lg">★</span>

              <h3 className="text-lg font-black text-[#07152f]">
                Default Address
              </h3>
            </div>

            {addresses
              .filter((address) => address.isDefault)
              .map((address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  onEdit={openEditForm}
                  onRemove={removeAddress}
                  onDefault={makeDefault}
                />
              ))}

          </section>
        )}

        {/* OTHER ADDRESSES */}

        {addresses.some(
          (address) => !address.isDefault
        ) && (
          <section>

            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-lg font-black text-[#07152f]">
                Other Addresses
              </h3>
            </div>

            <div className="space-y-4">

              {addresses
                .filter(
                  (address) => !address.isDefault
                )
                .map((address) => (
                  <AddressCard
                    key={address.id}
                    address={address}
                    onEdit={openEditForm}
                    onRemove={removeAddress}
                    onDefault={makeDefault}
                  />
                ))}

            </div>

          </section>
        )}

      </div>

    </main>
  );
}

/* =========================================================
   ADDRESS CARD
========================================================= */

function AddressCard({
  address,
  onEdit,
  onRemove,
  onDefault,
}: {
  address: Address;
  onEdit: (address: Address) => void;
  onRemove: (id: string) => void;
  onDefault: (id: string) => void;
}) {
  return (
    <article className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6">

      <div className="flex flex-col gap-5">

        {/* TOP */}

        <div className="flex flex-wrap items-start justify-between gap-4">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#07152f] text-lg text-white">
              {address.type === "OFFICE"
                ? "⌂"
                : "⌂"}
            </div>

            <div>

              <div className="flex flex-wrap items-center gap-2">

                <h4 className="font-black text-[#07152f]">
                  {address.name}
                </h4>

                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-gray-600">
                  {address.type}
                </span>

              </div>

              {address.isDefault && (
                <span className="mt-1 inline-block text-xs font-black text-green-600">
                  DEFAULT ADDRESS
                </span>
              )}

            </div>

          </div>

          <span className="text-sm font-bold text-gray-600">
            {address.mobile}
          </span>

        </div>

        {/* ADDRESS */}

        <div className="rounded-2xl bg-gray-50 p-4 text-sm leading-6 text-gray-700">

          <p className="font-semibold">
            {address.addressLine1}
          </p>

          {address.addressLine2 && (
            <p>{address.addressLine2}</p>
          )}

          {address.landmark && (
            <p>
              Landmark: {address.landmark}
            </p>
          )}

          <p>
            {address.city}, {address.state} -{" "}
            <strong>{address.pincode}</strong>
          </p>

        </div>

        {/* ACTIONS */}

        <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">

          <button
            type="button"
            onClick={() => onEdit(address)}
            className="min-h-11 rounded-xl border-2 border-[#07152f] px-5 py-2 text-sm font-black text-[#07152f]"
          >
            EDIT
          </button>

          <button
            type="button"
            onClick={() => onRemove(address.id)}
            className="min-h-11 rounded-xl border-2 border-red-100 px-5 py-2 text-sm font-black text-red-600"
          >
            REMOVE
          </button>

          {!address.isDefault && (
            <button
              type="button"
              onClick={() => onDefault(address.id)}
              className="min-h-11 rounded-xl px-3 py-2 text-sm font-black text-[#07152f]"
            >
              MAKE DEFAULT
            </button>
          )}

        </div>

      </div>

    </article>
  );
}
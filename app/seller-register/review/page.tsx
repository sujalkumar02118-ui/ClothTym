"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type RegistrationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED";

type SavedRegistration = {
  mobile?: string | null;
  mobileVerified?: boolean;

  businessType?: string | null;
  businessName?: string | null;
  ownerName?: string | null;

  hasGst?: boolean | null;
  gstin?: string | null;
  panNumber?: string | null;
  panName?: string | null;
  panEmail?: string | null;

  pickupAddress?: string | null;
  pickupCity?: string | null;
  pickupState?: string | null;
  pickupPincode?: string | null;

  pickupContactName?: string | null;
  pickupContactMobile?: string | null;

  pickupLatitude?: number | null;
  pickupLongitude?: number | null;

  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankIfsc?: string | null;
  bankName?: string | null;

  storeName?: string | null;

  termsAccepted?: boolean;

  submittedAt?: string | null;
  status?: RegistrationStatus;
  rejectionReason?: string | null;
};

type ParsedAddress = {
  houseNumber?: string;
  street?: string;
  area?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  latitude?: number | null;
  longitude?: number | null;
};

export default function SellerReviewPage() {
  const router = useRouter();

  const [registration, setRegistration] =
    useState<SavedRegistration | null>(null);

  const [termsAccepted, setTermsAccepted] = useState(false);

  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [submittedAt, setSubmittedAt] = useState<string | null>(
    null
  );

  /*
   * Load the complete seller registration from DB.
   */
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
          router.replace(
            "/login?callbackUrl=/seller-register/review"
          );
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Unable to load seller registration details."
          );
        }

        if (cancelled) return;

        const saved =
          (data?.registration as SavedRegistration | null) ??
          null;

        setRegistration(saved);

        if (saved?.termsAccepted) {
          setTermsAccepted(true);
        }

        /*
         * If registration was already submitted,
         * show the submitted state instead of allowing
         * another submission.
         */
        if (
          saved?.status === "SUBMITTED" ||
          saved?.status === "UNDER_REVIEW" ||
          saved?.status === "APPROVED"
        ) {
          setSuccess(true);
          setSubmittedAt(saved.submittedAt ?? null);
        }
      } catch (err) {
        if (cancelled) return;

        console.error(
          "Seller review loading error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load seller registration."
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

  /*
   * Convert the structured pickup address stored in
   * pickupAddress into readable fields.
   */
  const parsedAddress = useMemo<ParsedAddress | null>(() => {
    if (!registration?.pickupAddress) {
      return null;
    }

    try {
      const parsed = JSON.parse(
        registration.pickupAddress
      );

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        return parsed as ParsedAddress;
      }
    } catch {
      // Older/plain-text address.
      return {
        area: registration.pickupAddress,
      };
    }

    return null;
  }, [registration?.pickupAddress]);

  function maskAccountNumber(
    accountNumber?: string | null
  ) {
    if (!accountNumber) {
      return "Not provided";
    }

    const value = accountNumber.trim();

    if (!value) {
      return "Not provided";
    }

    /*
     * The API normally returns a masked account number.
     * This also safely handles an unmasked value if one
     * is ever returned.
     */
    if (
      value.includes("•") ||
      value.includes("*")
    ) {
      return value;
    }

    if (value.length <= 4) {
      return `••••${value}`;
    }

    return `••••••••${value.slice(-4)}`;
  }

  function maskGstin(gstin?: string | null) {
    if (!gstin) {
      return "Not provided";
    }

    const value = gstin.trim();

    if (value.length <= 4) {
      return value;
    }

    return `${value.slice(0, 4)}••••••${value.slice(-3)}`;
  }

  function maskPan(pan?: string | null) {
    if (!pan) {
      return "Not provided";
    }

    const value = pan.trim();

    if (value.length <= 4) {
      return value;
    }

    return `${value.slice(0, 3)}•••••${value.slice(-2)}`;
  }

  function formatBusinessType(
    value?: string | null
  ) {
    if (!value) {
      return "Not provided";
    }

    const labels: Record<string, string> = {
      INDIVIDUAL: "Individual",
      PROPRIETORSHIP: "Proprietorship",
      PARTNERSHIP: "Partnership",
      LLP: "LLP",
      PRIVATE_LIMITED: "Private Limited",
      OTHER: "Other",
    };

    return labels[value] ?? value;
  }

  function formatDate(value?: string | null) {
    if (!value) {
      return null;
    }

    try {
      return new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return value;
    }
  }

  function getReadableAddress() {
    if (!registration?.pickupAddress) {
      return "Not provided";
    }

    if (!parsedAddress) {
      return registration.pickupAddress;
    }

    const parts = [
      parsedAddress.houseNumber,
      parsedAddress.street,
      parsedAddress.area,
      parsedAddress.district,
      parsedAddress.city,
      parsedAddress.state,
      parsedAddress.pincode,
    ].filter(Boolean);

    return parts.length > 0
      ? parts.join(", ")
      : "Address details saved";
  }

  function validateBeforeSubmit() {
    if (!registration) {
      setError(
        "Seller registration details could not be loaded."
      );
      return false;
    }

    if (!registration.mobile) {
      setError(
        "Mobile number is missing. Please complete mobile verification."
      );
      return false;
    }

    if (!registration.mobileVerified) {
      setError(
        "Mobile number has not been verified yet."
      );
      return false;
    }

    if (!registration.businessType) {
      setError(
        "Business type is missing. Please complete the Business step."
      );
      return false;
    }

    if (!registration.businessName) {
      setError(
        "Business name is missing. Please complete the Business step."
      );
      return false;
    }

    if (!registration.ownerName) {
      setError(
        "Seller/owner name is missing. Please complete the required details."
      );
      return false;
    }

    if (!registration.pickupAddress) {
      setError(
        "Pickup address is missing. Please complete the Address step."
      );
      return false;
    }

    if (!registration.pickupCity) {
      setError(
        "Pickup city is missing. Please complete the Address step."
      );
      return false;
    }

    if (!registration.pickupState) {
      setError(
        "Pickup state is missing. Please complete the Address step."
      );
      return false;
    }

    if (!registration.pickupPincode) {
      setError(
        "Pickup pincode is missing. Please complete the Address step."
      );
      return false;
    }

    if (!registration.bankAccountName) {
      setError(
        "Bank account holder details are missing."
      );
      return false;
    }

    if (!registration.bankAccountNumber) {
      setError(
        "Bank account number is missing."
      );
      return false;
    }

    if (!registration.bankIfsc) {
      setError(
        "Bank IFSC is missing."
      );
      return false;
    }

    if (!registration.bankName) {
      setError(
        "Bank name is missing."
      );
      return false;
    }

    if (!registration.storeName) {
      setError(
        "Store name is missing. Please complete the Seller Details step."
      );
      return false;
    }

    if (!termsAccepted) {
      setError(
        "Please accept the ClothTym Seller Terms & Conditions."
      );
      return false;
    }

    return true;
  }

  async function handleSubmit() {
    setError("");

    if (!validateBeforeSubmit()) {
      return;
    }

    setLoading(true);

    try {
      /*
       * Final submission goes through the authenticated
       * seller-registration API.
       *
       * The server performs the authoritative validation
       * and changes the registration status.
       */
      const response = await fetch(
        "/api/seller-registration",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            termsAccepted: true,
          }),
        }
      );

      if (response.status === 401) {
        router.replace(
          "/login?callbackUrl=/seller-register/review"
        );
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to submit seller registration."
        );
      }

      const saved =
        (data?.registration as SavedRegistration | null) ??
        null;

      setRegistration(
        saved ?? {
          ...registration,
          termsAccepted: true,
          status: "SUBMITTED",
        }
      );

      setTermsAccepted(true);
      setSuccess(true);

      setSubmittedAt(
        saved?.submittedAt ??
          new Date().toISOString()
      );
    } catch (err) {
      console.error(
        "Seller registration submission error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit seller registration. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <div className="mx-auto w-8 h-8 rounded-full border-4 border-gray-200 border-t-gray-900 animate-spin" />

            <p className="mt-4 text-sm font-medium text-gray-600">
              Loading your registration details...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /*
   * FINAL SUBMITTED STATE
   */
  if (success) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-3xl mx-auto">

          <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12 text-center">

            <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl">
              ✓
            </div>

            <h1 className="mt-6 text-3xl md:text-4xl font-extrabold text-gray-900">
              Registration Submitted
            </h1>

            <p className="mt-3 text-gray-600 leading-6">
              Your ClothTym seller registration has been
              successfully submitted for verification.
            </p>

            {submittedAt && (
              <p className="mt-2 text-sm text-gray-500">
                Submitted on {formatDate(submittedAt)}
              </p>
            )}

            <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-left">
              <h2 className="font-bold text-blue-900">
                What happens next?
              </h2>

              <p className="mt-2 text-sm text-blue-800 leading-6">
                ClothTym will review your seller
                registration details. Your seller account
                will become available after the required
                verification and approval process is
                completed.
              </p>
            </div>

            <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-5 text-left">
              <div className="flex items-start gap-3">
                <div className="text-2xl">
                  🔒
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">
                    Your information is protected
                  </h3>

                  <p className="mt-1 text-sm text-gray-600 leading-6">
                    Sensitive seller and bank information
                    is not displayed publicly.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-8 w-full rounded-xl bg-gray-900 text-white px-8 py-4 font-bold hover:bg-gray-800 transition"
            >
              Back to ClothTym Home
            </button>

          </div>

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900">
            Review & Submit
          </h1>

          <p className="mt-2 text-gray-500">
            Review your seller registration details
            before submitting
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
                    <div className="h-0.5 flex-1 mx-3 bg-gray-900" />
                  )}
                </div>
              );
            })}

          </div>
        </div>

        {/* INFORMATION */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 mb-6">
          <div className="flex gap-3">

            <div className="text-2xl">
              ℹ️
            </div>

            <div>
              <h2 className="font-bold text-blue-900">
                Final review
              </h2>

              <p className="text-sm text-blue-800 mt-1">
                Please carefully review all information
                before submitting your seller registration.
              </p>
            </div>

          </div>
        </div>

        {/* MOBILE */}
        <ReviewSection
          title="📱 Mobile Verification"
          onEdit={() =>
            router.push("/seller-register")
          }
        >
          <ReviewRow
            label="Mobile Number"
            value={
              registration?.mobile ||
              "Not provided"
            }
          />

          <ReviewRow
            label="Verification"
            value={
              registration?.mobileVerified
                ? "✓ Verified"
                : "Not verified"
            }
          />
        </ReviewSection>

        {/* BUSINESS */}
        <ReviewSection
          title="🏢 Business Details"
          onEdit={() =>
            router.push("/seller-register/business")
          }
        >
          <ReviewRow
            label="Business Type"
            value={formatBusinessType(
              registration?.businessType
            )}
          />

          <ReviewRow
            label="Business Name"
            value={
              registration?.businessName ||
              "Not provided"
            }
          />

          <ReviewRow
            label="Owner Name"
            value={
              registration?.ownerName ||
              "Not provided"
            }
          />

          <ReviewRow
            label="GST Status"
            value={
              registration?.hasGst === true
                ? "GST Registered"
                : registration?.hasGst === false
                  ? "No GST"
                  : "Not provided"
            }
          />

          {registration?.hasGst === true && (
            <ReviewRow
              label="GSTIN"
              value={maskGstin(
                registration.gstin
              )}
            />
          )}

          {registration?.hasGst === false && (
            <>
              <ReviewRow
                label="PAN"
                value={maskPan(
                  registration.panNumber
                )}
              />

              {registration.panName && (
                <ReviewRow
                  label="PAN Name"
                  value={registration.panName}
                />
              )}
            </>
          )}
        </ReviewSection>

        {/* ADDRESS */}
        <ReviewSection
          title="📍 Pickup Address"
          onEdit={() =>
            router.push("/seller-register/address")
          }
        >
          <ReviewRow
            label="Pickup Address"
            value={getReadableAddress()}
          />

          <ReviewRow
            label="City"
            value={
              registration?.pickupCity ||
              parsedAddress?.city ||
              "Not provided"
            }
          />

          <ReviewRow
            label="State"
            value={
              registration?.pickupState ||
              parsedAddress?.state ||
              "Not provided"
            }
          />

          <ReviewRow
            label="Pincode"
            value={
              registration?.pickupPincode ||
              parsedAddress?.pincode ||
              "Not provided"
            }
          />

          <ReviewRow
            label="Pickup Contact"
            value={
              registration?.pickupContactName &&
              registration?.pickupContactMobile
                ? `${registration.pickupContactName} • ${registration.pickupContactMobile}`
                : registration?.pickupContactName ||
                  registration?.pickupContactMobile ||
                  "Not provided"
            }
          />

          <ReviewRow
            label="GPS Location"
            value={
              registration?.pickupLatitude != null &&
              registration?.pickupLongitude != null
                ? `${registration.pickupLatitude.toFixed(
                    6
                  )}, ${registration.pickupLongitude.toFixed(
                    6
                  )}`
                : parsedAddress?.latitude != null &&
                    parsedAddress?.longitude != null
                  ? `${parsedAddress.latitude.toFixed(
                      6
                    )}, ${parsedAddress.longitude.toFixed(
                      6
                    )}`
                  : "Not provided"
            }
          />
        </ReviewSection>

        {/* BANK */}
        <ReviewSection
          title="🏦 Bank Details"
          onEdit={() =>
            router.push("/seller-register/bank")
          }
        >
          <ReviewRow
            label="Account Holder"
            value={
              registration?.bankAccountName ||
              "Not provided"
            }
          />

          <ReviewRow
            label="Account Number"
            value={maskAccountNumber(
              registration?.bankAccountNumber
            )}
          />

          <ReviewRow
            label="IFSC"
            value={
              registration?.bankIfsc ||
              "Not provided"
            }
          />

          <ReviewRow
            label="Bank"
            value={
              registration?.bankName ||
              "Not provided"
            }
          />
        </ReviewSection>

        {/* SELLER DETAILS */}
        <ReviewSection
          title="🏪 Seller / Store Details"
          onEdit={() =>
            router.push("/seller-register/details")
          }
        >
          <ReviewRow
            label="Store Name"
            value={
              registration?.storeName ||
              "Not provided"
            }
          />

          <ReviewRow
            label="Seller Name"
            value={
              registration?.ownerName ||
              "Not provided"
            }
          />

          <ReviewRow
            label="Business Name"
            value={
              registration?.businessName ||
              "Not provided"
            }
          />

          <ReviewRow
            label="Business Type"
            value={formatBusinessType(
              registration?.businessType
            )}
          />
        </ReviewSection>

        {/* TERMS */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">

          <h2 className="text-xl font-bold text-gray-900">
            Terms & Conditions
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            Please confirm that the information provided
            during seller registration is accurate and
            belongs to you or your business.
          </p>

          <label className="mt-6 flex items-start gap-3 cursor-pointer">

            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) =>
                setTermsAccepted(
                  e.target.checked
                )
              }
              disabled={loading}
              className="mt-1 h-5 w-5 rounded border-gray-300"
            />

            <span className="text-sm text-gray-700 leading-6">
              I confirm that the information provided by
              me is accurate and I agree to the ClothTym
              Seller Terms & Conditions and Privacy Policy.
            </span>

          </label>

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
              router.push(
                "/seller-register/details"
              )
            }
            disabled={loading}
            className="w-full md:w-auto rounded-xl border border-gray-300 bg-white px-7 py-4 font-bold text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              loading || !termsAccepted
            }
            className="w-full md:w-auto min-w-[250px] rounded-xl bg-gray-900 text-white px-8 py-4 font-bold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Submitting..."
              : "Submit Seller Registration →"}
          </button>

        </div>

      </div>
    </main>
  );
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">

      <div className="flex items-center justify-between gap-4 mb-5">

        <h2 className="text-xl font-bold text-gray-900">
          {title}
        </h2>

        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-bold text-gray-700 hover:text-gray-900 underline"
        >
          Edit
        </button>

      </div>

      <div className="space-y-4">
        {children}
      </div>

    </section>
  );
}

function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-gray-100 pb-3 last:border-0 last:pb-0">

      <span className="text-sm font-semibold text-gray-600">
        {label}
      </span>

      <span className="text-sm font-medium text-gray-900 sm:text-right break-words">
        {value}
      </span>

    </div>
  );
}
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import type { SellerRegistration } from "@prisma/client";

export const runtime = "nodejs";

type RegistrationPayload = {
  mobile?: unknown;
  mobileVerified?: unknown;

  businessType?: unknown;
  businessName?: unknown;
  ownerName?: unknown;

  hasGst?: unknown;
  gstin?: unknown;
  panNumber?: unknown;
  panName?: unknown;
  panEmail?: unknown;

  pickupAddress?: unknown;
  pickupCity?: unknown;
  pickupState?: unknown;
  pickupPincode?: unknown;
  pickupContactName?: unknown;
  pickupContactMobile?: unknown;
  pickupLatitude?: unknown;
  pickupLongitude?: unknown;

  bankAccountName?: unknown;
  bankAccountNumber?: unknown;
  bankIfsc?: unknown;
  bankName?: unknown;

  storeName?: unknown;

  termsAccepted?: unknown;
  submit?: unknown;
};

/* =========================================
   CONSTANTS
========================================= */

const BUSINESS_TYPES = new Set([
  "INDIVIDUAL",
  "PROPRIETORSHIP",
  "PARTNERSHIP",
  "LLP",
  "PRIVATE_LIMITED",
  "OTHER",
]);

/* =========================================
   HELPERS
========================================= */

function cleanString(
  value: unknown
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const cleaned = value.trim();

  return cleaned || undefined;
}

function normalizeUpper(
  value: unknown
): string | undefined {
  const cleaned = cleanString(value);

  return cleaned
    ? cleaned.toUpperCase()
    : undefined;
}

function isValidMobile(
  value: string | undefined
): boolean {
  return !!value && /^[6-9][0-9]{9}$/.test(value);
}

function isValidPincode(
  value: string | undefined
): boolean {
  return !!value && /^[0-9]{6}$/.test(value);
}

function isValidGstin(
  value: string | undefined
): boolean {
  return (
    !!value &&
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(
      value
    )
  );
}

function isValidPan(
  value: string | undefined
): boolean {
  return (
    !!value &&
    /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value)
  );
}

function isValidIfsc(
  value: string | undefined
): boolean {
  return (
    !!value &&
    /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value)
  );
}

function isValidEmail(
  value: string | undefined
): boolean {
  if (!value) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

function parseOptionalNumber(
  value: unknown
): number | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return undefined;
  }

  const numberValue =
    typeof value === "number"
      ? value
      : Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : undefined;
}

function isValidLatitude(
  value: number | undefined
): boolean {
  return (
    value !== undefined &&
    Number.isFinite(value) &&
    value >= -90 &&
    value <= 90
  );
}

function isValidLongitude(
  value: number | undefined
): boolean {
  return (
    value !== undefined &&
    Number.isFinite(value) &&
    value >= -180 &&
    value <= 180
  );
}

/* =========================================
   SAFE RESPONSE
========================================= */

function sanitizeRegistration(
  registration: SellerRegistration
) {
  const accountNumber =
    registration.bankAccountNumber;

  const maskedAccountNumber =
    accountNumber
      ? `****${accountNumber.slice(-4)}`
      : null;

  return {
    id: registration.id,
    userId: registration.userId,

    mobile: registration.mobile,
    mobileVerified:
      registration.mobileVerified,

    businessType:
      registration.businessType,
    businessName:
      registration.businessName,
    ownerName:
      registration.ownerName,

    hasGst:
      registration.hasGst,

    gstin:
      registration.gstin,

    panNumber:
      registration.panNumber,

    panName:
      registration.panName,

    panEmail:
      registration.panEmail,

    pickupAddress:
      registration.pickupAddress,

    pickupCity:
      registration.pickupCity,

    pickupState:
      registration.pickupState,

    pickupPincode:
      registration.pickupPincode,

    pickupContactName:
      registration.pickupContactName,

    pickupContactMobile:
      registration.pickupContactMobile,

    pickupLatitude:
      registration.pickupLatitude,

    pickupLongitude:
      registration.pickupLongitude,

    bankAccountName:
      registration.bankAccountName,

    // Never expose full bank account number.
    bankAccountNumber:
      maskedAccountNumber,

    bankIfsc:
      registration.bankIfsc,

    bankName:
      registration.bankName,

    storeName:
      registration.storeName,

    termsAccepted:
      registration.termsAccepted,

    submittedAt:
      registration.submittedAt,

    status:
      registration.status,

    rejectionReason:
      registration.rejectionReason,

    createdAt:
      registration.createdAt,

    updatedAt:
      registration.updatedAt,
  };
}

/* =========================================
   GET
   LOAD CURRENT USER REGISTRATION
========================================= */

export async function GET() {
  try {
    const session =
      await getServerSession(
        authOptions
      );

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const userId =
      String(session.user.id);

    const registration =
      await prisma.sellerRegistration.findUnique(
        {
          where: {
            userId,
          },
        }
      );

    if (!registration) {
      return NextResponse.json(
        {
          registration: null,
        },
        {
          status: 200,
        }
      );
    }

    return NextResponse.json(
      {
        registration:
          sanitizeRegistration(
            registration
          ),
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Seller registration GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load seller registration.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================
   POST
   SAVE / UPDATE DRAFT
========================================= */

export async function POST(
  request: NextRequest
) {
  try {
    /* =======================================
       AUTH
    ======================================= */

    const session =
      await getServerSession(
        authOptions
      );

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const userId =
      String(session.user.id);

    /* =======================================
       READ BODY
    ======================================= */

    let body: RegistrationPayload;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid JSON request.",
        },
        {
          status: 400,
        }
      );
    }

    /* =======================================
       EXISTING REGISTRATION
    ======================================= */

    const existing =
      await prisma.sellerRegistration.findUnique(
        {
          where: {
            userId,
          },
        }
      );

    /*
     * Submitted / Under Review / Approved
     * registrations cannot be edited.
     *
     * Rejected registrations can be edited
     * and submitted again.
     */

    if (
      existing &&
      (
        existing.status === "SUBMITTED" ||
        existing.status === "UNDER_REVIEW" ||
        existing.status === "APPROVED"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "This seller registration cannot be edited at its current status.",
          status:
            existing.status,
        },
        {
          status: 409,
        }
      );
    }

    /* =======================================
       INPUT NORMALIZATION
    ======================================= */

    const mobile =
      cleanString(body.mobile);

    const businessType =
      normalizeUpper(
        body.businessType
      );

    const businessName =
      cleanString(
        body.businessName
      );

    const ownerName =
      cleanString(
        body.ownerName
      );

    const hasGst =
      typeof body.hasGst === "boolean"
        ? body.hasGst
        : undefined;

    const gstin =
      normalizeUpper(
        body.gstin
      );

    const panNumber =
      normalizeUpper(
        body.panNumber
      );

    const panName =
      cleanString(
        body.panName
      );

    const panEmail =
      cleanString(
        body.panEmail
      )?.toLowerCase();

    const pickupAddress =
      cleanString(
        body.pickupAddress
      );

    const pickupCity =
      cleanString(
        body.pickupCity
      );

    const pickupState =
      cleanString(
        body.pickupState
      );

    const pickupPincode =
      cleanString(
        body.pickupPincode
      );

    const pickupContactName =
      cleanString(
        body.pickupContactName
      );

    const pickupContactMobile =
      cleanString(
        body.pickupContactMobile
      );

    const pickupLatitude =
      parseOptionalNumber(
        body.pickupLatitude
      );

    const pickupLongitude =
      parseOptionalNumber(
        body.pickupLongitude
      );

    const bankAccountName =
      cleanString(
        body.bankAccountName
      );

    const bankAccountNumber =
      cleanString(
        body.bankAccountNumber
      );

    const bankIfsc =
      normalizeUpper(
        body.bankIfsc
      );

    const bankName =
      cleanString(
        body.bankName
      );

    const storeName =
      cleanString(
        body.storeName
      );

    const termsAccepted =
      body.termsAccepted === true;

    const submit =
      body.submit === true;

    /* =======================================
       BASIC VALIDATION
    ======================================= */

    if (!mobile) {
      return NextResponse.json(
        {
          error:
            "Mobile number is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!isValidMobile(mobile)) {
      return NextResponse.json(
        {
          error:
            "Enter a valid 10-digit mobile number.",
        },
        {
          status: 400,
        }
      );
    }

    /* =======================================
       BUSINESS VALIDATION
    ======================================= */

    if (
      businessType &&
      !BUSINESS_TYPES.has(
        businessType
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid business type.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      businessName &&
      businessName.length < 2
    ) {
      return NextResponse.json(
        {
          error:
            "Business name is too short.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      ownerName &&
      ownerName.length < 2
    ) {
      return NextResponse.json(
        {
          error:
            "Owner name is too short.",
        },
        {
          status: 400,
        }
      );
    }

    /* =======================================
       GST / PAN
    ======================================= */

    if (
      hasGst === true &&
      gstin &&
      !isValidGstin(gstin)
    ) {
      return NextResponse.json(
        {
          error:
            "Enter a valid GSTIN.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      hasGst === false &&
      panNumber &&
      !isValidPan(panNumber)
    ) {
      return NextResponse.json(
        {
          error:
            "Enter a valid PAN number.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      panEmail &&
      !isValidEmail(panEmail)
    ) {
      return NextResponse.json(
        {
          error:
            "Enter a valid PAN email address.",
        },
        {
          status: 400,
        }
      );
    }

    /* =======================================
       ADDRESS
    ======================================= */

    if (
      pickupPincode &&
      !isValidPincode(
        pickupPincode
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Enter a valid 6-digit pickup pincode.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      pickupContactMobile &&
      !isValidMobile(
        pickupContactMobile
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Enter a valid pickup contact mobile number.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      pickupLatitude !== undefined &&
      !isValidLatitude(
        pickupLatitude
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid pickup latitude.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      pickupLongitude !== undefined &&
      !isValidLongitude(
        pickupLongitude
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid pickup longitude.",
        },
        {
          status: 400,
        }
      );
    }

    /* =======================================
       BANK
    ======================================= */

    if (
      bankAccountNumber &&
      !/^[0-9]{9,18}$/.test(
        bankAccountNumber
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Enter a valid bank account number.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      bankIfsc &&
      !isValidIfsc(
        bankIfsc
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Enter a valid IFSC code.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      bankAccountName &&
      bankAccountName.length < 2
    ) {
      return NextResponse.json(
        {
          error:
            "Bank account holder name is too short.",
        },
        {
          status: 400,
        }
      );
    }

    /* =======================================
       FINAL SUBMISSION
    ======================================= */

    if (submit) {
      /*
       * Server-side OTP verification is mandatory.
       * The client cannot fake this value.
       */
      if (
        !existing?.mobileVerified
      ) {
        return NextResponse.json(
          {
            error:
              "Mobile number must be verified before submission.",
          },
          {
            status: 400,
          }
        );
      }

      if (!businessType) {
        return NextResponse.json(
          {
            error:
              "Business type is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (!businessName) {
        return NextResponse.json(
          {
            error:
              "Business name is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (!ownerName) {
        return NextResponse.json(
          {
            error:
              "Owner name is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (hasGst === undefined) {
        return NextResponse.json(
          {
            error:
              "Please select whether you have GST.",
          },
          {
            status: 400,
          }
        );
      }

      if (hasGst === true) {
        if (!gstin) {
          return NextResponse.json(
            {
              error:
                "GSTIN is required.",
            },
            {
              status: 400,
            }
          );
        }

        if (!isValidGstin(gstin)) {
          return NextResponse.json(
            {
              error:
                "Enter a valid GSTIN.",
            },
            {
              status: 400,
            }
          );
        }
      }

      if (hasGst === false) {
        if (!panNumber) {
          return NextResponse.json(
            {
              error:
                "PAN number is required.",
            },
            {
              status: 400,
            }
          );
        }

        if (!isValidPan(panNumber)) {
          return NextResponse.json(
            {
              error:
                "Enter a valid PAN number.",
            },
            {
              status: 400,
            }
          );
        }

        if (!panName) {
          return NextResponse.json(
            {
              error:
                "PAN name is required.",
            },
            {
              status: 400,
            }
          );
        }

        if (!panEmail) {
          return NextResponse.json(
            {
              error:
                "PAN email is required.",
            },
            {
              status: 400,
            }
          );
        }

        if (!isValidEmail(panEmail)) {
          return NextResponse.json(
            {
              error:
                "Enter a valid PAN email address.",
            },
            {
              status: 400,
            }
          );
        }
      }

      /* ADDRESS */

      if (!pickupAddress) {
        return NextResponse.json(
          {
            error:
              "Pickup address is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (!pickupCity) {
        return NextResponse.json(
          {
            error:
              "Pickup city is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (!pickupState) {
        return NextResponse.json(
          {
            error:
              "Pickup state is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (!pickupPincode) {
        return NextResponse.json(
          {
            error:
              "Pickup pincode is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (!pickupContactName) {
        return NextResponse.json(
          {
            error:
              "Pickup contact name is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (!pickupContactMobile) {
        return NextResponse.json(
          {
            error:
              "Pickup contact mobile is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !isValidLatitude(
          pickupLatitude
        ) ||
        !isValidLongitude(
          pickupLongitude
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Accurate pickup location is required.",
          },
          {
            status: 400,
          }
        );
      }

      /* BANK */

      if (!bankAccountName) {
        return NextResponse.json(
          {
            error:
              "Bank account holder name is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (!bankAccountNumber) {
        return NextResponse.json(
          {
            error:
              "Bank account number is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !/^[0-9]{9,18}$/.test(
          bankAccountNumber
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Enter a valid bank account number.",
          },
          {
            status: 400,
          }
        );
      }

      if (!bankIfsc) {
        return NextResponse.json(
          {
            error:
              "IFSC code is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (!isValidIfsc(bankIfsc)) {
        return NextResponse.json(
          {
            error:
              "Enter a valid IFSC code.",
          },
          {
            status: 400,
          }
        );
      }

      if (!bankName) {
        return NextResponse.json(
          {
            error:
              "Bank name is required.",
          },
          {
            status: 400,
          }
        );
      }

      /* STORE */

      if (!storeName) {
        return NextResponse.json(
          {
            error:
              "Store name is required.",
          },
          {
            status: 400,
          }
        );
      }

      /* TERMS */

      if (!termsAccepted) {
        return NextResponse.json(
          {
            error:
              "You must accept the seller terms and conditions.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* =======================================
       SAFE PARTIAL UPDATE
    ======================================= */

    const updateData: Record<
      string,
      unknown
    > = {};

    /*
     * Only update fields that were actually
     * supplied by the current step.
     *
     * This prevents Address/Bank data from
     * accidentally being erased when Business
     * details are edited later.
     */

    if (body.mobile !== undefined) {
      updateData.mobile = mobile;
    }

    if (
      body.businessType !== undefined
    ) {
      updateData.businessType =
        businessType ?? null;
    }

    if (
      body.businessName !== undefined
    ) {
      updateData.businessName =
        businessName ?? null;
    }

    if (body.ownerName !== undefined) {
      updateData.ownerName =
        ownerName ?? null;
    }

    if (body.hasGst !== undefined) {
      updateData.hasGst =
        hasGst ?? null;
    }

    if (body.gstin !== undefined) {
      updateData.gstin =
        gstin ?? null;
    }

    if (
      body.panNumber !== undefined
    ) {
      updateData.panNumber =
        panNumber ?? null;
    }

    if (body.panName !== undefined) {
      updateData.panName =
        panName ?? null;
    }

    if (body.panEmail !== undefined) {
      updateData.panEmail =
        panEmail ?? null;
    }

    if (
      body.pickupAddress !== undefined
    ) {
      updateData.pickupAddress =
        pickupAddress ?? null;
    }

    if (
      body.pickupCity !== undefined
    ) {
      updateData.pickupCity =
        pickupCity ?? null;
    }

    if (
      body.pickupState !== undefined
    ) {
      updateData.pickupState =
        pickupState ?? null;
    }

    if (
      body.pickupPincode !== undefined
    ) {
      updateData.pickupPincode =
        pickupPincode ?? null;
    }

    if (
      body.pickupContactName !== undefined
    ) {
      updateData.pickupContactName =
        pickupContactName ?? null;
    }

    if (
      body.pickupContactMobile !== undefined
    ) {
      updateData.pickupContactMobile =
        pickupContactMobile ?? null;
    }

    if (
      body.pickupLatitude !== undefined
    ) {
      updateData.pickupLatitude =
        pickupLatitude ?? null;
    }

    if (
      body.pickupLongitude !== undefined
    ) {
      updateData.pickupLongitude =
        pickupLongitude ?? null;
    }

    if (
      body.bankAccountName !== undefined
    ) {
      updateData.bankAccountName =
        bankAccountName ?? null;
    }

    if (
      body.bankAccountNumber !== undefined
    ) {
      updateData.bankAccountNumber =
        bankAccountNumber ?? null;
    }

    if (
      body.bankIfsc !== undefined
    ) {
      updateData.bankIfsc =
        bankIfsc ?? null;
    }

    if (
      body.bankName !== undefined
    ) {
      updateData.bankName =
        bankName ?? null;
    }

    if (
      body.storeName !== undefined
    ) {
      updateData.storeName =
        storeName ?? null;
    }

    /*
     * Client cannot modify mobileVerified.
     *
     * It will only be changed by the future
     * real OTP verification endpoint.
     */

    if (body.termsAccepted !== undefined) {
      updateData.termsAccepted =
        termsAccepted;
    }

    /* =======================================
       SUBMISSION STATE
    ======================================= */

    if (submit) {
      updateData.termsAccepted =
        true;

      updateData.submittedAt =
        new Date();

      updateData.status =
        "SUBMITTED";

      updateData.rejectionReason =
        null;
    } else if (
      existing?.status === "REJECTED"
    ) {
      /*
       * Editing a rejected registration
       * moves it back to DRAFT until
       * the seller submits it again.
       */
      updateData.status = "DRAFT";
      updateData.rejectionReason = null;
    }

    /* =======================================
       CREATE / UPDATE
    ======================================= */

    let registration:
      | SellerRegistration;

    if (!existing) {
      /*
       * First draft creation.
       *
       * All fields not supplied by the current
       * step remain null.
       */

      registration =
        await prisma.sellerRegistration.create(
          {
            data: {
              userId,

              mobile:
                mobile ?? "",

              mobileVerified:
                false,

              businessType:
                businessType ?? null,

              businessName:
                businessName ?? null,

              ownerName:
                ownerName ?? null,

              hasGst:
                hasGst ?? null,

              gstin:
                gstin ?? null,

              panNumber:
                panNumber ?? null,

              panName:
                panName ?? null,

              panEmail:
                panEmail ?? null,

              pickupAddress:
                pickupAddress ?? null,

              pickupCity:
                pickupCity ?? null,

              pickupState:
                pickupState ?? null,

              pickupPincode:
                pickupPincode ?? null,

              pickupContactName:
                pickupContactName ?? null,

              pickupContactMobile:
                pickupContactMobile ?? null,

              pickupLatitude:
                pickupLatitude ?? null,

              pickupLongitude:
                pickupLongitude ?? null,

              bankAccountName:
                bankAccountName ?? null,

              bankAccountNumber:
                bankAccountNumber ?? null,

              bankIfsc:
                bankIfsc ?? null,

              bankName:
                bankName ?? null,

              storeName:
                storeName ?? null,

              termsAccepted:
                submit
                  ? true
                  : false,

              submittedAt:
                submit
                  ? new Date()
                  : null,

              status:
                submit
                  ? "SUBMITTED"
                  : "DRAFT",

              rejectionReason:
                null,
            },
          }
        );
    } else {
      registration =
        await prisma.sellerRegistration.update(
          {
            where: {
              userId,
            },

            data:
              updateData as Parameters<
                typeof prisma.sellerRegistration.update
              >[0]["data"],
          }
        );
    }

    /* =======================================
       RESPONSE
    ======================================= */

    return NextResponse.json(
      {
        success: true,

        message: submit
          ? "Seller registration submitted successfully."
          : "Seller registration saved.",

        registration:
          sanitizeRegistration(
            registration
          ),
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Seller registration POST error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to save seller registration.",
      },
      {
        status: 500,
      }
    );
  }
}
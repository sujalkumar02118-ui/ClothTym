import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  /* =========================================
     ADMIN PROTECTION
  ========================================= */

  if (pathname.startsWith("/admin")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Login nahi hai
    if (!token) {
      const loginUrl = new URL("/login", request.url);

      loginUrl.searchParams.set(
        "callbackUrl",
        pathname
      );

      return NextResponse.redirect(loginUrl);
    }

    // Admin nahi hai ya blocked hai
    if (
      token.role !== "ADMIN" ||
      token.isBlocked === true
    ) {
      return NextResponse.redirect(
        new URL("/", request.url)
      );
    }

    return NextResponse.next();
  }

  /* =========================================
     SELLER REGISTRATION PROTECTION
  ========================================= */

  if (pathname.startsWith("/seller-register")) {
    const session = await getServerSession(
      authOptions
    );

    // Login required
    if (!session?.user?.id) {
      const loginUrl = new URL(
        "/login",
        request.url
      );

      loginUrl.searchParams.set(
        "callbackUrl",
        pathname
      );

      return NextResponse.redirect(loginUrl);
    }

    const userId = String(
      session.user.id
    );

    const registration =
      await prisma.sellerRegistration.findUnique({
        where: {
          userId,
        },
        select: {
          mobileVerified: true,

          businessType: true,
          businessName: true,
          ownerName: true,
          hasGst: true,
          gstin: true,
          panNumber: true,
          panName: true,
          panEmail: true,

          pickupAddress: true,
          pickupCity: true,
          pickupState: true,
          pickupPincode: true,
          pickupContactName: true,
          pickupContactMobile: true,
          pickupLatitude: true,
          pickupLongitude: true,

          bankAccountName: true,
          bankAccountNumber: true,
          bankIfsc: true,
          bankName: true,

          storeName: true,

          status: true,
        },
      });

    /* =======================================
       STATUS PAGE
       Always accessible to logged-in user
    ======================================= */

    if (
      pathname ===
      "/seller-register/status"
    ) {
      return NextResponse.next();
    }

    /* =======================================
       MAIN REGISTRATION PAGE
       Always accessible to logged-in user
    ======================================= */

    if (
      pathname === "/seller-register"
    ) {
      return NextResponse.next();
    }

    /* =======================================
       NO REGISTRATION
       Cannot directly jump to any step
    ======================================= */

    if (!registration) {
      return NextResponse.redirect(
        new URL(
          "/seller-register",
          request.url
        )
      );
    }

    /* =======================================
       SUBMITTED / UNDER REVIEW / APPROVED
       Registration editing is locked.
    ======================================= */

    if (
      registration.status ===
        "SUBMITTED" ||
      registration.status ===
        "UNDER_REVIEW" ||
      registration.status ===
        "APPROVED"
    ) {
      return NextResponse.redirect(
        new URL(
          "/seller-register/status",
          request.url
        )
      );
    }

    /* =======================================
       BUSINESS STEP
       Requires verified mobile
    ======================================= */

    if (
      pathname ===
      "/seller-register/business"
    ) {
      if (
        registration.mobileVerified !==
        true
      ) {
        return NextResponse.redirect(
          new URL(
            "/seller-register",
            request.url
          )
        );
      }

      return NextResponse.next();
    }

    /* =======================================
       BUSINESS COMPLETION CHECK
    ======================================= */

    const businessComplete =
      registration.mobileVerified ===
        true &&
      !!registration.businessType &&
      !!registration.businessName &&
      !!registration.ownerName &&
      registration.hasGst !== null &&
      registration.hasGst !== undefined &&
      (
        registration.hasGst === true
          ? !!registration.gstin
          : !!registration.panNumber &&
            !!registration.panName &&
            !!registration.panEmail
      );

    /* =======================================
       ADDRESS STEP
    ======================================= */

    if (
      pathname ===
      "/seller-register/address"
    ) {
      if (!businessComplete) {
        return NextResponse.redirect(
          new URL(
            "/seller-register/business",
            request.url
          )
        );
      }

      return NextResponse.next();
    }

    /* =======================================
       ADDRESS COMPLETION CHECK
    ======================================= */

    const addressComplete =
      businessComplete &&
      !!registration.pickupAddress &&
      !!registration.pickupCity &&
      !!registration.pickupState &&
      !!registration.pickupPincode &&
      !!registration.pickupContactName &&
      !!registration.pickupContactMobile &&
      registration.pickupLatitude !==
        null &&
      registration.pickupLatitude !==
        undefined &&
      registration.pickupLongitude !==
        null &&
      registration.pickupLongitude !==
        undefined;

    /* =======================================
       BANK STEP
    ======================================= */

    if (
      pathname ===
      "/seller-register/bank"
    ) {
      if (!addressComplete) {
        return NextResponse.redirect(
          new URL(
            "/seller-register/address",
            request.url
          )
        );
      }

      return NextResponse.next();
    }

    /* =======================================
       BANK COMPLETION CHECK
    ======================================= */

    const bankComplete =
      addressComplete &&
      !!registration.bankAccountName &&
      !!registration.bankAccountNumber &&
      !!registration.bankIfsc &&
      !!registration.bankName;

    /* =======================================
       DETAILS STEP
    ======================================= */

    if (
      pathname ===
      "/seller-register/details"
    ) {
      if (!bankComplete) {
        return NextResponse.redirect(
          new URL(
            "/seller-register/bank",
            request.url
          )
        );
      }

      return NextResponse.next();
    }

    /* =======================================
       DETAILS COMPLETION CHECK
    ======================================= */

    const detailsComplete =
      bankComplete &&
      !!registration.storeName;

    /* =======================================
       REVIEW STEP
    ======================================= */

    if (
      pathname ===
      "/seller-register/review"
    ) {
      if (!detailsComplete) {
        return NextResponse.redirect(
          new URL(
            "/seller-register/details",
            request.url
          )
        );
      }

      return NextResponse.next();
    }

    /* =======================================
       UNKNOWN SELLER-REGISTER ROUTE
    ======================================= */

    return NextResponse.redirect(
      new URL(
        "/seller-register",
        request.url
      )
    );
  }

  /* =========================================
     NORMAL WEBSITE ROUTES
  ========================================= */

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/seller-register/:path*",
  ],
};
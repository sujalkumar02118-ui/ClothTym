import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient, OrderStatus } from "@prisma/client";
import { authOptions } from "@/lib/authOptions";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

const MAX_OTP_ATTEMPTS = 5;
const OTP_LOCK_DURATION_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
  try {
    // =========================================================
    // 15H.4 — DELIVERY ACCESS AUTHORIZATION
    // =========================================================
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login first.",
        },
        { status: 401 }
      );
    }

    const customUser = session.user as typeof session.user & {
      role?: string;
      isBlocked?: boolean;
    };

    if (
      customUser.role !== "DELIVERY" ||
      customUser.isBlocked === true
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden.",
        },
        { status: 403 }
      );
    }

    // =========================================================
    // REQUEST BODY VALIDATION
    // =========================================================
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON request body.",
        },
        { status: 400 }
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const requestBody = body as Record<string, unknown>;

    // =========================================================
    // ORDER ID VALIDATION
    // =========================================================
    if (
      typeof requestBody.orderId !== "string" ||
      requestBody.orderId.trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid order ID is required.",
        },
        { status: 400 }
      );
    }

    const orderId = requestBody.orderId.trim();

    if (orderId.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order ID.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // OTP VALIDATION
    // =========================================================
    if (typeof requestBody.otp !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "OTP is required.",
        },
        { status: 400 }
      );
    }

    const otp = requestBody.otp.trim();

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        {
          success: false,
          message: "OTP must be exactly 6 digits.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // FIND ORDER
    // =========================================================
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        status: true,

        sellerPickupOtp: true,
        sellerPickupOtpExpiresAt: true,

        sellerPickupOtpAttempts: true,
        sellerPickupOtpLockedUntil: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found.",
        },
        { status: 404 }
      );
    }

    // =========================================================
    // 15H.4 — OTP AUTHORIZATION BY ORDER STATUS
    // =========================================================
    if (order.status !== OrderStatus.READY_FOR_PICKUP) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Seller pickup can only be verified for an order that is READY_FOR_PICKUP.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // OTP EXISTENCE
    // =========================================================
    if (!order.sellerPickupOtp) {
      return NextResponse.json(
        {
          success: false,
          message: "Seller pickup OTP is not available.",
        },
        { status: 400 }
      );
    }

    if (!order.sellerPickupOtpExpiresAt) {
      return NextResponse.json(
        {
          success: false,
          message: "Seller pickup OTP expiry is not available.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 15H.3 — TEMPORARY OTP LOCK CHECK
    // =========================================================
    if (order.sellerPickupOtpLockedUntil) {
      const lockTime =
        order.sellerPickupOtpLockedUntil.getTime();

      if (
        Number.isFinite(lockTime) &&
        Date.now() < lockTime
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Too many incorrect OTP attempts. Please try again after 5 minutes.",
          },
          { status: 429 }
        );
      }

      // Lock expired → reset lock and attempts.
      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          sellerPickupOtpAttempts: 0,
          sellerPickupOtpLockedUntil: null,
        },
      });
    }

    // =========================================================
    // OTP EXPIRY CHECK
    // =========================================================
    const sellerOtpExpiryTime =
      order.sellerPickupOtpExpiresAt.getTime();

    if (
      !Number.isFinite(sellerOtpExpiryTime) ||
      Date.now() >= sellerOtpExpiryTime
    ) {
      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          sellerPickupOtp: null,
          sellerPickupOtpExpiresAt: null,
          sellerPickupOtpAttempts: 0,
          sellerPickupOtpLockedUntil: null,
        },
      });

      return NextResponse.json(
        {
          success: false,
          message:
            "Seller pickup OTP has expired. Please generate a new OTP.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // OTP VERIFICATION
    // =========================================================
    if (order.sellerPickupOtp !== otp) {
      const currentAttempts =
        order.sellerPickupOtpAttempts ?? 0;

      const nextAttempts = currentAttempts + 1;

      // =======================================================
      // 5 WRONG ATTEMPTS → 5 MINUTE LOCK
      // =======================================================
      if (nextAttempts >= MAX_OTP_ATTEMPTS) {
        const lockedUntil = new Date(
          Date.now() + OTP_LOCK_DURATION_MS
        );

        await prisma.order.update({
          where: {
            id: order.id,
          },
          data: {
            sellerPickupOtpAttempts: nextAttempts,
            sellerPickupOtpLockedUntil: lockedUntil,
          },
        });

        return NextResponse.json(
          {
            success: false,
            message:
              "Too many incorrect OTP attempts. Seller pickup OTP is locked for 5 minutes.",
          },
          { status: 429 }
        );
      }

      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          sellerPickupOtpAttempts: nextAttempts,
        },
      });

      return NextResponse.json(
        {
          success: false,
          message: `Invalid seller pickup OTP. ${MAX_OTP_ATTEMPTS - nextAttempts} attempts remaining.`,
        },
        { status: 400 }
      );
    }

    // =========================================================
    // SUCCESS
    // =========================================================
    const customerDeliveryOtp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const customerDeliveryOtpExpiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    const now = new Date();

    // =========================================================
    // SUCCESS → CLEAR ATTEMPTS + LOCK
    // =========================================================
    const updatedOrder = await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: OrderStatus.OUT_FOR_DELIVERY,

        sellerOtpVerifiedAt: now,
        pickedUpAt: now,

        sellerPickupOtp: null,
        sellerPickupOtpExpiresAt: null,

        sellerPickupOtpAttempts: 0,
        sellerPickupOtpLockedUntil: null,

        customerDeliveryOtp:
          customerDeliveryOtp,

        customerDeliveryOtpExpiresAt:
          customerDeliveryOtpExpiresAt,
      },
      select: {
        id: true,
        status: true,
        pickedUpAt: true,
        sellerOtpVerifiedAt: true,
        customerDeliveryOtpExpiresAt: true,
      },
    });

    // =========================================================
    // RESPONSE
    // IMPORTANT:
    // CUSTOMER OTP IS NEVER RETURNED HERE.
    // =========================================================
    return NextResponse.json({
      success: true,

      message:
        "Seller pickup verified successfully. Order is now out for delivery.",

      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        pickedUpAt: updatedOrder.pickedUpAt,
        sellerOtpVerifiedAt:
          updatedOrder.sellerOtpVerifiedAt,
        customerDeliveryOtpExpiresAt:
          updatedOrder.customerDeliveryOtpExpiresAt,
      },
    });
  } catch (error) {
    console.error(
      "SELLER OTP VERIFICATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while verifying seller pickup OTP.",
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  PrismaClient,
  ReturnPickupStatus,
  RefundStatus,
  ReturnStatus,
} from "@prisma/client";
import { authOptions } from "@/lib/authOptions";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

const MAX_OTP_ATTEMPTS = 5;
const OTP_LOCK_DURATION_MS = 5 * 60 * 1000;

function generateOtp() {
  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();
}

export async function POST(req: Request) {
  try {
    // =========================================================
    // 15H.4 — DELIVERY AUTHENTICATION & AUTHORIZATION
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
      body = await req.json();
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

    const orderId =
      typeof requestBody.orderId === "string"
        ? requestBody.orderId.trim()
        : "";

    const action =
      typeof requestBody.action === "string"
        ? requestBody.action.trim()
        : "";

    const otp =
      typeof requestBody.otp === "string"
        ? requestBody.otp.trim()
        : "";

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    if (orderId.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order ID.",
        },
        { status: 400 }
      );
    }

    if (
      action !== "REQUEST_PICKUP" &&
      action !== "VERIFY_PICKUP_OTP"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid pickup action.",
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
    // REQUEST RETURN PICKUP
    // =========================================================
    if (action === "REQUEST_PICKUP") {
      if (
        order.returnStatus !==
        ReturnStatus.APPROVED
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Return pickup can only be requested for an approved return.",
          },
          { status: 400 }
        );
      }

      if (
        order.returnPickupStatus ===
        ReturnPickupStatus.REQUESTED
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Return pickup has already been requested.",
          },
          { status: 400 }
        );
      }

      if (
        order.returnPickupStatus ===
        ReturnPickupStatus.PICKED_UP
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Return product has already been picked up.",
          },
          { status: 400 }
        );
      }

      const pickupOtp = generateOtp();

      const returnPickupOtpExpiresAt =
        new Date(
          Date.now() + 10 * 60 * 1000
        );

      const updatedOrder =
        await prisma.order.update({
          where: {
            id: orderId,
          },
          data: {
            returnPickupStatus:
              ReturnPickupStatus.REQUESTED,

            returnPickupOtp:
              pickupOtp,

            returnPickupOtpExpiresAt,

            returnPickupOtpAttempts: 0,

            returnPickupOtpLockedUntil:
              null,
          },
        });

      return NextResponse.json({
        success: true,

        message:
          "Return pickup requested successfully.",

        order: {
          id: updatedOrder.id,

          returnStatus:
            updatedOrder.returnStatus,

          returnPickupStatus:
            updatedOrder.returnPickupStatus,

          returnPickupOtpExpiresAt:
            updatedOrder.returnPickupOtpExpiresAt,
        },

        // =====================================================
        // TEMPORARY DEVELOPMENT RESPONSE
        // =====================================================
        // Real SMS provider integration will remove this
        // field in Step 11.
        pickupOtp,
      });
    }

    // =========================================================
    // VERIFY RETURN PICKUP OTP
    // =========================================================
    if (action === "VERIFY_PICKUP_OTP") {
      if (!/^\d{6}$/.test(otp)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "OTP must be exactly 6 digits.",
          },
          { status: 400 }
        );
      }

      // -------------------------------------------------------
      // RETURN STATUS
      // -------------------------------------------------------
      if (
        order.returnStatus !==
        ReturnStatus.APPROVED
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Return is not approved.",
          },
          { status: 400 }
        );
      }

      // -------------------------------------------------------
      // PICKUP STATUS
      // -------------------------------------------------------
      if (
        order.returnPickupStatus !==
        ReturnPickupStatus.REQUESTED
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Return pickup is not currently requested.",
          },
          { status: 400 }
        );
      }

      // -------------------------------------------------------
      // OTP EXISTENCE
      // -------------------------------------------------------
      if (!order.returnPickupOtp) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Pickup OTP is not available.",
          },
          { status: 400 }
        );
      }

      if (
        !order.returnPickupOtpExpiresAt
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Return pickup OTP expiry is not available.",
          },
          { status: 400 }
        );
      }

      // -------------------------------------------------------
      // OTP LOCK
      // -------------------------------------------------------
      if (
        order.returnPickupOtpLockedUntil
      ) {
        const lockTime =
          order.returnPickupOtpLockedUntil.getTime();

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

        await prisma.order.update({
          where: {
            id: order.id,
          },
          data: {
            returnPickupOtpAttempts: 0,
            returnPickupOtpLockedUntil:
              null,
          },
        });
      }

      // -------------------------------------------------------
      // OTP EXPIRY
      // -------------------------------------------------------
      const otpExpiryTime =
        order.returnPickupOtpExpiresAt.getTime();

      if (
        !Number.isFinite(otpExpiryTime) ||
        Date.now() >= otpExpiryTime
      ) {
        await prisma.order.update({
          where: {
            id: order.id,
          },
          data: {
            returnPickupOtp: null,
            returnPickupOtpExpiresAt: null,
            returnPickupOtpAttempts: 0,
            returnPickupOtpLockedUntil:
              null,
          },
        });

        return NextResponse.json(
          {
            success: false,
            message:
              "Return pickup OTP has expired. Please request a new OTP.",
          },
          { status: 400 }
        );
      }

      // -------------------------------------------------------
      // OTP VERIFICATION
      // -------------------------------------------------------
      if (
        order.returnPickupOtp !== otp
      ) {
        const currentAttempts =
          order.returnPickupOtpAttempts ?? 0;

        const nextAttempts =
          currentAttempts + 1;

        if (
          nextAttempts >=
          MAX_OTP_ATTEMPTS
        ) {
          const lockedUntil =
            new Date(
              Date.now() +
                OTP_LOCK_DURATION_MS
            );

          await prisma.order.update({
            where: {
              id: order.id,
            },
            data: {
              returnPickupOtpAttempts:
                nextAttempts,

              returnPickupOtpLockedUntil:
                lockedUntil,
            },
          });

          return NextResponse.json(
            {
              success: false,
              message:
                "Too many incorrect OTP attempts. Return pickup OTP is locked for 5 minutes.",
            },
            { status: 429 }
          );
        }

        await prisma.order.update({
          where: {
            id: order.id,
          },
          data: {
            returnPickupOtpAttempts:
              nextAttempts,
          },
        });

        return NextResponse.json(
          {
            success: false,
            message:
              `Invalid pickup OTP. ${
                MAX_OTP_ATTEMPTS -
                nextAttempts
              } attempts remaining.`,
          },
          { status: 400 }
        );
      }

      // =======================================================
      // SUCCESS
      // =======================================================
      const pickedUpAt = new Date();

      const updatedOrder =
        await prisma.order.update({
          where: {
            id: orderId,
          },
          data: {
            returnPickupStatus:
              ReturnPickupStatus.PICKED_UP,

            returnPickupOtpVerifiedAt:
              pickedUpAt,

            returnPickedUpAt:
              pickedUpAt,

            // OTP cannot be reused.
            returnPickupOtp: null,

            returnPickupOtpExpiresAt:
              null,

            returnPickupOtpAttempts: 0,

            returnPickupOtpLockedUntil:
              null,
          },
        });

      // =======================================================
      // REFUND
      // =======================================================
      let refundStatus =
        updatedOrder.refundStatus;

      let refundAmount =
        updatedOrder.refundAmount;

      if (
        updatedOrder.returnStatus ===
          ReturnStatus.COMPLETED &&
        updatedOrder.refundStatus ===
          RefundStatus.NOT_STARTED
      ) {
        refundAmount = Number(
          updatedOrder.totalAmount.toFixed(2)
        );

        const refundOrder =
          await prisma.order.update({
            where: {
              id: updatedOrder.id,
            },
            data: {
              refundStatus:
                RefundStatus.COMPLETED,

              refundAmount,

              refundRequestedAt:
                pickedUpAt,

              refundCompletedAt:
                pickedUpAt,

              refundFailureReason:
                null,
            },
          });

        refundStatus =
          refundOrder.refundStatus;

        refundAmount =
          refundOrder.refundAmount;
      }

      // =======================================================
      // RESPONSE
      // =======================================================
      return NextResponse.json({
        success: true,

        message:
          "Return pickup verified successfully.",

        order: {
          id: updatedOrder.id,

          returnStatus:
            updatedOrder.returnStatus,

          returnPickupStatus:
            updatedOrder.returnPickupStatus,

          returnPickupOtpVerifiedAt:
            updatedOrder.returnPickupOtpVerifiedAt,

          returnPickedUpAt:
            updatedOrder.returnPickedUpAt,

          refundStatus,

          refundAmount,
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Invalid pickup action.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error(
      "RETURN PICKUP ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong with return pickup.",
      },
      { status: 500 }
    );
  }
}
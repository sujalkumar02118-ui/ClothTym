import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  PrismaClient,
  OrderStatus,
  ReturnStatus,
} from "@prisma/client";
import { authOptions } from "@/lib/authOptions";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
};

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
          message: "Valid Order ID is required.",
        },
        { status: 400 }
      );
    }

    const orderId = requestBody.orderId.trim();

    if (orderId.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Order ID.",
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

        customerDeliveryOtp: true,
        customerDeliveryOtpExpiresAt: true,

        customerDeliveryOtpAttempts: true,
        customerDeliveryOtpLockedUntil: true,

        userId: true,
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
    // 15H.4 — CUSTOMER OTP ONLY AT DELIVERY STAGE
    // =========================================================
    if (order.status !== OrderStatus.OUT_FOR_DELIVERY) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Order cannot be delivered in current status: ${order.status}`,
        },
        { status: 400 }
      );
    }

    // =========================================================
    // OTP EXISTENCE
    // =========================================================
    if (!order.customerDeliveryOtp) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Customer delivery OTP has not been generated.",
        },
        { status: 400 }
      );
    }

    if (!order.customerDeliveryOtpExpiresAt) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Customer delivery OTP expiry is not available.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // OTP LOCK CHECK
    // =========================================================
    if (order.customerDeliveryOtpLockedUntil) {
      const lockTime =
        order.customerDeliveryOtpLockedUntil.getTime();

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

      // Lock expired → reset
      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          customerDeliveryOtpAttempts: 0,
          customerDeliveryOtpLockedUntil: null,
        },
      });
    }

    // =========================================================
    // OTP EXPIRY CHECK
    // =========================================================
    const otpExpiryTime =
      order.customerDeliveryOtpExpiresAt.getTime();

    if (
      !Number.isFinite(otpExpiryTime) ||
      Date.now() >= otpExpiryTime
    ) {
      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          customerDeliveryOtp: null,
          customerDeliveryOtpExpiresAt: null,
          customerDeliveryOtpAttempts: 0,
          customerDeliveryOtpLockedUntil: null,
        },
      });

      return NextResponse.json(
        {
          success: false,
          message:
            "Customer delivery OTP has expired. Please generate a new OTP.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // OTP VERIFICATION
    // =========================================================
    if (order.customerDeliveryOtp !== otp) {
      const currentAttempts =
        order.customerDeliveryOtpAttempts ?? 0;

      const nextAttempts =
        currentAttempts + 1;

      // 5 wrong attempts → 5 minute lock
      if (nextAttempts >= 5) {
        const lockedUntil = new Date(
          Date.now() + 5 * 60 * 1000
        );

        await prisma.order.update({
          where: {
            id: order.id,
          },
          data: {
            customerDeliveryOtpAttempts:
              nextAttempts,
            customerDeliveryOtpLockedUntil:
              lockedUntil,
          },
        });

        return NextResponse.json(
          {
            success: false,
            message:
              "Too many incorrect OTP attempts. Customer delivery OTP is locked for 5 minutes.",
          },
          { status: 429 }
        );
      }

      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          customerDeliveryOtpAttempts:
            nextAttempts,
        },
      });

      return NextResponse.json(
        {
          success: false,
          message:
            `Invalid customer OTP. ${5 - nextAttempts} attempts remaining.`,
        },
        { status: 400 }
      );
    }

    // =========================================================
    // SUCCESS
    // =========================================================
    const deliveredAt = new Date();

    const returnDeadline = new Date(
      deliveredAt.getTime() +
        2 * 60 * 60 * 1000
    );

    // =========================================================
    // TRANSACTION
    // =========================================================
    const result = await prisma.$transaction(
      async (tx) => {
        const updatedOrder =
          await tx.order.update({
            where: {
              id: order.id,
            },
            data: {
              status: OrderStatus.DELIVERED,

              customerOtpVerifiedAt:
                deliveredAt,

              deliveredAt,

              returnDeadline,

              returnStatus:
                ReturnStatus.ELIGIBLE,

              customerDeliveryOtp: null,

              customerDeliveryOtpExpiresAt:
                null,

              customerDeliveryOtpAttempts:
                0,

              customerDeliveryOtpLockedUntil:
                null,
            },
            select: {
              id: true,
              status: true,
              deliveredAt: true,
              returnDeadline: true,
              returnStatus: true,
              userId: true,
            },
          });

        const notification =
          await tx.notification.create({
            data: {
              title:
                "Delivery Successful 🎉",

              message:
                "Your product has been delivered. You can raise a return request within 2 hours of delivery.",

              type: "DELIVERY",

              userId:
                updatedOrder.userId,
            },
          });

        return {
          updatedOrder,
          notification,
        };
      }
    );

    // =========================================================
    // RESPONSE
    // =========================================================
    return NextResponse.json({
      success: true,

      message:
        "Delivery verified successfully. Your 2-hour return window has started.",

      notification: {
        id: result.notification.id,
        title:
          result.notification.title,
        message:
          result.notification.message,
        type:
          result.notification.type,
        createdAt:
          result.notification.createdAt,
      },

      order: result.updatedOrder,
    });
  } catch (error) {
    console.error(
      "CUSTOMER OTP VERIFICATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while verifying customer OTP.",
      },
      { status: 500 }
    );
  }
}
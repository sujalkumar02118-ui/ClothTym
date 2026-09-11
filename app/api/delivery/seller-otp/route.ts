import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient, OrderStatus } from "@prisma/client";
import { randomInt } from "crypto";
import { authOptions } from "@/lib/authOptions";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const customUser = session.user as typeof session.user & {
      role?: string;
      isBlocked?: boolean;
    };

    if (
      customUser.role !== "SELLER" ||
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

    const seller = await prisma.seller.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!seller) {
      return NextResponse.json(
        {
          success: false,
          message: "Seller profile not found.",
        },
        { status: 404 }
      );
    }

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                sellerId: true,
              },
            },
          },
        },
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

    const sellerOwnsOrder = order.items.some(
      (item) => item.product.sellerId === seller.id
    );

    if (!sellerOwnsOrder) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorized to generate pickup OTP for this order.",
        },
        { status: 403 }
      );
    }

    if (order.status !== OrderStatus.READY_FOR_PICKUP) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Seller pickup OTP can only be generated when the order is READY_FOR_PICKUP.",
        },
        { status: 400 }
      );
    }

    const now = new Date();

    /*
     * Existing valid OTP:
     * Do not generate another OTP unnecessarily.
     */
    if (
      order.sellerPickupOtp &&
      order.sellerPickupOtpExpiresAt &&
      now.getTime() <
        order.sellerPickupOtpExpiresAt.getTime()
    ) {
      return NextResponse.json({
        success: true,
        message: "Seller pickup OTP already exists.",
        order: {
          id: order.id,
          sellerPickupOtpExpiresAt:
            order.sellerPickupOtpExpiresAt,
        },
        pickupOtp: order.sellerPickupOtp,
      });
    }

    /*
     * Generate a cryptographically stronger 6-digit OTP.
     */
    const pickupOtp = randomInt(
      100000,
      1000000
    ).toString();

    const sellerPickupOtpExpiresAt = new Date(
      now.getTime() + 10 * 60 * 1000
    );

    const updatedOrder =
      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          sellerPickupOtp: pickupOtp,
          sellerPickupOtpExpiresAt,

          // Fresh OTP gets a fresh attempt window.
          sellerPickupOtpAttempts: 0,
          sellerPickupOtpLockedUntil: null,
        },
        select: {
          id: true,
          sellerPickupOtpExpiresAt: true,
          sellerPickupOtpAttempts: true,
          sellerPickupOtpLockedUntil: true,
        },
      });

    return NextResponse.json({
      success: true,
      message:
        "Seller pickup OTP generated successfully.",
      order: {
        id: updatedOrder.id,
        sellerPickupOtpExpiresAt:
          updatedOrder.sellerPickupOtpExpiresAt,
      },
      pickupOtp,
    });
  } catch (error) {
    console.error(
      "SELLER OTP GENERATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while generating seller pickup OTP.",
      },
      { status: 500 }
    );
  }
}
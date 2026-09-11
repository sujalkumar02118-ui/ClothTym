import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // ==============================
    // AUTHENTICATION
    // ==============================

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    const customUser = session.user as typeof session.user & {
      isBlocked?: boolean;
    };

    if (customUser.isBlocked === true) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is blocked",
        },
        { status: 403 }
      );
    }

    // ==============================
    // REQUEST BODY VALIDATION
    // ==============================

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON body",
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
          message: "Invalid request body",
        },
        { status: 400 }
      );
    }

    const requestBody = body as Record<string, unknown>;

    if (typeof requestBody.orderId !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required",
        },
        { status: 400 }
      );
    }

    const orderId = requestBody.orderId.trim();

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required",
        },
        { status: 400 }
      );
    }

    if (orderId.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Order ID",
        },
        { status: 400 }
      );
    }

    // ==============================
    // FIND ORDER
    // ==============================

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
        },
        { status: 404 }
      );
    }

    // ==============================
    // ORDER OWNERSHIP
    // ==============================

    if (order.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorized to pay for this order",
        },
        { status: 403 }
      );
    }

    // ==============================
    // ONLINE PAYMENT CHECK
    // ==============================

    if (order.paymentMethod !== "ONLINE") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This order is not an online payment order",
        },
        { status: 400 }
      );
    }

    // ==============================
    // 15F.2 — PAYMENT STATUS
    // TRANSITION VALIDATION
    // ==============================

    /*
      Allowed states for creating/retrying
      an online payment:

      PENDING
      FAILED

      PAID and REFUNDED orders must never
      create another payment.
    */

    if (order.paymentStatus === "PAID") {
      return NextResponse.json(
        {
          success: false,
          message: "This order has already been paid.",
        },
        { status: 400 }
      );
    }

    if (order.paymentStatus === "REFUNDED") {
      return NextResponse.json(
        {
          success: false,
          message: "This order has already been refunded.",
        },
        { status: 400 }
      );
    }

    if (
      order.paymentStatus !== "PENDING" &&
      order.paymentStatus !== "FAILED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid payment status for creating payment order.",
        },
        { status: 400 }
      );
    }

    // ==============================
    // RAZORPAY CREDENTIALS
    // ==============================

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Razorpay keys are not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env",
        },
        { status: 500 }
      );
    }

    // ==============================
    // EXISTING RAZORPAY ORDER
    // ==============================

    /*
      If payment is already PENDING and a
      Razorpay order exists, reuse it.

      If the previous payment attempt FAILED,
      do NOT reuse the old Razorpay order.
      A fresh Razorpay order is created.
    */

    if (
      order.paymentStatus === "PENDING" &&
      order.razorpayOrderId
    ) {
      const existingAmountInPaise = Math.round(
        order.totalAmount * 100
      );

      if (
        !Number.isFinite(order.totalAmount) ||
        order.totalAmount <= 0 ||
        !Number.isSafeInteger(existingAmountInPaise) ||
        existingAmountInPaise <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid order amount",
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        razorpayOrderId: order.razorpayOrderId,
        amount: existingAmountInPaise,
        currency: "INR",
        alreadyCreated: true,
      });
    }

    // ==============================
    // RAZORPAY INSTANCE
    // ==============================

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // ==============================
    // 15F.2 — SERVER-SIDE AMOUNT
    // VALIDATION
    // ==============================

    const totalAmount = order.totalAmount;

    if (
      !Number.isFinite(totalAmount) ||
      totalAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order amount",
        },
        { status: 400 }
      );
    }

    const amountInPaise = Math.round(
      totalAmount * 100
    );

    if (
      !Number.isSafeInteger(amountInPaise) ||
      amountInPaise <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment amount",
        },
        { status: 400 }
      );
    }

    // ==============================
    // CREATE NEW RAZORPAY ORDER
    // ==============================

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `ct_${order.id}`,
      notes: {
        clothTymOrderId: order.id,
        userId: order.userId,
      },
    });

    // ==============================
    // SAVE PAYMENT ORDER
    // ==============================

    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        razorpayOrderId: razorpayOrder.id,
        paymentStatus: "PENDING",
      },
    });

    // ==============================
    // RESPONSE
    // ==============================

    return NextResponse.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: "INR",
      keyId,
      alreadyCreated: false,
    });
  } catch (error) {
    console.error(
      "Razorpay create order error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create Razorpay order",
      },
      { status: 500 }
    );
  }
}
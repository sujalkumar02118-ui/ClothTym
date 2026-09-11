import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
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

    // ==============================
    // PAYMENT DETAILS VALIDATION
    // ==============================

    if (typeof requestBody.orderId !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required",
        },
        { status: 400 }
      );
    }

    if (typeof requestBody.razorpayOrderId !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Razorpay order ID is required",
        },
        { status: 400 }
      );
    }

    if (typeof requestBody.razorpayPaymentId !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Razorpay payment ID is required",
        },
        { status: 400 }
      );
    }

    if (typeof requestBody.razorpaySignature !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Razorpay signature is required",
        },
        { status: 400 }
      );
    }

    const orderId = requestBody.orderId.trim();
    const razorpayOrderId =
      requestBody.razorpayOrderId.trim();
    const razorpayPaymentId =
      requestBody.razorpayPaymentId.trim();
    const razorpaySignature =
      requestBody.razorpaySignature.trim();

    if (!orderId || orderId.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Order ID",
        },
        { status: 400 }
      );
    }

    if (
      !razorpayOrderId ||
      razorpayOrderId.length > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Razorpay order ID",
        },
        { status: 400 }
      );
    }

    if (
      !razorpayPaymentId ||
      razorpayPaymentId.length > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Razorpay payment ID",
        },
        { status: 400 }
      );
    }

    if (
      !razorpaySignature ||
      razorpaySignature.length !== 64 ||
      !/^[a-fA-F0-9]{64}$/.test(razorpaySignature)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Razorpay signature",
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
            "You are not authorized to verify this payment",
        },
        { status: 403 }
      );
    }

    // ==============================
    // 15E.6.5 — PAYMENT METHOD
    // ==============================

    if (order.paymentMethod !== "ONLINE") {
      return NextResponse.json(
        {
          success: false,
          message:
            "COD orders cannot be verified through online payment",
        },
        { status: 400 }
      );
    }

    // ==============================
    // 15E.6.5 — PAYMENT STATUS
    // ==============================

    if (order.paymentStatus === "PAID") {
      return NextResponse.json({
        success: true,
        message: "Payment already verified",
        paymentStatus: "PAID",
        orderId: order.id,
      });
    }

    if (order.paymentStatus === "REFUNDED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This payment has already been refunded",
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
          message: "Invalid payment status",
        },
        { status: 400 }
      );
    }

    // ==============================
    // RAZORPAY ORDER VALIDATION
    // ==============================

    if (!order.razorpayOrderId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Razorpay order has not been created for this order",
        },
        { status: 400 }
      );
    }

    if (order.razorpayOrderId !== razorpayOrderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Razorpay order mismatch",
        },
        { status: 400 }
      );
    }

    // ==============================
    // RAZORPAY SECRET
    // ==============================

    const razorpaySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!razorpaySecret) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Razorpay secret key is not configured",
        },
        { status: 500 }
      );
    }

    // ==============================
    // SIGNATURE VERIFICATION
    // ==============================

    const generatedSignature = crypto
      .createHmac("sha256", razorpaySecret)
      .update(
        `${razorpayOrderId}|${razorpayPaymentId}`
      )
      .digest("hex");

    const generatedBuffer = Buffer.from(
      generatedSignature,
      "utf8"
    );

    const receivedBuffer = Buffer.from(
      razorpaySignature.toLowerCase(),
      "utf8"
    );

    if (
      generatedBuffer.length !==
      receivedBuffer.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment signature",
        },
        { status: 400 }
      );
    }

    const isValid = crypto.timingSafeEqual(
      generatedBuffer,
      receivedBuffer
    );

    if (!isValid) {
      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          paymentStatus: "FAILED",
          razorpayPaymentId,
          razorpaySignature,
        },
      });

      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment signature",
        },
        { status: 400 }
      );
    }

    // ==============================
    // PAYMENT SUCCESS
    // ==============================

    const updatedOrder =
      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          paymentStatus: "PAID",
          razorpayPaymentId,
          razorpaySignature,
          paidAt: new Date(),
        },
      });

    // ==============================
    // PAYMENT NOTIFICATION
    // ==============================

    await prisma.notification.create({
      data: {
        title: "Payment successful",
        message: `Payment of ₹${updatedOrder.totalAmount} for order #${updatedOrder.id} was successful.`,
        type: "PAYMENT",
        userId: updatedOrder.userId,
      },
    });

    // ==============================
    // RESPONSE
    // ==============================

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      paymentStatus: updatedOrder.paymentStatus,
      orderId: updatedOrder.id,
    });
  } catch (error) {
    console.error(
      "Razorpay verification error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Payment verification failed",
      },
      { status: 500 }
    );
  }
}
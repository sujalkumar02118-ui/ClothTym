import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  PrismaClient,
  RefundStatus,
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
}

/* =========================================================
   REFUND API
   POST /api/refund
   ========================================================= */

export async function POST(request: Request) {
  let orderId = "";

  try {
    // =====================================================
    // 15E.5.4 — AUTHENTICATION
    // =====================================================

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
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
          message: "Account access denied.",
        },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    // =====================================================
    // 15E.5.4 — INPUT VALIDATION
    // =====================================================

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

    const requestBody =
      body as Record<string, unknown>;

    // =====================================================
    // ORDER ID VALIDATION
    // =====================================================

    if (
      typeof requestBody.orderId !== "string" ||
      requestBody.orderId.trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    orderId = requestBody.orderId.trim();

    if (orderId.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Order ID.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // FIND ORDER
    // =====================================================

    const order =
      await prisma.order.findUnique({
        where: {
          id: orderId,
        },
        include: {
          items: true,
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

    // =====================================================
    // 15E.5.4 — REFUND OWNERSHIP VALIDATION
    // =====================================================

    if (order.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorized to access this refund.",
        },
        { status: 403 }
      );
    }

    // =====================================================
    // RETURN MUST BE COMPLETED
    // =====================================================

    if (
      order.returnStatus !==
      ReturnStatus.COMPLETED
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Refund can only be initiated after return is completed.",
          returnStatus:
            order.returnStatus,
        },
        { status: 400 }
      );
    }

    // =====================================================
    // PREVENT DUPLICATE REFUND
    // =====================================================

    if (
      order.refundStatus ===
      RefundStatus.COMPLETED
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Refund has already been completed.",
          refundStatus:
            order.refundStatus,
          refundAmount:
            order.refundAmount,
        },
        { status: 400 }
      );
    }

    if (
      order.refundStatus ===
        RefundStatus.PROCESSING ||
      order.refundStatus ===
        RefundStatus.PENDING
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Refund is already being processed.",
          refundStatus:
            order.refundStatus,
        },
        { status: 400 }
      );
    }

    // =====================================================
    // REFUND AMOUNT VALIDATION
    // =====================================================

    const refundAmount = Number(
      order.totalAmount.toFixed(2)
    );

    if (
      !Number.isFinite(refundAmount) ||
      refundAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid refund amount.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // MARK REFUND AS PROCESSING
    // =====================================================

    const processingRefund =
      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          refundStatus:
            RefundStatus.PROCESSING,
          refundAmount,
          refundRequestedAt:
            new Date(),
          refundFailureReason: null,
        },
      });

    // =====================================================
    // NOTIFICATION — REFUND PROCESSING
    // =====================================================

    await prisma.notification.create({
      data: {
        userId: order.userId,
        title: "Refund Processing",
        message:
          `Your refund for order ${order.id} is now being processed.`,
        type: "REFUND_PROCESSING",
      },
    });

    /*
      =======================================================
      CURRENT VERSION

      Abhi actual Razorpay/bank refund nahi hai.

      Ye internal refund workflow hai.
      Razorpay integration baad mein add hoga.
      =======================================================
    */

    const completedRefund =
      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          refundStatus:
            RefundStatus.COMPLETED,
          refundAmount,
          refundCompletedAt:
            new Date(),
        },
      });

    // =====================================================
    // NOTIFICATION — REFUND COMPLETED
    // =====================================================

    await prisma.notification.create({
      data: {
        userId: order.userId,
        title: "Refund Completed",
        message:
          `Your refund of ₹${refundAmount.toFixed(
            2
          )} for order ${order.id} has been completed successfully.`,
        type: "REFUND_COMPLETED",
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Refund completed successfully.",
      refund: {
        orderId:
          completedRefund.id,
        status:
          completedRefund.refundStatus,
        amount:
          completedRefund.refundAmount,
        requestedAt:
          completedRefund.refundRequestedAt,
        completedAt:
          completedRefund.refundCompletedAt,
      },
    });
  } catch (error) {
    console.error(
      "REFUND ERROR:",
      error
    );

    // =====================================================
    // MARK REFUND FAILED
    // =====================================================

    if (orderId) {
      try {
        const failedOrder =
          await prisma.order.update({
            where: {
              id: orderId,
            },
            data: {
              refundStatus:
                RefundStatus.FAILED,
              refundFailureReason:
                error instanceof Error
                  ? error.message
                  : "Refund failed",
            },
          });

        // =================================================
        // NOTIFICATION — REFUND FAILED
        // =================================================

        await prisma.notification.create({
          data: {
            userId: failedOrder.userId,
            title: "Refund Failed",
            message:
              `Unfortunately, your refund for order ${failedOrder.id} could not be completed.`,
            type: "REFUND_FAILED",
          },
        });
      } catch (
        notificationError
      ) {
        console.error(
          "REFUND FAILURE UPDATE ERROR:",
          notificationError
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Refund could not be processed",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   GET REFUND STATUS
   GET /api/refund?orderId=ORDER_ID
   ========================================================= */

export async function GET(
  request: Request
) {
  try {
    // =====================================================
    // 15E.5.4 — GET AUTHENTICATION
    // =====================================================

    const session =
      await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const customUser =
      session.user as typeof session.user & {
        isBlocked?: boolean;
      };

    if (customUser.isBlocked === true) {
      return NextResponse.json(
        {
          success: false,
          message: "Account access denied.",
        },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    // =====================================================
    // ORDER ID VALIDATION
    // =====================================================

    const { searchParams } =
      new URL(request.url);

    const orderId =
      searchParams.get("orderId");

    if (
      !orderId ||
      orderId.trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order ID is required.",
        },
        { status: 400 }
      );
    }

    const normalizedOrderId =
      orderId.trim();

    if (
      normalizedOrderId.length > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid Order ID.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // FIND ORDER
    // =====================================================

    const order =
      await prisma.order.findUnique({
        where: {
          id: normalizedOrderId,
        },
        select: {
          id: true,
          userId: true,
          totalAmount: true,
          returnStatus: true,
          refundStatus: true,
          refundAmount: true,
          refundRequestedAt: true,
          refundCompletedAt: true,
          refundFailureReason: true,
        },
      });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order not found.",
        },
        { status: 404 }
      );
    }

    // =====================================================
    // OWNERSHIP VALIDATION
    // =====================================================

    if (order.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorized to access this refund.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      refund: {
        orderId: order.id,
        returnStatus:
          order.returnStatus,
        refundStatus:
          order.refundStatus,
        refundAmount:
          order.refundAmount,
        refundRequestedAt:
          order.refundRequestedAt,
        refundCompletedAt:
          order.refundCompletedAt,
        refundFailureReason:
          order.refundFailureReason,
      },
    });
  } catch (error) {
    console.error(
      "GET REFUND STATUS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Refund status could not be loaded",
      },
      { status: 500 }
    );
  }
}
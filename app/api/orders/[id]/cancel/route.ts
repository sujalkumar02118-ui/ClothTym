import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  PrismaClient,
  OrderStatus,
} from "@prisma/client";
import { authOptions } from "@/lib/authOptions";

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // =====================================================
    // AUTHENTICATION
    // =====================================================

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
      isBlocked?: boolean;
    };

    if (customUser.isBlocked === true) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is blocked.",
        },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    // =====================================================
    // ORDER ID VALIDATION
    // =====================================================

    const { id } = await params;

    if (
      typeof id !== "string" ||
      id.trim() === "" ||
      id.length > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid Order ID is required.",
        },
        { status: 400 }
      );
    }

    const orderId = id.trim();

    // =====================================================
    // FIND ORDER
    // =====================================================

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

    // =====================================================
    // ORDER OWNERSHIP
    // =====================================================

    if (order.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not allowed to cancel this order.",
        },
        { status: 403 }
      );
    }

    // =====================================================
    // 15F.4 — PAID ORDER MODIFICATION PROTECTION
    // =====================================================

    /*
      Once an order is PAID, the customer must not
      cancel it through the normal cancellation API.

      A paid order must go through the proper
      return/refund workflow instead.
    */

    if (order.paymentStatus === "PAID") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Paid orders cannot be cancelled. Please use the return/refund process.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // REFUNDED ORDER PROTECTION
    // =====================================================

    if (order.paymentStatus === "REFUNDED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "A refunded order cannot be cancelled.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // ORDER STATUS VALIDATION
    // =====================================================

    const cancellableStatuses: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.READY_FOR_PICKUP,
    ];

    if (!cancellableStatuses.includes(order.status)) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Order cannot be cancelled after it reaches "${order.status}".`,
        },
        { status: 400 }
      );
    }

    // =====================================================
    // CANCEL ORDER
    // =====================================================

    const cancelledOrder =
      await prisma.order.update({
        where: {
          id: orderId,
        },
        data: {
          status: OrderStatus.CANCELLED,
        },
      });

    return NextResponse.json(
      {
        success: true,
        message: "Order cancelled successfully.",
        order: cancelledOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "ORDER CANCEL ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Order cancel nahi ho paaya.",
      },
      { status: 500 }
    );
  }
}
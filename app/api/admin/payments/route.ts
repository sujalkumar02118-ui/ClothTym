import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/authOptions";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const customUser = session.user as typeof session.user & {
      role?: string;
      isBlocked?: boolean;
    };

    if (
      customUser.role !== "ADMIN" ||
      customUser.isBlocked === true
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden",
        },
        { status: 403 }
      );
    }

    const orders = await prisma.order.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    const payments = orders.map((order) => ({
      id:
        order.razorpayPaymentId ||
        `PAY-${order.id}`,

      orderId: order.id,

      customer:
        order.user?.name ||
        order.user?.email ||
        "Customer",

      email:
        order.user?.email || "",

      phone:
        order.user?.phone || "",

      method: order.paymentMethod,

      amount: order.totalAmount,

      status: order.paymentStatus,

      date: order.createdAt,

      paidAt: order.paidAt,

      razorpayOrderId:
        order.razorpayOrderId,

      razorpayPaymentId:
        order.razorpayPaymentId,

      refundStatus:
        order.refundStatus,

      refundAmount:
        order.refundAmount || 0,
    }));

    const summary = {
      transactions: payments.length,

      totalAmount: payments.reduce(
        (sum, payment) =>
          sum + Number(payment.amount || 0),
        0
      ),

      paidAmount: payments
        .filter(
          (payment) =>
            payment.status === "PAID"
        )
        .reduce(
          (sum, payment) =>
            sum + Number(payment.amount || 0),
          0
        ),

      pendingAmount: payments
        .filter(
          (payment) =>
            payment.status === "PENDING"
        )
        .reduce(
          (sum, payment) =>
            sum + Number(payment.amount || 0),
          0
        ),

      failedAmount: payments
        .filter(
          (payment) =>
            payment.status === "FAILED"
        )
        .reduce(
          (sum, payment) =>
            sum + Number(payment.amount || 0),
          0
        ),

      refundedAmount: payments
        .filter(
          (payment) =>
            payment.status === "REFUNDED"
        )
        .reduce(
          (sum, payment) =>
            sum + Number(payment.amount || 0),
          0
        ),

      paidCount: payments.filter(
        (payment) =>
          payment.status === "PAID"
      ).length,

      pendingCount: payments.filter(
        (payment) =>
          payment.status === "PENDING"
      ).length,

      failedCount: payments.filter(
        (payment) =>
          payment.status === "FAILED"
      ).length,

      refundedCount: payments.filter(
        (payment) =>
          payment.status === "REFUNDED"
      ).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        payments,
        summary,
      },
    });
  } catch (error) {
    console.error(
      "ADMIN PAYMENTS API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Payments could not be loaded.",
      },
      {
        status: 500,
      }
    );
  }
}
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/authOptions";

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    // Admin authentication & authorization
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

    const { id } = await context.params;
    const body = await request.json();

    const action = body.action;
    const reason = body.reason;

    if (
      action !== "PROCESS" &&
      action !== "COMPLETE" &&
      action !== "FAIL"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid action. Use PROCESS, COMPLETE or FAIL.",
        },
        { status: 400 }
      );
    }

    if (
      action === "FAIL" &&
      (!reason ||
        typeof reason !== "string" ||
        reason.trim() === "")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Refund failure reason is required.",
        },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        returnStatus: true,
        refundStatus: true,
        refundAmount: true,
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

    if (
      order.refundStatus !== "PENDING" &&
      order.refundStatus !== "PROCESSING" &&
      action !== "FAIL"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This refund cannot be updated from its current status.",
          currentStatus: order.refundStatus,
        },
        { status: 400 }
      );
    }

    const now = new Date();

    let data: Record<string, unknown> = {};

    if (action === "PROCESS") {
      data = {
        refundStatus: "PROCESSING",
        refundRequestedAt:
          order.refundStatus === "PENDING"
            ? now
            : undefined,
        refundFailureReason: null,
      };
    }

    if (action === "COMPLETE") {
      data = {
        refundStatus: "COMPLETED",
        refundCompletedAt: now,
        refundFailureReason: null,
      };
    }

    if (action === "FAIL") {
      data = {
        refundStatus: "FAILED",
        refundFailureReason: reason.trim(),
      };
    }

    const updatedOrder = await prisma.order.update({
      where: {
        id,
      },
      data,
      select: {
        id: true,
        returnStatus: true,
        refundStatus: true,
        refundAmount: true,
        refundRequestedAt: true,
        refundCompletedAt: true,
        refundFailureReason: true,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        action === "PROCESS"
          ? "Refund moved to processing."
          : action === "COMPLETE"
          ? "Refund completed successfully."
          : "Refund marked as failed.",
      data: updatedOrder,
    });
  } catch (error) {
    console.error(
      "ADMIN REFUND UPDATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Refund could not be updated.",
      },
      { status: 500 }
    );
  }
}
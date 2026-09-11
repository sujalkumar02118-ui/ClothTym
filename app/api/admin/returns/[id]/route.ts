import { NextResponse } from "next/server";
import {
  PrismaClient,
  ReturnStatus,
  RefundStatus,
} from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
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

    const { id } = await context.params;
    const body = await request.json();

    const action = body.action;
    const reason = body.reason;

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          message: "Action is required.",
        },
        { status: 400 }
      );
    }

    const allowedActions = [
      "APPROVE",
      "REJECT",
      "START_REFUND",
      "COMPLETE_REFUND",
      "FAIL_REFUND",
    ];

    if (!allowedActions.includes(action)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid action.",
        },
        { status: 400 }
      );
    }

    if (
      action === "REJECT" ||
      action === "FAIL_REFUND"
    ) {
      if (
        !reason ||
        typeof reason !== "string" ||
        reason.trim() === ""
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Reason is required.",
          },
          { status: 400 }
        );
      }
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

    /*
     * RETURN APPROVE
     */
    if (action === "APPROVE") {
      if (
        order.returnStatus !==
        ReturnStatus.REQUESTED
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Only requested returns can be approved.",
            currentStatus:
              order.returnStatus,
          },
          { status: 400 }
        );
      }

      const updatedOrder =
        await prisma.order.update({
          where: {
            id,
          },
          data: {
            returnStatus:
              ReturnStatus.APPROVED,
          },
          select: {
            id: true,
            returnStatus: true,
            refundStatus: true,
          },
        });

      return NextResponse.json({
        success: true,
        message:
          "Return request approved successfully.",
        data: updatedOrder,
      });
    }

    /*
     * RETURN REJECT
     */
    if (action === "REJECT") {
      if (
        order.returnStatus !==
        ReturnStatus.REQUESTED
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Only requested returns can be rejected.",
            currentStatus:
              order.returnStatus,
          },
          { status: 400 }
        );
      }

      const updatedOrder =
        await prisma.order.update({
          where: {
            id,
          },
          data: {
            returnStatus:
              ReturnStatus.REJECTED,

            returnRejectedReason:
              reason.trim(),
          },
          select: {
            id: true,
            returnStatus: true,
            returnRejectedReason: true,
          },
        });

      return NextResponse.json({
        success: true,
        message:
          "Return request rejected successfully.",
        data: updatedOrder,
      });
    }

    /*
     * START REFUND
     */
    if (action === "START_REFUND") {
      if (
        order.returnStatus !==
        ReturnStatus.APPROVED
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Refund can only be started after return approval.",
            currentReturnStatus:
              order.returnStatus,
          },
          { status: 400 }
        );
      }

      if (
        order.refundStatus ===
        RefundStatus.PROCESSING
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Refund is already processing.",
          },
          { status: 400 }
        );
      }

      if (
        order.refundStatus ===
        RefundStatus.COMPLETED
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Refund has already been completed.",
          },
          { status: 400 }
        );
      }

      const updatedOrder =
        await prisma.order.update({
          where: {
            id,
          },
          data: {
            refundStatus:
              RefundStatus.PROCESSING,

            refundRequestedAt:
              new Date(),

            refundFailureReason: null,
          },
          select: {
            id: true,
            returnStatus: true,
            refundStatus: true,
            refundAmount: true,
            refundRequestedAt: true,
          },
        });

      return NextResponse.json({
        success: true,
        message:
          "Refund processing started successfully.",
        data: updatedOrder,
      });
    }

    /*
     * COMPLETE REFUND
     */
    if (action === "COMPLETE_REFUND") {
      if (
        order.refundStatus !==
        RefundStatus.PROCESSING
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Only processing refunds can be completed.",
            currentRefundStatus:
              order.refundStatus,
          },
          { status: 400 }
        );
      }

      const updatedOrder =
        await prisma.order.update({
          where: {
            id,
          },
          data: {
            refundStatus:
              RefundStatus.COMPLETED,

            refundCompletedAt:
              new Date(),

            refundFailureReason: null,
          },
          select: {
            id: true,
            returnStatus: true,
            refundStatus: true,
            refundAmount: true,
            refundRequestedAt: true,
            refundCompletedAt: true,
          },
        });

      return NextResponse.json({
        success: true,
        message:
          "Refund completed successfully.",
        data: updatedOrder,
      });
    }

    /*
     * FAIL REFUND
     */
    if (action === "FAIL_REFUND") {
      if (
        order.refundStatus !==
        RefundStatus.PROCESSING
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Only processing refunds can be marked as failed.",
            currentRefundStatus:
              order.refundStatus,
          },
          { status: 400 }
        );
      }

      const updatedOrder =
        await prisma.order.update({
          where: {
            id,
          },
          data: {
            refundStatus:
              RefundStatus.FAILED,

            refundFailureReason:
              reason.trim(),
          },
          select: {
            id: true,
            returnStatus: true,
            refundStatus: true,
            refundAmount: true,
            refundFailureReason: true,
          },
        });

      return NextResponse.json({
        success: true,
        message:
          "Refund marked as failed.",
        data: updatedOrder,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Action could not be processed.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error(
      "ADMIN RETURN/REFUND UPDATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Return/refund could not be updated.",
      },
      { status: 500 }
    );
  }
}
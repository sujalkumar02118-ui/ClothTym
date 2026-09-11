import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
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

    const refunds = await prisma.order.findMany({
      where: {
        OR: [
          {
            refundStatus: {
              not: "NOT_STARTED",
            },
          },
          {
            returnStatus: "COMPLETED",
          },
        ],
      },

      orderBy: {
        updatedAt: "desc",
      },

      select: {
        id: true,
        totalAmount: true,
        status: true,

        returnStatus: true,
        returnRequestedAt: true,
        returnCompletedAt: true,

        refundStatus: true,
        refundAmount: true,
        refundRequestedAt: true,
        refundCompletedAt: true,
        refundFailureReason: true,

        paymentMethod: true,
        paymentStatus: true,

        createdAt: true,
        updatedAt: true,

        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },

        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            returnStatus: true,

            product: {
              select: {
                id: true,
                name: true,
                image: true,

                seller: {
                  select: {
                    id: true,
                    shopName: true,
                    ownerName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const data = refunds.map((order) => ({
      id: order.id,
      totalAmount: order.totalAmount,
      status: order.status,

      returnStatus: order.returnStatus,
      returnRequestedAt: order.returnRequestedAt,
      returnCompletedAt: order.returnCompletedAt,

      refundStatus: order.refundStatus,
      refundAmount: order.refundAmount,
      refundRequestedAt: order.refundRequestedAt,
      refundCompletedAt: order.refundCompletedAt,
      refundFailureReason: order.refundFailureReason,

      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,

      createdAt: order.createdAt,
      updatedAt: order.updatedAt,

      customer: order.user,

      items: order.items,

      itemCount: order.items.reduce(
        (total, item) => total + item.quantity,
        0
      ),
    }));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("ADMIN REFUNDS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Refunds could not be loaded.",
      },
      {
        status: 500,
      }
    );
  }
}
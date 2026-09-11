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

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          {
            returnStatus: {
              in: [
                "REQUESTED",
                "APPROVED",
                "REJECTED",
                "COMPLETED",
                "EXPIRED",
              ],
            },
          },
          {
            items: {
              some: {
                returnStatus: {
                  in: [
                    "REQUESTED",
                    "APPROVED",
                    "REJECTED",
                    "COMPLETED",
                    "EXPIRED",
                  ],
                },
              },
            },
          },
        ],
      },
      orderBy: {
        returnRequestedAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isBlocked: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                price: true,
                seller: {
                  select: {
                    id: true,
                    shopName: true,
                    ownerName: true,
                  },
                },
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const returns = orders.map((order) => {
      const returnedItems = order.items.filter(
        (item) =>
          item.returnStatus !== "NOT_ELIGIBLE"
      );

      return {
        orderId: order.id,

        totalAmount: order.totalAmount,

        orderStatus: order.status,

        returnStatus: order.returnStatus,

        returnRequestedAt:
          order.returnRequestedAt,

        returnReason: order.returnReason,

        returnRejectedReason:
          order.returnRejectedReason,

        returnCompletedAt:
          order.returnCompletedAt,

        returnPickupStatus:
          order.returnPickupStatus,

        returnPickedUpAt:
          order.returnPickedUpAt,

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

        customer: order.user,

        items: returnedItems.map((item) => ({
          id: item.id,

          quantity: item.quantity,

          price: item.price,

          returnStatus:
            item.returnStatus,

          product: item.product,
        })),

        itemCount: returnedItems.length,
      };
    });

    return NextResponse.json({
      success: true,
      data: returns,
    });
  } catch (error) {
    console.error(
      "ADMIN RETURNS API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Return requests could not be loaded.",
      },
      {
        status: 500,
      }
    );
  }
}
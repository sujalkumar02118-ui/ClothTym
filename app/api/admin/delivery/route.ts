import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
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
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },

        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                seller: {
                  select: {
                    id: true,
                    shopName: true,
                    ownerName: true,
                    city: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const deliveries = orders.map((order) => {
      const sellerNames = Array.from(
        new Set(
          order.items
            .map(
              (item) =>
                item.product.seller.shopName ||
                item.product.seller.ownerName
            )
            .filter(Boolean)
        )
      );

      return {
        id: order.id,
        orderId: order.id,

        customer: order.user?.name || "Unknown Customer",

        seller:
          sellerNames.length > 0
            ? sellerNames.join(", ")
            : "Unknown Seller",

        amount: order.totalAmount,

        status: order.status,

        createdAt: order.createdAt.toISOString(),

        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,

        address: order.address,

        pickedUpAt: order.pickedUpAt
          ? order.pickedUpAt.toISOString()
          : null,

        deliveredAt: order.deliveredAt
          ? order.deliveredAt.toISOString()
          : null,

        sellerOtpVerifiedAt:
          order.sellerOtpVerifiedAt
            ? order.sellerOtpVerifiedAt.toISOString()
            : null,

        customerOtpVerifiedAt:
          order.customerOtpVerifiedAt
            ? order.customerOtpVerifiedAt.toISOString()
            : null,

        returnStatus: order.returnStatus,

        returnDeadline: order.returnDeadline
          ? order.returnDeadline.toISOString()
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      count: deliveries.length,
      deliveries,
    });
  } catch (error) {
    console.error(
      "ADMIN DELIVERY API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Delivery data could not be loaded.",
      },
      {
        status: 500,
      }
    );
  }
}
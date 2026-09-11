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
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        items: {
          include: {
            product: {
              include: {
                seller: true,
                category: true,
              },
            },
          },
        },
      },
    });

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      totalAmount: order.totalAmount,
      status: order.status,
      address: order.address,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      pickedUpAt: order.pickedUpAt,
      deliveredAt: order.deliveredAt,
      returnStatus: order.returnStatus,
      refundStatus: order.refundStatus,

      customer: {
        id: order.user.id,
        name: order.user.name,
        email: order.user.email,
        phone: order.user.phone,
        isBlocked: order.user.isBlocked,
      },

      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        returnStatus: item.returnStatus,

        product: {
          id: item.product.id,
          name: item.product.name,
          image: item.product.image,
          price: item.product.price,

          category: item.product.category
            ? {
                id: item.product.category.id,
                name: item.product.category.name,
              }
            : null,

          seller: item.product.seller
            ? {
                id: item.product.seller.id,
                shopName: item.product.seller.shopName,
                ownerName: item.product.seller.ownerName,
              }
            : null,
        },
      })),

      itemCount: order.items.reduce(
        (total, item) => total + item.quantity,
        0
      ),
    }));

    return NextResponse.json({
      success: true,
      data: formattedOrders,
      totalOrders: formattedOrders.length,
    });
  } catch (error) {
    console.error("ADMIN ORDERS API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Orders could not be loaded.",
      },
      { status: 500 }
    );
  }
}
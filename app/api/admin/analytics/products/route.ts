import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        image: true,

        seller: {
          select: {
            id: true,
            shopName: true,
            ownerName: true,
          },
        },

        orderItems: {
          select: {
            quantity: true,
            price: true,

            order: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const analytics = products.map((product) => {
      const validOrderItems = product.orderItems.filter(
        (item) => item.order.status !== "CANCELLED"
      );

      const totalUnitsSold = validOrderItems.reduce(
        (total, item) => total + item.quantity,
        0
      );

      const revenue = validOrderItems.reduce(
        (total, item) =>
          total + item.price * item.quantity,
        0
      );

      const orderIds = new Set(
        validOrderItems.map((item) => item.order.id)
      );

      return {
        id: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        stock: product.stock,

        seller: product.seller,

        totalUnitsSold,
        orderCount: orderIds.size,
        revenue,
      };
    });

    const bestSelling = [...analytics]
      .sort(
        (a, b) =>
          b.totalUnitsSold - a.totalUnitsSold
      )
      .slice(0, 10);

    const lowSelling = [...analytics]
      .sort(
        (a, b) =>
          a.totalUnitsSold - b.totalUnitsSold
      )
      .slice(0, 10);

    const productWiseRevenue = [...analytics]
      .sort((a, b) => b.revenue - a.revenue)
      .map((product) => ({
        id: product.id,
        name: product.name,
        revenue: product.revenue,
        totalUnitsSold: product.totalUnitsSold,
        orderCount: product.orderCount,
      }));

    const productWiseOrders = [...analytics]
      .sort((a, b) => b.orderCount - a.orderCount)
      .map((product) => ({
        id: product.id,
        name: product.name,
        orderCount: product.orderCount,
        totalUnitsSold: product.totalUnitsSold,
        revenue: product.revenue,
      }));

    return NextResponse.json({
      success: true,

      data: {
        totalProducts: products.length,

        bestSelling,
        lowSelling,

        productWiseRevenue,
        productWiseOrders,

        products: analytics,
      },
    });
  } catch (error) {
    console.error(
      "ADMIN PRODUCT ANALYTICS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Product analytics could not be loaded.",
      },
      {
        status: 500,
      }
    );
  }
}
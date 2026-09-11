import { NextResponse } from "next/server";
import {
  PrismaClient,
  OrderStatus,
  ReturnStatus,
} from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const prisma = new PrismaClient();

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);

    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const now = new Date();

    const from = fromParam
      ? new Date(`${fromParam}T00:00:00`)
      : new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

    const to = toParam
      ? new Date(`${toParam}T23:59:59.999`)
      : now;

    if (
      Number.isNaN(from.getTime()) ||
      Number.isNaN(to.getTime())
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid date range.",
        },
        { status: 400 }
      );
    }

    if (from > to) {
      return NextResponse.json(
        {
          success: false,
          message:
            "From date cannot be after to date.",
        },
        { status: 400 }
      );
    }

    const dateFilter = {
      createdAt: {
        gte: from,
        lte: to,
      },
    };

    /*
     * ORDERS
     */

    const [
      totalOrders,
      deliveredOrders,
      cancelledOrders,
      pendingOrders,
      returnedOrders,
      totalCustomers,
      totalSellers,
      totalProducts,
    ] = await Promise.all([
      prisma.order.count({
        where: dateFilter,
      }),

      prisma.order.count({
        where: {
          ...dateFilter,
          status: OrderStatus.DELIVERED,
        },
      }),

      prisma.order.count({
        where: {
          ...dateFilter,
          status: OrderStatus.CANCELLED,
        },
      }),

      prisma.order.count({
        where: {
          ...dateFilter,
          status: {
            notIn: [
              OrderStatus.DELIVERED,
              OrderStatus.CANCELLED,
            ],
          },
        },
      }),

      prisma.order.count({
        where: {
          ...dateFilter,
          returnStatus: {
            in: [
              ReturnStatus.REQUESTED,
              ReturnStatus.APPROVED,
              ReturnStatus.COMPLETED,
            ],
          },
        },
      }),

      prisma.user.count({
        where: {
          role: "BUYER",
          createdAt: {
            gte: from,
            lte: to,
          },
        },
      }),

      prisma.seller.count({
        where: {
          user: {
            createdAt: {
              gte: from,
              lte: to,
            },
          },
        },
      }),

      prisma.product.count({
        where: {
          createdAt: {
            gte: from,
            lte: to,
          },
        },
      }),
    ]);

    /*
     * SALES
     */

    const salesResult =
      await prisma.order.aggregate({
        where: {
          ...dateFilter,
          status: {
            not: OrderStatus.CANCELLED,
          },
        },

        _sum: {
          totalAmount: true,
        },
      });

    const totalSales =
      salesResult._sum.totalAmount ?? 0;

    /*
     * NET SALES
     */

    const deliveredSalesResult =
      await prisma.order.aggregate({
        where: {
          ...dateFilter,
          status: OrderStatus.DELIVERED,
        },

        _sum: {
          totalAmount: true,
        },
      });

    const netSales =
      deliveredSalesResult._sum.totalAmount ?? 0;

    /*
     * CUSTOMER ANALYTICS
     */

    const newCustomers =
      await prisma.user.count({
        where: {
          role: "BUYER",
          createdAt: {
            gte: from,
            lte: to,
          },
        },
      });

    const customerOrderGroups =
      await prisma.order.groupBy({
        by: ["userId"],

        where: dateFilter,

        _count: {
          id: true,
        },
      });

    const repeatCustomers =
      customerOrderGroups.filter(
        (customer) =>
          customer._count.id > 1
      ).length;

    /*
     * SELLER ANALYTICS
     */

    const activeSellers =
      await prisma.seller.count({
        where: {
          approved: true,
        },
      });

    /*
     * TOP SELLERS
     */

    const sellerOrders =
      await prisma.orderItem.findMany({
        where: {
          order: {
            ...dateFilter,
            status: {
              not: OrderStatus.CANCELLED,
            },
          },
        },

        select: {
          quantity: true,
          price: true,

          product: {
            select: {
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
      });

    const sellerMap = new Map<
      string,
      {
        sellerId: string;
        shopName: string;
        ownerName: string;
        orders: number;
        revenue: number;
      }
    >();

    for (const item of sellerOrders) {
      const seller =
        item.product.seller;

      const existing =
        sellerMap.get(seller.id);

      const revenue =
        item.price * item.quantity;

      if (existing) {
        existing.orders += item.quantity;
        existing.revenue += revenue;
      } else {
        sellerMap.set(seller.id, {
          sellerId: seller.id,
          shopName: seller.shopName,
          ownerName: seller.ownerName,
          orders: item.quantity,
          revenue,
        });
      }
    }

    const topSellers =
      Array.from(sellerMap.values())
        .sort(
          (a, b) =>
            b.revenue - a.revenue
        )
        .slice(0, 10);

    /*
     * PRODUCT ANALYTICS
     */

    const productOrders =
      await prisma.orderItem.findMany({
        where: {
          order: {
            ...dateFilter,
            status: {
              not: OrderStatus.CANCELLED,
            },
          },
        },

        select: {
          quantity: true,
          price: true,

          product: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

    const productMap = new Map<
      string,
      {
        productId: string;
        name: string;
        image: string;
        quantity: number;
        revenue: number;
      }
    >();

    for (const item of productOrders) {
      const product =
        item.product;

      const existing =
        productMap.get(product.id);

      const revenue =
        item.price * item.quantity;

      if (existing) {
        existing.quantity +=
          item.quantity;

        existing.revenue += revenue;
      } else {
        productMap.set(product.id, {
          productId: product.id,
          name: product.name,
          image: product.image,
          quantity: item.quantity,
          revenue,
        });
      }
    }

    const bestSellingProducts =
      Array.from(productMap.values())
        .sort(
          (a, b) =>
            b.quantity - a.quantity
        )
        .slice(0, 10);

    const lowSellingProducts =
      Array.from(productMap.values())
        .sort(
          (a, b) =>
            a.quantity - b.quantity
        )
        .slice(0, 10);

    /*
     * RETURN / REFUND ANALYTICS
     */

    const returnRequests =
      await prisma.order.count({
        where: {
          ...dateFilter,
          returnStatus:
            ReturnStatus.REQUESTED,
        },
      });

    const approvedReturns =
      await prisma.order.count({
        where: {
          ...dateFilter,
          returnStatus:
            ReturnStatus.APPROVED,
        },
      });

    const completedReturns =
      await prisma.order.count({
        where: {
          ...dateFilter,
          returnStatus:
            ReturnStatus.COMPLETED,
        },
      });

    const refundProcessing =
      await prisma.order.count({
        where: {
          ...dateFilter,
          refundStatus: "PROCESSING",
        },
      });

    const refundCompleted =
      await prisma.order.count({
        where: {
          ...dateFilter,
          refundStatus: "COMPLETED",
        },
      });

    const refundFailed =
      await prisma.order.count({
        where: {
          ...dateFilter,
          refundStatus: "FAILED",
        },
      });

    const refundAmountResult =
      await prisma.order.aggregate({
        where: {
          ...dateFilter,
          refundStatus: "COMPLETED",
        },

        _sum: {
          refundAmount: true,
        },
      });

    const totalRefundAmount =
      refundAmountResult._sum
        .refundAmount ?? 0;

    /*
     * SALES & ORDERS CHART DATA
     */

    const chartOrders =
      await prisma.order.findMany({
        where: dateFilter,

        select: {
          createdAt: true,
          totalAmount: true,
          status: true,
        },

        orderBy: {
          createdAt: "asc",
        },
      });

    const chartMap = new Map<
      string,
      {
        date: string;
        sales: number;
        orders: number;
      }
    >();

    for (const order of chartOrders) {
      const date = order.createdAt
        .toISOString()
        .slice(0, 10);

      const existing =
        chartMap.get(date);

      if (existing) {
        existing.orders += 1;

        if (
          order.status !==
          OrderStatus.CANCELLED
        ) {
          existing.sales +=
            order.totalAmount;
        }
      } else {
        chartMap.set(date, {
          date,
          sales:
            order.status ===
            OrderStatus.CANCELLED
              ? 0
              : order.totalAmount,
          orders: 1,
        });
      }
    }

    const chartData =
      Array.from(chartMap.values());

    /*
     * RESPONSE
     */

    return NextResponse.json({
      success: true,

      range: {
        from: from.toISOString(),
        to: to.toISOString(),
      },

      sales: {
        totalSales,
        netSales,
      },

      orders: {
        total: totalOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
        pending: pendingOrders,
        returned: returnedOrders,
      },

      customers: {
        total: totalCustomers,
        new: newCustomers,
        repeat: repeatCustomers,
      },

      sellers: {
        total: totalSellers,
        active: activeSellers,
        topPerforming: topSellers,
      },

      products: {
        total: totalProducts,
        bestSelling:
          bestSellingProducts,
        lowSelling:
          lowSellingProducts,
      },

      returns: {
        requested: returnRequests,
        approved: approvedReturns,
        completed: completedReturns,
      },

      refunds: {
        processing: refundProcessing,
        completed: refundCompleted,
        failed: refundFailed,
        totalAmount:
          totalRefundAmount,
      },

      charts: {
        salesOverTime: chartData.map(
          (item) => ({
            date: item.date,
            sales: item.sales,
          })
        ),

        ordersOverTime: chartData.map(
          (item) => ({
            date: item.date,
            orders: item.orders,
          })
        ),
      },
    });
  } catch (error) {
    console.error(
      "ADMIN ANALYTICS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Analytics could not be loaded.",
      },
      {
        status: 500,
      }
    );
  }
}
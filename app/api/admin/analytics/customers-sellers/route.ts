import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient, OrderStatus, Role } from "@prisma/client";
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

    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const dateFilter =
      from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(`${from}T00:00:00`) } : {}),
              ...(to ? { lte: new Date(`${to}T23:59:59.999`) } : {}),
            },
          }
        : {};

    /*
     * CUSTOMER ANALYTICS
     */

    const totalCustomers = await prisma.user.count({
      where: {
        role: Role.BUYER,
      },
    });

    const newCustomers = await prisma.user.count({
      where: {
        role: Role.BUYER,
        ...dateFilter,
      },
    });

    const customers = await prisma.user.findMany({
      where: {
        role: Role.BUYER,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        orders: {
          where: {
            status: OrderStatus.DELIVERED,
            ...dateFilter,
          },
          select: {
            id: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    });

    const repeatCustomers = customers.filter(
      (customer) => customer.orders.length > 1
    ).length;

    const oneTimeCustomers = customers.filter(
      (customer) => customer.orders.length === 1
    ).length;

    /*
     * SELLER ANALYTICS
     */

    const totalSellers = await prisma.seller.count();

    const activeSellers = await prisma.seller.count({
      where: {
        approved: true,
      },
    });

    const sellers = await prisma.seller.findMany({
      select: {
        id: true,
        shopName: true,
        ownerName: true,
        city: true,
        approved: true,

        products: {
          select: {
            id: true,
            name: true,

            orderItems: {
              where: {
                order: {
                  status: OrderStatus.DELIVERED,
                  ...dateFilter,
                },
              },
              select: {
                quantity: true,
                price: true,
              },
            },
          },
        },
      },
    });

    const sellerPerformance = sellers.map((seller) => {
      let totalOrders = 0;
      let totalProductsSold = 0;
      let revenue = 0;

      seller.products.forEach((product) => {
        product.orderItems.forEach((item) => {
          totalOrders += 1;
          totalProductsSold += item.quantity;
          revenue += item.price * item.quantity;
        });
      });

      return {
        id: seller.id,
        shopName: seller.shopName,
        ownerName: seller.ownerName,
        city: seller.city,
        approved: seller.approved,
        totalOrders,
        totalProductsSold,
        revenue,
      };
    });

    const topSellers = [...sellerPerformance]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    /*
     * CUSTOMER PERFORMANCE
     */

    const customerPerformance = customers
      .map((customer) => {
        const totalOrders = customer.orders.length;

        const totalSpent = customer.orders.reduce(
          (total, order) => total + order.totalAmount,
          0
        );

        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          createdAt: customer.createdAt,
          totalOrders,
          totalSpent,
          customerType:
            totalOrders > 1
              ? "REPEAT"
              : totalOrders === 1
              ? "ONE_TIME"
              : "NO_ORDER",
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);

    return NextResponse.json({
      success: true,

      data: {
        customers: {
          totalCustomers,
          newCustomers,
          repeatCustomers,
          oneTimeCustomers,
          noOrderCustomers: customerPerformance.filter(
            (customer) => customer.totalOrders === 0
          ).length,
        },

        sellers: {
          totalSellers,
          activeSellers,
          sellerPerformance,
          topSellers,
        },

        customerPerformance,
      },
    });
  } catch (error) {
    console.error(
      "ADMIN CUSTOMER/SELLER ANALYTICS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Customer and seller analytics could not be loaded.",
      },
      {
        status: 500,
      }
    );
  }
}
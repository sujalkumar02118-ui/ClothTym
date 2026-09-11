import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { PrismaClient } from "@prisma/client";

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
    const session = await getServerSession(
      authOptions
    );

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        {
          status: 401,
        }
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
          message: "Forbidden.",
        },
        {
          status: 403,
        }
      );
    }

    const sevenDaysAgo = new Date();

    sevenDaysAgo.setHours(0, 0, 0, 0);

    sevenDaysAgo.setDate(
      sevenDaysAgo.getDate() - 6
    );

    const [
      totalCustomers,
      totalSellers,
      totalOrders,
      totalProducts,
      allSalesOrders,
      recentOrders,
      last7DaysOrders,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          role: "BUYER",
        },
      }),

      prisma.user.count({
        where: {
          role: "SELLER",
        },
      }),

      prisma.order.count(),

      prisma.product.count(),

      prisma.order.findMany({
        where: {
          status: {
            not: "CANCELLED",
          },
        },
        select: {
          totalAmount: true,
        },
      }),

      prisma.order.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),

      prisma.order.findMany({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
          status: {
            not: "CANCELLED",
          },
        },
        select: {
          totalAmount: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      }),
    ]);

    const totalSales =
      allSalesOrders.reduce(
        (sum, order) =>
          sum +
          Number(
            order.totalAmount || 0
          ),
        0
      );

    const salesOverview = Array.from(
      { length: 7 },
      (_, index) => {
        const date = new Date(
          sevenDaysAgo
        );

        date.setDate(
          sevenDaysAgo.getDate() +
            index
        );

        const year =
          date.getFullYear();

        const month =
          date.getMonth();

        const day =
          date.getDate();

        const dayOrders =
          last7DaysOrders.filter(
            (order) => {
              const orderDate =
                new Date(
                  order.createdAt
                );

              return (
                orderDate.getFullYear() ===
                  year &&
                orderDate.getMonth() ===
                  month &&
                orderDate.getDate() ===
                  day
              );
            }
          );

        const sales =
          dayOrders.reduce(
            (sum, order) =>
              sum +
              Number(
                order.totalAmount || 0
              ),
            0
          );

        return {
          date:
            date.toISOString(),

          label:
            date.toLocaleDateString(
              "en-IN",
              {
                weekday: "short",
              }
            ),

          sales,

          orders:
            dayOrders.length,
        };
      }
    );

    return NextResponse.json({
      success: true,

      data: {
        totalCustomers,
        totalSellers,
        totalOrders,
        totalProducts,
        totalSales,

        recentOrders:
          recentOrders.map(
            (order) => ({
              id: String(
                order.id
              ),

              totalAmount:
                Number(
                  order.totalAmount ||
                    0
                ),

              status:
                String(
                  order.status
                ),

              createdAt:
                order.createdAt.toISOString(),

              user: order.user
                ? {
                    name:
                      order.user
                        .name,

                    email:
                      order.user
                        .email,
                  }
                : null,
            })
          ),

        salesOverview,
      },
    });
  } catch (error) {
    console.error(
      "ADMIN DASHBOARD API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Dashboard data could not be loaded.",
      },
      {
        status: 500,
      }
    );
  }
}
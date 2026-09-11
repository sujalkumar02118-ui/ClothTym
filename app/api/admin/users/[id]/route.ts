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

type Context = {
  params: Promise<{
    id: string;
  }>;
};

type AdminAuthResult =
  | {
      authorized: true;
    }
  | {
      authorized: false;
      response: NextResponse;
    };

async function verifyAdmin(): Promise<AdminAuthResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      ),
    };
  }

  const customUser = session.user as typeof session.user & {
    role?: string;
    isBlocked?: boolean;
  };

  if (
    customUser.role !== "ADMIN" ||
    customUser.isBlocked === true
  ) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Forbidden",
        },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
  };
}

export async function GET(
  request: Request,
  context: Context
) {
  try {
    const auth = await verifyAdmin();

    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await context.params;

    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        seller: true,

        orders: {
          select: {
            totalAmount: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    const totalOrders = user.orders.length;

    const totalSpent = user.orders.reduce(
      (total, order) =>
        total + Number(order.totalAmount || 0),
      0
    );

    return NextResponse.json({
      success: true,

      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isBlocked: user.isBlocked,
        createdAt: user.createdAt,

        seller: user.seller,

        orderStats: {
          totalOrders,
          totalSpent,
        },
      },
    });
  } catch (error) {
    console.error(
      "ADMIN USER DETAILS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load user details.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: Context
) {
  try {
    const auth = await verifyAdmin();

    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await context.params;

    const body = await request.json();

    const action = String(
      body.action || ""
    ).toLowerCase();

    if (
      action !== "block" &&
      action !== "unblock"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid user status action.",
        },
        { status: 400 }
      );
    }

    const existingUser =
      await prisma.user.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          role: true,
        },
      });

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    // Admin ko accidentally block na kar sakein.
    if (existingUser.role === "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin accounts cannot be blocked.",
        },
        { status: 403 }
      );
    }

    const isBlocked =
      action === "block";

    const updatedUser =
      await prisma.user.update({
        where: {
          id,
        },
        data: {
          isBlocked,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isBlocked: true,
          createdAt: true,
        },
      });

    return NextResponse.json({
      success: true,
      message: isBlocked
        ? "User blocked successfully."
        : "User unblocked successfully.",
      data: updatedUser,
    });
  } catch (error) {
    console.error(
      "ADMIN USER STATUS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update user status.",
      },
      { status: 500 }
    );
  }
}
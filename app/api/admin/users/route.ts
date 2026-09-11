import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session =
    await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        {
          status: 401,
        }
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
          message: "Forbidden.",
        },
        {
          status: 403,
        }
      ),
    };
  }

  return {
    authorized: true,
    response: null,
  };
}

export async function GET() {
  try {
    const auth = await checkAdmin();

    if (!auth.authorized) {
      return auth.response!;
    }

    const users =
      await prisma.user.findMany({
        where: {
          role: {
            in: ["BUYER", "SELLER"],
          },
        },

        orderBy: {
          createdAt: "desc",
        },

        // IMPORTANT:
        // Password and other sensitive authentication
        // fields are intentionally NOT selected.
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
      data: users,
    });
  } catch (error) {
    console.error(
      "ADMIN USERS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Users could not be loaded.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request: Request
) {
  try {
    const auth = await checkAdmin();

    if (!auth.authorized) {
      return auth.response!;
    }

    // =====================================================
    // REQUEST BODY VALIDATION
    // =====================================================

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid JSON request body.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    const requestBody =
      body as Record<string, unknown>;

    // =====================================================
    // USER ID VALIDATION
    // =====================================================

    if (
      typeof requestBody.userId !== "string" ||
      requestBody.userId.trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Valid User ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const userId =
      requestBody.userId.trim();

    if (userId.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid User ID.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // BLOCK STATUS VALIDATION
    // =====================================================

    if (
      typeof requestBody.isBlocked !==
      "boolean"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "isBlocked must be a boolean.",
        },
        {
          status: 400,
        }
      );
    }

    const isBlocked =
      requestBody.isBlocked;

    // =====================================================
    // FIND USER
    // =====================================================

    const user =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          id: true,
          role: true,
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    // =====================================================
    // ADMIN PROTECTION
    // =====================================================

    if (user.role === "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin account cannot be blocked.",
        },
        {
          status: 403,
        }
      );
    }

    // =====================================================
    // UPDATE USER
    // =====================================================

    const updatedUser =
      await prisma.user.update({
        where: {
          id: userId,
        },

        data: {
          isBlocked,
        },

        // IMPORTANT:
        // Never return password or other sensitive
        // authentication fields.
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
      "ADMIN USERS PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "User status could not be updated.",
      },
      {
        status: 500,
      }
    );
  }
}
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";

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

    const notifications = await prisma.notification.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("ADMIN NOTIFICATIONS API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Notifications could not be loaded.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    const type =
      typeof body.type === "string"
        ? body.type.trim()
        : "";

    const userId =
      typeof body.userId === "string" &&
      body.userId.trim() !== ""
        ? body.userId.trim()
        : null;

    if (!title || !message || !type) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Title, message and type are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (userId) {
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
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
    }

    const notification =
      await prisma.notification.create({
        data: {
          title,
          message,
          type,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        success: true,
        message: "Notification created successfully.",
        data: notification,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("ADMIN NOTIFICATIONS CREATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Notification could not be created.",
      },
      {
        status: 500,
      }
    );
  }
}
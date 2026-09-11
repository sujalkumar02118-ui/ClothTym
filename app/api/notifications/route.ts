import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

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

    const userId = String(session.user.id);

    const notifications =
      await prisma.notification.findMany({
        where: {
          OR: [
            {
              userId,
            },
            {
              userId: null,
            },
          ],
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
    console.error(
      "NOTIFICATIONS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Notifications could not be loaded.",
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
    const session = await getServerSession(authOptions);

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

    const userId = String(session.user.id);

    const body = await request.json();

    const notificationId =
      typeof body.notificationId === "string"
        ? body.notificationId.trim()
        : "";

    const markAll =
      body.markAll === true;

    if (markAll) {
      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      return NextResponse.json({
        success: true,
        message:
          "All notifications marked as read.",
      });
    }

    if (!notificationId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Notification ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const notification =
      await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId,
        },
      });

    if (!notification) {
      return NextResponse.json(
        {
          success: false,
          message: "Notification not found.",
        },
        {
          status: 404,
        }
      );
    }

    const updatedNotification =
      await prisma.notification.update({
        where: {
          id: notificationId,
        },
        data: {
          isRead: true,
        },
      });

    return NextResponse.json({
      success: true,
      message:
        "Notification marked as read.",
      data: updatedNotification,
    });
  } catch (error) {
    console.error(
      "NOTIFICATION UPDATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Notification could not be updated.",
      },
      {
        status: 500,
      }
    );
  }
}
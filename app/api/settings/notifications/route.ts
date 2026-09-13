import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/* =========================================================
   GET NOTIFICATION PREFERENCE
========================================================= */

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: String(session.user.id),
      },
      select: {
        notificationsEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Account not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      notificationsEnabled: user.notificationsEnabled,
    });
  } catch (error) {
    console.error("NOTIFICATION SETTINGS GET ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load notification settings." },
      { status: 500 }
    );
  }
}

/* =========================================================
   UPDATE NOTIFICATION PREFERENCE
========================================================= */

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (typeof body?.notificationsEnabled !== "boolean") {
      return NextResponse.json(
        {
          error:
            "notificationsEnabled must be true or false.",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: {
        id: String(session.user.id),
      },
      data: {
        notificationsEnabled:
          body.notificationsEnabled,
      },
      select: {
        notificationsEnabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      notificationsEnabled:
        user.notificationsEnabled,
    });
  } catch (error) {
    console.error("NOTIFICATION SETTINGS PATCH ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update notification settings." },
      { status: 500 }
    );
  }
}
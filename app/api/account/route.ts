import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function normalizePhone(value: unknown) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 10);
}

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeName(value: unknown) {
  return String(value ?? "").trim();
}

/* =========================================================
   GET ACCOUNT DETAILS
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
        id: true,
        name: true,
        email: true,
        phone: true,
        alternatePhone: true,
        alternatePhoneHint: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Account not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("ACCOUNT GET ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load account details." },
      { status: 500 }
    );
  }
}

/* =========================================================
   UPDATE ACCOUNT DETAILS
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

    const userId = String(session.user.id);

    const body = await request.json();

    const name = normalizeName(body?.name);
    const email = normalizeEmail(body?.email);
    const alternatePhone = normalizePhone(
      body?.alternatePhone
    );
    const alternatePhoneHint = String(
      body?.alternatePhoneHint ?? ""
    ).trim();

    if (!name) {
      return NextResponse.json(
        { error: "Full name is required." },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: "Full name is too long." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (alternatePhone && alternatePhone.length !== 10) {
      return NextResponse.json(
        {
          error:
            "Alternate mobile number must contain 10 digits.",
        },
        { status: 400 }
      );
    }

    if (alternatePhoneHint.length > 50) {
      return NextResponse.json(
        { error: "Hint name is too long." },
        { status: 400 }
      );
    }

    /* -------------------------------------------------------
       Check duplicate email
    ------------------------------------------------------- */

    const existingEmail = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id: userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingEmail) {
      return NextResponse.json(
        {
          error:
            "This email address is already registered with another account.",
        },
        { status: 409 }
      );
    }

    /* -------------------------------------------------------
       Check alternate number against primary phone numbers
    ------------------------------------------------------- */

    if (alternatePhone) {
      const conflictingUser =
        await prisma.user.findFirst({
          where: {
            phone: alternatePhone,
            NOT: {
              id: userId,
            },
          },
          select: {
            id: true,
          },
        });

      if (conflictingUser) {
        return NextResponse.json(
          {
            error:
              "This mobile number is already registered with another account.",
          },
          { status: 409 }
        );
      }
    }

    /* -------------------------------------------------------
       Update
    ------------------------------------------------------- */

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name,
        email,
        alternatePhone: alternatePhone || null,
        alternatePhoneHint:
          alternatePhoneHint || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        alternatePhone: true,
        alternatePhoneHint: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Account details updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("ACCOUNT PATCH ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update account details." },
      { status: 500 }
    );
  }
}
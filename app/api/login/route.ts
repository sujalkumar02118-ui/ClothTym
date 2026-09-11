import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
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
          message: "Invalid JSON request body.",
        },
        { status: 400 }
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
          message: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const requestBody =
      body as Record<string, unknown>;

    // =====================================================
    // EMAIL
    // =====================================================

    if (
      typeof requestBody.email !== "string" ||
      requestBody.email.trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required.",
        },
        { status: 400 }
      );
    }

    const email =
      requestBody.email
        .trim()
        .toLowerCase();

    if (email.length > 254) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 400 }
      );
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // PASSWORD
    // =====================================================

    if (
      typeof requestBody.password !== "string" ||
      requestBody.password.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required.",
        },
        { status: 400 }
      );
    }

    const password =
      requestBody.password;

    if (password.length > 128) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // DATABASE QUERY
    // =====================================================

    const user =
      await prisma.user.findUnique({
        where: {
          email,
        },

        // Password is selected ONLY internally so that
        // bcrypt can verify it. It is NEVER returned.
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          password: true,
          role: true,
          isBlocked: true,
        },
      });

    // =====================================================
    // INVALID LOGIN
    // =====================================================

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    // =====================================================
    // BLOCKED USER
    // =====================================================

    if (user.isBlocked === true) {
      return NextResponse.json(
        {
          success: false,
          code: "USER_BLOCKED",
          message:
            "Your account has been blocked by the administrator. Please contact support.",
        },
        { status: 403 }
      );
    }

    // =====================================================
    // PASSWORD EXISTENCE CHECK
    // =====================================================

    if (
      typeof user.password !== "string" ||
      user.password.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This account does not have a valid password.",
        },
        { status: 401 }
      );
    }

    // =====================================================
    // PASSWORD VERIFICATION
    // =====================================================

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    // =====================================================
    // SUCCESS RESPONSE
    // =====================================================

    // IMPORTANT:
    // Never return user.password or password hash.

    return NextResponse.json({
      success: true,

      message: "Login successful.",

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while logging in.",
      },
      { status: 500 }
    );
  }
}
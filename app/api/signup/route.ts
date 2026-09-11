import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // =====================================================
    // REQUEST BODY VALIDATION
    // =====================================================

    let body: unknown;

    try {
      body = await req.json();
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
    // NAME VALIDATION
    // =====================================================

    if (
      typeof requestBody.name !== "string" ||
      requestBody.name.trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid name is required.",
        },
        { status: 400 }
      );
    }

    const name =
      requestBody.name.trim();

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name must be between 2 and 100 characters.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // EMAIL VALIDATION
    // =====================================================

    if (
      typeof requestBody.email !== "string" ||
      requestBody.email.trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid email is required.",
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
          message: "Invalid email address.",
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
          message: "Invalid email address.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // PHONE VALIDATION
    // =====================================================

    if (
      typeof requestBody.phone !== "string" ||
      requestBody.phone.trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid phone number is required.",
        },
        { status: 400 }
      );
    }

    const phone =
      requestBody.phone.trim();

    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Phone number must be exactly 10 digits.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // PASSWORD VALIDATION
    // =====================================================

    if (
      typeof requestBody.password !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Password is required.",
        },
        { status: 400 }
      );
    }

    const password =
      requestBody.password;

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must be at least 8 characters long.",
        },
        { status: 400 }
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must not exceed 128 characters.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // ROLE VALIDATION
    // =====================================================

    if (
      typeof requestBody.role !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid account role is required.",
        },
        { status: 400 }
      );
    }

    const role =
      requestBody.role.trim().toUpperCase();

    /*
      SECURITY:

      Public signup is allowed only for:

        BUYER
        SELLER

      ADMIN and DELIVERY accounts must NEVER be
      created through public signup.

      This prevents privilege escalation where
      someone sends:

        role: "ADMIN"
    */

    if (
      role !== "BUYER" &&
      role !== "SELLER"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid account role.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // CHECK EXISTING USER
    // =====================================================

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User already exists.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // HASH PASSWORD
    // =====================================================

    const hashedPassword =
      await bcrypt.hash(password, 10);

    // =====================================================
    // CREATE USER
    // =====================================================

    const user =
      await prisma.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          role,
        },

        /*
          SECURITY:

          Password is deliberately NOT selected
          in the response object.
        */

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

    // =====================================================
    // RESPONSE
    // =====================================================

    return NextResponse.json(
      {
        success: true,
        message:
          "Account created successfully.",

        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "SIGNUP ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while creating the account.",
      },
      { status: 500 }
    );
  }
}
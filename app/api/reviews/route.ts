import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

/* =========================================================
   GET REVIEWS FOR A PRODUCT
========================================================= */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId")?.trim();

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID is required",
        },
        { status: 400 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: {
        productId,
      },
      orderBy: {
        id: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    const totalReviews = reviews.length;

    const averageRating =
      totalReviews > 0
        ? reviews.reduce(
            (sum, review) => sum + review.rating,
            0
          ) / totalReviews
        : 0;

    return NextResponse.json({
      success: true,
      reviews,
      averageRating: Number(averageRating.toFixed(1)),
      totalReviews,
    });
  } catch (error) {
    console.error("GET REVIEWS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Reviews could not be loaded",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   CREATE REVIEW
========================================================= */

export async function POST(request: Request) {
  try {
    /* -------------------------------------------------------
       AUTHENTICATION
    ------------------------------------------------------- */

    const session = await getServerSession(authOptions);

    const customUser = session?.user as
      | {
          id?: string;
          role?: string;
          isBlocked?: boolean;
        }
      | undefined;

    if (!customUser?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login before submitting a review",
        },
        { status: 401 }
      );
    }

    if (customUser.isBlocked === true) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is blocked",
        },
        { status: 403 }
      );
    }

    /* -------------------------------------------------------
       BODY VALIDATION
    ------------------------------------------------------- */

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON request body",
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
          message: "Invalid request body",
        },
        { status: 400 }
      );
    }

    const requestBody = body as Record<string, unknown>;

    if (
      typeof requestBody.productId !== "string" ||
      requestBody.productId.trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID is required",
        },
        { status: 400 }
      );
    }

    const productId = requestBody.productId.trim();

    if (productId.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID",
        },
        { status: 400 }
      );
    }

    const numericRating = Number(requestBody.rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Rating must be between 1 and 5",
        },
        { status: 400 }
      );
    }

    let comment: string | null = null;

    if (requestBody.comment !== undefined) {
      if (typeof requestBody.comment !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid comment",
          },
          { status: 400 }
        );
      }

      comment = requestBody.comment.trim() || null;

      if (comment && comment.length > 1000) {
        return NextResponse.json(
          {
            success: false,
            message: "Comment must be 1000 characters or less",
          },
          { status: 400 }
        );
      }
    }

    /* -------------------------------------------------------
       CHECK PRODUCT
    ------------------------------------------------------- */

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    /* -------------------------------------------------------
       USE SESSION USER ID
       NEVER TRUST CLIENT userId
    ------------------------------------------------------- */

    const userId = customUser.id;

    /* -------------------------------------------------------
       CHECK USER
    ------------------------------------------------------- */

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    /* -------------------------------------------------------
       PREVENT DUPLICATE REVIEW
    ------------------------------------------------------- */

    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        productId,
      },
      select: {
        id: true,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        {
          success: false,
          message: "You have already reviewed this product",
        },
        { status: 400 }
      );
    }

    /* -------------------------------------------------------
       CREATE REVIEW
    ------------------------------------------------------- */

    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating: numericRating,
        comment,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    /* -------------------------------------------------------
       CALCULATE NEW AVERAGE
    ------------------------------------------------------- */

    const allReviews = await prisma.review.findMany({
      where: {
        productId,
      },
      select: {
        rating: true,
      },
    });

    const totalReviews = allReviews.length;

    const averageRating =
      totalReviews > 0
        ? allReviews.reduce(
            (sum, item) => sum + item.rating,
            0
          ) / totalReviews
        : 0;

    return NextResponse.json(
      {
        success: true,
        message: "Review submitted successfully",
        review,
        averageRating: Number(
          averageRating.toFixed(1)
        ),
        totalReviews,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("CREATE REVIEW ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Review could not be submitted",
      },
      { status: 500 }
    );
  }
}
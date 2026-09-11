import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/authOptions";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Admin authentication & authorization
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

    const reviews = await prisma.review.findMany({
      orderBy: {
        id: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
          },
        },
      },
    });

    const formattedReviews = reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      customer: {
        id: review.user.id,
        name: review.user.name,
        email: review.user.email,
        phone: review.user.phone,
      },
      product: {
        id: review.product.id,
        name: review.product.name,
        price: review.product.price,
        image: review.product.image,
      },
    }));

    return NextResponse.json({
      success: true,
      reviews: formattedReviews,
      total: formattedReviews.length,
    });
  } catch (error) {
    console.error("ADMIN REVIEWS API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Reviews could not be loaded.",
      },
      {
        status: 500,
      }
    );
  }
}
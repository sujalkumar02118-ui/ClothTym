import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/* =========================================================
   GET — Logged-in user's wishlist
========================================================= */

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please login to view your wishlist." },
        { status: 401 }
      );
    }

    const userId = String(session.user.id);

    const wishlist = await prisma.wishlist.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        product: {
          include: {
            category: true,
            seller: {
              select: {
                id: true,
                shopName: true,
                approved: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(wishlist);
  } catch (error) {
    console.error("Wishlist GET error:", error);

    return NextResponse.json(
      { error: "Failed to load wishlist." },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST — Add product to wishlist
========================================================= */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please login to add products to wishlist." },
        { status: 401 }
      );
    }

    const userId = String(session.user.id);

    const body = await request.json();
    const productId = String(body?.productId || "").trim();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

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
        { error: "Product not found." },
        { status: 404 }
      );
    }

    const existingWishlist = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingWishlist) {
      return NextResponse.json({
        success: true,
        message: "Product is already in your wishlist.",
        wishlist: existingWishlist,
      });
    }

    const wishlist = await prisma.wishlist.create({
      data: {
        userId,
        productId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Product added to wishlist.",
        wishlist,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Wishlist POST error:", error);

    return NextResponse.json(
      { error: "Failed to add product to wishlist." },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE — Remove product from wishlist
========================================================= */

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please login to remove products from wishlist." },
        { status: 401 }
      );
    }

    const userId = String(session.user.id);

    const body = await request.json();
    const productId = String(body?.productId || "").trim();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    const wishlistItem = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!wishlistItem) {
      return NextResponse.json(
        { error: "Product is not in your wishlist." },
        { status: 404 }
      );
    }

    await prisma.wishlist.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product removed from wishlist.",
    });
  } catch (error) {
    console.error("Wishlist DELETE error:", error);

    return NextResponse.json(
      { error: "Failed to remove product from wishlist." },
      { status: 500 }
    );
  }
}
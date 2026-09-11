import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* =========================================================
   GET SINGLE PRODUCT
   /api/products/[id]

   SECURITY:
   - Only products belonging to approved sellers are public.
   - Seller internal/sensitive fields are not exposed.
========================================================= */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // =====================================================
    // PRODUCT ID VALIDATION
    // =====================================================

    if (
      typeof id !== "string" ||
      id.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Product ID is required",
        },
        { status: 400 }
      );
    }

    const productId = id.trim();

    if (productId.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid product ID",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // FETCH PRODUCT
    //
    // IMPORTANT:
    // Public marketplace must not expose products from
    // unapproved sellers.
    // =====================================================

    const product = await prisma.product.findFirst({
      where: {
        id: productId,

        seller: {
          approved: true,
        },
      },

      include: {
        category: true,

        seller: {
          select: {
            id: true,
            shopName: true,
            ownerName: true,
            city: true,
            address: true,
            approved: true,
          },
        },
      },
    });

    // =====================================================
    // PRODUCT NOT FOUND / NOT PUBLIC
    // =====================================================

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 }
      );
    }

    // =====================================================
    // RESPONSE
    // =====================================================

    return NextResponse.json(product, {
      status: 200,
    });
  } catch (error) {
    console.error(
      "GET PRODUCT BY ID ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load product",
      },
      { status: 500 }
    );
  }
}
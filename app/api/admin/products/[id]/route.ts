import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/authOptions";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID is required.",
        },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        id,
      },
      include: {
        category: true,
        seller: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found.",
        },
        { status: 404 }
      );
    }

    const formattedProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      image: product.image,
      images: product.images,
      sizes: product.sizes,
      colors: product.colors,
      sizeChart: product.sizeChart,
      createdAt: product.createdAt,
      updatedAt: product.createdAt,

      category: {
        id: product.category.id,
        name: product.category.name,
      },

      seller: {
        id: product.seller.id,
        shopName: product.seller.shopName,
        ownerName: product.seller.ownerName,
        city: product.seller.city,
        address: product.seller.address,
        approved: product.seller.approved,

        user: {
          id: product.seller.user.id,
          name: product.seller.user.name,
          email: product.seller.user.email,
          phone: product.seller.user.phone,
          isBlocked: product.seller.user.isBlocked,
          createdAt: product.seller.user.createdAt,
        },
      },

      sellerStatus: product.seller.user.isBlocked
        ? "BLOCKED"
        : product.seller.approved
        ? "ACTIVE"
        : "PENDING",
    };

    return NextResponse.json({
      success: true,
      data: formattedProduct,
    });
  } catch (error) {
    console.error(
      "ADMIN PRODUCT DETAILS API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Product details could not be loaded.",
      },
      { status: 500 }
    );
  }
}
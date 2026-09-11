import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/authOptions";

const prisma = new PrismaClient();

export async function GET() {
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

    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
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

    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });

    const formattedProducts = products.map((product) => ({
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
        },
      },

      sellerStatus: product.seller.user.isBlocked
        ? "BLOCKED"
        : product.seller.approved
        ? "ACTIVE"
        : "PENDING",

      createdAt: product.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        products: formattedProducts,
        totalProducts: formattedProducts.length,
        visibleProducts: formattedProducts.filter(
          (product) => !product.seller.user.isBlocked
        ).length,
        categories: categories.map((category) => ({
          id: category.id,
          name: category.name,
        })),
        totalCategories: categories.length,
      },
    });
  } catch (error) {
    console.error("ADMIN PRODUCTS API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Products could not be loaded.",
      },
      {
        status: 500,
      }
    );
  }
}
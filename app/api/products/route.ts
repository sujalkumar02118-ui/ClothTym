import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

/* =========================================================
   APPROVED SELLER AUTH HELPER
========================================================= */

async function getApprovedSeller() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      session: null,
      seller: null,
      response: NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login first.",
        },
        { status: 401 }
      ),
    };
  }

  const customUser = session.user as typeof session.user & {
    role?: string;
    isBlocked?: boolean;
  };

  if (
    customUser.role !== "SELLER" ||
    customUser.isBlocked === true
  ) {
    return {
      session,
      seller: null,
      response: NextResponse.json(
        {
          success: false,
          message: "Seller access denied.",
        },
        { status: 403 }
      ),
    };
  }

  const seller = await prisma.seller.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      approved: true,
    },
  });

  if (!seller) {
    return {
      session,
      seller: null,
      response: NextResponse.json(
        {
          success: false,
          message: "Seller account not found.",
        },
        { status: 403 }
      ),
    };
  }

  /* =====================================================
     IMPORTANT:
     Seller role alone is NOT enough.
     Admin approval is required.
  ===================================================== */

  if (seller.approved !== true) {
    return {
      session,
      seller: null,
      response: NextResponse.json(
        {
          success: false,
          message: "Seller account is not approved yet.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    session,
    seller,
    response: null,
  };
}

/* =========================================================
   GET ALL PRODUCTS / SELLER OWN PRODUCTS
========================================================= */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get("mine") === "true";

    /* =====================================================
       SELLER OWN PRODUCTS
       /api/products?mine=true
    ===================================================== */

    if (mine) {
      const auth = await getApprovedSeller();

      if (auth.response) {
        return auth.response;
      }

      const seller = auth.seller!;

      const products = await prisma.product.findMany({
        where: {
          sellerId: seller.id,
        },
        orderBy: {
          createdAt: "desc",
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
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      });

      const productsWithRating = products.map((product) => {
        const ratings = product.reviews.map(
          (review) => review.rating
        );

        const reviewCount = ratings.length;

        const averageRating =
          reviewCount > 0
            ? Number(
                (
                  ratings.reduce(
                    (sum, rating) => sum + rating,
                    0
                  ) / reviewCount
                ).toFixed(1)
              )
            : 0;

        const { reviews, ...productData } = product;

        return {
          ...productData,
          averageRating,
          reviewCount,
        };
      });

      return NextResponse.json({
        success: true,
        products: productsWithRating,
      });
    }

    /* =====================================================
       PUBLIC MARKETPLACE
       
       IMPORTANT:
       Only products belonging to APPROVED sellers
       are publicly visible.
    ===================================================== */

    const products = await prisma.product.findMany({
      where: {
        seller: {
          approved: true,
        },
      },
      orderBy: {
        createdAt: "desc",
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
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    const productsWithRating = products.map((product) => {
      const ratings = product.reviews.map(
        (review) => review.rating
      );

      const reviewCount = ratings.length;

      const averageRating =
        reviewCount > 0
          ? Number(
              (
                ratings.reduce(
                  (sum, rating) => sum + rating,
                  0
                ) / reviewCount
              ).toFixed(1)
            )
          : 0;

      const { reviews, ...productData } = product;

      return {
        ...productData,
        averageRating,
        reviewCount,
      };
    });

    return NextResponse.json({
      success: true,
      products: productsWithRating,
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Products could not be loaded.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   CREATE PRODUCT
========================================================= */

export async function POST(request: Request) {
  try {
    /* =====================================================
       ONLY APPROVED SELLER
    ===================================================== */

    const auth = await getApprovedSeller();

    if (auth.response) {
      return auth.response;
    }

    const seller = auth.seller!;

    /* =====================================================
       REQUEST BODY
    ===================================================== */

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

    const {
      name,
      description,
      price,
      stock,
      category,
      image,
      images,
      sizes,
      colors,
      sizeChart,
    } = body as {
      name?: unknown;
      description?: unknown;
      price?: unknown;
      stock?: unknown;
      category?: unknown;
      image?: unknown;
      images?: unknown;
      sizes?: unknown;
      colors?: unknown;
      sizeChart?: unknown;
    };

    /* =====================================================
       BASIC VALIDATION
    ===================================================== */

    if (
      typeof name !== "string" ||
      name.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Product name is required.",
        },
        { status: 400 }
      );
    }

    if (name.trim().length > 200) {
      return NextResponse.json(
        {
          success: false,
          message: "Product name is too long.",
        },
        { status: 400 }
      );
    }

    if (
      typeof description !== "string" ||
      description.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Product description is required.",
        },
        { status: 400 }
      );
    }

    if (description.trim().length > 5000) {
      return NextResponse.json(
        {
          success: false,
          message: "Product description is too long.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       PRICE VALIDATION
    ===================================================== */

    if (
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0 ||
      price > 100000000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product price.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       STOCK VALIDATION
    ===================================================== */

    if (
      typeof stock !== "number" ||
      !Number.isFinite(stock) ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      stock > 100000000
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Stock must be a valid non-negative whole number.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CATEGORY VALIDATION
    ===================================================== */

    if (
      typeof category !== "string" ||
      category.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Category is required.",
        },
        { status: 400 }
      );
    }

    if (category.trim().length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Category name is too long.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       IMAGE VALIDATION
    ===================================================== */

    if (
      image !== undefined &&
      image !== null &&
      typeof image !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid main product image.",
        },
        { status: 400 }
      );
    }

    if (
      typeof image === "string" &&
      image.length > 2000
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Main product image value is too long.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       IMAGES VALIDATION
    ===================================================== */

    if (
      images !== undefined &&
      images !== null &&
      !Array.isArray(images) &&
      typeof images !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product images.",
        },
        { status: 400 }
      );
    }

    if (Array.isArray(images)) {
      if (images.length > 20) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Maximum 20 product images are allowed.",
          },
          { status: 400 }
        );
      }

      if (
        images.some(
          (item) =>
            typeof item !== "string" ||
            item.trim().length === 0 ||
            item.length > 2000
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid product image value.",
          },
          { status: 400 }
        );
      }
    }

    if (
      typeof images === "string" &&
      images.length > 40000
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product images data is too large.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       SIZES VALIDATION
    ===================================================== */

    if (
      sizes !== undefined &&
      sizes !== null &&
      !Array.isArray(sizes) &&
      typeof sizes !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product sizes.",
        },
        { status: 400 }
      );
    }

    if (Array.isArray(sizes)) {
      if (sizes.length > 50) {
        return NextResponse.json(
          {
            success: false,
            message: "Too many product sizes.",
          },
          { status: 400 }
        );
      }

      if (
        sizes.some(
          (item) =>
            typeof item !== "string" ||
            item.trim().length === 0 ||
            item.length > 100
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid product size.",
          },
          { status: 400 }
        );
      }
    }

    if (
      typeof sizes === "string" &&
      sizes.length > 5000
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product sizes data is too large.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       COLORS VALIDATION
    ===================================================== */

    if (
      colors !== undefined &&
      colors !== null &&
      !Array.isArray(colors) &&
      typeof colors !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product colors.",
        },
        { status: 400 }
      );
    }

    if (Array.isArray(colors)) {
      if (colors.length > 50) {
        return NextResponse.json(
          {
            success: false,
            message: "Too many product colors.",
          },
          { status: 400 }
        );
      }

      if (
        colors.some(
          (item) =>
            typeof item !== "string" ||
            item.trim().length === 0 ||
            item.length > 100
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid product color.",
          },
          { status: 400 }
        );
      }
    }

    if (
      typeof colors === "string" &&
      colors.length > 5000
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product colors data is too large.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       SIZE CHART VALIDATION
    ===================================================== */

    if (
      sizeChart !== undefined &&
      sizeChart !== null &&
      typeof sizeChart !== "string" &&
      typeof sizeChart !== "object"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid size chart.",
        },
        { status: 400 }
      );
    }

    if (
      typeof sizeChart === "string" &&
      sizeChart.length > 20000
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Size chart data is too large.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CATEGORY
    ===================================================== */

    let categoryRecord =
      await prisma.category.findUnique({
        where: {
          name: category.trim(),
        },
      });

    if (!categoryRecord) {
      categoryRecord =
        await prisma.category.create({
          data: {
            name: category.trim(),
          },
        });
    }

    /* =====================================================
       IMAGES
    ===================================================== */

    let finalImages: string[] = [];

    if (Array.isArray(images)) {
      finalImages = images
        .filter(
          (item): item is string =>
            typeof item === "string"
        )
        .map((item) => item.trim())
        .filter(Boolean);
    } else if (typeof images === "string") {
      try {
        const parsed: unknown = JSON.parse(images);

        if (Array.isArray(parsed)) {
          finalImages = parsed
            .filter(
              (item): item is string =>
                typeof item === "string"
            )
            .map((item) => item.trim())
            .filter(Boolean);
        }
      } catch {
        finalImages = images
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }

    if (
      typeof image === "string" &&
      image.trim() !== ""
    ) {
      const mainImage = image.trim();

      finalImages = [
        mainImage,
        ...finalImages.filter(
          (item) => item !== mainImage
        ),
      ];
    }

    const productImage =
      finalImages[0] || "";

    /* =====================================================
       SIZES
    ===================================================== */

    let finalSizes: string[] = [];

    if (Array.isArray(sizes)) {
      finalSizes = sizes
        .filter(
          (item): item is string =>
            typeof item === "string"
        )
        .map((item) => item.trim())
        .filter(Boolean);
    } else if (typeof sizes === "string") {
      try {
        const parsed: unknown = JSON.parse(sizes);

        if (Array.isArray(parsed)) {
          finalSizes = parsed
            .filter(
              (item): item is string =>
                typeof item === "string"
            )
            .map((item) => item.trim())
            .filter(Boolean);
        }
      } catch {
        finalSizes = sizes
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }

    /* =====================================================
       COLORS
    ===================================================== */

    let finalColors: string[] = [];

    if (Array.isArray(colors)) {
      finalColors = colors
        .filter(
          (item): item is string =>
            typeof item === "string"
        )
        .map((item) => item.trim())
        .filter(Boolean);
    } else if (typeof colors === "string") {
      try {
        const parsed: unknown = JSON.parse(colors);

        if (Array.isArray(parsed)) {
          finalColors = parsed
            .filter(
              (item): item is string =>
                typeof item === "string"
            )
            .map((item) => item.trim())
            .filter(Boolean);
        }
      } catch {
        finalColors = colors
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }

    /* =====================================================
       SIZE CHART
    ===================================================== */

    let finalSizeChart = "";

    if (typeof sizeChart === "string") {
      finalSizeChart = sizeChart.trim();
    } else if (
      sizeChart !== undefined &&
      sizeChart !== null
    ) {
      finalSizeChart =
        JSON.stringify(sizeChart);
    }

    /* =====================================================
       CREATE PRODUCT
    ===================================================== */

    const product =
      await prisma.product.create({
        data: {
          name: name.trim(),
          description: description.trim(),
          price,
          stock,
          image: productImage,

          images: JSON.stringify(
            finalImages
          ),

          sizes: JSON.stringify(
            finalSizes
          ),

          colors: JSON.stringify(
            finalColors
          ),

          sizeChart: finalSizeChart,

          sellerId: seller.id,

          categoryId:
            categoryRecord.id,
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

    return NextResponse.json(
      {
        success: true,
        message:
          "Product published successfully",
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CREATE PRODUCT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Product could not be published",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE PRODUCT
========================================================= */

export async function DELETE(
  request: Request
) {
  try {
    /* =====================================================
       ONLY APPROVED SELLER
    ===================================================== */

    const auth = await getApprovedSeller();

    if (auth.response) {
      return auth.response;
    }

    const seller = auth.seller!;

    /* =====================================================
       DELETE REQUEST BODY
    ===================================================== */

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid JSON request body.",
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
          message:
            "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const { id } =
      body as {
        id?: unknown;
      };

    /* =====================================================
       PRODUCT ID VALIDATION
    ===================================================== */

    if (
      typeof id !== "string" ||
      id.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product ID is required.",
        },
        { status: 400 }
      );
    }

    if (id.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid product ID.",
        },
        { status: 400 }
      );
    }

    const productId = id.trim();

    /* =====================================================
       OWNERSHIP CHECK
    ===================================================== */

    const existingProduct =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },
        select: {
          id: true,
          sellerId: true,
        },
      });

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product not found.",
        },
        { status: 404 }
      );
    }

    if (
      existingProduct.sellerId !==
      seller.id
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not allowed to delete this product.",
        },
        { status: 403 }
      );
    }

    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Product deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE PRODUCT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Product could not be deleted",
      },
      { status: 500 }
    );
  }
}
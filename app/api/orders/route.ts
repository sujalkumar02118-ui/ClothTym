import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

/* =========================================================
   GET ORDERS
   - Buyer: only own orders
   - Seller: only own seller-related orders
   - OTP/security fields are never exposed
========================================================= */

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // =====================================================
    // AUTHENTICATION
    // =====================================================

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const userId = String(session.user.id);

    // =====================================================
    // FRESH USER SECURITY CHECK
    // =====================================================

    const currentUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        role: true,
        isBlocked: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User account not found.",
        },
        { status: 401 }
      );
    }

    if (currentUser.isBlocked) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is blocked.",
        },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const mine = url.searchParams.get("mine");

    // =====================================================
    // SELLER ORDERS
    // /api/orders?mine=true
    // =====================================================

    if (mine === "true") {
      if (currentUser.role !== "SELLER") {
        return NextResponse.json(
          {
            success: false,
            message: "Seller access denied.",
          },
          { status: 403 }
        );
      }

      const seller = await prisma.seller.findUnique({
        where: {
          userId,
        },
        select: {
          id: true,
          approved: true,
        },
      });

      if (!seller) {
        return NextResponse.json(
          {
            success: false,
            message: "Seller profile not found.",
          },
          { status: 403 }
        );
      }

      // ===================================================
      // SECURITY:
      // Unapproved seller cannot access seller order data.
      // ===================================================

      if (!seller.approved) {
        return NextResponse.json(
          {
            success: false,
            message: "Seller account is not approved.",
          },
          { status: 403 }
        );
      }

      const orders = await prisma.order.findMany({
        where: {
          items: {
            some: {
              product: {
                sellerId: seller.id,
              },
            },
          },
        },

        // =================================================
        // SECURITY:
        // NEVER expose OTPs or OTP security metadata.
        // =================================================

        omit: {
          sellerPickupOtp: true,
          sellerPickupOtpExpiresAt: true,
          sellerPickupOtpAttempts: true,
          sellerPickupOtpLockedUntil: true,

          customerDeliveryOtp: true,
          customerDeliveryOtpExpiresAt: true,
          customerDeliveryOtpAttempts: true,
          customerDeliveryOtpLockedUntil: true,

          returnPickupOtp: true,
          returnPickupOtpExpiresAt: true,
          returnPickupOtpAttempts: true,
          returnPickupOtpLockedUntil: true,
        },

        orderBy: {
          createdAt: "desc",
        },

        include: {
          items: {
            where: {
              product: {
                sellerId: seller.id,
              },
            },

            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  price: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        orders,
      });
    }

    // =====================================================
    // BUYER ORDERS
    // =====================================================

    const orders = await prisma.order.findMany({
      // Buyer can ONLY see their own orders.
      where: {
        userId,
      },

      // =================================================
      // SECURITY:
      // NEVER expose OTPs or OTP security metadata.
      // =================================================

      omit: {
        sellerPickupOtp: true,
        sellerPickupOtpExpiresAt: true,
        sellerPickupOtpAttempts: true,
        sellerPickupOtpLockedUntil: true,

        customerDeliveryOtp: true,
        customerDeliveryOtpExpiresAt: true,
        customerDeliveryOtpAttempts: true,
        customerDeliveryOtpLockedUntil: true,

        returnPickupOtp: true,
        returnPickupOtpExpiresAt: true,
        returnPickupOtpAttempts: true,
        returnPickupOtpLockedUntil: true,
      },

      orderBy: {
        createdAt: "desc",
      },

      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                price: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("GET ORDERS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Orders could not be loaded.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   CREATE ORDER
========================================================= */

export async function POST(request: Request) {
  try {
    // =====================================================
    // AUTHENTICATION
    // =====================================================

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login first.",
        },
        { status: 401 }
      );
    }

    const userId = String(session.user.id);

    // =====================================================
    // FRESH USER SECURITY CHECK
    // =====================================================

    const currentUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        role: true,
        isBlocked: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User account not found.",
        },
        { status: 401 }
      );
    }

    if (currentUser.isBlocked) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is blocked.",
        },
        { status: 403 }
      );
    }

    // =====================================================
    // ORDER CREATION IS FOR BUYERS
    // =====================================================

    if (currentUser.role !== "BUYER") {
      return NextResponse.json(
        {
          success: false,
          message: "Only buyer accounts can place orders.",
        },
        { status: 403 }
      );
    }

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

    const requestBody = body as Record<string, unknown>;

    const address = requestBody.address;
    const items = requestBody.items;
    const paymentMethod = requestBody.paymentMethod;

    // =====================================================
    // ADDRESS VALIDATION
    // =====================================================

    if (typeof address !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Valid delivery address is required.",
        },
        { status: 400 }
      );
    }

    const trimmedAddress = address.trim();

    if (trimmedAddress.length < 5) {
      return NextResponse.json(
        {
          success: false,
          message: "Delivery address is too short.",
        },
        { status: 400 }
      );
    }

    if (trimmedAddress.length > 500) {
      return NextResponse.json(
        {
          success: false,
          message: "Delivery address is too long.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // ITEMS VALIDATION
    // =====================================================

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one product is required.",
        },
        { status: 400 }
      );
    }

    if (items.length > 50) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many products in one order.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // EXTRACT + VALIDATE PRODUCT IDS / QUANTITIES
    // =====================================================

    const requestedItems: {
      productId: string;
      quantity: number;
    }[] = [];

    for (const item of items) {
      if (
        typeof item !== "object" ||
        item === null ||
        Array.isArray(item)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid order item.",
          },
          { status: 400 }
        );
      }

      const orderItem = item as {
        productId?: unknown;
        quantity?: unknown;
      };

      if (
        typeof orderItem.productId !== "string" ||
        orderItem.productId.trim() === ""
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid product ID.",
          },
          { status: 400 }
        );
      }

      const productId = orderItem.productId.trim();

      if (productId.length > 100) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid product ID.",
          },
          { status: 400 }
        );
      }

      if (
        typeof orderItem.quantity !== "number" ||
        !Number.isFinite(orderItem.quantity) ||
        !Number.isInteger(orderItem.quantity) ||
        orderItem.quantity <= 0 ||
        orderItem.quantity > 100
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Product quantity must be a positive whole number.",
          },
          { status: 400 }
        );
      }

      requestedItems.push({
        productId,
        quantity: orderItem.quantity,
      });
    }

    // =====================================================
    // PAYMENT METHOD VALIDATION
    // =====================================================

    if (
      paymentMethod !== "COD" &&
      paymentMethod !== "ONLINE"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment method must be either COD or ONLINE.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // DUPLICATE PRODUCT VALIDATION
    // =====================================================

    const requestedProductIds = requestedItems.map(
      (item) => item.productId
    );

    const uniqueRequestedProductIds = new Set(
      requestedProductIds
    );

    if (
      uniqueRequestedProductIds.size !==
      requestedProductIds.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The same product cannot be added multiple times to one order.",
        },
        { status: 400 }
      );
    }

    const productIds = [
      ...new Set(
        requestedItems.map(
          (item) => item.productId
        )
      ),
    ];

    // =====================================================
    // FETCH ACTUAL PRODUCTS
    //
    // IMPORTANT:
    // Only APPROVED sellers' products can be ordered.
    // =====================================================

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
        seller: {
          approved: true,
        },
      },

      select: {
        id: true,
        price: true,
        stock: true,
        sellerId: true,
        seller: {
          select: {
            id: true,
            approved: true,
          },
        },
      },
    });

    // =====================================================
    // PRODUCT EXISTENCE / APPROVAL VALIDATION
    // =====================================================

    if (products.length !== productIds.length) {
      return NextResponse.json(
        {
          success: false,
          message:
            "One or more products are unavailable or their seller is not approved.",
        },
        { status: 400 }
      );
    }

    const productMap = new Map(
      products.map((product) => [
        product.id,
        product,
      ])
    );

    // =====================================================
    // SERVER-SIDE ORDER TOTAL
    // =====================================================

    let calculatedTotal = 0;

    const orderItemsData: {
      productId: string;
      quantity: number;
      price: number;
    }[] = [];

    for (const requestedItem of requestedItems) {
      const product = productMap.get(
        requestedItem.productId
      );

      if (!product) {
        return NextResponse.json(
          {
            success: false,
            message: "Product not found.",
          },
          { status: 400 }
        );
      }

      // ===================================================
      // SELLER APPROVAL CHECK
      // ===================================================

      if (!product.seller.approved) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This product is currently unavailable.",
          },
          { status: 400 }
        );
      }

      // ===================================================
      // PRODUCT PRICE VALIDATION
      // ===================================================

      if (
        !Number.isFinite(product.price) ||
        product.price < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Product has an invalid price.",
          },
          { status: 400 }
        );
      }

      // ===================================================
      // STOCK VALIDATION
      // ===================================================

      if (
        !Number.isInteger(product.stock) ||
        product.stock < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Product has an invalid stock value.",
          },
          { status: 400 }
        );
      }

      if (
        requestedItem.quantity >
        product.stock
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Requested quantity is greater than available stock.",
          },
          { status: 400 }
        );
      }

      // ===================================================
      // SERVER-SIDE ITEM PRICE
      // ===================================================

      const itemPrice =
        Math.round(product.price * 100) / 100;

      const itemTotal =
        itemPrice * requestedItem.quantity;

      if (
        !Number.isFinite(itemTotal) ||
        itemTotal < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid product amount.",
          },
          { status: 400 }
        );
      }

      calculatedTotal += itemTotal;

      orderItemsData.push({
        productId: product.id,
        quantity: requestedItem.quantity,
        price: itemPrice,
      });
    }

    // =====================================================
    // FINAL SERVER-SIDE TOTAL
    // =====================================================

    calculatedTotal =
      Math.round(calculatedTotal * 100) / 100;

    if (
      !Number.isFinite(calculatedTotal) ||
      calculatedTotal < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order total.",
        },
        { status: 400 }
      );
    }

    const finalTotal = calculatedTotal;

    // =====================================================
    // CREATE ORDER + RESERVE STOCK ATOMICALLY
    //
    // This prevents two simultaneous orders from consuming
    // the same stock.
    // =====================================================

    const order = await prisma.$transaction(
      async (tx) => {
        // -----------------------------------------------
        // DECREASE STOCK SAFELY
        // -----------------------------------------------

        for (const item of orderItemsData) {
          const stockUpdate =
            await tx.product.updateMany({
              where: {
                id: item.productId,
                seller: {
                  approved: true,
                },
                stock: {
                  gte: item.quantity,
                },
              },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            });

          if (stockUpdate.count !== 1) {
            throw new Error(
              `INSUFFICIENT_STOCK:${item.productId}`
            );
          }
        }

        // -----------------------------------------------
        // CREATE ORDER
        // -----------------------------------------------

        const createdOrder =
          await tx.order.create({
            data: {
              // Authenticated user only
              userId,

              // Database-calculated total only
              totalAmount: finalTotal,

              address: trimmedAddress,

              status: "PENDING",

              returnStatus: "NOT_ELIGIBLE",

              paymentMethod:
                paymentMethod === "COD"
                  ? "COD"
                  : "ONLINE",

              paymentStatus: "PENDING",

              items: {
                create: orderItemsData,
              },
            },

            include: {
              items: true,
            },
          });

        // -----------------------------------------------
        // ORDER NOTIFICATION
        // -----------------------------------------------

        await tx.notification.create({
          data: {
            title:
              "Order placed successfully",

            message: `Your order #${createdOrder.id} has been placed successfully.`,

            type: "ORDER",

            userId,
          },
        });

        return createdOrder;
      }
    );

    // =====================================================
    // SUCCESS RESPONSE
    // =====================================================

    return NextResponse.json({
      success: true,

      message:
        paymentMethod === "COD"
          ? "COD order created successfully."
          : "Online payment order created successfully.",

      order: {
        id: order.id,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "CREATE ORDER ERROR:",
      error
    );

    // =====================================================
    // FRIENDLY STOCK ERROR
    // =====================================================

    if (
      error instanceof Error &&
      error.message.startsWith(
        "INSUFFICIENT_STOCK:"
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "One or more products are no longer available in the requested quantity.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Order could not be created.",
      },
      { status: 500 }
    );
  }
}
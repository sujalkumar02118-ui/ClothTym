import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/authOptions";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/* =========================================================
   AUTHENTICATION
========================================================= */

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
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

  if (customUser.isBlocked === true) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "Your account is blocked.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    userId: session.user.id,
  };
}

/* =========================================================
   FORMAT CART ITEM

   Product price always comes from database.
   No client-supplied price is trusted.
========================================================= */

function formatCartItem(item: any) {
  const unitPrice = Number(item.product.price);
  const itemTotal = unitPrice * Number(item.quantity);

  return {
    id: item.id,
    productId: item.productId,
    name: item.product.name,
    price: unitPrice,
    image: item.product.image,
    stock: Number(item.product.stock),
    quantity: Number(item.quantity),
    size: item.size ?? null,
    color: item.color ?? null,
    itemTotal,
  };
}

/* =========================================================
   GET CART
   GET /api/cart
========================================================= */

export async function GET() {
  try {
    const auth = await getAuthenticatedUser();

    if (auth.error) {
      return auth.error;
    }

    const cartItems = await prisma.cart.findMany({
      where: {
        userId: auth.userId,
      },
      orderBy: {
        id: "desc",
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            stock: true,
          },
        },
      },
    });

    const formattedItems = cartItems.map(
      (item) => formatCartItem(item)
    );

    const subtotal = formattedItems.reduce(
      (total, item) => total + item.itemTotal,
      0
    );

    const deliveryCharge =
      subtotal >= 1000 || subtotal === 0 ? 0 : 50;

    const total = subtotal + deliveryCharge;

    return NextResponse.json({
      success: true,
      cart: formattedItems,
      summary: {
        subtotal,
        deliveryCharge,
        total,
      },
    });
  } catch (error) {
    console.error("GET CART ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Cart could not be loaded.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   ADD TO CART
   POST /api/cart

   Body:
   {
     productId: string,
     quantity?: number,
     size?: string | null,
     color?: string | null
   }
========================================================= */

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedUser();

    if (auth.error) {
      return auth.error;
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON body.",
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
          message: "Request body must be an object.",
        },
        { status: 400 }
      );
    }

    const data = body as {
      productId?: unknown;
      quantity?: unknown;
      size?: unknown;
      color?: unknown;
    };

    /* -----------------------------------------------------
       PRODUCT ID VALIDATION
    ----------------------------------------------------- */

    if (
      typeof data.productId !== "string" ||
      data.productId.trim() === "" ||
      data.productId.length > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid product ID is required.",
        },
        { status: 400 }
      );
    }

    const productId = data.productId.trim();

    /* -----------------------------------------------------
       QUANTITY VALIDATION
    ----------------------------------------------------- */

    const quantity =
      data.quantity === undefined
        ? 1
        : data.quantity;

    if (
      typeof quantity !== "number" ||
      !Number.isFinite(quantity) ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Quantity must be a whole number between 1 and 100.",
        },
        { status: 400 }
      );
    }

    /* -----------------------------------------------------
       SIZE VALIDATION
    ----------------------------------------------------- */

    let size: string | null = null;

    if (
      data.size !== undefined &&
      data.size !== null
    ) {
      if (
        typeof data.size !== "string" ||
        data.size.trim() === "" ||
        data.size.length > 100
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid size.",
          },
          { status: 400 }
        );
      }

      size = data.size.trim();
    }

    /* -----------------------------------------------------
       COLOR VALIDATION
    ----------------------------------------------------- */

    let color: string | null = null;

    if (
      data.color !== undefined &&
      data.color !== null
    ) {
      if (
        typeof data.color !== "string" ||
        data.color.trim() === "" ||
        data.color.length > 100
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid colour.",
          },
          { status: 400 }
        );
      }

      color = data.color.trim();
    }

    /* -----------------------------------------------------
       PRODUCT CHECK
    ----------------------------------------------------- */

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        name: true,
        price: true,
        image: true,
        stock: true,
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

    if (product.stock <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "This product is out of stock.",
        },
        { status: 400 }
      );
    }

    /* -----------------------------------------------------
       SAME USER + SAME PRODUCT + SAME SIZE + SAME COLOR
       = SAME CART ITEM
    ----------------------------------------------------- */

    const existingCartItem =
      await prisma.cart.findFirst({
        where: {
          userId: auth.userId,
          productId,
          size,
          color,
        },
      });

    /* -----------------------------------------------------
       UPDATE EXISTING VARIANT
    ----------------------------------------------------- */

    if (existingCartItem) {
      const newQuantity =
        existingCartItem.quantity + quantity;

      if (newQuantity > 100) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Maximum cart quantity for one product variant is 100.",
          },
          { status: 400 }
        );
      }

      if (newQuantity > product.stock) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Only ${product.stock} item(s) are available in stock.`,
          },
          { status: 400 }
        );
      }

      const updatedCartItem =
        await prisma.cart.update({
          where: {
            id: existingCartItem.id,
          },
          data: {
            quantity: newQuantity,
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                image: true,
                stock: true,
              },
            },
          },
        });

      return NextResponse.json({
        success: true,
        message: "Cart updated successfully.",
        cartItem: formatCartItem(updatedCartItem),
      });
    }

    /* -----------------------------------------------------
       NEW CART ITEM
    ----------------------------------------------------- */

    if (quantity > product.stock) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Only ${product.stock} item(s) are available in stock.`,
        },
        { status: 400 }
      );
    }

    const cartItem = await prisma.cart.create({
      data: {
        userId: auth.userId,
        productId,
        quantity,
        size,
        color,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            stock: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Product added to cart successfully.",
        cartItem: formatCartItem(cartItem),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("ADD CART ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Product could not be added to cart.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   UPDATE CART QUANTITY
   PATCH /api/cart

   Body:
   {
     productId: string,
     quantity: number,
     size?: string | null,
     color?: string | null
   }
========================================================= */

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthenticatedUser();

    if (auth.error) {
      return auth.error;
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON body.",
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
          message: "Request body must be an object.",
        },
        { status: 400 }
      );
    }

    const data = body as {
      productId?: unknown;
      quantity?: unknown;
      size?: unknown;
      color?: unknown;
    };

    /* -----------------------------------------------------
       PRODUCT ID
    ----------------------------------------------------- */

    if (
      typeof data.productId !== "string" ||
      data.productId.trim() === "" ||
      data.productId.length > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid product ID is required.",
        },
        { status: 400 }
      );
    }

    const productId = data.productId.trim();

    /* -----------------------------------------------------
       QUANTITY
    ----------------------------------------------------- */

    if (
      typeof data.quantity !== "number" ||
      !Number.isFinite(data.quantity) ||
      !Number.isInteger(data.quantity) ||
      data.quantity < 1 ||
      data.quantity > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Quantity must be a whole number between 1 and 100.",
        },
        { status: 400 }
      );
    }

    /* -----------------------------------------------------
       SIZE
    ----------------------------------------------------- */

    let size: string | null = null;

    if (
      data.size !== undefined &&
      data.size !== null
    ) {
      if (
        typeof data.size !== "string" ||
        data.size.trim() === "" ||
        data.size.length > 100
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid size.",
          },
          { status: 400 }
        );
      }

      size = data.size.trim();
    }

    /* -----------------------------------------------------
       COLOR
    ----------------------------------------------------- */

    let color: string | null = null;

    if (
      data.color !== undefined &&
      data.color !== null
    ) {
      if (
        typeof data.color !== "string" ||
        data.color.trim() === "" ||
        data.color.length > 100
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid colour.",
          },
          { status: 400 }
        );
      }

      color = data.color.trim();
    }

    /* -----------------------------------------------------
       PRODUCT CHECK
    ----------------------------------------------------- */

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        stock: true,
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

    if (data.quantity > product.stock) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Only ${product.stock} item(s) are available in stock.`,
        },
        { status: 400 }
      );
    }

    /* -----------------------------------------------------
       USER'S OWN CART ITEM
    ----------------------------------------------------- */

    const existingCartItem =
      await prisma.cart.findFirst({
        where: {
          userId: auth.userId,
          productId,
          size,
          color,
        },
      });

    if (!existingCartItem) {
      return NextResponse.json(
        {
          success: false,
          message: "Cart item not found.",
        },
        { status: 404 }
      );
    }

    const updatedCartItem =
      await prisma.cart.update({
        where: {
          id: existingCartItem.id,
        },
        data: {
          quantity: data.quantity,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              image: true,
              stock: true,
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      message: "Cart quantity updated successfully.",
      cartItem: formatCartItem(updatedCartItem),
    });
  } catch (error) {
    console.error("UPDATE CART ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Cart could not be updated.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE CART ITEM / CLEAR CART

   Remove:
   {
     productId: string,
     size?: string | null,
     color?: string | null
   }

   Clear:
   {
     clearAll: true
   }
========================================================= */

export async function DELETE(request: Request) {
  try {
    const auth = await getAuthenticatedUser();

    if (auth.error) {
      return auth.error;
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON body.",
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
          message: "Request body must be an object.",
        },
        { status: 400 }
      );
    }

    const data = body as {
      productId?: unknown;
      size?: unknown;
      color?: unknown;
      clearAll?: unknown;
    };

    /* -----------------------------------------------------
       CLEAR ALL
    ----------------------------------------------------- */

    if (data.clearAll === true) {
      await prisma.cart.deleteMany({
        where: {
          userId: auth.userId,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Cart cleared successfully.",
      });
    }

    /* -----------------------------------------------------
       PRODUCT ID
    ----------------------------------------------------- */

    if (
      typeof data.productId !== "string" ||
      data.productId.trim() === "" ||
      data.productId.length > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid product ID is required.",
        },
        { status: 400 }
      );
    }

    const productId = data.productId.trim();

    /* -----------------------------------------------------
       SIZE
    ----------------------------------------------------- */

    let size: string | null = null;

    if (
      data.size !== undefined &&
      data.size !== null
    ) {
      if (
        typeof data.size !== "string" ||
        data.size.trim() === "" ||
        data.size.length > 100
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid size.",
          },
          { status: 400 }
        );
      }

      size = data.size.trim();
    }

    /* -----------------------------------------------------
       COLOR
    ----------------------------------------------------- */

    let color: string | null = null;

    if (
      data.color !== undefined &&
      data.color !== null
    ) {
      if (
        typeof data.color !== "string" ||
        data.color.trim() === "" ||
        data.color.length > 100
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid colour.",
          },
          { status: 400 }
        );
      }

      color = data.color.trim();
    }

    /* -----------------------------------------------------
       USER'S OWN CART ITEM
    ----------------------------------------------------- */

    const existingCartItem =
      await prisma.cart.findFirst({
        where: {
          userId: auth.userId,
          productId,
          size,
          color,
        },
        select: {
          id: true,
        },
      });

    if (!existingCartItem) {
      return NextResponse.json(
        {
          success: false,
          message: "Cart item not found.",
        },
        { status: 404 }
      );
    }

    await prisma.cart.delete({
      where: {
        id: existingCartItem.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product removed from cart successfully.",
    });
  } catch (error) {
    console.error("DELETE CART ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Cart item could not be removed.",
      },
      { status: 500 }
    );
  }
}
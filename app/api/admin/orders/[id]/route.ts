import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/authOptions";

const prisma = new PrismaClient();

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
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

    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: {
        id,
      },
      include: {
        user: true,
        items: {
          include: {
            product: {
              include: {
                seller: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found.",
        },
        {
          status: 404,
        }
      );
    }

    const formattedOrder = {
      id: order.id,
      totalAmount: order.totalAmount,
      status: order.status,
      address: order.address,

      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,

      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,

      paidAt: order.paidAt,

      createdAt: order.createdAt,
      updatedAt: order.updatedAt,

      pickedUpAt: order.pickedUpAt,
      deliveredAt: order.deliveredAt,

      sellerOtpVerifiedAt: order.sellerOtpVerifiedAt,
      customerOtpVerifiedAt: order.customerOtpVerifiedAt,

      returnDeadline: order.returnDeadline,
      returnStatus: order.returnStatus,
      returnRequestedAt: order.returnRequestedAt,
      returnReason: order.returnReason,
      returnRejectedReason: order.returnRejectedReason,
      returnCompletedAt: order.returnCompletedAt,

      returnPickupStatus: order.returnPickupStatus,
      returnPickedUpAt: order.returnPickedUpAt,

      refundStatus: order.refundStatus,
      refundAmount: order.refundAmount,
      refundRequestedAt: order.refundRequestedAt,
      refundCompletedAt: order.refundCompletedAt,
      refundFailureReason: order.refundFailureReason,

      customer: {
        id: order.user.id,
        name: order.user.name,
        email: order.user.email,
        phone: order.user.phone,
        isBlocked: order.user.isBlocked,
      },

      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        returnStatus: item.returnStatus,

        product: {
          id: item.product.id,
          name: item.product.name,
          description: item.product.description,
          image: item.product.image,
          images: item.product.images,
          sizes: item.product.sizes,
          colors: item.product.colors,
          sizeChart: item.product.sizeChart,

          category: item.product.category
            ? {
                id: item.product.category.id,
                name: item.product.category.name,
              }
            : null,

          seller: item.product.seller
            ? {
                id: item.product.seller.id,
                shopName: item.product.seller.shopName,
                ownerName: item.product.seller.ownerName,
                city: item.product.seller.city,
                address: item.product.seller.address,
                approved: item.product.seller.approved,
              }
            : null,
        },
      })),
    };

    return NextResponse.json({
      success: true,
      data: formattedOrder,
    });
  } catch (error) {
    console.error("ADMIN ORDER DETAILS API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Order details could not be loaded.",
      },
      {
        status: 500,
      }
    );
  }
}
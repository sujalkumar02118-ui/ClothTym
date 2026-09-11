import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

type AdminAuthResult =
  | {
      authorized: true;
    }
  | {
      authorized: false;
      response: NextResponse;
    };

async function verifyAdmin(): Promise<AdminAuthResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
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
    customUser.role !== "ADMIN" ||
    customUser.isBlocked === true
  ) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Forbidden",
        },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
  };
}

function getAddressParts(pickupAddress: string | null) {
  if (!pickupAddress) {
    return {
      address: null,
      city: null,
    };
  }

  try {
    const parsed = JSON.parse(pickupAddress);

    return {
      address: pickupAddress,
      city:
        typeof parsed.city === "string"
          ? parsed.city
          : null,
    };
  } catch {
    return {
      address: pickupAddress,
      city: null,
    };
  }
}

export async function GET() {
  try {
    const auth = await verifyAdmin();

    if (!auth.authorized) {
      return auth.response;
    }

    /*
     * New seller-registration based sellers
     */
    const registrations =
      await prisma.sellerRegistration.findMany({
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              isBlocked: true,
              createdAt: true,
              seller: {
                select: {
                  id: true,
                  approved: true,
                },
              },
            },
          },
        },
      });

    const registrationSellers = registrations.map(
      (registration) => {
        const addressParts = getAddressParts(
          registration.pickupAddress
        );

        const existingSeller =
          registration.user.seller;

        return {
          id:
            existingSeller?.id ||
            registration.id,

          registrationId: registration.id,

          shopName:
            registration.storeName ||
            registration.businessName ||
            "Seller Registration",

          ownerName:
            registration.ownerName ||
            registration.panName ||
            registration.user.name,

          city:
            registration.pickupCity ||
            addressParts.city ||
            "—",

          address:
            registration.pickupAddress,

          approved:
            existingSeller?.approved === true ||
            registration.status === "APPROVED",

          registrationStatus:
            registration.status,

          rejectionReason:
            registration.rejectionReason,

          user: {
            id: registration.user.id,
            name: registration.user.name,
            email: registration.user.email,
            phone: registration.user.phone,
            role: registration.user.role,
            isBlocked: registration.user.isBlocked,
            createdAt:
              registration.user.createdAt,
          },
        };
      }
    );

    /*
     * Old/legacy sellers which do not have
     * a SellerRegistration record.
     *
     * This keeps the existing seller system
     * from disappearing.
     */
    const legacySellers =
      await prisma.seller.findMany({
        where: {
          user: {
            sellerRegistration: null,
          },
        },
        orderBy: {
          user: {
            createdAt: "desc",
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              isBlocked: true,
              createdAt: true,
            },
          },
        },
      });

    const legacySellerData = legacySellers.map(
      (seller) => ({
        id: seller.id,

        registrationId: null,

        shopName: seller.shopName,

        ownerName: seller.ownerName,

        city: seller.city,

        address: seller.address,

        approved: seller.approved,

        registrationStatus:
          seller.approved
            ? "APPROVED"
            : "UNDER_REVIEW",

        rejectionReason: null,

        user: {
          id: seller.user.id,
          name: seller.user.name,
          email: seller.user.email,
          phone: seller.user.phone,
          role: seller.user.role,
          isBlocked: seller.user.isBlocked,
          createdAt: seller.user.createdAt,
        },
      })
    );

    const sellers = [
      ...registrationSellers,
      ...legacySellerData,
    ];

    const pendingSellers = sellers.filter(
      (seller) => !seller.approved
    ).length;

    const approvedSellers = sellers.filter(
      (seller) => seller.approved
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        totalSellers: sellers.length,
        pendingSellers,
        approvedSellers,
        sellers,
      },
    });
  } catch (error) {
    console.error(
      "ADMIN SELLERS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Seller data could not be loaded.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await verifyAdmin();

    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();

    const sellerId = String(
      body.sellerId || ""
    ).trim();

    const approved =
      body.approved === true;

    if (!sellerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Seller ID is required.",
        },
        { status: 400 }
      );
    }

    /*
     * First try existing Seller record.
     */
    const existingSeller =
      await prisma.seller.findUnique({
        where: {
          id: sellerId,
        },
        select: {
          id: true,
          userId: true,
        },
      });

    /*
     * If no Seller record exists, the ID may be
     * SellerRegistration.id.
     */
    let registrationId: string | null = null;

    if (!existingSeller) {
      const registration =
        await prisma.sellerRegistration.findUnique({
          where: {
            id: sellerId,
          },
          select: {
            id: true,
            userId: true,
            storeName: true,
            businessName: true,
            ownerName: true,
            pickupAddress: true,
            pickupCity: true,
            pickupState: true,
            pickupPincode: true,
            status: true,
          },
        });

      if (!registration) {
        return NextResponse.json(
          {
            success: false,
            message: "Seller registration not found.",
          },
          { status: 404 }
        );
      }

      registrationId = registration.id;

      if (!approved) {
        await prisma.$transaction([
          prisma.sellerRegistration.update({
            where: {
              id: registration.id,
            },
            data: {
              status: "UNDER_REVIEW",
              rejectionReason: null,
            },
          }),

          prisma.user.update({
            where: {
              id: registration.userId,
            },
            data: {
              role: "BUYER",
            },
          }),
        ]);

        return NextResponse.json({
          success: true,
          message:
            "Seller approval removed successfully.",
        });
      }

      /*
       * Create Seller record for a newly approved
       * registration.
       */
      let city =
        registration.pickupCity ||
        "—";

      let address =
        registration.pickupAddress ||
        null;

      /*
       * pickupAddress is stored as structured JSON.
       * We keep the original stored value here so
       * existing data is not lost.
       */
      if (registration.pickupAddress) {
        try {
          const parsed = JSON.parse(
            registration.pickupAddress
          );

          if (
            !registration.pickupCity &&
            typeof parsed.city === "string"
          ) {
            city = parsed.city;
          }
        } catch {
          // Keep original address unchanged.
        }
      }

      const shopName =
        registration.storeName ||
        registration.businessName ||
        "ClothTym Seller";

      const ownerName =
        registration.ownerName ||
        "Seller";

      const result =
        await prisma.$transaction(
          async (tx) => {
            const seller =
              await tx.seller.create({
                data: {
                  userId:
                    registration.userId,
                  shopName,
                  ownerName,
                  city,
                  address,
                  approved: true,
                },
              });

            await tx.user.update({
              where: {
                id: registration.userId,
              },
              data: {
                role: "SELLER",
              },
            });

            await tx.sellerRegistration.update({
              where: {
                id: registration.id,
              },
              data: {
                status: "APPROVED",
                rejectionReason: null,
              },
            });

            return seller;
          }
        );

      return NextResponse.json({
        success: true,
        message:
          "Seller approved successfully.",
        data: {
          id: result.id,
          registrationId,
        },
      });
    }

    /*
     * Existing Seller record.
     */
    const result =
      await prisma.$transaction(
        async (tx) => {
          const seller =
            await tx.seller.update({
              where: {
                id: existingSeller.id,
              },
              data: {
                approved,
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    isBlocked: true,
                    createdAt: true,
                  },
                },
              },
            });

          await tx.user.update({
            where: {
              id: existingSeller.userId,
            },
            data: {
              role: approved
                ? "SELLER"
                : "BUYER",
            },
          });

          const registration =
            await tx.sellerRegistration.findUnique({
              where: {
                userId:
                  existingSeller.userId,
              },
              select: {
                id: true,
              },
            });

          if (registration) {
            registrationId =
              registration.id;

            await tx.sellerRegistration.update({
              where: {
                id: registration.id,
              },
              data: {
                status: approved
                  ? "APPROVED"
                  : "UNDER_REVIEW",
                rejectionReason: null,
              },
            });
          }

          return seller;
        }
      );

    return NextResponse.json({
      success: true,
      message: approved
        ? "Seller approved successfully."
        : "Seller approval removed successfully.",
      data: {
        ...result,
        registrationId,
      },
    });
  } catch (error) {
    console.error(
      "ADMIN SELLER PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Seller status could not be updated.",
      },
      { status: 500 }
    );
  }
}
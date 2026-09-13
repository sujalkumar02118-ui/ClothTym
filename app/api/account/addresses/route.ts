import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function getUserId() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  return String(session.user.id);
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function validPincode(value: string) {
  return /^\d{6}$/.test(value);
}

function validMobile(value: string) {
  return /^\d{10}$/.test(value);
}

/* =========================================================
   GET — ALL SAVED ADDRESSES
========================================================= */

export async function GET() {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error("ADDRESSES GET ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load addresses." },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST — ADD NEW ADDRESS
========================================================= */

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const name = clean(body?.name);
    const mobile = clean(body?.mobile).replace(/\D/g, "");

    const addressLine1 = clean(body?.addressLine1);
    const addressLine2 = clean(body?.addressLine2);
    const landmark = clean(body?.landmark);

    const city = clean(body?.city);
    const state = clean(body?.state);
    const pincode = clean(body?.pincode).replace(/\D/g, "");

    const type =
      clean(body?.type).toUpperCase() === "OFFICE"
        ? "OFFICE"
        : "HOME";

    const isDefault = Boolean(body?.isDefault);

    if (!name) {
      return NextResponse.json(
        { error: "Name is required." },
        { status: 400 }
      );
    }

    if (!validMobile(mobile)) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid 10-digit mobile number.",
        },
        { status: 400 }
      );
    }

    if (!addressLine1) {
      return NextResponse.json(
        { error: "Address is required." },
        { status: 400 }
      );
    }

    if (!city) {
      return NextResponse.json(
        { error: "City is required." },
        { status: 400 }
      );
    }

    if (!state) {
      return NextResponse.json(
        { error: "State is required." },
        { status: 400 }
      );
    }

    if (!validPincode(pincode)) {
      return NextResponse.json(
        { error: "Please enter a valid 6-digit pincode." },
        { status: 400 }
      );
    }

    const existingCount = await prisma.address.count({
      where: { userId },
    });

    const shouldBeDefault =
      isDefault || existingCount === 0;

    const address = await prisma.$transaction(
      async (tx) => {
        if (shouldBeDefault) {
          await tx.address.updateMany({
            where: { userId },
            data: { isDefault: false },
          });
        }

        return tx.address.create({
          data: {
            userId,
            name,
            mobile,
            addressLine1,
            addressLine2: addressLine2 || null,
            landmark: landmark || null,
            city,
            state,
            pincode,
            type,
            isDefault: shouldBeDefault,
          },
        });
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Address added successfully.",
        address,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("ADDRESS POST ERROR:", error);

    return NextResponse.json(
      { error: "Failed to add address." },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH — UPDATE ADDRESS / SET DEFAULT
========================================================= */

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = clean(body?.id);

    if (!id) {
      return NextResponse.json(
        { error: "Address ID is required." },
        { status: 400 }
      );
    }

    const existing = await prisma.address.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Address not found." },
        { status: 404 }
      );
    }

    /* -------------------------------------------------------
       SET DEFAULT ONLY
    ------------------------------------------------------- */

    if (body?.setDefault === true) {
      await prisma.$transaction([
        prisma.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        }),
        prisma.address.update({
          where: { id },
          data: { isDefault: true },
        }),
      ]);

      const updated = await prisma.address.findUnique({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: "Default address updated.",
        address: updated,
      });
    }

    /* -------------------------------------------------------
       NORMAL UPDATE
    ------------------------------------------------------- */

    const name = clean(body?.name);
    const mobile = clean(body?.mobile).replace(/\D/g, "");

    const addressLine1 = clean(body?.addressLine1);
    const addressLine2 = clean(body?.addressLine2);
    const landmark = clean(body?.landmark);

    const city = clean(body?.city);
    const state = clean(body?.state);
    const pincode = clean(body?.pincode).replace(/\D/g, "");

    const type =
      clean(body?.type).toUpperCase() === "OFFICE"
        ? "OFFICE"
        : "HOME";

    const isDefault = Boolean(body?.isDefault);

    if (!name) {
      return NextResponse.json(
        { error: "Name is required." },
        { status: 400 }
      );
    }

    if (!validMobile(mobile)) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid 10-digit mobile number.",
        },
        { status: 400 }
      );
    }

    if (!addressLine1) {
      return NextResponse.json(
        { error: "Address is required." },
        { status: 400 }
      );
    }

    if (!city || !state) {
      return NextResponse.json(
        { error: "City and state are required." },
        { status: 400 }
      );
    }

    if (!validPincode(pincode)) {
      return NextResponse.json(
        { error: "Please enter a valid 6-digit pincode." },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(
      async (tx) => {
        if (isDefault) {
          await tx.address.updateMany({
            where: {
              userId,
              NOT: { id },
            },
            data: { isDefault: false },
          });
        }

        return tx.address.update({
          where: { id },
          data: {
            name,
            mobile,
            addressLine1,
            addressLine2: addressLine2 || null,
            landmark: landmark || null,
            city,
            state,
            pincode,
            type,
            isDefault,
          },
        });
      }
    );

    return NextResponse.json({
      success: true,
      message: "Address updated successfully.",
      address: updated,
    });
  } catch (error) {
    console.error("ADDRESS PATCH ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update address." },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE — REMOVE ADDRESS
========================================================= */

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const id = clean(searchParams.get("id"));

    if (!id) {
      return NextResponse.json(
        { error: "Address ID is required." },
        { status: 400 }
      );
    }

    const existing = await prisma.address.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Address not found." },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.address.delete({
        where: { id },
      });

      /* If default was removed, promote another address. */
      if (existing.isDefault) {
        const nextAddress =
          await tx.address.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
          });

        if (nextAddress) {
          await tx.address.update({
            where: { id: nextAddress.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Address removed successfully.",
    });
  } catch (error) {
    console.error("ADDRESS DELETE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to remove address." },
      { status: 500 }
    );
  }
}
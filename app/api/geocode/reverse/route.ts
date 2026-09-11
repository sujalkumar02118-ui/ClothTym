import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon) {
      return NextResponse.json(
        {
          error: "Latitude and longitude are required.",
        },
        { status: 400 }
      );
    }

    const latitude = Number(lat);
    const longitude = Number(lon);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        {
          error: "Invalid coordinates.",
        },
        { status: 400 }
      );
    }

    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?format=jsonv2` +
      `&lat=${encodeURIComponent(latitude)}` +
      `&lon=${encodeURIComponent(longitude)}` +
      `&zoom=18` +
      `&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "ClothTym Seller Registration",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Unable to fetch address.",
        },
        { status: 502 }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Reverse geocoding error:", error);

    return NextResponse.json(
      {
        error: "Reverse geocoding failed.",
      },
      { status: 500 }
    );
  }
}
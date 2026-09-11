import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "No image file received",
        },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        {
          success: false,
          message: "Only image files are allowed",
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 10)}.${extension}`;

    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads"
    );

    await mkdir(uploadDirectory, {
      recursive: true,
    });

    const filePath = path.join(
      uploadDirectory,
      fileName
    );

    await writeFile(filePath, buffer);

    const imageUrl = `/uploads/${fileName}`;

    return NextResponse.json({
      success: true,
      url: imageUrl,
    });
  } catch (error) {
    console.error("IMAGE UPLOAD ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Image upload failed",
      },
      { status: 500 }
    );
  }
}
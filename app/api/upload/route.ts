import { NextRequest, NextResponse } from "next/server";
import cloudinary from "../../../lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string | null) || "hs_lookbook";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || "image/webp";
    const base64Data = `data:${mimeType};base64,${buffer.toString("base64")}`;

    // Direct base64 upload with extended timeout and retry
    let result: any = null;
    let lastError: any = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        result = await cloudinary.uploader.upload(base64Data, {
          folder: folder,
          resource_type: "image",
          timeout: 120000,
        });
        if (result?.secure_url) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Cloudinary upload attempt ${attempt} failed:`, err?.message || err);
        if (attempt < 2) {
          await new Promise((res) => setTimeout(res, 1000));
        }
      }
    }

    if (!result || !result.secure_url) {
      throw lastError || new Error("Failed to upload image to Cloudinary");
    }

    return NextResponse.json({
      secure_url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload image to Cloudinary" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const publicId = body?.publicId;

    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Cloudinary delete error:", err);
    return NextResponse.json({ error: err?.message || "Failed to delete from Cloudinary" }, { status: 500 });
  }
}

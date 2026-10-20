/**
 * Centralized, reusable image processing and Cloudinary utility.
 * Handles client-side WebP conversion, adaptive compression to <= 100 KB,
 * and Cloudinary upload/deletion.
 */

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

export interface CompressionOptions {
  targetSizeKB?: number; // target size in KB (default: 100)
  maxDimension?: number; // maximum width or height (default: 1600)
  initialQuality?: number; // initial WebP quality (default: 0.85)
}

/**
 * Compresses an image file and converts it into WebP format while preserving sharpness.
 * Dynamically adapts compression and dimensions to guarantee the output is <= targetSizeKB (~100 KB).
 */
export async function compressAndConvertToWebP(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const targetBytes = (options.targetSizeKB ?? 100) * 1024;
  const maxDimension = options.maxDimension ?? 1600;
  const initialQuality = options.initialQuality ?? 0.85;

  return new Promise((resolve, reject) => {
    // If not an image, return original
    if (!file.type.startsWith("image/")) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Failed to decode image data"));
      img.onload = async () => {
        try {
          let { width, height } = img;

          // Scale down dimensions if exceeding maxDimension, maintaining aspect ratio
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d", { alpha: true });
          if (!ctx) {
            return reject(new Error("Failed to create 2D canvas context"));
          }

          // Enable high-quality bicubic image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          // Adaptive compression loop to target <= 100 KB
          const qualities = [initialQuality, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55];
          let bestBlob: Blob | null = null;

          for (const q of qualities) {
            const blob = await new Promise<Blob | null>((res) =>
              canvas.toBlob((b) => res(b), "image/webp", q)
            );

            if (!blob) continue;
            bestBlob = blob;

            // If under or around target size, accept it
            if (blob.size <= targetBytes) {
              break;
            }
          }

          // If still over target size, scale canvas down slightly and re-compress at 0.70
          if (bestBlob && bestBlob.size > targetBytes && (width > 800 || height > 800)) {
            const scale = Math.sqrt(targetBytes / bestBlob.size);
            const scaledW = Math.max(640, Math.round(width * Math.min(scale, 0.85)));
            const scaledH = Math.max(480, Math.round(height * Math.min(scale, 0.85)));

            const scaledCanvas = document.createElement("canvas");
            scaledCanvas.width = scaledW;
            scaledCanvas.height = scaledH;
            const scaledCtx = scaledCanvas.getContext("2d", { alpha: true });

            if (scaledCtx) {
              scaledCtx.imageSmoothingEnabled = true;
              scaledCtx.imageSmoothingQuality = "high";
              scaledCtx.drawImage(img, 0, 0, scaledW, scaledH);

              const smallerBlob = await new Promise<Blob | null>((res) =>
                scaledCanvas.toBlob((b) => res(b), "image/webp", 0.72)
              );

              if (smallerBlob) {
                bestBlob = smallerBlob;
              }
            }
          }

          if (!bestBlob) {
            return reject(new Error("Failed to generate WebP image blob"));
          }

          // Build clean .webp file name
          const baseName = file.name.replace(/\.[^/.]+$/, "");
          const webpFile = new File([bestBlob], `${baseName}.webp`, {
            type: "image/webp",
            lastModified: Date.now(),
          });

          resolve(webpFile);
        } catch (err) {
          reject(err);
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Unified image upload function:
 * 1. Automatically converts image to WebP
 * 2. Compresses to <= 100 KB with crystal clarity
 * 3. Uploads to Cloudinary
 * 4. Returns secure CDN url and publicId
 */
export async function uploadImageToCloudinary(
  file: File,
  folder = "hs_lookbook"
): Promise<CloudinaryUploadResult> {
  // Step 1: Compress and convert to WebP <= 100 KB
  const webpFile = await compressAndConvertToWebP(file, { targetSizeKB: 100 });

  // Step 2: Upload to Next.js Cloudinary API route
  const formData = new FormData();
  formData.append("file", webpFile);
  formData.append("folder", folder);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || `Upload failed with HTTP ${res.status}`);
  }

  const data = await res.json();
  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
}

/**
 * Unified image deletion function:
 * Deletes the image permanently from Cloudinary using its public_id.
 */
export async function deleteImageFromCloudinary(publicId: string): Promise<boolean> {
  if (!publicId) return true;

  try {
    const res = await fetch("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId }),
    });

    if (!res.ok) {
      console.warn(`Failed to delete Cloudinary asset: ${publicId}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Cloudinary deletion network error:", err);
    return false;
  }
}

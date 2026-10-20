import { IMAGE_MAX_WIDTH, IMAGE_QUALITY } from "./constants/limits";

/**
 * Client-side image downscaling.
 *
 * Library images are resized to at most 1600px wide and re-encoded at ~0.8
 * quality, which keeps uploads small enough for the 1 GB free Storage tier.
 * WebP is preferred when the browser can encode it, otherwise JPEG.
 */
export async function compressImage(
  file: File,
  maxWidth: number = IMAGE_MAX_WIDTH,
  quality: number = IMAGE_QUALITY,
): Promise<File> {
  const bitmap = await loadBitmap(file);

  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    closeBitmap(bitmap);
    return file;
  }

  context.drawImage(bitmap as CanvasImageSource, 0, 0, width, height);
  closeBitmap(bitmap);

  const mimeType = supportsWebp() ? "image/webp" : "image/jpeg";
  const blob = await canvasToBlob(canvas, mimeType, quality);

  if (!blob) return file;

  const name = file.name.replace(/\.[^.]+$/, "") + (mimeType === "image/webp" ? ".webp" : ".jpg");
  return new File([blob], name, { type: mimeType, lastModified: Date.now() });
}

/** Smaller budget for chat pictures so the database stays light. */
export async function compressChatImage(file: File): Promise<File> {
  return compressImage(file, 1280, 0.72);
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fall through to the <img> decoder (Safari < 15, some WebViews).
    }
  }
  return await loadWithImageElement(file);
}

function loadWithImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode that image."));
    };
    image.src = url;
  });
}

function closeBitmap(bitmap: ImageBitmap | HTMLImageElement) {
  if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

let webpSupport: boolean | null = null;

function supportsWebp(): boolean {
  if (webpSupport !== null) return webpSupport;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  webpSupport = canvas.toDataURL("image/webp").startsWith("data:image/webp");
  return webpSupport;
}

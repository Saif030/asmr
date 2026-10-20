import {
  ALLOWED_CHAT_IMAGE_MIME,
  ALLOWED_MATERIAL_MIME,
  MAX_CHAT_IMAGE_BYTES,
  MAX_IMAGE_BYTES,
  MAX_PDF_BYTES,
} from "./constants/limits";

export type FileLike = {
  name: string;
  type: string;
  size: number;
};

export type ValidationResult = { ok: true } | { ok: false; error: string };

/**
 * Shared client/server validation for library uploads.
 * The bucket's own file-size and extension limits re-check everything, so a
 * tampered client cannot push past the rules.
 */
export function validateMaterialFile(file: FileLike): ValidationResult {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isImage = ALLOWED_MATERIAL_MIME.includes(file.type);

  if (!isPdf && !isImage) {
    return { ok: false, error: "Only PDF files and images (JPG, PNG, WebP, GIF) are allowed." };
  }

  // Check PDF size limit (20 MB)
  if (isPdf && file.size > MAX_PDF_BYTES) {
    return { ok: false, error: "PDFs are limited to 20 MB." };
  }

  // Check image size limit (5 MB) - only if NOT a PDF
  if (!isPdf && isImage && file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Images are limited to 5 MB." };
  }

  if (file.size === 0) {
    return { ok: false, error: "That file is empty." };
  }

  return { ok: true };
}

/** Chat pictures are compressed first, then validated with a tighter budget. */
export function validateChatImage(file: FileLike): ValidationResult {
  if (!ALLOWED_CHAT_IMAGE_MIME.includes(file.type)) {
    return { ok: false, error: "Chat images must be JPG, PNG, WebP or GIF." };
  }
  if (file.size > MAX_CHAT_IMAGE_BYTES) {
    return { ok: false, error: "Chat images are limited to 2 MB after compression." };
  }
  return { ok: true };
}

export function isPdfFile(file: FileLike) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function isImageFile(file: FileLike) {
  return file.type.startsWith("image/");
}

/** Strips characters that would break a search term. */
export function sanitizeSearchTerm(term: string): string {
  return term.replace(/[^\p{L}\p{N}\s-]/gu, " ").trim().slice(0, 80);
}

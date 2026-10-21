/**
 * Free-tier limits, tuned for the Appwrite Education plan.
 *
 * The Education plan is Pro-equivalent: 150 GB of storage, 2 TB of bandwidth
 * per month, unlimited buckets and no inactivity pausing. The numbers below
 * are therefore generous, and the storage ceiling can be lowered with
 * APPWRITE_STORAGE_LIMIT_BYTES if the project is ever moved to the Free plan
 * (2 GB).
 */

/** Storage ceiling. Education: 150 GB. Override for a smaller plan. */
export const STORAGE_QUOTA_BYTES = Number(
  process.env.APPWRITE_STORAGE_LIMIT_BYTES ?? 150 * 1024 * 1024 * 1024,
);
export const STORAGE_UPLOAD_BLOCK_BYTES = Math.floor(STORAGE_QUOTA_BYTES * 0.93);
export const STORAGE_WARN_BYTES = Math.floor(STORAGE_QUOTA_BYTES * 0.7);

/** Per-file upload ceilings (validated on client and server). */
export const MAX_PDF_BYTES = 100 * 1024 * 1024; // 100 MB
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_CHAT_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB (compressed first)

/** The single Appwrite bucket's own hard limit. */
export const BUCKET_MAX_FILE_BYTES = MAX_PDF_BYTES;

export const ALLOWED_MATERIAL_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const ALLOWED_CHAT_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Extensions the Appwrite bucket accepts. */
export const ALLOWED_FILE_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "webp", "gif"];

/** Client-side image downscaling before upload. */
export const IMAGE_MAX_WIDTH = 1600;
export const IMAGE_QUALITY = 0.8;

/** Keep the database small: only the newest N messages survive per channel. */
export const MESSAGES_PER_CHANNEL_LIMIT = 5000;

/** Rows fetched per request (Appwrite caps a page at 100 by default). */
export const PAGE_SIZE = 50;

export const MATERIAL_TYPE_LABELS: Record<string, string> = {
  book: "Books",
  pyq: "PYQs",
  question_bank: "Question Banks",
  image: "Images / Notes",
  youtube: "YouTube",
};

export const MATERIAL_TYPE_ORDER = [
  "book",
  "pyq",
  "question_bank",
  "image",
  "youtube",
] as const;

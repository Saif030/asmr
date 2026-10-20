import { BUCKETS, endpoint, projectId } from "./config";

/**
 * Public file URLs.
 *
 * Appwrite serves files from
 *   {endpoint}/storage/buckets/{bucketId}/files/{fileId}/view
 * Both buckets are created with fileSecurity disabled, so the browser can
 * render previews and stream PDFs without a signed URL. File ids are random,
 * which keeps the links unguessable.
 */
export function fileViewUrl(
  bucketId: string,
  fileId: string | null | undefined,
): string | null {
  if (!fileId) return null;
  return `${endpoint()}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId()}`;
}

export function fileDownloadUrl(
  bucketId: string,
  fileId: string | null | undefined,
): string | null {
  if (!fileId) return null;
  return `${endpoint()}/storage/buckets/${bucketId}/files/${fileId}/download?project=${projectId()}`;
}

export function materialFileUrl(fileId: string | null | undefined) {
  return fileViewUrl(BUCKETS.materials, fileId);
}

export function materialDownloadUrl(fileId: string | null | undefined) {
  return fileDownloadUrl(BUCKETS.materials, fileId);
}

export function chatImageUrl(fileId: string | null | undefined) {
  return fileViewUrl(BUCKETS.chat, fileId);
}

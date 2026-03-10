/**
 * File storage abstraction. Uses Supabase Storage when configured.
 * All upload/download/delete routes use this so they work on Vercel.
 */

import {
  isSupabaseStorageAvailable,
  uploadToSupabase,
  deleteFromSupabaseByUrl,
} from "./supabase-storage";

export function isBlobStorageAvailable(): boolean {
  return isSupabaseStorageAvailable();
}

export async function uploadToBlob(
  buffer: Buffer,
  pathname: string,
  options?: { contentType?: string }
): Promise<string | null> {
  return uploadToSupabase(buffer, pathname, options);
}

export async function deleteBlobByUrl(url: string): Promise<boolean> {
  return deleteFromSupabaseByUrl(url);
}

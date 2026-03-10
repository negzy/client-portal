import { createClient, SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "portal-uploads";

function getClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export function isSupabaseStorageAvailable(): boolean {
  return Boolean(getClient());
}

/**
 * Upload a buffer to Supabase Storage. Returns the public URL or null.
 */
export async function uploadToSupabase(
  buffer: Buffer,
  pathname: string,
  options?: { contentType?: string }
): Promise<string | null> {
  const supabase = getClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(pathname, buffer, {
        contentType: options?.contentType ?? "application/octet-stream",
        upsert: true,
      });
    if (error) {
      console.error("[supabase-storage] upload failed:", error);
      return null;
    }
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (e) {
    console.error("[supabase-storage] upload error:", e);
    return null;
  }
}

/**
 * Delete a file by its full public URL (we extract the path from the URL).
 */
export async function deleteFromSupabaseByUrl(url: string): Promise<boolean> {
  const supabase = getClient();
  if (!supabase) return false;
  try {
    const pathMatch = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    const path = pathMatch ? decodeURIComponent(pathMatch[1]) : null;
    if (!path) {
      console.error("[supabase-storage] could not parse path from url:", url);
      return false;
    }
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) {
      console.error("[supabase-storage] delete failed:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[supabase-storage] delete error:", e);
    return false;
  }
}

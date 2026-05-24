// Supabase Storage client wrapper — Sprint 10A (mobile-readiness)
//
// Local-first guarantee: every function is null-safe when Supabase isn't
// configured. UI components branch on `isStorageAvailable()` and fall back
// to dataUrl storage in localStorage for fully-offline workspaces.
//
// Path convention: {workspace_id}/{evidence_asset_id}/{filename}
// RLS (migration 0013) enforces workspace membership against the first
// path segment.

import { getSupabaseClient, isSupabaseConfigured } from "./supabaseClient";

export const EVIDENCE_BUCKET = "evidence-files";

/** True when Supabase + auth are configured well enough to upload. */
export function isStorageAvailable(): boolean {
  return isSupabaseConfigured();
}

function sanitizeFilename(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "file";
}

export function buildEvidencePath(
  workspaceId: string,
  evidenceAssetId: string,
  filename: string
): string {
  const ws = workspaceId.trim();
  const asset = evidenceAssetId.trim();
  if (!ws || !asset) {
    throw new Error("workspaceId + evidenceAssetId required for evidence path");
  }
  return `${ws}/${asset}/${sanitizeFilename(filename)}`;
}

export type UploadResult = {
  bucket: string;
  path: string;
};

/** Upload a binary file (Blob/File) to the evidence bucket. Throws when
 * Supabase isn't configured or the upload fails — caller handles fallback. */
export async function uploadEvidenceFile(
  workspaceId: string,
  evidenceAssetId: string,
  file: File | Blob,
  filename?: string
): Promise<UploadResult> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  const safeName = sanitizeFilename(filename ?? (file as File).name ?? "upload");
  const path = buildEvidencePath(workspaceId, evidenceAssetId, safeName);
  const { error } = await client.storage
    .from(EVIDENCE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: (file as File).type || undefined
    });
  if (error) throw new Error(`storage upload failed: ${error.message}`);
  return { bucket: EVIDENCE_BUCKET, path };
}

/** Get a short-lived signed URL for displaying/downloading an evidence file.
 * Returns null when Supabase isn't configured or the path is missing. */
export async function getEvidenceSignedUrl(
  path: string,
  expiresInSeconds = 600
): Promise<string | null> {
  if (!path) return null;
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.storage
    .from(EVIDENCE_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error) {
    console.warn("[storage] signed url failed", error);
    return null;
  }
  return data?.signedUrl ?? null;
}

/** Remove an evidence file from the bucket. No-op when Supabase isn't
 * configured. Returns true on success. */
export async function removeEvidenceFile(path: string): Promise<boolean> {
  if (!path) return false;
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.storage.from(EVIDENCE_BUCKET).remove([path]);
  if (error) {
    console.warn("[storage] remove failed", error);
    return false;
  }
  return true;
}

/** Convert a File to a base64 data URL for local-first fallback. Useful
 * when Supabase isn't configured (or upload failed) — the dataUrl can
 * still be stored in localStorage and rendered in <img>. */
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

/** Inspect a File: returns image dimensions when possible. Useful for
 * Evidence intake UI to show "1920x1080 · 1.2 MB" preview. Returns null
 * for non-image files. */
export function readImageDimensions(file: File | Blob): Promise<{
  width: number;
  height: number;
} | null> {
  if (!file.type.startsWith("image/")) return Promise.resolve(null);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exp = Math.min(units.length - 1, Math.floor(Math.log10(bytes) / 3));
  const value = bytes / Math.pow(1000, exp);
  return `${value.toFixed(value >= 10 || exp === 0 ? 0 : 1)} ${units[exp]}`;
}

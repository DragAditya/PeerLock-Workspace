export const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024;
export const PROFILE_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function profileImageValidationError(file: Pick<File, "type" | "size">) {
  if (!PROFILE_IMAGE_MIME_TYPES.includes(file.type as (typeof PROFILE_IMAGE_MIME_TYPES)[number])) return "Choose a PNG, JPEG, or WebP image.";
  if (file.size > MAX_PROFILE_IMAGE_BYTES) return "Choose an image smaller than 2 MB.";
  return null;
}

export async function compressProfileImage(file: File) {
  const error = profileImageValidationError(file);
  if (error) throw new Error(error);
  const bitmap = await createImageBitmap(file);
  const longestSide = Math.max(bitmap.width, bitmap.height);
  const scale = Math.min(1, 384 / longestSide);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot prepare the profile image.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/webp", 0.78);
}

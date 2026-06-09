import { supabase } from './supabase';

const BUCKET = 'reflection-images';
const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadReflectionPostImage(
  userId: string,
  reflectionId: string | null,
  file: File
): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error('Image must be 5MB or smaller.');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const folder = reflectionId || `draft-${crypto.randomUUID()}`;
  const path = `${userId}/${folder}/cover.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || `image/${ext}` });

  if (error) {
    throw new Error(
      `Image upload failed: ${error.message}. Run migration 019 in Supabase to enable reflection post images.`
    );
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

import { supabase } from './supabase';

const BUCKET = 'welfare-gallery';
const MAX_BYTES = 5 * 1024 * 1024;

function validateImageFile(file: File): void {
  if (file.size > MAX_BYTES) {
    throw new Error('Image must be 5MB or smaller.');
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.');
  }
}

export async function uploadWelfareProgramImage(
  userId: string,
  programId: string,
  file: File
): Promise<string> {
  validateImageFile(file);

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${programId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || `image/${ext}` });

  if (error) {
    throw new Error(
      `Image upload failed: ${error.message}. Run migration 032 in Supabase to enable the welfare gallery.`
    );
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function uploadWelfareProgramCover(
  userId: string,
  programId: string,
  file: File
): Promise<string> {
  validateImageFile(file);

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${programId}/cover.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || `image/${ext}` });

  if (error) {
    throw new Error(`Cover upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

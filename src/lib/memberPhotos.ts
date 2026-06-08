import { supabase } from './supabase';

const BUCKET = 'member-photos';
const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadMemberPhoto(memberId: string, file: File): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error('Photo must be 5MB or smaller.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${memberId}/avatar.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || `image/${ext}` });

  if (error) {
    throw new Error(
      `Photo upload failed: ${error.message}. Run migration 009 in Supabase to create the member-photos bucket.`
    );
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

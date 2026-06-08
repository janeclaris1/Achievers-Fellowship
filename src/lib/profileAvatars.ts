import { supabase } from './supabase';

const BUCKET = 'profile-avatars';
const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadProfileAvatar(userId: string, file: File): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error('Photo must be 5MB or smaller.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/avatar.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || `image/${ext}` });

  if (error) {
    throw new Error(
      `Avatar upload failed: ${error.message}. Run migration 013 in Supabase to create the profile-avatars bucket.`
    );
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function saveProfileAvatar(userId: string, avatarUrl: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId);

  if (error) throw new Error(error.message);
}

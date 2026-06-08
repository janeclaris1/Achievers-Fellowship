import { supabase } from './supabase';

const READS_CHANGED = 'reflection-reads-changed';

export function subscribeReflectionReadsChanged(onChange: () => void): () => void {
  const handler = () => onChange();
  window.addEventListener(READS_CHANGED, handler);
  return () => window.removeEventListener(READS_CHANGED, handler);
}

export function notifyReflectionReadsChanged(): void {
  window.dispatchEvent(new CustomEvent(READS_CHANGED));
}

export async function fetchUnreadReflectionCount(userId: string): Promise<number> {
  const [publishedRes, readsRes] = await Promise.all([
    supabase.from('reflections').select('id').eq('status', 'PUBLISHED'),
    supabase.from('reflection_reads').select('reflection_id').eq('profile_id', userId),
  ]);

  if (publishedRes.error || readsRes.error) return 0;

  const readIds = new Set((readsRes.data ?? []).map((row) => row.reflection_id));
  return (publishedRes.data ?? []).filter((row) => !readIds.has(row.id)).length;
}

export async function markReflectionRead(userId: string, reflectionId: string): Promise<void> {
  const { error } = await supabase.from('reflection_reads').upsert(
    { profile_id: userId, reflection_id: reflectionId, read_at: new Date().toISOString() },
    { onConflict: 'profile_id,reflection_id' }
  );

  if (!error) notifyReflectionReadsChanged();
}

export async function markAllPublishedReflectionsRead(userId: string): Promise<void> {
  const { data: published, error } = await supabase
    .from('reflections')
    .select('id')
    .eq('status', 'PUBLISHED');

  if (error || !published?.length) return;

  const { error: upsertError } = await supabase.from('reflection_reads').upsert(
    published.map((row) => ({
      profile_id: userId,
      reflection_id: row.id,
      read_at: new Date().toISOString(),
    })),
    { onConflict: 'profile_id,reflection_id' }
  );

  if (!upsertError) notifyReflectionReadsChanged();
}

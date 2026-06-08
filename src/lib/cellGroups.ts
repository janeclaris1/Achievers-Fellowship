import { supabase } from './supabase';
import type { CellGroup } from '../types';

/** Loads cell groups, falling back when is_active column is not migrated yet. */
export async function fetchActiveCellGroups() {
  const withFilter = await supabase
    .from('cell_groups')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (withFilter.error?.message?.includes('is_active')) {
    return supabase.from('cell_groups').select('*').order('name');
  }

  return withFilter as typeof withFilter & { data: CellGroup[] | null };
}

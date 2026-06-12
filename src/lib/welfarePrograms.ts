import { supabase } from './supabase';
import type { ProgramType, WelfareProgram, WelfareProgramImage } from '../types';

export const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  BIRTHDAY: 'Birthday celebration',
  BEREAVEMENT: 'Bereavement',
  HOSPITAL_VISIT: 'Hospital visit',
  WEDDING: 'Wedding party',
  SPECIAL_PROGRAM: 'Special program',
  OTHER: 'Other',
};

export const PROGRAM_TYPE_SHORT: Record<ProgramType, string> = {
  BIRTHDAY: 'Birthday',
  BEREAVEMENT: 'Bereavement',
  HOSPITAL_VISIT: 'Hospital',
  WEDDING: 'Wedding',
  SPECIAL_PROGRAM: 'Special',
  OTHER: 'Other',
};

export interface WelfareProgramWithGallery extends WelfareProgram {
  cover_image_url?: string;
  welfare_program_images?: WelfareProgramImage[];
}

export function getProgramDisplayImage(program: WelfareProgramWithGallery): string | null {
  if (program.cover_image_url) return program.cover_image_url;
  const sorted = [...(program.welfare_program_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  return sorted[0]?.image_url ?? null;
}

export interface ProgramGalleryImage {
  url: string;
  caption?: string | null;
}

export function getProgramGalleryImages(program: WelfareProgramWithGallery): ProgramGalleryImage[] {
  const images: ProgramGalleryImage[] = [];

  if (program.cover_image_url) {
    images.push({ url: program.cover_image_url, caption: 'Cover' });
  }

  const sorted = [...(program.welfare_program_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  for (const img of sorted) {
    const normalized = img.image_url.split('?')[0];
    if (!images.some((entry) => entry.url.split('?')[0] === normalized)) {
      images.push({ url: img.image_url, caption: img.caption });
    }
  }

  return images;
}

export function programHasGalleryContent(program: WelfareProgramWithGallery): boolean {
  return Boolean(program.cover_image_url || (program.welfare_program_images?.length ?? 0) > 0);
}

export async function fetchWelfareGalleryPrograms(
  typeFilter?: ProgramType | null
): Promise<WelfareProgramWithGallery[]> {
  let query = supabase
    .from('welfare_programs')
    .select('*, welfare_program_images(*)')
    .in('status', ['COMPLETED', 'IN_PROGRESS'])
    .order('date', { ascending: false });

  if (typeFilter) {
    query = query.eq('type', typeFilter);
  }

  const { data, error } = await query;
  if (error) {
    if (error.message.includes('welfare_program_images')) {
      const { data: fallback } = await supabase
        .from('welfare_programs')
        .select('*')
        .in('status', ['COMPLETED', 'IN_PROGRESS'])
        .order('date', { ascending: false });
      return (fallback ?? []).filter((p) => p.cover_image_url) as WelfareProgramWithGallery[];
    }
    return [];
  }

  return (data ?? []).filter(programHasGalleryContent) as WelfareProgramWithGallery[];
}

export async function fetchProgramGalleryImages(programId: string): Promise<WelfareProgramImage[]> {
  const { data } = await supabase
    .from('welfare_program_images')
    .select('*')
    .eq('program_id', programId)
    .order('sort_order', { ascending: true });
  return data ?? [];
}

export async function addProgramGalleryImage(
  programId: string,
  imageUrl: string,
  uploadedBy: string,
  caption?: string
): Promise<{ error: string | null }> {
  const { count } = await supabase
    .from('welfare_program_images')
    .select('*', { count: 'exact', head: true })
    .eq('program_id', programId);

  const { error } = await supabase.from('welfare_program_images').insert({
    program_id: programId,
    image_url: imageUrl,
    caption: caption?.trim() || null,
    sort_order: count ?? 0,
    uploaded_by: uploadedBy,
  });

  return { error: error?.message ?? null };
}

export async function deleteProgramGalleryImage(imageId: string): Promise<void> {
  await supabase.from('welfare_program_images').delete().eq('id', imageId);
}

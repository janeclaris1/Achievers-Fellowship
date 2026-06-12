import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  addProgramGalleryImage,
  deleteProgramGalleryImage,
  fetchProgramGalleryImages,
} from '../../lib/welfarePrograms';
import { uploadWelfareProgramCover, uploadWelfareProgramImage } from '../../lib/welfareGalleryImages';
import type { WelfareProgramImage } from '../../types';
import { cn } from '../../utils/cn';

interface WelfareProgramGalleryEditorProps {
  programId: string;
  userId: string;
  coverImageUrl?: string | null;
  onCoverChange: (url: string | null) => void;
}

const WelfareProgramGalleryEditor: React.FC<WelfareProgramGalleryEditorProps> = ({
  programId,
  userId,
  coverImageUrl,
  onCoverChange,
}) => {
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<WelfareProgramImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadImages = async () => {
    setLoading(true);
    const data = await fetchProgramGalleryImages(programId);
    setImages(data);
    setLoading(false);
  };

  useEffect(() => {
    void loadImages();
  }, [programId]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadWelfareProgramCover(userId, programId, file);
      const { error: updateError } = await supabase
        .from('welfare_programs')
        .update({ cover_image_url: url })
        .eq('id', programId);
      if (updateError) throw new Error(updateError.message);
      onCoverChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cover upload failed.');
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const url = await uploadWelfareProgramImage(userId, programId, file);
        const { error: insertError } = await addProgramGalleryImage(programId, url, userId);
        if (insertError) throw new Error(insertError);
      }
      await loadImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gallery upload failed.');
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleDeleteImage = async (imageId: string) => {
    await deleteProgramGalleryImage(imageId);
    await loadImages();
  };

  const handleRemoveCover = async () => {
    await supabase.from('welfare_programs').update({ cover_image_url: null }).eq('id', programId);
    onCoverChange(null);
  };

  return (
    <div className="space-y-4 border-t border-slate-100 pt-4 dark:border-slate-700">
      <div>
        <label className="label">Event gallery</label>
        <p className="text-xs text-slate-500 mb-3">
          Add a cover photo and gallery images for the welfare events page.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Cover photo</p>
        {coverImageUrl ? (
          <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            <img src={coverImageUrl} alt="Cover" className="max-h-40 w-full object-cover" />
            <button
              type="button"
              onClick={handleRemoveCover}
              className="absolute right-2 top-2 rounded-lg bg-black/50 p-1.5 text-white hover:bg-black/70"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-8 text-sm text-slate-500 hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-600"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Upload cover photo
          </button>
        )}
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
        {coverImageUrl && (
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploading}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-500"
          >
            Replace cover
          </button>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Gallery photos</p>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-slate-400" size={18} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {images.map((img) => (
              <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg">
                <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleDeleteImage(img.id)}
                  className="absolute right-1 top-1 rounded bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={uploading}
              className={cn(
                'flex aspect-square items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-400 hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-600'
              )}
            >
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={20} />}
            </button>
          </div>
        )}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleGalleryUpload}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 p-2 text-xs text-rose-600 dark:bg-rose-900/20">{error}</p>
      )}
    </div>
  );
};

export default WelfareProgramGalleryEditor;

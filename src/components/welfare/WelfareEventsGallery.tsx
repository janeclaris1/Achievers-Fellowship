import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Calendar, Images, Loader2 } from 'lucide-react';
import type { ProgramType } from '../../types';
import {
  PROGRAM_TYPE_LABELS,
  PROGRAM_TYPE_SHORT,
  fetchWelfareGalleryPrograms,
  getProgramDisplayImage,
  getProgramGalleryImages,
  type WelfareProgramWithGallery,
} from '../../lib/welfarePrograms';
import { formatDate } from '../../utils/dateUtils';
import { cn } from '../../utils/cn';
import WelfareEventBentoGallery from './WelfareEventBentoGallery';

const FILTER_TYPES: { id: ProgramType | null; label: string }[] = [
  { id: null, label: 'All events' },
  { id: 'BIRTHDAY', label: 'Birthdays' },
  { id: 'WEDDING', label: 'Weddings' },
  { id: 'BEREAVEMENT', label: 'Bereavement' },
  { id: 'HOSPITAL_VISIT', label: 'Hospital visits' },
  { id: 'SPECIAL_PROGRAM', label: 'Special' },
  { id: 'OTHER', label: 'Other' },
];

interface WelfareEventsGalleryProps {
  compact?: boolean;
}

const WelfareEventsGallery: React.FC<WelfareEventsGalleryProps> = ({ compact = false }) => {
  const [programs, setPrograms] = useState<WelfareProgramWithGallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<ProgramType | null>(null);
  const [selected, setSelected] = useState<WelfareProgramWithGallery | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    fetchWelfareGalleryPrograms(typeFilter).then((data) => {
      setPrograms(data);
      setLoading(false);
    });
  }, [typeFilter]);

  useEffect(() => {
    if (selected && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selected]);

  const selectedImages = selected ? getProgramGalleryImages(selected) : [];

  const openEvent = (program: WelfareProgramWithGallery) => {
    setSelected(program);
  };

  const closeEvent = () => {
    setSelected(null);
  };

  return (
    <section className={cn('space-y-5', compact ? '' : 'py-2')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-heading font-bold text-slate-900 dark:text-slate-100">
            <Images size={20} className="text-emerald-600" />
            Events gallery
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Birthday celebrations, wedding parties, and other welfare moments
          </p>
        </div>
      </div>

      {!selected && (
        <div className="flex flex-wrap gap-2">
          {FILTER_TYPES.map((filter) => (
            <button
              key={filter.label}
              type="button"
              onClick={() => setTypeFilter(filter.id)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                typeFilter === filter.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {selected ? (
        <div ref={detailRef} className="space-y-6">
          <button
            type="button"
            onClick={closeEvent}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-600 dark:text-emerald-300"
          >
            <ArrowLeft size={16} />
            Back to all events
          </button>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 sm:p-6">
            <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              {PROGRAM_TYPE_LABELS[selected.type]}
            </span>
            <h3 className="mt-3 text-xl font-heading font-bold text-slate-900 dark:text-slate-100">
              {selected.title}
            </h3>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
              <Calendar size={14} />
              {formatDate(selected.date)}
            </p>
            {selected.description && (
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {selected.description}
              </p>
            )}
          </div>

          <WelfareEventBentoGallery images={selectedImages} />
        </div>
      ) : loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-emerald-500" size={28} />
        </div>
      ) : programs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-700">
          <Images size={36} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-500">No gallery events yet.</p>
          <p className="mt-1 text-xs text-slate-400">
            Add photos when you complete a welfare program.
          </p>
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {programs.map((program) => {
            const imageUrl = getProgramDisplayImage(program);
            const imageCount = getProgramGalleryImages(program).length;

            return (
              <button
                key={program.id}
                type="button"
                onClick={() => openEvent(program)}
                className="group mb-4 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-left shadow-sm transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
              >
                {imageUrl ? (
                  <div className="relative overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={program.title}
                      className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    {imageCount > 1 && (
                      <span className="absolute right-2 top-2 rounded-lg bg-black/55 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                        {imageCount} photos
                      </span>
                    )}
                  </div>
                ) : null}
                <div className="p-4">
                  <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {PROGRAM_TYPE_SHORT[program.type]}
                  </span>
                  <h3 className="mt-2 font-semibold text-slate-900 dark:text-slate-100">{program.title}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar size={12} />
                    {formatDate(program.date)}
                  </p>
                  {program.description && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                      {program.description}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default WelfareEventsGallery;

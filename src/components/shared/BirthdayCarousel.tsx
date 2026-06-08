import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Cake, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { MEMBER_WITH_CELL_GROUP_SELECT } from '../../lib/memberQueries';
import BirthdayCountdown from './BirthdayCountdown';
import type { Member } from '../../types';
import { getMemberDisplayName, getMemberInitials } from '../../utils/memberUtils';
import { daysUntilBirthday, formatDate } from '../../utils/dateUtils';
import { cn } from '../../utils/cn';

interface BirthdayMember extends Member {
  daysUntil: number;
}

interface BirthdayCarouselProps {
  daysWindow?: number;
  className?: string;
}

const BirthdayCarousel: React.FC<BirthdayCarouselProps> = ({ daysWindow = 30, className }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [members, setMembers] = useState<BirthdayMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchBirthdays = async () => {
      setLoading(true);
      setError(null);

      const { data, error: qError } = await supabase
        .from('members')
        .select(MEMBER_WITH_CELL_GROUP_SELECT)
        .eq('status', 'ACTIVE');

      if (qError) {
        setError(qError.message);
        setMembers([]);
      } else {
        const upcoming = (data || [])
          .map((m: Member) => ({
            ...m,
            daysUntil: daysUntilBirthday(m.dob),
          }))
          .filter(m => m.daysUntil <= daysWindow)
          .sort((a, b) => a.daysUntil - b.daysUntil);
        setMembers(upcoming);
        setActiveIndex(0);
      }

      setLoading(false);
    };

    fetchBirthdays();
  }, [daysWindow]);

  const scrollToIndex = (index: number) => {
    const track = trackRef.current;
    if (!track || members.length === 0) return;

    const clamped = Math.max(0, Math.min(index, members.length - 1));
    const card = track.children[clamped] as HTMLElement | undefined;
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
    setActiveIndex(clamped);
  };

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track || members.length === 0) return;

    const trackCenter = track.scrollLeft + track.clientWidth / 2;
    let closest = 0;
    let closestDistance = Infinity;

    Array.from(track.children).forEach((child, i) => {
      const el = child as HTMLElement;
      const cardCenter = el.offsetLeft + el.offsetWidth / 2;
      const distance = Math.abs(cardCenter - trackCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = i;
      }
    });

    setActiveIndex(closest);
  };

  return (
    <section className={cn('card overflow-hidden min-w-0', className)}>
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
            <Cake size={14} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading font-semibold text-sm text-slate-900 dark:text-slate-100">
              Upcoming Birthdays
            </h2>
            <p className="text-[11px] text-slate-500">Next {daysWindow} days</p>
          </div>
        </div>

        {members.length > 1 && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => scrollToIndex(activeIndex - 1)}
              disabled={activeIndex === 0}
              className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous birthday"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => scrollToIndex(activeIndex + 1)}
              disabled={activeIndex >= members.length - 1}
              className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next birthday"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="p-3 min-w-0">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-slate-400 gap-2">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-xs">Loading birthdays...</span>
          </div>
        ) : error ? (
          <p className="text-xs text-rose-600 dark:text-rose-400 py-4 text-center">
            Could not load birthdays: {error}
          </p>
        ) : members.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            No upcoming birthdays in the next {daysWindow} days.
          </p>
        ) : (
          <>
            <div
              ref={trackRef}
              onScroll={handleScroll}
              className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1 -mx-0.5 px-0.5 scrollbar-thin"
            >
              {members.map(m => (
                  <article
                    key={m.id}
                    className={cn(
                      'snap-center flex-shrink-0 w-[min(100%,210px)] rounded-xl border p-2.5',
                      'bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/80',
                      'border-slate-200 dark:border-slate-700',
                      m.daysUntil === 0 && 'ring-2 ring-amber-400/60 border-amber-200 dark:border-amber-700'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      {m.photo_url ? (
                        <img
                          src={m.photo_url}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-900 dark:bg-blue-500 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                          {getMemberInitials(m)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate leading-tight">
                          {getMemberDisplayName(m)}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {(m.cell_groups as { name?: string } | undefined)?.name || '—'}
                        </p>
                        <div className="flex items-center justify-between gap-1.5 mt-1">
                          <span className="text-[11px] text-slate-400 truncate">
                            {formatDate(m.dob, 'MMM d')}
                          </span>
                          <BirthdayCountdown daysUntil={m.daysUntil} className="text-[10px] px-1.5 py-0.5" />
                        </div>
                      </div>
                    </div>
                  </article>
              ))}
            </div>

            {members.length > 1 && (
              <div className="flex justify-center gap-1 mt-2.5">
                {members.map((m, i) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => scrollToIndex(i)}
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      i === activeIndex
                        ? 'w-4 bg-amber-500'
                        : 'w-1.5 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500'
                    )}
                    aria-label={`Go to ${getMemberDisplayName(m)}`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default BirthdayCarousel;

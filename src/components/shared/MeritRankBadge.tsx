import React from 'react';
import { cn } from '../../utils/cn';

interface MeritRankBadgeProps {
  rank: number;
  className?: string;
}

const rankStyles: Record<number, string> = {
  1: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 ring-1 ring-amber-300',
  2: 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200',
  3: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
};

const MeritRankBadge: React.FC<MeritRankBadgeProps> = ({ rank, className }) => (
  <span
    className={cn(
      'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0',
      rankStyles[rank] || 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
      className
    )}
  >
    {rank}
  </span>
);

export default MeritRankBadge;

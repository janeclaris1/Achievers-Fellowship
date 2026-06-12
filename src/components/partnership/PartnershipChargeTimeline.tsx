import React from 'react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { PartnershipSubscriptionCharge } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';
import { formatGhs } from '../../utils/formatUtils';
import { cn } from '../../utils/cn';

interface PartnershipChargeTimelineProps {
  charges: PartnershipSubscriptionCharge[];
}

const PartnershipChargeTimeline: React.FC<PartnershipChargeTimelineProps> = ({ charges }) => {
  if (charges.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Recent gifts</h2>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-700/80">
        {charges.map((c, i) => {
          const isCompleted = c.status === 'COMPLETED';
          const isFailed = c.status === 'FAILED';
          return (
            <li key={c.id} className="flex items-center gap-4 px-5 py-3.5">
              <span
                className={cn(
                  'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full',
                  isCompleted && 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40',
                  isFailed && 'bg-rose-100 text-rose-600 dark:bg-rose-900/40',
                  !isCompleted && !isFailed && 'bg-amber-100 text-amber-600 dark:bg-amber-900/40'
                )}
              >
                {isCompleted ? <CheckCircle2 size={16} /> : isFailed ? <XCircle size={16} /> : <Clock size={16} />}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {formatGhs(Number(c.amount))}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {formatDateTime(c.charged_at || c.created_at)}
                </p>
              </div>
              {i === 0 && isCompleted && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Latest</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PartnershipChargeTimeline;

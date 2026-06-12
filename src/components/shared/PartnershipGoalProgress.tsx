import React from 'react';
import { Target } from 'lucide-react';
import { computeGoalProgress, GOAL_PERIOD_LABELS, type GoalPeriod } from '../../lib/partnershipSubscriptionGoals';
import type { PartnershipSubscriptionCharge } from '../../types';
import { formatGhs } from '../../utils/formatUtils';
import { cn } from '../../utils/cn';

interface PartnershipGoalProgressProps {
  goalAmount: number;
  goalPeriod: GoalPeriod;
  charges: PartnershipSubscriptionCharge[];
  className?: string;
  showSuggestion?: boolean;
  dailyAmount?: number;
}

const PartnershipGoalProgress: React.FC<PartnershipGoalProgressProps> = ({
  goalAmount,
  goalPeriod,
  charges,
  className,
  showSuggestion,
  dailyAmount,
}) => {
  const { contributed, percent, remaining, daysRemaining } = computeGoalProgress(
    charges,
    goalAmount,
    goalPeriod
  );
  const onTrack =
    dailyAmount !== undefined
      ? contributed + dailyAmount * daysRemaining >= goalAmount * 0.95
      : percent >= (100 * (daysInPeriodElapsed(goalPeriod) / daysInPeriod(goalPeriod)));

  return (
    <div className={cn('rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10 p-4 space-y-3', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <Target size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Partnership goal — {GOAL_PERIOD_LABELS[goalPeriod]}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Target {formatGhs(goalAmount)}
            </p>
          </div>
        </div>
        <span className="text-sm font-bold text-emerald-600">{Math.round(percent)}%</span>
      </div>

      <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
        <span>Contributed: <strong className="text-emerald-700 dark:text-emerald-400">{formatGhs(contributed)}</strong></span>
        <span>Remaining: <strong>{formatGhs(remaining)}</strong></span>
        <span>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left</span>
      </div>

      {showSuggestion && remaining > 0 && daysRemaining > 0 && (
        <p className="text-xs text-slate-500">
          {onTrack ? (
            <>You&apos;re on track for your {GOAL_PERIOD_LABELS[goalPeriod].toLowerCase()} goal.</>
          ) : (
            <>
              To reach your goal, partner about{' '}
              <strong className="text-emerald-700">{formatGhs(Math.ceil(remaining / daysRemaining))}</strong> per day
              for the rest of the period.
            </>
          )}
        </p>
      )}
    </div>
  );
};

function daysInPeriod(period: GoalPeriod): number {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  if (period === 'MONTHLY') return new Date(y, m + 1, 0).getDate();
  if (period === 'QUARTERLY') {
    const qStart = Math.floor(m / 3) * 3;
    const start = new Date(y, qStart, 1);
    const end = new Date(y, qStart + 3, 0);
    return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  }
  const isLeap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  return isLeap ? 366 : 365;
}

function daysInPeriodElapsed(period: GoalPeriod): number {
  const now = new Date();
  const { start } = (() => {
    const y = now.getFullYear();
    const m = now.getMonth();
    if (period === 'MONTHLY') return { start: new Date(y, m, 1) };
    if (period === 'QUARTERLY') {
      const qStart = Math.floor(m / 3) * 3;
      return { start: new Date(y, qStart, 1) };
    }
    return { start: new Date(y, 0, 1) };
  })();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  return Math.round((today.getTime() - startDay.getTime()) / 86400000) + 1;
}

export default PartnershipGoalProgress;

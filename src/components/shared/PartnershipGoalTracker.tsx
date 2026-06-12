import React, { useEffect, useState } from 'react';
import { PartyPopper, Sparkles } from 'lucide-react';
import {
  computeGoalProgress,
  computePeriodGiving,
  GOAL_PERIOD_LABELS,
  GOAL_PERIOD_OPTIONS,
  type GoalPeriod,
} from '../../lib/partnershipSubscriptionGoals';
import type { Gender, PartnershipSubscriptionCharge } from '../../types';
import { getPartnershipEsteemGreeting } from '../../utils/memberUtils';
import { formatGhs } from '../../utils/formatUtils';
import { cn } from '../../utils/cn';

export function getPartnershipCelebrationMessage(
  memberName?: string,
  hasGoal?: boolean,
  gender?: Gender | null
): string {
  const greeting = getPartnershipEsteemGreeting(memberName, gender);
  const base = `Wooshh!!!! ${greeting} Thank you for your partnership.`;
  return hasGoal
    ? `${base} You are closer to achieving your goal`
    : `${base} Every gift counts!`;
}

interface PartnershipGoalTrackerProps {
  goalAmount?: number;
  goalPeriod?: GoalPeriod;
  charges?: PartnershipSubscriptionCharge[];
  memberName?: string;
  gender?: Gender | null;
  preview?: boolean;
  celebrate?: boolean;
  onCelebrateDismiss?: () => void;
  className?: string;
}

const PartnershipGoalTracker: React.FC<PartnershipGoalTrackerProps> = ({
  goalAmount,
  goalPeriod: goalPeriodProp = 'MONTHLY',
  charges = [],
  memberName,
  gender,
  preview = false,
  celebrate = false,
  onCelebrateDismiss,
  className,
}) => {
  const [showCelebration, setShowCelebration] = useState(celebrate);
  const [trackingPeriod, setTrackingPeriod] = useState<GoalPeriod>(goalPeriodProp);

  useEffect(() => {
    if (celebrate) setShowCelebration(true);
  }, [celebrate]);

  useEffect(() => {
    setTrackingPeriod(goalPeriodProp);
  }, [goalPeriodProp]);

  const hasGoal = goalAmount != null && goalAmount > 0 && goalPeriodProp;
  const activePeriod = hasGoal ? goalPeriodProp : trackingPeriod;

  const goalProgress = hasGoal
    ? computeGoalProgress(charges, goalAmount, goalPeriodProp)
    : null;
  const periodGiving = computePeriodGiving(charges, activePeriod);

  const contributed = goalProgress?.contributed ?? periodGiving.contributed;
  const clampedPercent = hasGoal
    ? Math.min(100, Math.max(0, goalProgress!.percent))
    : 0;

  const ringRadius = 48;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeOffset = circumference - (clampedPercent / 100) * circumference;

  return (
    <aside
      className={cn(
        'overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-slate-700/80 dark:bg-slate-900/80',
        className
      )}
    >
      {showCelebration && (
        <div
          className="relative bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 px-4 py-4 text-white fade-in"
          role="status"
        >
          <Sparkles size={14} className="absolute top-3 right-3 opacity-70" />
          <PartyPopper size={18} className="mb-2 opacity-90" />
          <p className="text-xs font-bold leading-relaxed pr-4">
            {getPartnershipCelebrationMessage(memberName, !!hasGoal, gender)}
          </p>
          <button
            type="button"
            onClick={() => {
              setShowCelebration(false);
              onCelebrateDismiss?.();
            }}
            className="mt-2 text-[11px] font-semibold text-white/90 underline"
          >
            Amen!
          </button>
        </div>
      )}

      <div className="space-y-5 p-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
            {hasGoal ? 'Goal progress' : 'Your partnership'}
          </p>
          {!hasGoal && (
            <div className="mt-2 flex gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900">
              {GOAL_PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTrackingPeriod(opt.id)}
                  className={cn(
                    'flex-1 rounded-md py-1 text-[10px] font-semibold transition-colors',
                    trackingPeriod === opt.id
                      ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-500'
                  )}
                >
                  {opt.shortLabel}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative h-28 w-28 flex-shrink-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={ringRadius} fill="none" strokeWidth="8" className="stroke-slate-100 dark:stroke-slate-700" />
              <circle
                cx="60"
                cy="60"
                r={ringRadius}
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={hasGoal ? strokeOffset : contributed > 0 ? circumference * 0.15 : circumference}
                className="stroke-emerald-500 transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {hasGoal ? (
                <span className="text-xl font-bold text-emerald-600">{Math.round(clampedPercent)}%</span>
              ) : (
                <span className="text-sm font-bold text-emerald-600 text-center leading-tight px-1">
                  {formatGhs(contributed)}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-2 text-sm min-w-0">
            {hasGoal ? (
              <>
                <Stat label="Target" value={formatGhs(goalAmount!)} />
                <Stat label="Given" value={formatGhs(contributed)} highlight />
                <Stat label="Left" value={formatGhs(goalProgress!.remaining)} />
              </>
            ) : (
              <>
                <Stat label="Gifts" value={String(periodGiving.giftCount)} />
                <Stat label="All-time" value={formatGhs(periodGiving.allTimeTotal)} highlight />
                <p className="text-[10px] text-slate-400">{periodGiving.daysRemaining}d left · {GOAL_PERIOD_LABELS[activePeriod]}</p>
              </>
            )}
          </div>
        </div>

        {hasGoal && (
          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${clampedPercent}%` }}
            />
          </div>
        )}

        {preview && (
          <p className="text-[11px] text-center text-slate-400 leading-relaxed">
            Updates live after each gift.
          </p>
        )}
      </div>
    </aside>
  );
};

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-400 text-xs">{label}</span>
      <span className={cn('font-semibold text-xs truncate', highlight ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-100')}>
        {value}
      </span>
    </div>
  );
}

export default PartnershipGoalTracker;

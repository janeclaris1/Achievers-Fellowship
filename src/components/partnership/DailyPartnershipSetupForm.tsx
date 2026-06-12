import React, { useState } from 'react';
import { ChevronDown, HandHeart, Loader2, ShieldCheck, Target } from 'lucide-react';
import {
  GOAL_PERIOD_OPTIONS,
  type GoalPeriod,
} from '../../lib/partnershipSubscriptionGoals';
import { WELFARE_PARTNERSHIP_ARMS } from '../../lib/welfarePartnershipArms';
import { formatGhs } from '../../utils/formatUtils';
import { cn } from '../../utils/cn';

const PRESET_DAILY = [5, 10, 20, 50, 100];
const PRESET_GOALS: Record<GoalPeriod, number[]> = {
  MONTHLY: [100, 300, 500, 1000],
  QUARTERLY: [500, 1500, 3000, 5000],
  YEARLY: [2000, 5000, 10000, 20000],
};

interface DailyPartnershipSetupFormProps {
  partnershipArm: string;
  dailyAmount: string;
  selectedPreset: number | null;
  onDailyChange: (value: string, preset: number | null) => void;
  setGoal: boolean;
  onSetGoalChange: (value: boolean) => void;
  goalAmount: string;
  goalPeriod: GoalPeriod;
  onGoalAmountChange: (value: string) => void;
  onGoalPeriodChange: (period: GoalPeriod) => void;
  suggestedDaily: number | null;
  onApplySuggestedDaily: () => void;
  parsedDaily: number;
  error: string | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const DailyPartnershipSetupForm: React.FC<DailyPartnershipSetupFormProps> = ({
  partnershipArm,
  dailyAmount,
  selectedPreset,
  onDailyChange,
  setGoal,
  onSetGoalChange,
  goalAmount,
  goalPeriod,
  onGoalAmountChange,
  onGoalPeriodChange,
  suggestedDaily,
  onApplySuggestedDaily,
  parsedDaily,
  error,
  loading,
  onSubmit,
}) => {
  const [goalOpen, setGoalOpen] = useState(setGoal);

  const toggleGoal = () => {
    const next = !goalOpen;
    setGoalOpen(next);
    onSetGoalChange(next);
  };

  const selectedArm = WELFARE_PARTNERSHIP_ARMS.find((a) => a.id === partnershipArm);

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 dark:border-slate-700/60 dark:bg-slate-900/30 sm:p-6">
        <div className="mb-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">Step 2</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Your daily partnership
          </h2>
          <p className="mt-1 text-sm text-slate-500">Charged automatically each morning via Paystack.</p>
        </div>

        <div className="flex flex-wrap gap-2.5 mb-5">
          {PRESET_DAILY.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onDailyChange('', preset)}
              className={cn(
                'min-w-[4.75rem] rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200',
                selectedPreset === preset
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-emerald-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600'
              )}
            >
              {formatGhs(preset)}
            </button>
          ))}
        </div>

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">GHS</span>
          <input
            type="number"
            min="1"
            step="1"
            className="input h-12 w-full rounded-2xl border-slate-200 bg-white pl-14 text-lg font-semibold dark:border-slate-600 dark:bg-slate-800"
            placeholder="Custom amount"
            value={dailyAmount}
            onChange={(e) => onDailyChange(e.target.value, null)}
          />
        </div>

        {parsedDaily >= 1 && selectedArm && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-emerald-50/80 px-4 py-3 dark:bg-emerald-950/30">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <HandHeart size={16} />
            </span>
            <p className="text-sm text-slate-700 dark:text-slate-200">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">{formatGhs(parsedDaily)}</span>
              {' '}daily for <span className="font-medium">{selectedArm.name}</span>
            </p>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-700">
        <button
          type="button"
          onClick={toggleGoal}
          className="flex w-full items-center justify-between gap-3 bg-white px-5 py-4 text-left transition-colors hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
              <Target size={18} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                Step 3 — Partnership goal
              </span>
              <span className="text-xs text-slate-400">Optional target for the month, quarter, or year</span>
            </span>
          </span>
          <ChevronDown
            size={18}
            className={cn('flex-shrink-0 text-slate-400 transition-transform duration-200', goalOpen && 'rotate-180')}
          />
        </button>

        {goalOpen && (
          <div className="space-y-4 border-t border-slate-100 bg-slate-50/50 px-5 pb-5 pt-4 dark:border-slate-700 dark:bg-slate-900/20">
            <div className="flex gap-1 rounded-xl bg-white p-1 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
              {GOAL_PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onGoalPeriodChange(opt.id);
                    onGoalAmountChange('');
                  }}
                  className={cn(
                    'flex-1 rounded-lg py-2 text-xs font-semibold transition-colors',
                    goalPeriod === opt.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  )}
                >
                  {opt.shortLabel}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {PRESET_GOALS[goalPeriod].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onGoalAmountChange(String(preset))}
                  className={cn(
                    'rounded-xl py-2.5 text-sm font-semibold border transition-all',
                    Number(goalAmount) === preset
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm dark:bg-emerald-950/40'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  )}
                >
                  {formatGhs(preset)}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              className="input w-full rounded-xl"
              placeholder="Custom goal amount (GHS)"
              value={goalAmount}
              onChange={(e) => onGoalAmountChange(e.target.value)}
            />
            {suggestedDaily && (
              <button
                type="button"
                onClick={onApplySuggestedDaily}
                className="w-full rounded-xl border border-dashed border-emerald-300 py-2.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
              >
                Suggested daily: {formatGhs(suggestedDaily)} to reach your goal
              </button>
            )}
          </div>
        )}
      </section>

      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:bg-rose-900/20">{error}</p>
      )}

      <div className="space-y-3">
        <button
          type="submit"
          disabled={loading || parsedDaily < 1}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 py-4 text-sm font-semibold text-white shadow-xl shadow-emerald-600/20 transition-all hover:shadow-emerald-600/30 disabled:opacity-50 disabled:shadow-none"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <HandHeart size={18} />}
          Begin daily partnership
        </button>
        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
          <ShieldCheck size={12} />
          Secure card setup via Paystack · Cancel anytime
        </p>
      </div>
    </form>
  );
};

export default DailyPartnershipSetupForm;

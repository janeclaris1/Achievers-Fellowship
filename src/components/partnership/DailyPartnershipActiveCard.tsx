import React from 'react';
import { Calendar, Loader2, Pause, Play, Target, XCircle, Zap } from 'lucide-react';
import { GOAL_PERIOD_OPTIONS } from '../../lib/partnershipSubscriptionGoals';
import { getPartnershipArmName } from '../../lib/welfarePartnershipArms';
import type { GoalPeriod } from '../../lib/partnershipSubscriptionGoals';
import type { PartnershipSubscription } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';
import { formatGhs } from '../../utils/formatUtils';
import { cn } from '../../utils/cn';
import { SUBSCRIPTION_STATUS_LABELS } from '../../lib/partnershipSubscription';

const statusStyles: Record<string, string> = {
  PENDING_SETUP: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  ACTIVE: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  PAUSED: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
  CANCELLED: 'bg-slate-500/15 text-slate-500',
  FAILED: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
};

interface DailyPartnershipActiveCardProps {
  subscription: PartnershipSubscription;
  editingGoal: boolean;
  editGoalAmount: string;
  editGoalPeriod: GoalPeriod;
  onEditGoalPeriodChange: (p: GoalPeriod) => void;
  onEditGoalAmountChange: (v: string) => void;
  onStartEditGoal: () => void;
  onSaveGoal: () => void;
  onClearGoal: () => void;
  onCancelEditGoal: () => void;
  goalLoading: boolean;
  actionLoading: boolean;
  error: string | null;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

const DailyPartnershipActiveCard: React.FC<DailyPartnershipActiveCardProps> = ({
  subscription,
  editingGoal,
  editGoalAmount,
  editGoalPeriod,
  onEditGoalPeriodChange,
  onEditGoalAmountChange,
  onStartEditGoal,
  onSaveGoal,
  onClearGoal,
  onCancelEditGoal,
  goalLoading,
  actionLoading,
  error,
  onPause,
  onResume,
  onCancel,
}) => (
  <div className="space-y-6">
    {/* Hero amount strip */}
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
              statusStyles[subscription.status]
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {SUBSCRIPTION_STATUS_LABELS[subscription.status] ?? subscription.status}
          </span>
          <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {formatGhs(Number(subscription.daily_amount))}
            <span className="text-lg font-normal text-slate-400"> /day</span>
          </p>
          {subscription.partnership_arm && (
            <p className="mt-1 text-sm text-slate-500">
              {getPartnershipArmName(subscription.partnership_arm)}
            </p>
          )}
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
          <Zap size={24} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {subscription.next_charge_at && subscription.status === 'ACTIVE' && (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 px-3 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Next charge</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1">
              <Calendar size={12} className="text-emerald-500" />
              {subscription.next_charge_at}
            </p>
          </div>
        )}
        {subscription.last_charged_at && (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 px-3 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Last gift</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {formatDateTime(subscription.last_charged_at)}
            </p>
          </div>
        )}
        {subscription.started_at && (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 px-3 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Since</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {formatDateTime(subscription.started_at)}
            </p>
          </div>
        )}
      </div>
    </div>

    {/* Goal */}
    {editingGoal ? (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Target size={16} className="text-emerald-600" />
          {subscription.goal_amount ? 'Update goal' : 'Set a goal'}
        </p>
        <div className="flex gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
          {GOAL_PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onEditGoalPeriodChange(opt.id)}
              className={cn(
                'flex-1 rounded-md py-1.5 text-xs font-medium',
                editGoalPeriod === opt.id
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-700'
                  : 'text-slate-500'
              )}
            >
              {opt.shortLabel}
            </button>
          ))}
        </div>
        <input
          type="number"
          min="1"
          className="input w-full rounded-xl"
          placeholder="Goal amount (GHS)"
          value={editGoalAmount}
          onChange={(e) => onEditGoalAmountChange(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onSaveGoal} disabled={goalLoading} className="btn-primary text-sm rounded-xl">
            Save
          </button>
          <button type="button" onClick={onCancelEditGoal} className="btn-secondary text-sm rounded-xl">
            Cancel
          </button>
          {subscription.goal_amount && (
            <button type="button" onClick={onClearGoal} disabled={goalLoading} className="btn-secondary text-sm text-rose-600 rounded-xl">
              Remove
            </button>
          )}
        </div>
      </div>
    ) : (
      <button
        type="button"
        onClick={onStartEditGoal}
        className="flex w-full items-center justify-between rounded-xl border border-dashed border-slate-300 dark:border-slate-600 px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Target size={16} />
          {subscription.goal_amount ? 'Edit partnership goal' : 'Set a partnership goal'}
        </span>
        <span className="text-xs text-slate-400">Optional</span>
      </button>
    )}

    {subscription.status === 'PAUSED' && (
      <p className="text-sm text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 rounded-xl">
        Paused — resume when you&apos;re ready to continue daily giving.
      </p>
    )}

    {error && (
      <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-4 py-3 rounded-xl">{error}</p>
    )}

    {/* Actions */}
    <div className="flex flex-wrap gap-2">
      {subscription.status === 'ACTIVE' && (
        <button
          type="button"
          onClick={onPause}
          disabled={actionLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Pause size={16} />}
          Pause
        </button>
      )}
      {subscription.status === 'PAUSED' && (
        <button
          type="button"
          onClick={onResume}
          disabled={actionLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
        >
          {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
          Resume
        </button>
      )}
      {['ACTIVE', 'PAUSED', 'PENDING_SETUP'].includes(subscription.status) && (
        <button
          type="button"
          onClick={onCancel}
          disabled={actionLoading}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
        >
          <XCircle size={16} />
          Cancel
        </button>
      )}
    </div>
  </div>
);

export default DailyPartnershipActiveCard;

import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Loader2, Pause, Play, XCircle } from 'lucide-react';
import {
  fetchAllPartnershipSubscriptions,
  fetchSubscriptionCharges,
  managePartnershipSubscription,
  SUBSCRIPTION_STATUS_LABELS,
} from '../../lib/partnershipSubscription';
import PartnershipGoalProgress from '../../components/shared/PartnershipGoalProgress';
import { GOAL_PERIOD_LABELS } from '../../lib/partnershipSubscriptionGoals';
import { getPartnershipArmName } from '../../lib/welfarePartnershipArms';
import type { PartnershipSubscription, PartnershipSubscriptionCharge } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';
import { formatGhs } from '../../utils/formatUtils';
import { cn } from '../../utils/cn';

const statusColors: Record<string, string> = {
  PENDING_SETUP: 'bg-amber-100 text-amber-800',
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  PAUSED: 'bg-slate-100 text-slate-700',
  CANCELLED: 'bg-slate-100 text-slate-600',
  FAILED: 'bg-rose-100 text-rose-800',
};

const PartnershipSubscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<PartnershipSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [charges, setCharges] = useState<PartnershipSubscriptionCharge[]>([]);
  const [chargesLoading, setChargesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchAllPartnershipSubscriptions().then(({ data }) => {
      setSubscriptions(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setCharges([]);
      return;
    }
    setChargesLoading(true);
    fetchSubscriptionCharges(selectedId).then(({ data }) => {
      setCharges(data);
      setChargesLoading(false);
    });
  }, [selectedId]);

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return subscriptions;
    return subscriptions.filter((s) => s.status === statusFilter);
  }, [subscriptions, statusFilter]);

  const stats = useMemo(() => {
    const active = subscriptions.filter((s) => s.status === 'ACTIVE');
    const dailyTotal = active.reduce((sum, s) => sum + Number(s.daily_amount), 0);
    return {
      activeCount: active.length,
      dailyTotal,
      paused: subscriptions.filter((s) => s.status === 'PAUSED').length,
    };
  }, [subscriptions]);

  const handleStaffAction = async (subscriptionId: string, action: 'pause' | 'resume' | 'cancel') => {
    setActionLoading(true);
    const result = await managePartnershipSubscription({ subscription_id: subscriptionId, action });
    setActionLoading(false);
    if (result.subscription) {
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === subscriptionId ? result.subscription! : s))
      );
    }
  };

  const selected = subscriptions.find((s) => s.id === selectedId);

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <CalendarClock size={22} className="text-emerald-600" />
          Partnership Subscriptions
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Daily recurring partnerships — manage subscribers and view charge history
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-sm text-slate-500">Active subscribers</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.activeCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500">Daily commitment (active)</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatGhs(stats.dailyTotal)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500">Paused</p>
          <p className="text-2xl font-bold text-slate-600 mt-1">{stats.paused}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['ALL', 'ACTIVE', 'PAUSED', 'PENDING_SETUP', 'CANCELLED', 'FAILED'].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              statusFilter === status
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
            )}
          >
            {status === 'ALL' ? 'All' : SUBSCRIPTION_STATUS_LABELS[status] ?? status}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Subscribers</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-400">No subscriptions found.</p>
          ) : (
            <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white dark:bg-slate-800">
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-100 dark:border-slate-700">
                    <th className="px-5 py-3 font-medium">Partner</th>
                    <th className="px-5 py-3 font-medium">Daily</th>
                    <th className="px-5 py-3 font-medium">Arm</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedId(s.id)}
                      className={cn(
                        'border-b border-slate-50 dark:border-slate-800 last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50',
                        selectedId === s.id && 'bg-emerald-50 dark:bg-emerald-900/10'
                      )}
                    >
                      <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">
                        {s.profiles?.full_name || s.payer_email}
                      </td>
                      <td className="px-5 py-3 text-emerald-700 dark:text-emerald-400 font-medium">
                        {formatGhs(Number(s.daily_amount))}
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {getPartnershipArmName(s.partnership_arm) || '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn('badge text-[10px]', statusColors[s.status])}>
                          {SUBSCRIPTION_STATUS_LABELS[s.status] ?? s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">
              {selected ? `${selected.profiles?.full_name || 'Subscriber'} — details` : 'Select a subscriber'}
            </h2>
          </div>
          {!selected ? (
            <p className="p-8 text-center text-sm text-slate-400">Click a row to view charge history.</p>
          ) : (
            <div className="p-5 space-y-4">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-slate-500">Daily amount</dt>
                  <dd className="font-medium">{formatGhs(Number(selected.daily_amount))}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Status</dt>
                  <dd>
                    <span className={cn('badge text-[10px]', statusColors[selected.status])}>
                      {SUBSCRIPTION_STATUS_LABELS[selected.status]}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Next charge</dt>
                  <dd className="font-medium">{selected.next_charge_at || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Failures</dt>
                  <dd className="font-medium">{selected.consecutive_failures}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-500">Email</dt>
                  <dd className="font-medium">{selected.payer_email}</dd>
                </div>
                {selected.goal_amount && selected.goal_period && (
                  <div className="col-span-2">
                    <dt className="text-slate-500">Goal</dt>
                    <dd className="font-medium">
                      {GOAL_PERIOD_LABELS[selected.goal_period]} — target set
                    </dd>
                  </div>
                )}
              </dl>

              {selected.goal_amount && selected.goal_period && (
                <PartnershipGoalProgress
                  goalAmount={Number(selected.goal_amount)}
                  goalPeriod={selected.goal_period}
                  charges={charges}
                  dailyAmount={Number(selected.daily_amount)}
                />
              )}

              <div className="flex flex-wrap gap-2">
                {selected.status === 'ACTIVE' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleStaffAction(selected.id, 'pause')}
                    className="btn-secondary text-xs flex items-center gap-1"
                  >
                    <Pause size={14} /> Pause
                  </button>
                )}
                {selected.status === 'PAUSED' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleStaffAction(selected.id, 'resume')}
                    className="btn-primary text-xs flex items-center gap-1"
                  >
                    <Play size={14} /> Resume
                  </button>
                )}
                {['ACTIVE', 'PAUSED'].includes(selected.status) && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleStaffAction(selected.id, 'cancel')}
                    className="btn-secondary text-xs text-rose-600 flex items-center gap-1"
                  >
                    <XCircle size={14} /> Cancel
                  </button>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Charges</h3>
                {chargesLoading ? (
                  <Loader2 className="animate-spin text-slate-400" size={20} />
                ) : charges.length === 0 ? (
                  <p className="text-sm text-slate-400">No charges yet.</p>
                ) : (
                  <ul className="space-y-2 max-h-48 overflow-y-auto text-sm">
                    {charges.map((c) => (
                      <li
                        key={c.id}
                        className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-slate-800 last:border-0"
                      >
                        <span className="text-slate-500">
                          {formatDateTime(c.charged_at || c.created_at)}
                        </span>
                        <span className="font-medium text-emerald-700">{formatGhs(Number(c.amount))}</span>
                        <span className={cn('badge text-[10px]', c.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800')}>
                          {c.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnershipSubscriptions;

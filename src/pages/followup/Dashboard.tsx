import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import StatCard from '../../components/shared/StatCard';
import PortalWelcomeHeader from '../../components/shared/PortalWelcomeHeader';
import EventsProgramsCard from '../../components/shared/EventsProgramsCard';
import ReflectionsCard from '../../components/shared/ReflectionsCard';
import { supabase } from '../../lib/supabase';
import type { FollowUp } from '../../types';
import { getMemberDisplayName } from '../../utils/memberUtils';
import { formatDateTime } from '../../utils/dateUtils';
import { cn } from '../../utils/cn';

const typeIcons: Record<string, string> = { CALL: '📞', MESSAGE: '💬', VISIT: '🏠' };
const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  NO_ANSWER: 'bg-rose-100 text-rose-700',
  RESCHEDULED: 'bg-blue-100 text-blue-700',
};

const FollowUpDashboard: React.FC = () => {
  const [pending, setPending] = useState<FollowUp[]>([]);
  const [completedThisWeek, setCompletedThisWeek] = useState(0);
  const [overdue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);

    Promise.all([
      supabase.from('follow_ups').select('*, members(id, first_name, last_name, gender, phone)').eq('status', 'PENDING').order('created_at', { ascending: false }).limit(10),
      supabase.from('follow_ups').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED').gte('completed_at', weekAgo.toISOString()),
    ]).then(([{ data: p }, { count: cw }]) => {
      setPending(p || []);
      setCompletedThisWeek(cw || 0);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 fade-in">
      <PortalWelcomeHeader subtitle="Track and manage member follow-up activities" />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Pending Follow-ups" value={loading ? '—' : pending.length} icon={<Clock size={20} />} color="amber" />
        <StatCard label="Completed This Week" value={loading ? '—' : completedThisWeek} icon={<CheckCircle size={20} />} color="green" />
        <StatCard label="Needs Attention" value={loading ? '—' : overdue} icon={<AlertCircle size={20} />} color="rose" />
      </div>

      <EventsProgramsCard role="FOLLOWUP" />
      <ReflectionsCard role="FOLLOWUP" />

      <div className="card p-5">
        <h3 className="font-heading font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">
          Pending Follow-ups
        </h3>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />)}</div>
        ) : pending.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">No pending follow-ups — great job!</div>
        ) : (
          <div className="space-y-2">
            {pending.map(fu => (
              <div key={fu.id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-[8px]">
                <span className="text-lg flex-shrink-0">{typeIcons[fu.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {fu.members ? getMemberDisplayName(fu.members) : '—'}
                    </p>
                    <span className={cn('badge text-[10px]', statusColors[fu.status])}>{fu.status}</span>
                  </div>
                  {fu.notes && <p className="text-xs text-slate-400 mt-0.5 truncate">{fu.notes}</p>}
                  <p className="text-xs text-slate-400">{formatDateTime(fu.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowUpDashboard;

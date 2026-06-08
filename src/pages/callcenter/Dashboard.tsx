import React, { useEffect, useState } from 'react';
import { Phone, Clock, PhoneCall } from 'lucide-react';
import StatCard from '../../components/shared/StatCard';
import PortalWelcomeHeader from '../../components/shared/PortalWelcomeHeader';
import WelfarePartnershipBanner from '../../components/shared/WelfarePartnershipBanner';
import EventsProgramsCard from '../../components/shared/EventsProgramsCard';
import ReflectionsCard from '../../components/shared/ReflectionsCard';
import { supabase } from '../../lib/supabase';
import { getMemberDisplayName } from '../../utils/memberUtils';
import { formatDateTime } from '../../utils/dateUtils';
import type { FollowUp } from '../../types';

const CallCenterDashboard: React.FC = () => {
  const [callsToday, setCallsToday] = useState(0);
  const [pending, setPending] = useState(0);
  const [recentCalls, setRecentCalls] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    Promise.all([
      supabase.from('follow_ups').select('*', { count: 'exact', head: true }).eq('type', 'CALL').gte('created_at', today.toISOString()),
      supabase.from('follow_ups').select('*', { count: 'exact', head: true }).eq('type', 'CALL').eq('status', 'PENDING'),
      supabase.from('follow_ups').select('*, members(id, first_name, last_name, gender, phone)')
        .eq('type', 'CALL').order('created_at', { ascending: false }).limit(8),
    ]).then(([{ count: ct }, { count: p }, { data: rc }]) => {
      setCallsToday(ct || 0);
      setPending(p || 0);
      setRecentCalls(rc || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 fade-in">
      <PortalWelcomeHeader subtitle="Member outreach and communication hub" />

      <WelfarePartnershipBanner />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Calls Today" value={loading ? '—' : callsToday} icon={<Phone size={20} />} color="blue" />
        <StatCard label="Pending Callbacks" value={loading ? '—' : pending} icon={<Clock size={20} />} color="amber" />
        <StatCard label="Avg Duration" value="—" icon={<PhoneCall size={20} />} color="green" />
      </div>

      <EventsProgramsCard role="CALL_CENTER" />
      <ReflectionsCard role="CALL_CENTER" />

      <div className="card p-5">
        <h3 className="font-heading font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">Recent Calls</h3>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />)}</div>
        ) : recentCalls.length === 0 ? (
          <p className="text-sm text-slate-400 py-4">No calls logged yet today.</p>
        ) : (
          <div className="space-y-2">
            {recentCalls.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-[8px]">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                  <Phone size={14} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {c.members ? getMemberDisplayName(c.members) : '—'}
                  </p>
                  <p className="text-xs text-slate-400">{formatDateTime(c.created_at)} · {c.status}</p>
                </div>
                {c.duration_sec && (
                  <span className="text-xs text-slate-400">{Math.floor(c.duration_sec / 60)}m</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CallCenterDashboard;

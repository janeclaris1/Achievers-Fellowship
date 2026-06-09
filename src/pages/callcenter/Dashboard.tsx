import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Clock, MessageSquare, PhoneCall, History, Inbox, ChevronRight } from 'lucide-react';
import { channelLabel } from '../../lib/callCenter';
import type { OutreachChannel } from '../../types';
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
  const [activitiesToday, setActivitiesToday] = useState(0);
  const [pending, setPending] = useState(0);
  const [recentActivities, setRecentActivities] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    Promise.all([
      supabase.from('follow_ups').select('*', { count: 'exact', head: true }).in('type', ['CALL', 'MESSAGE']).gte('created_at', today.toISOString()),
      supabase.from('follow_ups').select('*', { count: 'exact', head: true }).in('type', ['CALL', 'MESSAGE']).eq('status', 'PENDING'),
      supabase.from('follow_ups').select('*, members(id, first_name, last_name, gender, phone)')
        .in('type', ['CALL', 'MESSAGE']).order('created_at', { ascending: false }).limit(8),
    ]).then(([{ count: ct }, { count: p }, { data: rc }]) => {
      setActivitiesToday(ct || 0);
      setPending(p || 0);
      setRecentActivities(rc || []);
      setLoading(false);
    });
  }, []);

  const activityChannel = (row: FollowUp): OutreachChannel =>
    row.channel || (row.type === 'CALL' ? 'PHONE' : 'SMS');

  return (
    <div className="space-y-6 fade-in">
      <PortalWelcomeHeader subtitle="Member outreach and communication hub" />

      <WelfarePartnershipBanner />

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          to="/callcenter/outreach"
          className="card p-4 hover:shadow-md transition-shadow group flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-[8px] bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <PhoneCall size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Member Outreach</p>
            <p className="text-xs text-slate-500">Call, SMS & WhatsApp</p>
          </div>
          <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600" />
        </Link>
        <Link
          to="/callcenter/history"
          className="card p-4 hover:shadow-md transition-shadow group flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-[8px] bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <History size={20} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Activity Log</p>
            <p className="text-xs text-slate-500">All outreach history</p>
          </div>
          <ChevronRight size={16} className="text-slate-400 group-hover:text-violet-600" />
        </Link>
        <Link
          to="/callcenter/bulk-sms"
          className="card p-4 hover:shadow-md transition-shadow group flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-[8px] bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Inbox size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Bulk Messaging</p>
            <p className="text-xs text-slate-500">SMS & WhatsApp blasts</p>
          </div>
          <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-600" />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Outreach Today" value={loading ? '—' : activitiesToday} icon={<Phone size={20} />} color="blue" />
        <StatCard label="Pending Follow-ups" value={loading ? '—' : pending} icon={<Clock size={20} />} color="amber" />
        <StatCard label="Messages & Calls" value={loading ? '—' : recentActivities.length} icon={<MessageSquare size={20} />} color="green" />
      </div>

      <EventsProgramsCard role="CALL_CENTER" />
      <ReflectionsCard role="CALL_CENTER" />

      <div className="card p-5">
        <h3 className="font-heading font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">Recent Activity</h3>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />)}</div>
        ) : recentActivities.length === 0 ? (
          <p className="text-sm text-slate-400 py-4">No outreach logged yet.</p>
        ) : (
          <div className="space-y-2">
            {recentActivities.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-[8px]">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                  {activityChannel(c) === 'PHONE' ? (
                    <Phone size={14} className="text-blue-600 dark:text-blue-400" />
                  ) : (
                    <MessageSquare size={14} className="text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {c.members ? getMemberDisplayName(c.members) : '—'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDateTime(c.created_at)} · {channelLabel(activityChannel(c))} · {c.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CallCenterDashboard;

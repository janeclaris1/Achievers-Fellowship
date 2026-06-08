import React, { useEffect, useState } from 'react';
import { Users, UserCheck, Calendar, Activity } from 'lucide-react';
import StatCard from '../../components/shared/StatCard';
import BirthdayCountdown from '../../components/shared/BirthdayCountdown';
import PortalWelcomeHeader from '../../components/shared/PortalWelcomeHeader';
import EventsProgramsCard from '../../components/shared/EventsProgramsCard';
import ReflectionsCard from '../../components/shared/ReflectionsCard';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Member, FollowUp } from '../../types';
import { getMemberDisplayName } from '../../utils/memberUtils';
import { daysUntilBirthday, formatDate, formatDateTime } from '../../utils/dateUtils';

const SCLDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<Member[]>([]);
  const [recentFollowUps, setRecentFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.cell_group_id) return;

    const fetchData = async () => {
    const [{ data: m }] = await Promise.all([
      supabase.from('members').select('*').eq('cell_group_id', profile.cell_group_id!).eq('status', 'ACTIVE'),
    ]);

      const memberList = m || [];
      setMembers(memberList);

      const birthdays = memberList
        .filter(mem => daysUntilBirthday(mem.dob) <= 30)
        .sort((a, b) => daysUntilBirthday(a.dob) - daysUntilBirthday(b.dob))
        .slice(0, 5);
      setUpcomingBirthdays(birthdays);

      if (memberList.length > 0) {
        const { data: fuData } = await supabase
          .from('follow_ups')
          .select('*, members(*), profiles(full_name)')
          .in('member_id', memberList.map(m => m.id))
          .order('created_at', { ascending: false })
          .limit(5);
        setRecentFollowUps(fuData || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [profile]);

  const activeCount = members.filter(m => m.status === 'ACTIVE').length;

  return (
    <div className="space-y-6 fade-in">
      <PortalWelcomeHeader subtitle="Your senior cell overview" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Members" value={members.length} icon={<Users size={20} />} color="blue" />
        <StatCard label="Active Members" value={activeCount} icon={<UserCheck size={20} />} color="green" />
        <StatCard label="Upcoming Birthdays" value={upcomingBirthdays.filter(m => daysUntilBirthday(m.dob) <= 7).length} icon={<Calendar size={20} />} color="amber" />
        <StatCard label="Recent Follow-ups" value={recentFollowUps.length} icon={<Activity size={20} />} color="purple" />
      </div>

      <EventsProgramsCard role="SCL" />
      <ReflectionsCard role="SCL" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming Birthdays */}
        <div className="card p-5">
          <h3 className="font-heading font-semibold text-sm mb-4 text-slate-700 dark:text-slate-200">
            Upcoming Birthdays
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />)}
            </div>
          ) : upcomingBirthdays.length === 0 ? (
            <p className="text-sm text-slate-400">No upcoming birthdays in the next 30 days.</p>
          ) : (
            <div className="space-y-3">
              {upcomingBirthdays.map(m => {
                const days = daysUntilBirthday(m.dob);
                return (
                  <div key={m.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{getMemberDisplayName(m)}</p>
                      <p className="text-xs text-slate-400">{m.phone} · {formatDate(m.dob, 'MMM d')}</p>
                    </div>
                    <BirthdayCountdown daysUntil={days} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Follow-ups */}
        <div className="card p-5">
          <h3 className="font-heading font-semibold text-sm mb-4 text-slate-700 dark:text-slate-200">
            Recent Follow-ups on Your Members
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />)}
            </div>
          ) : recentFollowUps.length === 0 ? (
            <p className="text-sm text-slate-400">No follow-ups recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentFollowUps.map(fu => (
                <div key={fu.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                  <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                    fu.status === 'COMPLETED' ? 'bg-emerald-500' :
                    fu.status === 'PENDING' ? 'bg-amber-500' : 'bg-slate-300'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {fu.members ? getMemberDisplayName(fu.members) : '—'}
                    </p>
                    <p className="text-xs text-slate-400">{fu.type} · {fu.status} · {formatDateTime(fu.created_at)}</p>
                    {fu.notes && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{fu.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SCLDashboard;

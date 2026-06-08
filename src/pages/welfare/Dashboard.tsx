import React, { useEffect, useState } from 'react';
import { Calendar, BookOpen, Activity, Users } from 'lucide-react';
import StatCard from '../../components/shared/StatCard';
import BirthdayCountdown from '../../components/shared/BirthdayCountdown';
import PortalWelcomeHeader from '../../components/shared/PortalWelcomeHeader';
import EventsProgramsCard from '../../components/shared/EventsProgramsCard';
import ReflectionsCard from '../../components/shared/ReflectionsCard';
import { supabase } from '../../lib/supabase';
import type { Member, WelfareProgram } from '../../types';
import { getMemberDisplayName } from '../../utils/memberUtils';
import { daysUntilBirthday, formatDate } from '../../utils/dateUtils';

const WelfareDashboard: React.FC = () => {
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<Member[]>([]);
  const [activePrograms, setActivePrograms] = useState<WelfareProgram[]>([]);
  const [openPrayers, setOpenPrayers] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('members').select('*').eq('status', 'ACTIVE'),
      supabase.from('welfare_programs').select('*').in('status', ['PLANNED', 'IN_PROGRESS']).order('date').limit(5),
      supabase.from('prayer_requests').select('*', { count: 'exact', head: true }).eq('status', 'OPEN'),
    ]).then(([{ data: m }, { data: wp }, { count: pr }]) => {
      const members = m || [];
      setTotalMembers(members.length);

      const birthdays = members
        .filter(mem => daysUntilBirthday(mem.dob) <= 7)
        .sort((a, b) => daysUntilBirthday(a.dob) - daysUntilBirthday(b.dob));
      setUpcomingBirthdays(birthdays);
      setActivePrograms(wp || []);
      setOpenPrayers(pr || 0);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 fade-in">
      <PortalWelcomeHeader subtitle="Pastoral care and member welfare overview" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Members" value={loading ? '—' : totalMembers} icon={<Users size={20} />} color="blue" />
        <StatCard label="Birthdays This Week" value={loading ? '—' : upcomingBirthdays.length} icon={<Calendar size={20} />} color="amber" />
        <StatCard label="Active Programs" value={loading ? '—' : activePrograms.length} icon={<Activity size={20} />} color="green" />
        <StatCard label="Open Prayer Requests" value={loading ? '—' : openPrayers} icon={<BookOpen size={20} />} color="purple" />
      </div>

      <EventsProgramsCard role="WELFARE" />
      <ReflectionsCard role="WELFARE" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Upcoming Birthdays */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-sm text-slate-700 dark:text-slate-200">
              Birthdays This Week
            </h3>
            <a href="/welfare/birthdays" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              View all
            </a>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />)}</div>
          ) : upcomingBirthdays.length === 0 ? (
            <p className="text-sm text-slate-400 py-4">No birthdays in the next 7 days.</p>
          ) : (
            <div className="space-y-3">
              {upcomingBirthdays.map(m => {
                const days = daysUntilBirthday(m.dob);
                return (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{getMemberDisplayName(m)}</p>
                      <p className="text-xs text-slate-400">{m.phone}</p>
                    </div>
                    <BirthdayCountdown daysUntil={days} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Programs */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-sm text-slate-700 dark:text-slate-200">Active Programs</h3>
            <a href="/welfare/programs" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View all</a>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-14 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />)}</div>
          ) : activePrograms.length === 0 ? (
            <p className="text-sm text-slate-400 py-4">No active welfare programs.</p>
          ) : (
            <div className="space-y-3">
              {activePrograms.map(p => (
                <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-[8px]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{p.title}</p>
                      <p className="text-xs text-slate-400">{p.type.replace('_', ' ')} · {formatDate(p.date)}</p>
                    </div>
                    <span className={`badge text-xs ${
                      p.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {p.status.replace('_', ' ')}
                    </span>
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

export default WelfareDashboard;

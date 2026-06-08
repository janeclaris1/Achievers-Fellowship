import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Building2, Heart, TrendingUp, Calendar, Activity,
  Trophy, HandCoins, ChevronRight, Loader2
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import StatCard from '../../components/shared/StatCard';
import MeritRankBadge from '../../components/shared/MeritRankBadge';
import PortalWelcomeHeader from '../../components/shared/PortalWelcomeHeader';
import WelfarePartnershipBanner from '../../components/shared/WelfarePartnershipBanner';
import EventsProgramsCard from '../../components/shared/EventsProgramsCard';
import ReflectionsCard from '../../components/shared/ReflectionsCard';
import { supabase } from '../../lib/supabase';
import {
  fetchTopSoulWinners,
  fetchWeeklyPartnershipRanks,
} from '../../lib/engagementQueries';
import { daysUntilBirthday, formatWeekRange, getWeekStart } from '../../utils/dateUtils';
import { formatEspees } from '../../utils/formatUtils';
import { getMemberDisplayName } from '../../utils/memberUtils';
import type { Member, SoulWinnerRank, PartnershipRank } from '../../types';

interface DashboardStats {
  totalMembers: number;
  totalCellGroups: number;
  activeWelfarePrograms: number;
  newMembersThisMonth: number;
  pendingFollowUps: number;
  upcomingBirthdays: Member[];
}

const COLORS = ['#1E3A8A', '#F59E0B', '#10B981', '#F43F5E', '#8B5CF6'];

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    totalCellGroups: 0,
    activeWelfarePrograms: 0,
    newMembersThisMonth: 0,
    pendingFollowUps: 0,
    upcomingBirthdays: [],
  });
  const [memberGrowth, setMemberGrowth] = useState<{ month: string; count: number }[]>([]);
  const [genderSplit, setGenderSplit] = useState<{ name: string; value: number }[]>([]);
  const [cellGroupSizes, setCellGroupSizes] = useState<{ name: string; count: number }[]>([]);
  const [soulWinners, setSoulWinners] = useState<SoulWinnerRank[]>([]);
  const [partnershipRanks, setPartnershipRanks] = useState<PartnershipRank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [
        { count: totalMembers },
        { count: totalCellGroups },
        { count: activeWelfarePrograms },
        { count: newMembersThisMonth },
        { count: pendingFollowUps },
        { data: membersData },
        { data: cellGroupData },
      ] = await Promise.all([
        supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
        supabase.from('cell_groups').select('*', { count: 'exact', head: true }),
        supabase.from('welfare_programs').select('*', { count: 'exact', head: true }).eq('status', 'IN_PROGRESS'),
        supabase.from('members').select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase.from('follow_ups').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabase.from('members').select('*').eq('status', 'ACTIVE'),
        supabase.from('cell_groups').select('id, name, members(count)'),
      ]);

      const upcomingBirthdays = (membersData || [])
        .filter((m: Member) => daysUntilBirthday(m.dob) <= 7)
        .sort((a: Member, b: Member) => daysUntilBirthday(a.dob) - daysUntilBirthday(b.dob))
        .slice(0, 5);

      const maleCount = (membersData || []).filter((m: Member) => m.gender === 'MALE').length;
      const femaleCount = (membersData || []).filter((m: Member) => m.gender === 'FEMALE').length;

      setGenderSplit([
        { name: 'Male', value: maleCount },
        { name: 'Female', value: femaleCount },
      ]);

      setCellGroupSizes(
        (cellGroupData || []).map((g: { name: string; members?: { count: number }[] }) => ({
          name: g.name.length > 12 ? g.name.slice(0, 12) + '…' : g.name,
          count: Array.isArray(g.members) ? (g.members[0]?.count || 0) : 0,
        })).sort((a: { count: number }, b: { count: number }) => b.count - a.count).slice(0, 8)
      );

      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return { month: d.toLocaleString('default', { month: 'short' }), year: d.getFullYear(), monthNum: d.getMonth() };
      });
      const growth = months.map(m => ({
        month: m.month,
        count: (membersData || []).filter((mem: Member) => {
          const d = new Date(mem.created_at || '');
          return d.getMonth() === m.monthNum && d.getFullYear() === m.year;
        }).length,
      }));
      setMemberGrowth(growth);

      const [topSouls, topPartners] = await Promise.all([
        fetchTopSoulWinners(5),
        fetchWeeklyPartnershipRanks(getWeekStart()),
      ]);
      setSoulWinners(topSouls);
      setPartnershipRanks(topPartners.slice(0, 5));

      setStats({
        totalMembers: totalMembers || 0,
        totalCellGroups: totalCellGroups || 0,
        activeWelfarePrograms: activeWelfarePrograms || 0,
        newMembersThisMonth: newMembersThisMonth || 0,
        pendingFollowUps: pendingFollowUps || 0,
        upcomingBirthdays,
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6 fade-in">
      <PortalWelcomeHeader
        subtitle={`System overview — ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
      />

      <WelfarePartnershipBanner />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Members"
          value={loading ? '—' : stats.totalMembers}
          icon={<Users size={20} />}
          color="blue"
          trend={{ value: 12 }}
        />
        <StatCard
          label="Senior Cells"
          value={loading ? '—' : stats.totalCellGroups}
          icon={<Building2 size={20} />}
          color="purple"
        />
        <StatCard
          label="Active Programs"
          value={loading ? '—' : stats.activeWelfarePrograms}
          icon={<Heart size={20} />}
          color="green"
        />
        <StatCard
          label="New This Month"
          value={loading ? '—' : stats.newMembersThisMonth}
          icon={<TrendingUp size={20} />}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Pending Follow-ups"
          value={loading ? '—' : stats.pendingFollowUps}
          icon={<Activity size={20} />}
          color="rose"
        />
        <StatCard
          label="Birthdays This Week"
          value={loading ? '—' : stats.upcomingBirthdays.length}
          icon={<Calendar size={20} />}
          color="amber"
        />
      </div>

      {/* Engagement Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-amber-500" />
              <h3 className="font-heading font-semibold text-sm text-slate-700 dark:text-slate-200">
                Top Soul Winners
              </h3>
            </div>
            <Link to="/admin/soul-winners" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-6 text-slate-400"><Loader2 size={18} className="animate-spin" /></div>
          ) : soulWinners.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No soul wins recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {soulWinners.map((entry, i) => (
                <div key={entry.member_id} className="flex items-center gap-2.5 py-1.5">
                  <MeritRankBadge rank={i + 1} className="w-6 h-6 text-[10px]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {entry.member ? getMemberDisplayName(entry.member) : '—'}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-300 tabular-nums">{entry.souls_won}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <EventsProgramsCard role="MASTER_ADMIN" />
        <ReflectionsCard role="MASTER_ADMIN" />

        <div className="card p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <HandCoins size={16} className="text-emerald-600" />
              <h3 className="font-heading font-semibold text-sm text-slate-700 dark:text-slate-200">
                Top Partners
              </h3>
            </div>
            <Link to="/admin/partnerships" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <p className="text-[10px] text-slate-400 mb-3">This week · {formatWeekRange(getWeekStart())}</p>
          {loading ? (
            <div className="flex justify-center py-6 text-slate-400"><Loader2 size={18} className="animate-spin" /></div>
          ) : partnershipRanks.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No senior cells found.</p>
          ) : (
            <div className="space-y-2">
              {partnershipRanks.map((entry, i) => (
                <div key={entry.cell_group_id} className="flex items-center gap-2.5 py-1.5">
                  <MeritRankBadge rank={i + 1} className="w-6 h-6 text-[10px]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{entry.name}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {formatEspees(entry.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Member Growth */}
        <div className="card p-4 lg:col-span-2">
          <h3 className="font-heading font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">
            Member Growth (Last 6 Months)
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={memberGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#1E3A8A" strokeWidth={2} dot={{ r: 4 }} name="New Members" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gender Split */}
        <div className="card p-4">
          <h3 className="font-heading font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">
            Gender Distribution
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={genderSplit}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {genderSplit.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cell Group Sizes */}
      {cellGroupSizes.length > 0 && (
        <div className="card p-4">
          <h3 className="font-heading font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">
            Senior Cell Sizes
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={cellGroupSizes} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
              <Tooltip />
              <Bar dataKey="count" fill="#1E3A8A" radius={[0, 4, 4, 0]} name="Members" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Upcoming Birthdays */}
      {stats.upcomingBirthdays.length > 0 && (
        <div className="card p-4">
          <h3 className="font-heading font-semibold text-sm text-slate-700 dark:text-slate-200 mb-3">
            Upcoming Birthdays (Next 7 Days)
          </h3>
          <div className="space-y-2">
            {stats.upcomingBirthdays.map(m => {
              const days = daysUntilBirthday(m.dob);
              return (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {getMemberDisplayName(m)}
                    </p>
                    <p className="text-xs text-slate-400">{m.phone}</p>
                  </div>
                  <span className={`badge text-xs font-semibold ${
                    days === 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                    days === 1 ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

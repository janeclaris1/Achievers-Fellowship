import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, Flame, Gift, Sparkles, Target, TrendingUp, Wallet } from 'lucide-react';
import {
  buildDailyGivingTrend,
  buildGoalChartData,
  buildWeeklyGivingTrend,
  buildProjectedMonthly,
  CHART_COLORS,
  computeGoalProgress,
  computePartnershipStats,
  getMotivationMessage,
} from '../../lib/partnershipSubscriptionStats';
import { GOAL_PERIOD_OPTIONS, type GoalPeriod } from '../../lib/partnershipSubscriptionGoals';
import type { Gender, PartnershipSubscription, PartnershipSubscriptionCharge } from '../../types';
import { formatGhs } from '../../utils/formatUtils';
import { cn } from '../../utils/cn';

interface PartnershipStatsChartsProps {
  charges: PartnershipSubscriptionCharge[];
  subscription?: PartnershipSubscription | null;
  goalAmount?: number;
  goalPeriod?: GoalPeriod;
  memberName?: string;
  gender?: Gender | null;
  preview?: boolean;
  projectedDaily?: number;
  variant?: 'full' | 'sidebar';
}

const PartnershipStatsCharts: React.FC<PartnershipStatsChartsProps> = ({
  charges,
  subscription,
  goalAmount,
  goalPeriod = 'MONTHLY',
  memberName,
  gender,
  preview = false,
  projectedDaily = 0,
  variant = 'full',
}) => {
  const isSidebar = variant === 'sidebar';
  const chartHeight = isSidebar ? 128 : 220;
  const [period, setPeriod] = useState<GoalPeriod>(goalPeriod);

  const stats = useMemo(
    () => computePartnershipStats(charges, period, subscription),
    [charges, period, subscription]
  );

  const dailyTrend = useMemo(() => buildDailyGivingTrend(charges, 14), [charges]);
  const weeklyTrend = useMemo(() => buildWeeklyGivingTrend(charges, 8), [charges]);

  const goalProgress = useMemo(() => {
    if (!goalAmount || goalAmount <= 0) return null;
    return computeGoalProgress(charges, goalAmount, goalPeriod);
  }, [charges, goalAmount, goalPeriod]);

  const goalChartData = useMemo(() => {
    if (!goalAmount || !goalProgress) return [];
    return buildGoalChartData(goalAmount, goalProgress.contributed);
  }, [goalAmount, goalProgress]);

  const projectedMonthly = preview && projectedDaily > 0 ? buildProjectedMonthly(projectedDaily) : undefined;

  const motivation = getMotivationMessage({
    stats,
    goalPercent: goalProgress?.percent,
    memberName,
    gender,
    preview,
    projectedMonthly,
  });

  const hasChargeData = stats.giftCount > 0;

  return (
    <section
      className={cn(
        isSidebar
          ? 'flex h-full flex-col rounded-3xl border border-slate-200/70 bg-gradient-to-b from-white to-slate-50/80 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-slate-700/80 dark:from-slate-900/80 dark:to-slate-900/40 sm:p-6'
          : 'space-y-5'
      )}
    >
      <header className={cn('flex items-start justify-between gap-3', isSidebar ? 'mb-4' : '')}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-600/10 text-emerald-600">
            <BarChart3 size={18} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">Insights</p>
            <h2
              className={cn(
                'font-semibold tracking-tight text-slate-900 dark:text-slate-100',
                isSidebar ? 'text-base' : 'text-lg'
              )}
            >
              Partnership statistics
            </h2>
          </div>
        </div>
        {!preview && (
          <div className="flex gap-0.5 rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800">
            {GOAL_PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPeriod(opt.id)}
                className={cn(
                  'rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors',
                  period === opt.id
                    ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {opt.shortLabel}
              </button>
            ))}
          </div>
        )}
      </header>

      <div
        className={cn(
          'relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-teal-700 to-slate-800 text-white',
          isSidebar ? 'mb-4 px-4 py-3.5' : 'px-5 py-4'
        )}
      >
        <Sparkles size={14} className="absolute right-3 top-3 text-emerald-200/50" />
        <p className={cn('font-medium leading-relaxed pr-6', isSidebar ? 'text-xs' : 'text-sm')}>{motivation}</p>
        {preview && projectedDaily > 0 && (
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-200/80">
            Based on {formatGhs(projectedDaily)}/day selection
          </p>
        )}
      </div>

      <div className={cn('grid gap-2.5', isSidebar ? 'grid-cols-2 mb-4' : 'grid-cols-2 gap-3 lg:grid-cols-4')}>
        <StatTile
          compact={isSidebar}
          icon={<Wallet size={isSidebar ? 15 : 18} />}
          label={preview ? 'Projected / mo' : 'All-time'}
          value={
            preview && projectedDaily > 0 ? formatGhs(buildProjectedMonthly(projectedDaily)) : formatGhs(stats.allTimeTotal)
          }
        />
        <StatTile compact={isSidebar} icon={<Gift size={isSidebar ? 15 : 18} />} label="Gifts" value={String(stats.giftCount)} />
        <StatTile
          compact={isSidebar}
          icon={<Flame size={isSidebar ? 15 : 18} />}
          label="Streak"
          value={`${stats.streak}d`}
        />
        <StatTile
          compact={isSidebar}
          icon={<TrendingUp size={isSidebar ? 15 : 18} />}
          label={GOAL_PERIOD_OPTIONS.find((o) => o.id === period)?.shortLabel ?? 'Period'}
          value={formatGhs(stats.periodTotal)}
        />
      </div>

      {isSidebar ? (
        <div className="mt-auto rounded-2xl border border-slate-100 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100">Daily trend</h3>
            <span className="text-[10px] text-slate-400">14 days</span>
          </div>
          {hasChargeData || !preview ? (
            <ResponsiveContainer width="100%" height={chartHeight}>
              <AreaChart data={dailyTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="partnershipAreaSidebar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.area} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={CHART_COLORS.area} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  formatter={(value) => [formatGhs(Number(value ?? 0)), 'Given']}
                  contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 11 }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke={CHART_COLORS.bar}
                  strokeWidth={2}
                  fill="url(#partnershipAreaSidebar)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart
              message="Charts unlock after your first seed."
              compact
              short
            />
          )}
          {goalAmount && goalProgress && (
            <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-700">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Target size={12} className="text-emerald-600" />
                  Goal
                </span>
                <span className="font-semibold text-emerald-600">{Math.round(goalProgress.percent)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                  style={{ width: `${Math.min(100, goalProgress.percent)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="Daily giving" subtitle="Last 14 days">
            {hasChargeData || !preview ? (
              <ResponsiveContainer width="100%" height={chartHeight}>
                <AreaChart data={dailyTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="partnershipArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.area} stopOpacity={0.45} />
                      <stop offset="100%" stopColor={CHART_COLORS.area} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    formatter={(value) => [formatGhs(Number(value ?? 0)), 'Given']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke={CHART_COLORS.bar}
                    strokeWidth={2}
                    fill="url(#partnershipArea)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Your daily giving chart will appear after your first gift." />
            )}
          </ChartCard>

          <ChartCard
            title={goalAmount && goalProgress ? 'Goal progress' : 'Partnership focus'}
            subtitle={goalAmount ? `${Math.round(goalProgress?.percent ?? 0)}% complete` : 'Keep building momentum'}
          >
            {goalAmount && goalProgress && goalChartData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={goalChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={72}
                      paddingAngle={2}
                    >
                      {goalChartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatGhs(Number(value ?? 0))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Target size={14} className="text-emerald-600" />
                    <span className="text-slate-500">Target</span>
                    <span className="ml-auto font-semibold">{formatGhs(goalAmount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-500">Given</span>
                    <span className="ml-auto font-semibold text-emerald-600">{formatGhs(goalProgress.contributed)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-slate-200" />
                    <span className="text-slate-500">Remaining</span>
                    <span className="ml-auto font-semibold">{formatGhs(goalProgress.remaining)}</span>
                  </div>
                </div>
              </div>
            ) : hasChargeData ? (
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart data={weeklyTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    formatter={(value) => [formatGhs(Number(value ?? 0)), 'Weekly total']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <Bar dataKey="amount" fill={CHART_COLORS.bar} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Set a goal or start giving to unlock your progress chart." />
            )}
          </ChartCard>
        </div>
      )}

      {!isSidebar && goalAmount && goalProgress && hasChargeData && (
        <ChartCard title="Weekly totals" subtitle="Last 8 weeks of partnership">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                formatter={(value) => [formatGhs(Number(value ?? 0)), 'Total']}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Bar dataKey="amount" fill={CHART_COLORS.bar} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </section>
  );
};

function StatTile({
  icon,
  label,
  value,
  compact,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-800/60',
        compact ? 'p-3' : 'p-4'
      )}
    >
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
        {icon}
      </div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={cn('mt-0.5 truncate font-bold text-slate-900 dark:text-slate-100', compact ? 'text-sm' : 'text-lg')}>
        {value}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 dark:border-slate-700 dark:bg-slate-800/80">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function EmptyChart({ message, compact, short }: { message: string; compact?: boolean; short?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 text-center dark:border-slate-700',
        short ? 'h-[128px]' : compact ? 'h-[150px]' : 'h-[220px] px-6'
      )}
    >
      <p className={cn('leading-relaxed text-slate-400', compact || short ? 'text-xs' : 'text-sm')}>{message}</p>
    </div>
  );
}

export default PartnershipStatsCharts;

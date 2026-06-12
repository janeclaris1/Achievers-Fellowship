import type { Gender, PartnershipSubscription, PartnershipSubscriptionCharge } from '../types';
import { getPartnershipEsteemGreeting } from '../utils/memberUtils';
import {
  computeGoalProgress,
  computePeriodGiving,
  type GoalPeriod,
} from './partnershipSubscriptionGoals';

export interface PartnershipStatsSummary {
  allTimeTotal: number;
  giftCount: number;
  streak: number;
  avgDaily: number;
  periodTotal: number;
  periodGiftCount: number;
  daysActive: number;
}

export interface DailyTrendPoint {
  day: string;
  amount: number;
  gifts: number;
}

export interface WeeklyTrendPoint {
  week: string;
  amount: number;
}

export interface GoalChartPoint {
  name: string;
  value: number;
  color: string;
}

const CHART_COLORS = {
  given: '#10B981',
  remaining: '#E2E8F0',
  bar: '#059669',
  area: '#34D399',
};

export function computeStreak(charges: PartnershipSubscriptionCharge[]): number {
  const daySet = new Set(
    charges
      .filter((c) => c.status === 'COMPLETED')
      .map((c) => new Date(c.charged_at || c.created_at).toISOString().slice(0, 10))
  );

  if (daySet.size === 0) return 0;

  const cursor = new Date();
  const today = cursor.toISOString().slice(0, 10);
  if (!daySet.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (daySet.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function buildDailyGivingTrend(
  charges: PartnershipSubscriptionCharge[],
  days = 14
): DailyTrendPoint[] {
  const completed = charges.filter((c) => c.status === 'COMPLETED');
  const points: DailyTrendPoint[] = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayCharges = completed.filter(
      (c) => new Date(c.charged_at || c.created_at).toISOString().slice(0, 10) === key
    );
    points.push({
      day: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
      amount: dayCharges.reduce((sum, c) => sum + Number(c.amount), 0),
      gifts: dayCharges.length,
    });
  }

  return points;
}

export function buildWeeklyGivingTrend(
  charges: PartnershipSubscriptionCharge[],
  weeks = 8
): WeeklyTrendPoint[] {
  const completed = charges.filter((c) => c.status === 'COMPLETED');
  const points: WeeklyTrendPoint[] = [];

  for (let i = weeks - 1; i >= 0; i -= 1) {
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    weekEnd.setHours(23, 59, 59, 999);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const amount = completed
      .filter((c) => {
        const d = new Date(c.charged_at || c.created_at);
        return d >= weekStart && d <= weekEnd;
      })
      .reduce((sum, c) => sum + Number(c.amount), 0);

    points.push({
      week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount,
    });
  }

  return points;
}

export function buildGoalChartData(
  goalAmount: number,
  contributed: number
): GoalChartPoint[] {
  const remaining = Math.max(0, goalAmount - contributed);
  if (remaining === 0) {
    return [{ name: 'Achieved', value: contributed, color: CHART_COLORS.given }];
  }
  return [
    { name: 'Given', value: contributed, color: CHART_COLORS.given },
    { name: 'Remaining', value: remaining, color: CHART_COLORS.remaining },
  ];
}

export function computePartnershipStats(
  charges: PartnershipSubscriptionCharge[],
  period: GoalPeriod = 'MONTHLY',
  subscription?: PartnershipSubscription | null
): PartnershipStatsSummary {
  const completed = charges.filter((c) => c.status === 'COMPLETED');
  const periodGiving = computePeriodGiving(charges, period);
  const allTimeTotal = completed.reduce((sum, c) => sum + Number(c.amount), 0);

  let daysActive = 0;
  if (subscription?.started_at && completed.length > 0) {
    const start = new Date(subscription.started_at);
    const end = new Date();
    daysActive = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
  }

  const avgDaily = daysActive > 0 ? allTimeTotal / daysActive : 0;

  return {
    allTimeTotal,
    giftCount: completed.length,
    streak: computeStreak(charges),
    avgDaily,
    periodTotal: periodGiving.contributed,
    periodGiftCount: periodGiving.giftCount,
    daysActive,
  };
}

export function getMotivationMessage(params: {
  stats: PartnershipStatsSummary;
  goalPercent?: number;
  memberName?: string;
  gender?: Gender | null;
  preview?: boolean;
  projectedMonthly?: number;
}): string {
  const greeting = getPartnershipEsteemGreeting(params.memberName, params.gender);

  if (params.preview) {
    if (params.projectedMonthly && params.projectedMonthly > 0) {
      return `${greeting}, a daily partnership of that amount could bless the ministry with over ${Math.round(params.projectedMonthly)} GHS each month. Step out in faith!`;
    }
    return `${greeting}, your partnership journey starts with one faithful step. Set your daily amount and begin today.`;
  }

  if (params.goalPercent !== undefined && params.goalPercent >= 100) {
    return `Wooshh!!!! ${greeting}, you hit your partnership goal. Heaven celebrates your faithfulness!`;
  }
  if (params.stats.streak >= 7) {
    return `${greeting}, ${params.stats.streak} days strong! Your consistent partnership is building the kingdom.`;
  }
  if (params.goalPercent !== undefined && params.goalPercent >= 75) {
    return `${greeting}, you are so close to your goal — keep pressing! Every gift moves the vision forward.`;
  }
  if (params.stats.giftCount >= 1) {
    return `${greeting}, thank you for partnering. You are closer to achieving your goal with every gift.`;
  }
  return `${greeting}, faithful partnership transforms lives. Your daily gift makes a lasting difference.`;
}

export function buildProjectedMonthly(dailyAmount: number): number {
  return dailyAmount * 30;
}

export { CHART_COLORS, computeGoalProgress };

import type { PartnershipSubscriptionCharge } from '../types';

export type GoalPeriod = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export const GOAL_PERIOD_OPTIONS: { id: GoalPeriod; label: string; shortLabel: string }[] = [
  { id: 'MONTHLY', label: 'This month', shortLabel: 'Monthly' },
  { id: 'QUARTERLY', label: 'This quarter', shortLabel: 'Quarterly' },
  { id: 'YEARLY', label: 'This year', shortLabel: 'Yearly' },
];

export const GOAL_PERIOD_LABELS: Record<GoalPeriod, string> = {
  MONTHLY: 'This month',
  QUARTERLY: 'This quarter',
  YEARLY: 'This year',
};

export function getGoalPeriodBounds(period: GoalPeriod, refDate = new Date()): { start: Date; end: Date } {
  const y = refDate.getFullYear();
  const m = refDate.getMonth();

  if (period === 'MONTHLY') {
    return {
      start: new Date(y, m, 1),
      end: new Date(y, m + 1, 0, 23, 59, 59, 999),
    };
  }

  if (period === 'QUARTERLY') {
    const qStart = Math.floor(m / 3) * 3;
    return {
      start: new Date(y, qStart, 1),
      end: new Date(y, qStart + 3, 0, 23, 59, 59, 999),
    };
  }

  return {
    start: new Date(y, 0, 1),
    end: new Date(y, 11, 31, 23, 59, 59, 999),
  };
}

export function daysInGoalPeriod(period: GoalPeriod, refDate = new Date()): number {
  const { start, end } = getGoalPeriodBounds(period, refDate);
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endDay.getTime() - startDay.getTime()) / 86400000) + 1;
}

export function daysRemainingInGoalPeriod(period: GoalPeriod, refDate = new Date()): number {
  const { end } = getGoalPeriodBounds(period, refDate);
  const today = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.max(1, Math.round((endDay.getTime() - today.getTime()) / 86400000) + 1);
}

export function suggestDailyFromGoal(goalAmount: number, period: GoalPeriod, refDate = new Date()): number {
  const remaining = daysRemainingInGoalPeriod(period, refDate);
  return Math.max(1, Math.ceil(goalAmount / remaining));
}

export function computeGoalProgress(
  charges: PartnershipSubscriptionCharge[],
  goalAmount: number,
  period: GoalPeriod,
  refDate = new Date()
): { contributed: number; percent: number; remaining: number; daysRemaining: number } {
  const { start, end } = getGoalPeriodBounds(period, refDate);

  const contributed = charges
    .filter((c) => c.status === 'COMPLETED')
    .filter((c) => {
      const d = new Date(c.charged_at || c.created_at);
      return d >= start && d <= end;
    })
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const percent = goalAmount > 0 ? Math.min(100, (contributed / goalAmount) * 100) : 0;
  const remaining = Math.max(0, goalAmount - contributed);
  const daysRemaining = daysRemainingInGoalPeriod(period, refDate);

  return { contributed, percent, remaining, daysRemaining };
}

export function computePeriodGiving(
  charges: PartnershipSubscriptionCharge[],
  period: GoalPeriod,
  refDate = new Date()
): { contributed: number; giftCount: number; allTimeTotal: number; daysRemaining: number } {
  const { start, end } = getGoalPeriodBounds(period, refDate);

  const completed = charges.filter((c) => c.status === 'COMPLETED');
  const inPeriod = completed.filter((c) => {
    const d = new Date(c.charged_at || c.created_at);
    return d >= start && d <= end;
  });

  const contributed = inPeriod.reduce((sum, c) => sum + Number(c.amount), 0);
  const allTimeTotal = completed.reduce((sum, c) => sum + Number(c.amount), 0);

  return {
    contributed,
    giftCount: inPeriod.length,
    allTimeTotal,
    daysRemaining: daysRemainingInGoalPeriod(period, refDate),
  };
}

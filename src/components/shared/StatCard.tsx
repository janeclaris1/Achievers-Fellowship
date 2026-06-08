import React from 'react';
import { cn } from '../../utils/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; label?: string };
  color?: 'blue' | 'green' | 'amber' | 'rose' | 'purple' | 'sky';
  className?: string;
}

const colorMap = {
  blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  green: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
  purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  sky: 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400',
};

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, color = 'blue', className }) => {
  const iconColor = colorMap[color];

  const TrendIcon = trend
    ? trend.value > 0 ? TrendingUp : trend.value < 0 ? TrendingDown : Minus
    : null;

  const trendColor = trend
    ? trend.value > 0 ? 'text-emerald-600 dark:text-emerald-400'
    : trend.value < 0 ? 'text-rose-500'
    : 'text-slate-400'
    : '';

  return (
    <div className={cn('card p-5 flex items-start gap-4', className)}>
      <div className={cn('p-3 rounded-[10px] flex-shrink-0', iconColor)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
        <p className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-100 mt-0.5">
          {value}
        </p>
        {trend && TrendIcon && (
          <div className={cn('flex items-center gap-1 mt-1 text-xs font-medium', trendColor)}>
            <TrendIcon size={12} />
            <span>{Math.abs(trend.value)}% {trend.label || 'vs last month'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;

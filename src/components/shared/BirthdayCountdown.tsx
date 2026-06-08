import React from 'react';
import { cn } from '../../utils/cn';
import { getBirthdayCountdownLabel } from '../../utils/dateUtils';

interface BirthdayCountdownProps {
  daysUntil: number;
  className?: string;
}

const BirthdayCountdown: React.FC<BirthdayCountdownProps> = ({ daysUntil, className }) => {
  const { label, variant } = getBirthdayCountdownLabel(daysUntil);

  const variantStyles = {
    today: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-700',
    tomorrow: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    soon: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    upcoming: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  };

  const icons = {
    today: '🎉',
    tomorrow: '🎂',
    soon: '🎂',
    upcoming: '',
  };

  return (
    <span className={cn('badge text-xs font-semibold', variantStyles[variant], className)}>
      {icons[variant] && <span className="mr-1">{icons[variant]}</span>}
      {label}
    </span>
  );
};

export default BirthdayCountdown;

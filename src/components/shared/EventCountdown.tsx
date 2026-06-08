import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '../../utils/cn';
import { getEventCountdown, type EventCountdownVariant } from '../../utils/dateUtils';

interface EventCountdownProps {
  eventDate: string;
  className?: string;
  showHeart?: boolean;
  heartSize?: number;
}

const variantStyles: Record<EventCountdownVariant, string> = {
  now: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 ring-1 ring-rose-300 dark:ring-rose-700',
  imminent: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  today: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  tomorrow: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  soon: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  upcoming: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

const EventCountdown: React.FC<EventCountdownProps> = ({
  eventDate,
  className,
  showHeart = true,
  heartSize = 16,
}) => {
  const [countdown, setCountdown] = useState(() => getEventCountdown(eventDate));

  useEffect(() => {
    const tick = () => setCountdown(getEventCountdown(eventDate));
    tick();
    const id = window.setInterval(tick, 30000);
    return () => window.clearInterval(id);
  }, [eventDate]);

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      {showHeart && (
        <Heart
          size={heartSize}
          className="text-rose-500 fill-rose-500 animate-heartbeat flex-shrink-0"
          aria-hidden
        />
      )}
      <span className={cn('badge text-[10px] sm:text-xs font-semibold whitespace-nowrap', variantStyles[countdown.variant])}>
        {countdown.label}
      </span>
    </span>
  );
};

export default EventCountdown;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronRight, Heart, Loader2 } from 'lucide-react';
import { fetchUpcomingEventsAndPrograms } from '../../lib/engagementQueries';
import { formatDate } from '../../utils/dateUtils';
import EventCountdown from './EventCountdown';
import type { UserRole } from '../../types';

export const eventsRouteByRole: Record<UserRole, string> = {
  MASTER_ADMIN: '/admin/events',
  SCL: '/scl/events',
  WELFARE: '/welfare/events',
  FOLLOWUP: '/followup/events',
  CALL_CENTER: '/callcenter/events',
};

interface EventsProgramsCardProps {
  role: UserRole;
  limit?: number;
  className?: string;
}

const EventsProgramsCard: React.FC<EventsProgramsCardProps> = ({ role, limit = 5, className }) => {
  const [items, setItems] = useState<Awaited<ReturnType<typeof fetchUpcomingEventsAndPrograms>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingEventsAndPrograms(limit).then(data => {
      setItems(data);
      setLoading(false);
    });
  }, [limit]);

  const eventsPath = eventsRouteByRole[role];

  return (
    <div className={`card p-4 ${className ?? ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-blue-600" />
          <h3 className="font-heading font-semibold text-sm text-slate-700 dark:text-slate-200">
            Events & Programs
          </h3>
        </div>
        <Link to={eventsPath} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">
          View all <ChevronRight size={12} />
        </Link>
      </div>
      {loading ? (
        <div className="flex justify-center py-6 text-slate-400"><Loader2 size={18} className="animate-spin" /></div>
      ) : items.length === 0 ? (
        <p className="text-xs text-slate-400 py-4 text-center">No upcoming events or programs.</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={`${item.kind}-${item.id}`} className="py-1.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
              <div className="flex items-start gap-2">
                {item.kind === 'event' && (
                  <Heart
                    size={14}
                    className="text-rose-500 fill-rose-500 animate-heartbeat flex-shrink-0 mt-0.5"
                    aria-hidden
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{item.title}</p>
                  <p className="text-xs text-slate-400">
                    {formatDate(item.date, 'MMM d, yyyy')}
                    {item.kind === 'program' && (
                      <>
                        <span className="mx-1">·</span>
                        Program
                      </>
                    )}
                  </p>
                </div>
                {item.kind === 'event' && (
                  <EventCountdown eventDate={item.date} showHeart={false} className="flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsProgramsCard;

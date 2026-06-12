import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarClock, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getPortalFromPath } from '../../lib/portalNav';
import type { UserRole } from '../../types';

const portalPath: Record<UserRole, string> = {
  MASTER_ADMIN: '/admin',
  SCL: '/scl',
  WELFARE: '/welfare',
  FOLLOWUP: '/followup',
  CALL_CENTER: '/callcenter',
};

const PartnershipSubscriptionPromo: React.FC<{ className?: string }> = ({ className }) => {
  const { profile } = useAuth();
  const location = useLocation();
  const portal = getPortalFromPath(location.pathname);
  const role = profile?.role as UserRole | undefined;
  const base = portal ? `/${portal}` : role ? portalPath[role] : '/welfare';

  return (
    <Link
      to={`${base}/partnership-subscription`}
      className={`block rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/30 transition-colors ${className ?? ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-emerald-600 text-white flex-shrink-0">
            <CalendarClock size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Daily partnership
            </p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
              Partner every day — automatic daily giving
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Set your daily amount once. Paystack charges your saved card each morning.
            </p>
          </div>
        </div>
        <ChevronRight size={20} className="text-emerald-600 flex-shrink-0" />
      </div>
    </Link>
  );
};

export default PartnershipSubscriptionPromo;

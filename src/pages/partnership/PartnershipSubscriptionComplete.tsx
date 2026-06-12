import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { verifyPartnershipSubscription } from '../../lib/partnershipSubscription';
import { formatGhs } from '../../utils/formatUtils';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

const roleDefaultRoutes: Record<UserRole, string> = {
  MASTER_ADMIN: '/admin/dashboard',
  SCL: '/scl/dashboard',
  WELFARE: '/welfare/dashboard',
  FOLLOWUP: '/followup/dashboard',
  CALL_CENTER: '/callcenter/dashboard',
};

const PartnershipSubscriptionComplete: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const reference = searchParams.get('reference');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [dailyAmount, setDailyAmount] = useState<number | null>(null);

  useEffect(() => {
    if (!reference) {
      setLoading(false);
      setMessage('Missing payment reference.');
      return;
    }

    verifyPartnershipSubscription(reference).then((result) => {
      setSuccess(result.success);
      setMessage(result.message || result.error || 'Verification complete.');
      if (result.daily_amount) {
        setDailyAmount(result.daily_amount);
      }
      setLoading(false);
    });
  }, [reference]);

  const dashboardPath = profile?.role ? roleDefaultRoutes[profile.role] : '/login';
  const subscriptionPath = profile?.role
    ? `/${profile.role === 'MASTER_ADMIN' ? 'admin' : profile.role === 'CALL_CENTER' ? 'callcenter' : profile.role.toLowerCase()}/partnership-subscription`
    : '/login';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
      <div className="card p-8 max-w-md w-full text-center">
        {loading ? (
          <>
            <Loader2 className="animate-spin mx-auto text-emerald-600 mb-4" size={40} />
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Activating your daily partnership...
            </h1>
            <p className="text-sm text-slate-500 mt-2">Please wait while we verify your payment.</p>
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={48} />
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Daily partnership activated!
            </h1>
            {dailyAmount !== null && (
              <p className="text-2xl font-bold text-emerald-600 mt-2">{formatGhs(dailyAmount)} / day</p>
            )}
            <p className="text-sm text-slate-500 mt-2">{message}</p>
            <p className="text-xs text-slate-400 mt-4">
              Your card will be charged automatically each day. You can pause or cancel anytime.
            </p>
            <div className="flex flex-col gap-2 mt-6">
              <Link to={`${subscriptionPath}?celebration=1`} className="btn-primary inline-flex justify-center">
                View my subscription
              </Link>
              <Link to={dashboardPath} className="btn-secondary inline-flex justify-center">
                Back to dashboard
              </Link>
            </div>
          </>
        ) : (
          <>
            <XCircle className="mx-auto text-rose-500 mb-4" size={48} />
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Setup not completed</h1>
            <p className="text-sm text-slate-500 mt-2">{message}</p>
            <Link to={dashboardPath} className="btn-secondary inline-flex mt-6">
              Back to dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default PartnershipSubscriptionComplete;

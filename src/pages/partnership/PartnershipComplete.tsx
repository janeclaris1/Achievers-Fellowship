import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import {
  canViewWelfarePartnershipAmounts,
  verifyWelfarePartnership,
} from '../../lib/welfarePartnership';
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

const PartnershipComplete: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const reference = searchParams.get('reference');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState<number | null>(null);

  useEffect(() => {
    if (!reference) {
      setLoading(false);
      setMessage('Missing payment reference.');
      return;
    }

    verifyWelfarePartnership(reference).then((result) => {
      setSuccess(result.success);
      setMessage(result.message || result.error || 'Payment verification complete.');
      if (result.partnership?.amount) {
        setAmount(Number(result.partnership.amount));
      }
      setLoading(false);
    });
  }, [reference]);

  const dashboardPath = profile?.role ? roleDefaultRoutes[profile.role] : '/login';
  const showAmounts = canViewWelfarePartnershipAmounts(profile?.role);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
      <div className="card p-8 max-w-md w-full text-center">
        {loading ? (
          <>
            <Loader2 className="animate-spin mx-auto text-emerald-600 mb-4" size={40} />
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Confirming your partnership...</h1>
            <p className="text-sm text-slate-500 mt-2">Please wait while we verify your payment.</p>
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={48} />
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Thank you for partnering!</h1>
            {showAmounts && amount !== null && (
              <p className="text-2xl font-bold text-emerald-600 mt-2">{formatGhs(amount)}</p>
            )}
            <p className="text-sm text-slate-500 mt-2">{message}</p>
            <p className="text-xs text-slate-400 mt-4">Your partnership has been recorded by the Welfare Department.</p>
            <Link to={dashboardPath} className="btn-primary inline-flex mt-6">
              Back to dashboard
            </Link>
          </>
        ) : (
          <>
            <XCircle className="mx-auto text-rose-500 mb-4" size={48} />
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Payment not completed</h1>
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

export default PartnershipComplete;

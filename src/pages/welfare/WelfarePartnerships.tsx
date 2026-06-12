import React, { useEffect, useState } from 'react';
import { HandHeart, Loader2 } from 'lucide-react';
import { fetchAllWelfarePartnerships } from '../../lib/welfarePartnership';
import { getPartnershipArmName } from '../../lib/welfarePartnershipArms';
import type { WelfarePartnership } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';
import { formatGhs } from '../../utils/formatUtils';
import { cn } from '../../utils/cn';
import WelfarePartnershipBanner from '../../components/shared/WelfarePartnershipBanner';
import PartnershipSubscriptionPromo from '../../components/shared/PartnershipSubscriptionPromo';

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  FAILED: 'bg-rose-100 text-rose-800',
  CANCELLED: 'bg-slate-100 text-slate-600',
};

const WelfarePartnerships: React.FC = () => {
  const [partnerships, setPartnerships] = useState<WelfarePartnership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllWelfarePartnerships().then(({ data }) => {
      setPartnerships(data as WelfarePartnership[]);
      setLoading(false);
    });
  }, []);

  const totalCompleted = partnerships
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <HandHeart size={22} className="text-emerald-600" />
          Welfare Partnerships
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Individual sponsorships to the Welfare Department
        </p>
      </div>

      <WelfarePartnershipBanner />

      <PartnershipSubscriptionPromo />

      <div className="card p-4">
        <p className="text-sm text-slate-500">Total received (completed)</p>
        <p className="text-2xl font-bold text-emerald-600 mt-1">{formatGhs(totalCompleted)}</p>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Partnership log</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-slate-400" size={24} />
          </div>
        ) : partnerships.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">No partnerships recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100 dark:border-slate-700">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Partner</th>
                  <th className="px-5 py-3 font-medium">Partnership</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {partnerships.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 dark:border-slate-800 last:border-0">
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                      {formatDateTime(p.paid_at || p.created_at)}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">
                      {p.profiles?.full_name || '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {getPartnershipArmName(p.partnership_arm) || '—'}
                    </td>
                    <td className="px-5 py-3 text-emerald-700 dark:text-emerald-400 font-medium">
                      {formatGhs(Number(p.amount))}
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn('badge text-[10px]', statusColors[p.status])}>{p.status}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 max-w-[200px] truncate">
                      {p.partner_note || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WelfarePartnerships;

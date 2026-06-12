import React from 'react';
import { HandHeart, Sparkles } from 'lucide-react';

interface DailyPartnershipHeaderProps {
  armName: string;
}

const DailyPartnershipHeader: React.FC<DailyPartnershipHeaderProps> = ({ armName }) => (
  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-teal-800 to-slate-900 px-6 py-9 text-white shadow-xl shadow-emerald-900/10 sm:px-8 sm:py-10">
    <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-12 left-1/4 h-40 w-40 rounded-full bg-teal-400/15 blur-3xl" />
    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
          <Sparkles size={12} />
          Daily Partnership
        </p>
        <h1 className="mt-3 font-heading text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
          Partner with {armName}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-emerald-100/90">
          Give every day. Simple, faithful, and consistent.
        </p>
      </div>
      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
        <HandHeart size={26} className="text-emerald-100" />
      </div>
    </div>
  </div>
);

export default DailyPartnershipHeader;

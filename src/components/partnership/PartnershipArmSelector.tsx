import React from 'react';
import { WELFARE_PARTNERSHIP_ARMS } from '../../lib/welfarePartnershipArms';
import { cn } from '../../utils/cn';

interface PartnershipArmSelectorProps {
  partnershipArm: string;
  onArmChange: (id: string) => void;
}

const PartnershipArmSelector: React.FC<PartnershipArmSelectorProps> = ({
  partnershipArm,
  onArmChange,
}) => (
  <section>
    <div className="mb-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">Step 1</p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        Choose your arm
      </h2>
      <p className="mt-1 text-sm text-slate-500">Select the ministry you want to partner with daily.</p>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      {WELFARE_PARTNERSHIP_ARMS.map((arm) => {
        const Icon = arm.icon;
        const selected = partnershipArm === arm.id;
        return (
          <button
            key={arm.id}
            type="button"
            onClick={() => onArmChange(arm.id)}
            className={cn(
              'group relative flex items-start gap-3.5 rounded-2xl border p-4 text-left transition-all duration-200',
              selected
                ? 'border-emerald-500/80 bg-gradient-to-br from-emerald-50/90 to-white shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/25 dark:from-emerald-950/40 dark:to-slate-900/60'
                : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-slate-600'
            )}
          >
            <span
              className={cn(
                'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br transition-transform duration-200 group-hover:scale-105',
                selected ? `bg-gradient-to-br ${arm.gradient} text-white shadow-lg` : 'bg-slate-100 text-slate-500 dark:bg-slate-700'
              )}
            >
              <Icon size={20} />
            </span>
            <span className="min-w-0 pt-0.5">
              <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{arm.name}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-slate-500 line-clamp-2">{arm.tagline}</span>
            </span>
            {selected && (
              <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
            )}
          </button>
        );
      })}
    </div>
  </section>
);

export default PartnershipArmSelector;

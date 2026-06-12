import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';

const STEPS = [
  { id: 1, label: 'Choose arm' },
  { id: 2, label: 'Daily amount' },
  { id: 3, label: 'Goal & start' },
] as const;

interface PartnershipSetupProgressProps {
  currentStep: 1 | 2 | 3;
}

const PartnershipSetupProgress: React.FC<PartnershipSetupProgressProps> = ({ currentStep }) => (
  <nav aria-label="Setup progress" className="flex items-center gap-2 sm:gap-3">
    {STEPS.map((step, index) => {
      const done = step.id < currentStep;
      const active = step.id === currentStep;
      return (
        <React.Fragment key={step.id}>
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                done && 'bg-emerald-600 text-white',
                active && 'bg-emerald-600 text-white ring-4 ring-emerald-500/20',
                !done && !active && 'bg-slate-100 text-slate-400 dark:bg-slate-800'
              )}
            >
              {done ? <Check size={14} strokeWidth={3} /> : step.id}
            </span>
            <span
              className={cn(
                'hidden sm:block text-xs font-medium truncate',
                active ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'
              )}
            >
              {step.label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div
              className={cn(
                'h-px flex-1 min-w-[1rem] max-w-12 sm:max-w-20',
                step.id < currentStep ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'
              )}
            />
          )}
        </React.Fragment>
      );
    })}
  </nav>
);

export default PartnershipSetupProgress;

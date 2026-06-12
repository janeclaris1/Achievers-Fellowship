import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarHeart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { Department } from '../../lib/departments';
import WelfareEventsGallery from './WelfareEventsGallery';
import { cn } from '../../utils/cn';

interface WelfareDepartmentLandingProps {
  department: Department;
  basePath: string;
}

const WelfareDepartmentLanding: React.FC<WelfareDepartmentLandingProps> = ({ department, basePath }) => {
  const { profile } = useAuth();
  const canManage = profile?.role === 'MASTER_ADMIN' || profile?.role === 'WELFARE';
  const Icon = department.icon;

  return (
    <div className="fade-in -mx-4 lg:-mx-6 space-y-8 pb-10">
      <div className="px-4 lg:px-6">
        <Link
          to={basePath}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <ArrowLeft size={16} /> All departments
        </Link>
      </div>

      <section className="overflow-hidden border-y lg:border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 lg:mx-6 lg:rounded-3xl">
        <div className={cn('relative overflow-hidden bg-gradient-to-br px-6 py-10 sm:px-10 sm:py-12', department.gradient)}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4 text-white">
              <div className="rounded-2xl bg-white/15 p-3.5">
                <Icon size={28} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">Department</p>
                <h1 className="mt-1 text-2xl font-heading font-bold sm:text-3xl">{department.name}</h1>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/90">
                  Caring for members through birthdays, weddings, visitations, special programs & more - one event at a time
                </p>
              </div>
            </div>
            {canManage && (
              <Link
                to="/welfare/programs"
                className="inline-flex flex-shrink-0 items-center gap-2 self-start rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-700 shadow-lg hover:bg-emerald-50"
              >
                <CalendarHeart size={18} />
                Manage programs
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>

        <div className="grid gap-4 border-t border-slate-100 p-6 sm:grid-cols-3 dark:border-slate-800 sm:p-8">
          {[
            { label: 'Birthday celebrations', emoji: '🎂' },
            { label: 'Wedding parties', emoji: '💒' },
            { label: 'Care & support visits', emoji: '🤝' },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/50"
            >
              <span className="text-2xl">{item.emoji}</span>
              <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="px-4 lg:px-6">
        <WelfareEventsGallery />
      </div>
    </div>
  );
};

export default WelfareDepartmentLanding;

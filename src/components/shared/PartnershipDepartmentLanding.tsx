import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Department } from '../../lib/departments';
import { getDepartment } from '../../lib/departments';
import { RADIO_OUTREACH_PROGRAM_HIGHLIGHTS } from '../../lib/departmentPrograms';
import { cn } from '../../utils/cn';

interface PartnershipDepartmentLandingProps {
  department: Department;
  basePath: string;
}

const PartnershipDepartmentLanding: React.FC<PartnershipDepartmentLandingProps> = ({
  department,
  basePath,
}) => {
  const Icon = department.icon;
  const highlight = RADIO_OUTREACH_PROGRAM_HIGHLIGHTS.find((p) => p.id === department.id);
  const relatedPrograms = RADIO_OUTREACH_PROGRAM_HIGHLIGHTS.filter(
    (p) => p.id !== department.id && getDepartment(p.id)
  ).slice(0, 3);

  return (
    <div className="fade-in -mx-4 lg:-mx-6">
      <div className="px-4 lg:px-6 mb-4 flex flex-wrap items-center gap-3">
        <Link
          to={basePath}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <ArrowLeft size={16} /> All departments
        </Link>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <Link
          to={`${basePath}/podcast`}
          className="inline-flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400"
        >
          Podcast
        </Link>
      </div>

      <section className="overflow-hidden rounded-none lg:rounded-[12px] border-y lg:border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
        <div className="grid lg:grid-cols-2 min-h-[420px] lg:min-h-[520px]">
          <div className="relative min-h-[240px] lg:min-h-full bg-slate-900">
            {department.backgroundImage ? (
              <img
                src={department.backgroundImage}
                alt=""
                className={cn('absolute inset-0 h-full w-full', department.imageClass || 'object-cover object-center')}
              />
            ) : (
              <div className={cn('absolute inset-0 bg-gradient-to-br', department.gradient)} />
            )}
            <div className={cn('absolute inset-0', department.overlayClass || 'bg-slate-900/20')} />
          </div>

          <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-3">
              Ministry Program
            </p>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                <Icon size={24} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {department.name}
              </h1>
            </div>

            {highlight ? (
              <div className="mt-6 space-y-4 text-sm sm:text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
                <p className="font-medium text-slate-800 dark:text-slate-200">{highlight.tagline}</p>
                <p>{highlight.description}</p>
              </div>
            ) : (
              <p className="mt-6 text-sm sm:text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
                Partner with {department.name} to expand gospel outreach through our fellowship programs
                and community initiatives.
              </p>
            )}
          </div>
        </div>
      </section>

      {relatedPrograms.length > 0 && (
        <section className="mt-10 px-4 lg:px-6 pb-4">
          <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-slate-100 mb-4">
            More programs
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {relatedPrograms.map((program) => {
              const ProgramIcon = program.icon;
              return (
                <Link
                  key={program.id}
                  to={`${basePath}/${program.id}`}
                  className="card p-4 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <ProgramIcon size={16} />
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{program.name}</p>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{program.tagline}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                    View
                    <ArrowRight size={12} />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default PartnershipDepartmentLanding;

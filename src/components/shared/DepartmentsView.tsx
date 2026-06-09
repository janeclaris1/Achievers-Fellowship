import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  DEPARTMENTS,
  departmentsRouteByRole,
  getDepartment,
} from '../../lib/departments';
import { cn } from '../../utils/cn';
import type { UserRole } from '../../types';

const DepartmentsView: React.FC = () => {
  const { departmentId } = useParams<{ departmentId?: string }>();
  const { profile } = useAuth();
  const role = profile?.role as UserRole | undefined;
  const basePath = role ? departmentsRouteByRole[role] : '/admin/departments';

  const department = departmentId ? getDepartment(departmentId) : undefined;

  if (departmentId && !department) {
    return (
      <div className="space-y-4 fade-in">
        <Link to={basePath} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft size={16} /> Back to departments
        </Link>
        <div className="card p-8 text-center">
          <p className="text-slate-500">Department not found.</p>
        </div>
      </div>
    );
  }

  if (department) {
    const Icon = department.icon;
    return (
      <div className="max-w-3xl mx-auto space-y-6 fade-in">
        <Link to={basePath} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
          <ArrowLeft size={16} /> All departments
        </Link>

        <article className="card overflow-hidden">
          <div
            className={cn(
              'relative overflow-hidden',
              !department.backgroundImage && `bg-gradient-to-r ${department.gradient}`
            )}
          >
            {department.backgroundImage ? (
              <>
                <img
                  src={department.backgroundImage}
                  alt=""
                  className={cn('w-full h-auto block', department.imageClass)}
                />
                <div className={cn('absolute inset-0', department.overlayClass)} />
                <div className="absolute inset-0 p-6 sm:p-8 flex items-end">
                  <div className="flex items-center gap-3 text-white">
                    <div className="p-3 rounded-xl bg-white/15">
                      <Icon size={28} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-white/70">Department</p>
                      <h1 className="text-2xl font-heading font-bold">{department.name}</h1>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-6 sm:p-8 text-white flex items-center gap-3">
                <div className="p-3 rounded-xl bg-white/15">
                  <Icon size={28} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/70">Department</p>
                  <h1 className="text-2xl font-heading font-bold">{department.name}</h1>
                  <p className="text-sm text-white/90 mt-1">{department.tagline}</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8 space-y-4">
            {department.backgroundImage && (
              <p className="text-base text-slate-600 dark:text-slate-300 font-medium">{department.tagline}</p>
            )}
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{department.description}</p>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Building2 size={22} className="text-blue-600" />
          Departments
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Explore the ministries and departments of Christ Embassy Achievers PCF
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {DEPARTMENTS.map((dept) => {
          const Icon = dept.icon;
          return (
            <Link
              key={dept.id}
              to={`${basePath}/${dept.id}`}
              className="card overflow-hidden hover:shadow-md transition-shadow group"
            >
              {dept.backgroundImage ? (
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={dept.backgroundImage}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-heading font-semibold text-sm">{dept.name}</p>
                  </div>
                </div>
              ) : (
                <div className={cn('h-24 bg-gradient-to-r p-4 flex items-end', dept.gradient)}>
                  <p className="text-white font-heading font-semibold text-sm">{dept.name}</p>
                </div>
              )}
              <div className="p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex-shrink-0">
                    <Icon size={16} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{dept.tagline}</p>
                </div>
                <ChevronRight size={16} className="text-slate-400 flex-shrink-0 group-hover:text-blue-600" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default DepartmentsView;

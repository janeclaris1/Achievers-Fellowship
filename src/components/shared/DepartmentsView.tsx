import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, ChevronRight, History, Inbox, PhoneCall } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DEPARTMENTS, getDepartment } from '../../lib/departments';
import { canUseCallCenterTools, getDepartmentsBasePath } from '../../lib/portalNav';
import RadioOutreachLanding from './RadioOutreachLanding';
import PartnershipDepartmentLanding from './PartnershipDepartmentLanding';
import WelfareDepartmentLanding from '../welfare/WelfareDepartmentLanding';
import { cn } from '../../utils/cn';
import type { UserRole } from '../../types';

const callCenterTools = [
  { label: 'Member Outreach', to: '/callcenter/outreach', icon: PhoneCall },
  { label: 'Activity Log', to: '/callcenter/history', icon: History },
  { label: 'Bulk Messaging', to: '/callcenter/bulk-sms', icon: Inbox },
];

const DepartmentsView: React.FC = () => {
  const { departmentId } = useParams<{ departmentId?: string }>();
  const location = useLocation();
  const { profile } = useAuth();
  const role = profile?.role as UserRole | undefined;
  const basePath = role ? getDepartmentsBasePath(location.pathname, role) : '/admin/departments';

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
    if (department.id === 'podcast') {
      return <RadioOutreachLanding basePath={basePath} />;
    }

    if (department.id === 'welfare-department') {
      return <WelfareDepartmentLanding department={department} basePath={basePath} />;
    }

    if (department.backgroundImage) {
      return <PartnershipDepartmentLanding department={department} basePath={basePath} />;
    }

    const Icon = department.icon;
    const showCallCenterTools = department.id === 'call-center' && canUseCallCenterTools(role);

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
                </div>
              </div>
            )}
          </div>

          {showCallCenterTools && (
            <div className="p-6 sm:p-8 space-y-3">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Call Center tools</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {callCenterTools.map((tool) => {
                  const ToolIcon = tool.icon;
                  return (
                    <Link
                      key={tool.to}
                      to={tool.to}
                      className="rounded-[8px] border border-slate-200 dark:border-slate-600 p-4 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group"
                    >
                      <ToolIcon size={20} className="text-blue-600 dark:text-blue-400 mb-2" />
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                        {tool.label}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
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
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{dept.name}</p>
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

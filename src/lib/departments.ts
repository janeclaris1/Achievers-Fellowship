import {
  BookMarked,
  BookOpen,
  Building2,
  HeartHandshake,
  HeartPulse,
  Monitor,
  PhoneCall,
  Radio,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '../types';

export interface Department {
  id: string;
  name: string;
  gradient: string;
  icon: LucideIcon;
  backgroundImage?: string;
  imageClass?: string;
  overlayClass?: string;
}

export const DEPARTMENTS: Department[] = [
  {
    id: 'rhapsody-of-realities',
    name: 'Rhapsody of Realities',
    gradient: 'from-amber-600 via-orange-600 to-rose-700',
    icon: BookOpen,
    backgroundImage: '/partnerships/rhapsody-of-realities.png',
    imageClass: 'object-cover object-right',
    overlayClass: 'bg-gradient-to-r from-slate-900/85 via-slate-900/50 to-slate-900/30',
  },
  {
    id: 'healing-streams',
    name: 'Healing Streams',
    gradient: 'from-cyan-600 via-sky-600 to-blue-700',
    icon: HeartPulse,
    backgroundImage: '/partnerships/healing-streams.png',
    imageClass: 'object-cover object-center',
    overlayClass: 'bg-gradient-to-r from-slate-900/80 via-slate-900/45 to-slate-900/25',
  },
  {
    id: 'ministry-program',
    name: 'Ministry Program',
    gradient: 'from-emerald-600 via-teal-600 to-blue-700',
    icon: HeartHandshake,
    backgroundImage: '/partnerships/ministry-program.png',
    overlayClass: 'bg-gradient-to-r from-slate-900/85 via-slate-900/65 to-slate-900/75',
  },
  {
    id: 'bible-ministry',
    name: 'Bible Ministry',
    gradient: 'from-blue-700 via-indigo-600 to-violet-700',
    icon: BookMarked,
    backgroundImage: '/partnerships/bible-ministry.png',
    imageClass: 'object-cover object-center',
    overlayClass: 'bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-slate-900/30',
  },
  {
    id: 'radio-outreach',
    name: 'Radio Outreach',
    gradient: 'from-violet-600 via-purple-600 to-fuchsia-700',
    icon: Radio,
  },
  {
    id: 'welfare-department',
    name: 'Welfare Department',
    gradient: 'from-emerald-600 via-teal-600 to-green-700',
    icon: Building2,
  },
  {
    id: 'call-center',
    name: 'Call Center',
    gradient: 'from-amber-600 via-orange-500 to-rose-600',
    icon: PhoneCall,
  },
  {
    id: 'it-department',
    name: 'IT Department',
    gradient: 'from-slate-700 via-slate-600 to-blue-800',
    icon: Monitor,
  },
];

export const departmentsRouteByRole: Record<UserRole, string> = {
  MASTER_ADMIN: '/admin/departments',
  SCL: '/scl/departments',
  WELFARE: '/welfare/departments',
  FOLLOWUP: '/followup/departments',
  CALL_CENTER: '/callcenter/departments',
};

export function getDepartment(id: string): Department | undefined {
  return DEPARTMENTS.find((d) => d.id === id);
}

export function getDepartmentPath(role: UserRole, departmentId: string): string {
  return `${departmentsRouteByRole[role]}/${departmentId}`;
}

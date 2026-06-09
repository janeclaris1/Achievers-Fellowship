import {
  BookMarked,
  BookOpen,
  Building2,
  HeartHandshake,
  HeartPulse,
  Monitor,
  PhoneCall,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '../types';

export interface Department {
  id: string;
  name: string;
  tagline: string;
  description: string;
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
    tagline: 'Putting the Word in every home and heart.',
    description:
      'The Rhapsody of Realities department leads Bible distribution, devotional outreach, and sponsorship of the daily devotional across languages and nations.',
    gradient: 'from-amber-600 via-orange-600 to-rose-700',
    icon: BookOpen,
    backgroundImage: '/partnerships/rhapsody-of-realities.png',
    imageClass: 'object-cover object-right',
    overlayClass: 'bg-gradient-to-r from-slate-900/85 via-slate-900/50 to-slate-900/30',
  },
  {
    id: 'healing-streams',
    name: 'Healing Streams',
    tagline: 'Bringing healing and hope to nations.',
    description:
      'Healing Streams coordinates healing services, prayer campaigns, and outreach that ministers healing to families, communities, and nations.',
    gradient: 'from-cyan-600 via-sky-600 to-blue-700',
    icon: HeartPulse,
    backgroundImage: '/partnerships/healing-streams.png',
    imageClass: 'object-cover object-center',
    overlayClass: 'bg-gradient-to-r from-slate-900/80 via-slate-900/45 to-slate-900/25',
  },
  {
    id: 'ministry-program',
    name: 'Ministry Program',
    tagline: 'Support fellowship programs and member welfare.',
    description:
      'The Ministry Program department oversees church programs, fellowships, and initiatives that strengthen members and advance the vision of the church.',
    gradient: 'from-emerald-600 via-teal-600 to-blue-700',
    icon: HeartHandshake,
    backgroundImage: '/partnerships/ministry-program.png',
    overlayClass: 'bg-gradient-to-r from-slate-900/85 via-slate-900/65 to-slate-900/75',
  },
  {
    id: 'bible-ministry',
    name: 'Bible Ministry',
    tagline: 'Scripture distribution and outreach.',
    description:
      'Bible Ministry supports scripture distribution, Bible study resources, and outreach that helps people engage with the Word of God.',
    gradient: 'from-blue-700 via-indigo-600 to-violet-700',
    icon: BookMarked,
    backgroundImage: '/partnerships/bible-ministry.png',
    imageClass: 'object-cover object-center',
    overlayClass: 'bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-slate-900/30',
  },
  {
    id: 'welfare-department',
    name: 'Welfare Department',
    tagline: 'Pastoral care and member welfare.',
    description:
      'The Welfare Department cares for members through programs, prayer, visitation, birthdays, bereavement support, and practical member welfare.',
    gradient: 'from-emerald-600 via-teal-600 to-green-700',
    icon: Building2,
  },
  {
    id: 'call-center',
    name: 'Call Center',
    tagline: 'Member outreach and communication.',
    description:
      'The Call Center team reaches members through calls, SMS, WhatsApp, and follow-up notes — with a full activity log for every outreach.',
    gradient: 'from-amber-600 via-orange-500 to-rose-600',
    icon: PhoneCall,
  },
  {
    id: 'it-department',
    name: 'IT Department',
    tagline: 'Technology that serves the vision.',
    description:
      'The IT Department supports the fellowship portal, systems, and digital tools that help every department and member stay connected.',
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

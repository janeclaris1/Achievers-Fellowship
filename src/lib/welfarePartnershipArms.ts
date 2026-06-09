import { BookMarked, BookOpen, HeartHandshake, HeartPulse, Newspaper, type LucideIcon } from 'lucide-react';

export interface WelfarePartnershipArm {
  id: string;
  name: string;
  tagline: string;
  gradient: string;
  icon: LucideIcon;
  backgroundImage?: string;
  imageClass?: string;
  overlayClass?: string;
}

export const WELFARE_PARTNERSHIP_ARMS: WelfarePartnershipArm[] = [
  {
    id: 'rhapsody-of-realities',
    name: 'Rhapsody of Realities',
    tagline: 'Partner to put the Word in every home and heart.',
    gradient: 'from-amber-600 via-orange-600 to-rose-700',
    icon: BookOpen,
    backgroundImage: '/partnerships/rhapsody-of-realities.png',
    imageClass: 'object-cover object-right',
    overlayClass: 'bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-transparent',
  },
  {
    id: 'bible-ministry',
    name: 'Bible Ministry',
    tagline: 'Support Bible distribution and scripture outreach.',
    gradient: 'from-blue-700 via-indigo-600 to-violet-700',
    icon: BookMarked,
    backgroundImage: '/partnerships/bible-ministry.png',
    imageClass: 'object-cover object-center',
    overlayClass: 'bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-slate-900/30',
  },
  {
    id: 'ministry-program',
    name: 'Ministry Program',
    tagline: 'Be a Partner today — support fellowship programs, and member welfare.',
    gradient: 'from-emerald-600 via-teal-600 to-blue-700',
    icon: HeartHandshake,
    backgroundImage: '/partnerships/ministry-program.png',
    overlayClass: 'bg-gradient-to-r from-slate-900/85 via-slate-900/65 to-slate-900/75',
  },
  {
    id: 'loveword-news',
    name: 'Loveword News',
    tagline: 'Partner to spread the gospel through news and media outreach.',
    gradient: 'from-rose-600 via-fuchsia-600 to-purple-700',
    icon: Newspaper,
  },
  {
    id: 'healing-streams',
    name: 'Healing Streams',
    tagline: 'Partner to bring healing and hope to nations through Healing Streams.',
    gradient: 'from-cyan-600 via-sky-600 to-blue-700',
    icon: HeartPulse,
    backgroundImage: '/partnerships/healing-streams.png',
    imageClass: 'object-cover object-center',
    overlayClass: 'bg-gradient-to-r from-slate-900/80 via-slate-900/45 to-slate-900/25',
  },
];

export function getPartnershipArmName(id: string | null | undefined): string | null {
  if (!id) return null;
  return WELFARE_PARTNERSHIP_ARMS.find((arm) => arm.id === id)?.name ?? id;
}

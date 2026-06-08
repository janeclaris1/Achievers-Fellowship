import { BookMarked, BookOpen, HeartHandshake, type LucideIcon } from 'lucide-react';

export interface WelfarePartnershipArm {
  id: string;
  name: string;
  tagline: string;
  gradient: string;
  icon: LucideIcon;
}

export const WELFARE_PARTNERSHIP_ARMS: WelfarePartnershipArm[] = [
  {
    id: 'rhapsody-of-realities',
    name: 'Rhapsody of Realities',
    tagline: 'Partner to put the Word in every home and heart.',
    gradient: 'from-amber-600 via-orange-600 to-rose-700',
    icon: BookOpen,
  },
  {
    id: 'bible-ministry',
    name: 'Bible Ministry',
    tagline: 'Support Bible distribution and scripture outreach.',
    gradient: 'from-blue-700 via-indigo-600 to-violet-700',
    icon: BookMarked,
  },
  {
    id: 'ministry-program',
    name: 'Ministry Program',
    tagline: 'Be a Partner today — support fellowship programs, and member welfare.',
    gradient: 'from-emerald-600 via-teal-600 to-blue-700',
    icon: HeartHandshake,
  },
];

export function getPartnershipArmName(id: string | null | undefined): string | null {
  if (!id) return null;
  return WELFARE_PARTNERSHIP_ARMS.find((arm) => arm.id === id)?.name ?? id;
}

import type { LucideIcon } from 'lucide-react';
import { BookMarked, BookOpen, HeartHandshake, HeartPulse, Newspaper } from 'lucide-react';

export interface DepartmentProgramHighlight {
  id: string;
  name: string;
  tagline: string;
  description: string;
  gradient: string;
  icon: LucideIcon;
  backgroundImage?: string;
  imageClass?: string;
}

/** Ministry programs featured on the Radio Outreach landing page. */
export const RADIO_OUTREACH_PROGRAM_HIGHLIGHTS: DepartmentProgramHighlight[] = [
  {
    id: 'rhapsody-of-realities',
    name: 'Rhapsody of Realities',
    tagline: 'Putting the Word in every home and heart.',
    description:
      'Partner with us to distribute life-changing devotional material and reach families with the gospel through literature outreach.',
    gradient: 'from-amber-600 via-orange-600 to-rose-700',
    icon: BookOpen,
    backgroundImage: '/partnerships/rhapsody-of-realities.png',
    imageClass: 'object-cover object-right',
  },
  {
    id: 'healing-streams',
    name: 'Healing Streams',
    tagline: 'Healing and hope for nations.',
    description:
      'Join Healing Streams broadcasts and outreach that bring the healing power of God to communities around the world.',
    gradient: 'from-cyan-600 via-sky-600 to-blue-700',
    icon: HeartPulse,
    backgroundImage: '/partnerships/healing-streams.png',
    imageClass: 'object-cover object-center',
  },
  {
    id: 'ministry-program',
    name: 'Ministry Program',
    tagline: 'Programs that build people and strengthen welfare.',
    description:
      'Support fellowship programs, member care, and initiatives that help the church serve its community with excellence.',
    gradient: 'from-emerald-600 via-teal-600 to-blue-700',
    icon: HeartHandshake,
    backgroundImage: '/partnerships/ministry-program.png',
  },
  {
    id: 'bible-ministry',
    name: 'Bible Ministry',
    tagline: 'Scripture for every generation.',
    description:
      'Help place Bibles in hands that need them and fuel scripture-based outreach across our cells and communities.',
    gradient: 'from-blue-700 via-indigo-600 to-violet-700',
    icon: BookMarked,
    backgroundImage: '/partnerships/bible-ministry.png',
    imageClass: 'object-cover object-center',
  },
  {
    id: 'loveword-news',
    name: 'Loveword News',
    tagline: 'Gospel news and media outreach.',
    description:
      'Spread the good news through media platforms that inform, inspire, and connect listeners to the Word of God.',
    gradient: 'from-rose-600 via-fuchsia-600 to-purple-700',
    icon: Newspaper,
  },
];

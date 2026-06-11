import type { LucideIcon } from 'lucide-react';
import { BookMarked, BookOpen, HeartHandshake, HeartPulse, Newspaper } from 'lucide-react';

export type RadioProgramThumbnailVariant = 'default' | 'studio-hosts';

export interface RadioPreviousProgram {
  id: string;
  title: string;
  airedOn: string;
  summary: string;
  gradient: string;
  thumbnailImage?: string;
  thumbnailVariant?: RadioProgramThumbnailVariant;
  mediaUrl?: string;
}

export const RADIO_PROGRAM_THUMBNAIL = '/departments/radio-program-thumbnail.jpg';

/** Recent Radio Outreach broadcasts shown on the landing page. */
export const RADIO_OUTREACH_PREVIOUS_PROGRAMS: RadioPreviousProgram[] = [
  {
    id: 'gospel-hour-live',
    title: 'Gospel Hour Live',
    airedOn: 'January 2026',
    summary: 'An evening of worship, testimony, and the preaching of the gospel to listeners across the fellowship.',
    gradient: 'from-violet-600 via-purple-600 to-fuchsia-700',
    thumbnailVariant: 'studio-hosts',
  },
  {
    id: 'youth-voice-broadcast',
    title: 'Youth Voice Broadcast',
    airedOn: 'December 2025',
    summary: 'Young believers shared faith stories, scripture, and music that encouraged peers to stay rooted in Christ.',
    gradient: 'from-rose-600 via-fuchsia-600 to-purple-700',
  },
  {
    id: 'word-worship-session',
    title: 'Word & Worship Session',
    airedOn: 'November 2025',
    summary: 'A blended broadcast of praise, prayer, and teaching on living victoriously through the Word of God.',
    gradient: 'from-blue-700 via-indigo-600 to-violet-700',
    thumbnailVariant: 'studio-hosts',
  },
  {
    id: 'healing-streams-special',
    title: 'Healing Streams Radio Special',
    airedOn: 'October 2025',
    summary: 'A dedicated broadcast focused on healing, faith declarations, and testimonies of divine health.',
    gradient: 'from-cyan-600 via-sky-600 to-blue-700',
  },
  {
    id: 'rhapsody-partnership-broadcast',
    title: 'Rhapsody Partnership Broadcast',
    airedOn: 'September 2025',
    summary: 'Listeners were equipped to partner in spreading Rhapsody of Realities and reaching souls with literature.',
    gradient: 'from-amber-600 via-orange-600 to-rose-700',
    thumbnailVariant: 'studio-hosts',
  },
  {
    id: 'senior-cell-spotlight',
    title: 'Senior Cell Spotlight',
    airedOn: 'August 2025',
    summary: 'Cell leaders and members highlighted community outreach, soul winning, and fellowship growth stories.',
    gradient: 'from-emerald-600 via-teal-600 to-green-700',
  },
  {
    id: 'global-mission-hour',
    title: 'Global Mission Hour',
    airedOn: 'July 2025',
    summary: 'A missions-focused session calling the church to take the gospel to the absolute ends of the earth.',
    gradient: 'from-slate-700 via-slate-600 to-blue-800',
    thumbnailVariant: 'studio-hosts',
  },
  {
    id: 'faith-talk-friday',
    title: 'Faith Talk Friday',
    airedOn: 'June 2025',
    summary: 'Interactive discussions on faith, prayer, and practical Christian living for everyday believers.',
    gradient: 'from-violet-700 via-purple-700 to-indigo-800',
  },
  {
    id: 'easter-celebration-live',
    title: 'Easter Celebration Live',
    airedOn: 'April 2025',
    summary: 'A Resurrection Day broadcast celebrating Christ’s victory with worship, drama, and the Easter message.',
    gradient: 'from-rose-700 via-red-600 to-orange-600',
    thumbnailVariant: 'studio-hosts',
  },
];

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

import type { Gender, Member, MemberStatus } from '../types';

export const getPrefix = (gender: Gender): string =>
  gender === 'MALE' ? 'Bro' : 'Sis';

/** Infer gender from a name that starts with Bro / Sis / Sister */
export function inferGenderFromFullName(fullName: string): Gender | null {
  const lower = fullName.trim().toLowerCase();
  if (/^(sis|sister)\b/.test(lower)) return 'FEMALE';
  if (/^bro\b/.test(lower)) return 'MALE';
  return null;
}

export function getBroSisLabel(gender?: Gender | null, fullName?: string): 'Bro' | 'Sis' {
  if (gender === 'FEMALE') return 'Sis';
  if (gender === 'MALE') return 'Bro';
  const inferred = fullName ? inferGenderFromFullName(fullName) : null;
  if (inferred === 'FEMALE') return 'Sis';
  if (inferred === 'MALE') return 'Bro';
  return 'Bro';
}

export function getPartnershipFirstName(fullName?: string): string {
  const trimmed = fullName?.trim() || 'Partner';
  return trimmed.replace(/^(bro|sis|sister)\.?\s+/i, '').split(/\s+/)[0] || 'Partner';
}

/** e.g. "Esteem Bro John" or "Esteem Sis Mary" */
export function getPartnershipEsteemGreeting(fullName?: string, gender?: Gender | null): string {
  return `Esteem ${getBroSisLabel(gender, fullName)} ${getPartnershipFirstName(fullName)}`;
}

export const getMemberDisplayName = (member: Pick<Member, 'gender' | 'first_name' | 'last_name'>): string =>
  `${getPrefix(member.gender)} ${member.first_name} ${member.last_name}`;

export const getMemberInitials = (member: Pick<Member, 'first_name' | 'last_name'>): string =>
  `${member.first_name[0]}${member.last_name[0]}`.toUpperCase();

/** Welcome line for portal users after sign-in */
export const getPortalWelcomeMessage = (fullName: string, gender?: Gender | null): string => {
  const trimmed = fullName.trim();
  const lower = trimmed.toLowerCase();

  let title: 'Esteemed Bro' | 'Esteemed Sis' =
    gender === 'FEMALE' ? 'Esteemed Sis' : gender === 'MALE' ? 'Esteemed Bro' : 'Esteemed Bro';
  let name = trimmed;

  if (gender) {
    name = trimmed.replace(/^(bro|sis|sister)\.?\s+/i, '').trim() || trimmed;
  } else if (/^(sis|sister)\b/.test(lower)) {
    title = 'Esteemed Sis';
    name = trimmed.replace(/^(sis|sister)\.?\s+/i, '').trim();
  } else if (/^bro\b/.test(lower)) {
    title = 'Esteemed Bro';
    name = trimmed.replace(/^bro\.?\s+/i, '').trim();
  }

  return `Welcome back, ${title} ${name}`;
};

export const getStatusColor = (status: MemberStatus): string => {
  const colors: Record<MemberStatus, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    INACTIVE: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
    NEW_CONVERT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    TRANSFERRED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    DECEASED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  };
  return colors[status];
};

export const getStatusLabel = (status: MemberStatus): string => {
  const labels: Record<MemberStatus, string> = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    NEW_CONVERT: 'New Convert',
    TRANSFERRED: 'Transferred',
    DECEASED: 'Deceased',
  };
  return labels[status];
};

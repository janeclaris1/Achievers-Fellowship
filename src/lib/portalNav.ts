import type { UserRole } from '../types';

export type PortalId = 'admin' | 'scl' | 'welfare' | 'followup' | 'callcenter';

export function getPortalFromPath(pathname: string): PortalId | null {
  const match = pathname.match(/^\/(admin|scl|welfare|followup|callcenter)(\/|$)/);
  return match ? (match[1] as PortalId) : null;
}

export function canAccessPortal(role: UserRole, portal: PortalId): boolean {
  if (role === 'MASTER_ADMIN') return true;
  const roleByPortal: Record<PortalId, UserRole> = {
    admin: 'MASTER_ADMIN',
    scl: 'SCL',
    welfare: 'WELFARE',
    followup: 'FOLLOWUP',
    callcenter: 'CALL_CENTER',
  };
  return role === roleByPortal[portal];
}

/** Departments base path for the portal currently open in the URL. */
export function getDepartmentsBasePath(pathname: string, role: UserRole): string {
  const portal = getPortalFromPath(pathname);
  if (portal && canAccessPortal(role, portal)) {
    return `/${portal}/departments`;
  }
  const fallback: Record<UserRole, string> = {
    MASTER_ADMIN: '/admin/departments',
    SCL: '/scl/departments',
    WELFARE: '/welfare/departments',
    FOLLOWUP: '/followup/departments',
    CALL_CENTER: '/callcenter/departments',
  };
  return fallback[role];
}

export const portalSectionTitles: Record<PortalId, string> = {
  admin: 'Admin Portal',
  scl: 'SCL Portal',
  welfare: 'Welfare Portal',
  followup: 'Follow-up Portal',
  callcenter: 'Call Center',
};

export function getPortalSectionTitle(pathname: string, role: UserRole): string {
  const portal = getPortalFromPath(pathname);
  if (portal && canAccessPortal(role, portal)) {
    return portalSectionTitles[portal];
  }
  const roleTitles: Record<UserRole, string> = {
    MASTER_ADMIN: 'Admin Portal',
    SCL: 'SCL Portal',
    WELFARE: 'Welfare Portal',
    FOLLOWUP: 'Follow-up Portal',
    CALL_CENTER: 'Call Center',
  };
  return roleTitles[role];
}

export function canUseCallCenterTools(role: UserRole | undefined): boolean {
  return role === 'CALL_CENTER' || role === 'MASTER_ADMIN';
}

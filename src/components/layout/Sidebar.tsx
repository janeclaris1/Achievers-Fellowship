import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCheck, Heart, Phone, Bell,
  Settings, FileText, Building2, ClipboardList, Calendar,
  BookOpen, MessageSquare, PhoneCall, BarChart3, ArrowRightLeft,
  Shield, UserCog, Inbox, Activity, Trophy, HandCoins, CalendarDays, KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import { CHURCH_NAME } from '../../lib/branding';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  to: string;
}

const adminNav: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, to: '/admin/dashboard' },
  { label: 'Top Soul Winners', icon: <Trophy size={18} />, to: '/admin/soul-winners' },
  { label: 'Events & Programs', icon: <CalendarDays size={18} />, to: '/admin/events' },
  { label: 'Reflections', icon: <BookOpen size={18} />, to: '/admin/reflections' },
  { label: 'Top Partners', icon: <HandCoins size={18} />, to: '/admin/partnerships' },
  { label: 'User Management', icon: <UserCog size={18} />, to: '/admin/users' },
  { label: 'Password Requests', icon: <KeyRound size={18} />, to: '/admin/password-requests' },
  { label: 'Senior Cells', icon: <Building2 size={18} />, to: '/admin/cell-groups' },
  { label: 'All Members', icon: <Users size={18} />, to: '/admin/members' },
  { label: 'Bulk Messaging', icon: <MessageSquare size={18} />, to: '/admin/bulk-messaging' },
  { label: 'Transfers', icon: <ArrowRightLeft size={18} />, to: '/admin/transfers' },
  { label: 'Audit Logs', icon: <Shield size={18} />, to: '/admin/audit-logs' },
  { label: 'Reports', icon: <BarChart3 size={18} />, to: '/admin/reports' },
  { label: 'Settings', icon: <Settings size={18} />, to: '/admin/settings' },
];

const sclNav: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, to: '/scl/dashboard' },
  { label: 'Events & Programs', icon: <CalendarDays size={18} />, to: '/scl/events' },
  { label: 'Reflections', icon: <BookOpen size={18} />, to: '/scl/reflections' },
  { label: 'My Members', icon: <Users size={18} />, to: '/scl/members' },
  { label: 'Attendance', icon: <UserCheck size={18} />, to: '/scl/attendance' },
  { label: 'Birthday Calendar', icon: <Calendar size={18} />, to: '/scl/birthdays' },
  { label: 'Follow-up View', icon: <ClipboardList size={18} />, to: '/scl/followups' },
  { label: 'Notifications', icon: <Bell size={18} />, to: '/scl/notifications' },
];

const welfareNav: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, to: '/welfare/dashboard' },
  { label: 'Events & Programs', icon: <CalendarDays size={18} />, to: '/welfare/events' },
  { label: 'Reflections', icon: <BookOpen size={18} />, to: '/welfare/reflections' },
  { label: 'Member Database', icon: <Users size={18} />, to: '/welfare/members' },
  { label: 'Birthdays', icon: <Heart size={18} />, to: '/welfare/birthdays' },
  { label: 'Programs', icon: <Activity size={18} />, to: '/welfare/programs' },
  { label: 'Calendar', icon: <Calendar size={18} />, to: '/welfare/calendar' },
  { label: 'Prayer Requests', icon: <BookOpen size={18} />, to: '/welfare/prayer-requests' },
  { label: 'Bulk Messaging', icon: <MessageSquare size={18} />, to: '/welfare/bulk-sms' },
  { label: 'Reports', icon: <BarChart3 size={18} />, to: '/welfare/reports' },
];

const followupNav: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, to: '/followup/dashboard' },
  { label: 'Events & Programs', icon: <CalendarDays size={18} />, to: '/followup/events' },
  { label: 'Reflections', icon: <BookOpen size={18} />, to: '/followup/reflections' },
  { label: 'Follow-up List', icon: <ClipboardList size={18} />, to: '/followup/list' },
  { label: 'Visitations', icon: <Calendar size={18} />, to: '/followup/visitations' },
  { label: 'Reports', icon: <FileText size={18} />, to: '/followup/reports' },
];

const callCenterNav: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, to: '/callcenter/dashboard' },
  { label: 'Events & Programs', icon: <CalendarDays size={18} />, to: '/callcenter/events' },
  { label: 'Reflections', icon: <BookOpen size={18} />, to: '/callcenter/reflections' },
  { label: 'Make a Call', icon: <PhoneCall size={18} />, to: '/callcenter/call' },
  { label: 'Send SMS', icon: <MessageSquare size={18} />, to: '/callcenter/sms' },
  { label: 'Call History', icon: <Phone size={18} />, to: '/callcenter/history' },
  { label: 'Bulk SMS', icon: <Inbox size={18} />, to: '/callcenter/bulk-sms' },
  { label: 'Reports', icon: <BarChart3 size={18} />, to: '/callcenter/reports' },
];

const navByRole: Record<string, NavItem[]> = {
  MASTER_ADMIN: adminNav,
  SCL: sclNav,
  WELFARE: welfareNav,
  FOLLOWUP: followupNav,
  CALL_CENTER: callCenterNav,
};

const roleSectionTitle: Record<string, string> = {
  MASTER_ADMIN: 'Admin Portal',
  SCL: 'SCL Portal',
  WELFARE: 'Welfare Portal',
  FOLLOWUP: 'Follow-up Portal',
  CALL_CENTER: 'Call Center',
};

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open = true, onClose }) => {
  const { profile } = useAuth();
  const navItems = profile?.role ? navByRole[profile.role] || [] : [];
  const sectionTitle = profile?.role ? roleSectionTitle[profile.role] : 'Portal';

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-16 bottom-0 w-60 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-40 flex flex-col transition-transform duration-200 overflow-y-auto',
          'lg:translate-x-0 lg:static lg:top-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {sectionTitle}
          </p>
        </div>

        <nav className="flex-1 px-2 py-1 space-y-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => cn('sidebar-link', isActive && 'active')}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-slate-100 dark:border-slate-700">
          <p className="text-[10px] text-slate-400">
            {CHURCH_NAME}
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

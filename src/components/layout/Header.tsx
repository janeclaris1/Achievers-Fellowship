import React from 'react';
import { Moon, Sun, LogOut, Menu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../shared/NotificationBell';
import ChurchLogo from '../shared/ChurchLogo';
import { CHURCH_SHORT_NAME } from '../../lib/branding';
import { cn } from '../../utils/cn';

const roleLabels: Record<string, string> = {
  MASTER_ADMIN: 'Master Admin',
  SCL: 'Cell Leader',
  WELFARE: 'Welfare',
  FOLLOWUP: 'Follow-up',
  CALL_CENTER: 'Call Center',
};

const roleColors: Record<string, string> = {
  MASTER_ADMIN: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  SCL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  WELFARE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  FOLLOWUP: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  CALL_CENTER: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { theme, toggleTheme } = useTheme();
  const { profile, signOut } = useAuth();

  const displayName = profile?.full_name || 'User';

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-40">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-[8px] lg:hidden text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-3 flex-1">
        <ChurchLogo className="h-9 w-auto object-contain hidden sm:block" />
        <div className="hidden sm:block">
          <span className="font-heading font-bold text-slate-900 dark:text-slate-100 text-sm">{CHURCH_SHORT_NAME}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />

        <button
          onClick={toggleTheme}
          className="p-2 rounded-[8px] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
          <div className="w-8 h-8 rounded-full bg-blue-900 dark:bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
                {displayName}
              </span>
            </div>
            {profile?.role && (
              <span className={cn('badge text-[10px]', roleColors[profile.role])}>
                {roleLabels[profile.role]}
              </span>
            )}
          </div>
          <button
            onClick={signOut}
            className="p-1.5 rounded-[6px] text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors ml-1"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

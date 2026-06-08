import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPortalWelcomeMessage } from '../../utils/memberUtils';
import TypingWelcome from './TypingWelcome';

interface PortalWelcomeHeaderProps {
  subtitle?: string;
}

const PortalWelcomeHeader: React.FC<PortalWelcomeHeaderProps> = ({ subtitle }) => {
  const { profile } = useAuth();
  const message = profile?.full_name
    ? getPortalWelcomeMessage(profile.full_name)
    : 'Welcome back';

  return (
    <div>
      <TypingWelcome text={message} />
      {subtitle && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">{subtitle}</p>
      )}
    </div>
  );
};

export default PortalWelcomeHeader;

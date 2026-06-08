import React from 'react';
import { cn } from '../../utils/cn';

interface AuthorAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

const AuthorAvatar: React.FC<AuthorAvatarProps> = ({ name, avatarUrl, size = 'md', className }) => {
  const sizeClass = sizeClasses[size];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn('rounded-full object-cover flex-shrink-0 bg-slate-100', sizeClass, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0 font-semibold',
        'bg-gradient-to-br from-blue-500 to-violet-600 text-white',
        sizeClass,
        className
      )}
      aria-hidden
    >
      {initials(name) || '?'}
    </div>
  );
};

export default AuthorAvatar;

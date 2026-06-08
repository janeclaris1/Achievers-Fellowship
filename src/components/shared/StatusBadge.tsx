import React from 'react';
import { cn } from '../../utils/cn';
import { getStatusColor, getStatusLabel } from '../../utils/memberUtils';
import type { MemberStatus } from '../../types';

interface StatusBadgeProps {
  status: MemberStatus;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => (
  <span className={cn('badge', getStatusColor(status), className)}>
    {getStatusLabel(status)}
  </span>
);

export default StatusBadge;

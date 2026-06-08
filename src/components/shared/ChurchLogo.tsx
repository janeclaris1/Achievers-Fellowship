import React from 'react';
import { CHURCH_NAME, LOGO_PATH } from '../../lib/branding';
import { cn } from '../../utils/cn';

interface ChurchLogoProps {
  className?: string;
  alt?: string;
}

const ChurchLogo: React.FC<ChurchLogoProps> = ({
  className,
  alt = CHURCH_NAME,
}) => (
  <img
    src={LOGO_PATH}
    alt={alt}
    className={cn('h-10 w-auto object-contain bg-transparent', className)}
  />
);

export default ChurchLogo;

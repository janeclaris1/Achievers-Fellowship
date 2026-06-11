import React from 'react';
import { cn } from '../../utils/cn';

interface RadioProgramThumbnailProps {
  imageSrc?: string;
  alt: string;
  className?: string;
}

const RadioProgramThumbnail: React.FC<RadioProgramThumbnailProps> = ({
  imageSrc,
  alt,
  className,
}) => (
  <img
    src={imageSrc}
    alt={alt}
    className={cn('h-full w-full object-cover', className)}
  />
);

export default RadioProgramThumbnail;

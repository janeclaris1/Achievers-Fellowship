import React from 'react';
import { Mic } from 'lucide-react';
import type { RadioProgramThumbnailVariant } from '../../lib/departmentPrograms';
import { cn } from '../../utils/cn';

export const RADIO_HOST_SISTER_IMAGE = '/departments/hosts/sister-host.png';
export const RADIO_HOST_BROTHER_IMAGE = '/departments/hosts/brother-host.png';

interface RadioProgramThumbnailProps {
  variant?: RadioProgramThumbnailVariant;
  imageSrc?: string;
  alt: string;
  className?: string;
}

const RadioProgramThumbnail: React.FC<RadioProgramThumbnailProps> = ({
  variant = 'default',
  imageSrc,
  alt,
  className,
}) => {
  if (variant === 'studio-hosts') {
    return (
      <div
        className={cn(
          'relative h-full w-full overflow-hidden bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900',
          className
        )}
      >
        <img
          src="/departments/radio-outreach-hero.png"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 grid grid-cols-2">
          <div className="relative overflow-hidden border-r border-white/20">
            <img
              src={RADIO_HOST_SISTER_IMAGE}
              alt=""
              aria-hidden
              className="h-full w-full object-cover object-[center_18%] scale-110"
            />
          </div>
          <div className="relative overflow-hidden">
            <img
              src={RADIO_HOST_BROTHER_IMAGE}
              alt=""
              aria-hidden
              className="h-full w-full object-cover object-[center_12%] scale-105"
            />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-slate-900/30" />
        <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-rose-600/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
          <Mic size={11} />
          Achievers Radio
        </div>
        <span className="sr-only">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={cn('h-full w-full object-cover', className)}
    />
  );
};

export default RadioProgramThumbnail;

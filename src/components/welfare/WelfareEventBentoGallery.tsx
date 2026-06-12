import React from 'react';
import type { ProgramGalleryImage } from '../../lib/welfarePrograms';
import { cn } from '../../utils/cn';

interface WelfareEventBentoGalleryProps {
  images: ProgramGalleryImage[];
  className?: string;
}

function distributeToColumns(images: ProgramGalleryImage[]): ProgramGalleryImage[][] {
  const columns: ProgramGalleryImage[][] = [[], [], []];
  images.forEach((image, index) => {
    columns[index % 3].push(image);
  });
  return columns;
}

const WelfareEventBentoGallery: React.FC<WelfareEventBentoGalleryProps> = ({
  images,
  className,
}) => {
  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className={cn('overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900', className)}>
        <img src={images[0].url} alt="" className="block w-full h-auto" />
      </div>
    );
  }

  if (images.length === 2) {
    return (
      <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2', className)}>
        {images.map((image) => (
          <div
            key={image.url}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
          >
            <img src={image.url} alt="" className="block w-full h-auto" />
          </div>
        ))}
      </div>
    );
  }

  const columns = distributeToColumns(images);

  return (
    <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-3', className)}>
      {columns.map((column, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-3">
          {column.map((image) => (
            <div
              key={image.url}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
            >
              <img src={image.url} alt={image.caption ?? ''} className="block w-full h-auto" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default WelfareEventBentoGallery;

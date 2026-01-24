import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  gradient?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  onClick,
  hover = true,
  gradient = false,
}) => {
  const Component = onClick ? motion.div : 'div';
  const motionProps = onClick
    ? {
        whileHover: hover ? { scale: 1.01, y: -2 } : undefined,
        whileTap: { scale: 0.99 },
      }
    : {};

  return (
    <Component
      className={cn(
        'rounded-xl sm:rounded-2xl p-3 sm:p-4',
        'bg-white dark:bg-gray-800',
        'border border-gray-100 dark:border-gray-700',
        'shadow-sm',
        hover && 'transition-shadow duration-200 hover:shadow-md',
        onClick && 'cursor-pointer',
        gradient && 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900',
        className
      )}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </Component>
  );
};

// Spezielle Variante für Projekte
interface ProjectCardProps {
  title: string;
  subtitle: string;
  address: string;
  status: 'active' | 'completed' | 'paused' | 'archived';
  imageUrl?: string;
  reportsCount?: number;
  onClick?: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  subtitle,
  address,
  status,
  imageUrl,
  reportsCount,
  onClick,
}) => {
  const statusColors = {
    active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    completed: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600',
    paused: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    archived: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  };

  const statusLabels = {
    active: 'Aktiv',
    completed: 'Fertig',
    paused: 'Pause',
    archived: 'Archiviert',
  };

  return (
    <Card onClick={onClick} className="overflow-hidden p-0">
      {imageUrl && (
        <div className="h-24 sm:h-32 overflow-hidden bg-gray-100 dark:bg-gray-700">
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 text-sm sm:text-base min-w-0 flex-1">
            {title}
          </h3>
          <span
            className={cn(
              'px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full border flex-shrink-0',
              statusColors[status]
            )}
          >
            {statusLabels[status]}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1 truncate">{subtitle}</p>
        <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 line-clamp-1">{address}</p>
        {reportsCount !== undefined && (
          <p className="text-[10px] sm:text-xs text-primary-600 dark:text-primary-400 mt-1.5 sm:mt-2 font-medium">
            {reportsCount} Berichte
          </p>
        )}
      </div>
    </Card>
  );
};

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-medium rounded-xl
    transition-all duration-200
    touch-manipulation
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-offset-2
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-primary-600 to-primary-500
      text-white
      hover:from-primary-700 hover:to-primary-600
      active:from-primary-800 active:to-primary-700
      focus:ring-primary-500
      shadow-lg shadow-primary-500/25
    `,
    secondary: `
      bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200
      hover:bg-gray-200 dark:hover:bg-gray-600
      active:bg-gray-300 dark:active:bg-gray-500
      focus:ring-gray-400
    `,
    danger: `
      bg-gradient-to-r from-red-600 to-red-500
      text-white
      hover:from-red-700 hover:to-red-600
      focus:ring-red-500
      shadow-lg shadow-red-500/25
    `,
    ghost: `
      bg-transparent text-gray-700 dark:text-gray-300
      hover:bg-gray-100 dark:hover:bg-gray-800
      active:bg-gray-200 dark:active:bg-gray-700
      focus:ring-gray-400
    `,
    outline: `
      bg-transparent
      border-2 border-primary-500 text-primary-600 dark:text-primary-400
      hover:bg-primary-50 dark:hover:bg-primary-900/30
      active:bg-primary-100 dark:active:bg-primary-900/50
      focus:ring-primary-500
    `,
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-base min-h-[44px]',
    lg: 'px-6 py-4 text-lg min-h-[52px]',
  };

  // Extract motion-incompatible props and pass only valid ones
  const { onAnimationStart, onDrag, onDragEnd, onDragStart, ...buttonProps } = props;

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...buttonProps}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </motion.button>
  );
};

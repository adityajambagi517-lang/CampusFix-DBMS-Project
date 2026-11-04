'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'emerald' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const GlowButton: React.FC<GlowButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'emerald':
        return 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-glow-emerald hover:from-emerald-400 hover:to-teal-500 border border-emerald-400/30';
      case 'danger':
        return 'bg-gradient-to-r from-rose-600 to-red-700 text-white shadow-lg hover:from-rose-500 hover:to-red-600 border border-rose-500/30';
      case 'secondary':
        return 'bg-slate-800/90 text-slate-100 border border-slate-700 hover:bg-slate-700/80 hover:border-slate-600';
      case 'ghost':
        return 'bg-transparent text-slate-300 hover:text-white hover:bg-white/5 border border-transparent';
      case 'primary':
      default:
        return 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white shadow-glow-cyan hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 border border-sky-400/30';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-xs font-medium rounded-lg gap-1.5';
      case 'lg':
        return 'px-6 py-3.5 text-base font-semibold rounded-xl gap-2.5';
      case 'md':
      default:
        return 'px-4 py-2.5 text-sm font-medium rounded-xl gap-2';
    }
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      disabled={disabled || isLoading}
      className={`relative inline-flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      {...(props as any)}
    >
      {isLoading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </motion.button>
  );
};

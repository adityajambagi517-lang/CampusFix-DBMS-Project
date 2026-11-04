'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      icon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const getVariant = () => {
      switch (variant) {
        case 'secondary':
          return 'bg-slate-800 text-slate-100 border border-slate-700/80 hover:bg-slate-700 hover:border-slate-600 focus-visible:ring-slate-500';
        case 'outline':
          return 'bg-transparent text-slate-200 border border-white/10 hover:bg-white/5 hover:border-white/20 focus-visible:ring-brand-500';
        case 'ghost':
          return 'bg-transparent text-slate-300 hover:text-white hover:bg-white/5 focus-visible:ring-brand-500';
        case 'danger':
          return 'bg-rose-600 text-white border border-rose-500/30 hover:bg-rose-500 shadow-glow-rose focus-visible:ring-rose-500';
        case 'success':
          return 'bg-emerald-600 text-white border border-emerald-500/30 hover:bg-emerald-500 shadow-glow-emerald focus-visible:ring-emerald-500';
        case 'primary':
        default:
          return 'bg-brand-600 text-white border border-brand-500/30 hover:bg-brand-500 shadow-glow-primary focus-visible:ring-brand-500';
      }
    };

    const getSize = () => {
      switch (size) {
        case 'sm':
          return 'px-3 py-1.5 text-xs font-medium rounded-lg gap-1.5';
        case 'lg':
          return 'px-6 py-3 text-base font-semibold rounded-xl gap-2.5';
        case 'md':
        default:
          return 'px-4 py-2 text-sm font-medium rounded-xl gap-2';
      }
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 select-none ${getVariant()} ${getSize()} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          icon && <span className="flex-shrink-0" aria-hidden="true">{icon}</span>
        )}
        <span>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';

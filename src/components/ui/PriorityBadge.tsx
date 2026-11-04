'use client';

import React from 'react';
import { ComplaintPriority } from '@/types';
import { AlertCircle, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';

interface PriorityBadgeProps {
  priority: ComplaintPriority | string;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = '' }) => {
  const getStyle = () => {
    switch (priority) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-glow-rose',
          icon: <AlertCircle className="w-3 h-3 text-rose-400" />,
          label: 'Critical',
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
          icon: <ArrowUp className="w-3 h-3 text-orange-400" />,
          label: 'High',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          icon: <AlertTriangle className="w-3 h-3 text-amber-400" />,
          label: 'Medium',
        };
      case 'LOW':
      default:
        return {
          bg: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
          icon: <ArrowDown className="w-3 h-3 text-slate-400" />,
          label: 'Low',
        };
    }
  };

  const style = getStyle();

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border select-none ${style.bg} ${className}`}
      aria-label={`Priority: ${style.label}`}
    >
      {style.icon}
      <span>{style.label}</span>
    </span>
  );
};


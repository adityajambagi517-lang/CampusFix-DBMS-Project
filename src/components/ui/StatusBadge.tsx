'use client';

import React from 'react';
import { ComplaintStatus } from '@/types';

interface StatusBadgeProps {
  status: ComplaintStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStyle = () => {
    switch (status) {
      case 'OPEN':
        return {
          bg: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
          dot: 'bg-sky-400',
          label: 'Open',
        };
      case 'ASSIGNED':
        return {
          bg: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
          dot: 'bg-purple-400',
          label: 'Assigned',
        };
      case 'IN_PROGRESS':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
          dot: 'bg-amber-400 animate-pulse',
          label: 'In Progress',
        };
      case 'RESOLVED':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
          dot: 'bg-emerald-400',
          label: 'Resolved',
        };
      case 'ESCALATED':
        return {
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
          dot: 'bg-rose-400 animate-ping',
          label: 'Escalated',
        };
      case 'CLOSED':
      default:
        return {
          bg: 'bg-slate-500/10 text-slate-400 border-slate-500/25',
          dot: 'bg-slate-400',
          label: status || 'Closed',
        };
    }
  };

  const style = getStyle();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide select-none ${style.bg} ${className}`}
      role="status"
      aria-label={`Status: ${style.label}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      <span>{style.label}</span>
    </span>
  );
};

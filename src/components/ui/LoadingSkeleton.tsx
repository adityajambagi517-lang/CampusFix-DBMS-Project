'use client';

import React from 'react';

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-3 animate-pulse ${className}`} role="status" aria-label="Loading content">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-white/5 rounded-lg border border-white/5"
          style={{ width: `${100 - (i % 3) * 15}%` }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-2 p-4 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-white/5 rounded-xl border border-white/5 flex items-center px-4 gap-4">
          <div className="w-8 h-3 bg-white/10 rounded" />
          <div className="w-48 h-3 bg-white/10 rounded" />
          <div className="w-24 h-3 bg-white/10 rounded" />
          <div className="w-16 h-3 bg-white/10 rounded ml-auto" />
        </div>
      ))}
    </div>
  );
};

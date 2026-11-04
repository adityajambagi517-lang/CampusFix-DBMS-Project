'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ children, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-[220px] ${className}`}>
      {children}
    </div>
  );
};

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3;
  rowSpan?: 1 | 2;
  headerIcon?: React.ReactNode;
  title?: string;
  description?: string;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  className = '',
  colSpan = 1,
  rowSpan = 1,
  headerIcon,
  title,
  description,
}) => {
  const getColSpan = () => {
    switch (colSpan) {
      case 2:
        return 'md:col-span-2';
      case 3:
        return 'md:col-span-2 lg:col-span-3';
      default:
        return 'col-span-1';
    }
  };

  const getRowSpan = () => {
    switch (rowSpan) {
      case 2:
        return 'row-span-2';
      default:
        return 'row-span-1';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`glass-card p-6 flex flex-col justify-between rounded-2xl relative overflow-hidden group hover:border-sky-500/30 transition-all duration-300 ${getColSpan()} ${getRowSpan()} ${className}`}
    >
      {(headerIcon || title) && (
        <div className="flex items-start justify-between mb-3 z-10">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-slate-100 group-hover:text-sky-400 transition-colors">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {headerIcon && (
            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-sky-400 shadow-sm flex-shrink-0 ml-3">
              {headerIcon}
            </div>
          )}
        </div>
      )}
      <div className="relative z-10 h-full flex flex-col justify-end">
        {children}
      </div>
      {/* Subtle corner sheen */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-sky-500/5 blur-2xl group-hover:bg-sky-500/10 transition-colors pointer-events-none" />
    </motion.div>
  );
};

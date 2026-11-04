'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AmbientGlowProps {
  className?: string;
  variant?: 'cyber' | 'emerald' | 'amber' | 'multi';
}

export const AmbientGlow: React.FC<AmbientGlowProps> = ({ 
  className = '', 
  variant = 'cyber' 
}) => {
  const getGradient = () => {
    switch (variant) {
      case 'emerald':
        return 'from-emerald-500/20 via-teal-500/10 to-transparent';
      case 'amber':
        return 'from-amber-500/20 via-orange-500/10 to-transparent';
      case 'multi':
        return 'from-cyan-500/20 via-indigo-500/15 to-emerald-500/15';
      case 'cyber':
      default:
        return 'from-sky-500/20 via-indigo-600/15 to-transparent';
    }
  };

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.35, 0.55, 0.35],
          x: [0, 20, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br ${getGradient()} blur-3xl`}
      />
      <motion.div
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, -30, 0],
          y: [0, 25, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
        className="absolute top-1/2 -right-40 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl"
      />
      <div className="absolute inset-0 bg-cyber-grid opacity-60" />
    </div>
  );
};

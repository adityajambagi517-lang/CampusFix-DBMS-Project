'use client';

import React from 'react';
import { Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SimilarityBadgeProps {
  score: number; // 0.0 to 1.0
  className?: string;
  showText?: boolean;
}

export const SimilarityBadge: React.FC<SimilarityBadgeProps> = ({
  score,
  className = '',
  showText = true,
}) => {
  const percentage = Math.round(score * 100);

  // Status mapping based on pgvector cosine similarity
  let color = 'text-sky-400 bg-sky-950/60 border-sky-500/30';
  let Icon = Sparkles;
  let label = 'Related Context';

  if (percentage >= 80) {
    color = 'text-rose-400 bg-rose-950/60 border-rose-500/40 shadow-glow-rose';
    Icon = AlertTriangle;
    label = 'Likely Duplicate';
  } else if (percentage >= 60) {
    color = 'text-amber-400 bg-amber-950/60 border-amber-500/40';
    Icon = AlertTriangle;
    label = 'High Similarity';
  } else if (percentage >= 40) {
    color = 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30';
    Icon = ShieldCheck;
    label = 'Moderate Match';
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium backdrop-blur-md transition-all ${color} ${className}`}
      title={`pgvector 384-D Cosine Similarity: ${score.toFixed(4)}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="font-semibold tabular-nums">{percentage}% Match</span>
      {showText && <span className="text-[11px] opacity-80">· {label}</span>}
    </div>
  );
};

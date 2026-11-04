'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wrench, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  ArrowRight, 
  Play, 
  Check, 
  AlertCircle,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { Complaint } from '@/types';
import { AmbientGlow } from '@/components/ui/AmbientGlow';
import { GlowButton } from '@/components/ui/GlowButton';

export default function StaffDashboard() {
  const [tasks, setTasks] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [resolveModalId, setResolveModalId] = useState<number | null>(null);
  const [resolutionRemarks, setResolutionRemarks] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/complaints?my=true');
      const data = await res.json();
      if (data.complaints) {
        setTasks(data.complaints);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (complaintId: number, newStatus: string, remarks?: string) => {
    setUpdatingId(complaintId);
    try {
      const res = await fetch(`/api/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, remarks: remarks || `Technician updated status to ${newStatus}` }),
      });

      if (res.ok) {
        setResolveModalId(null);
        setResolutionRemarks('');
        loadTasks();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'ALL') return true;
    return t.status === filter;
  });

  return (
    <div className="relative min-h-[calc(100vh-6rem)] space-y-8 py-6 pb-20">
      <AmbientGlow variant="amber" />

      {/* Header & Skiper UI Control Bar */}
      <div className="relative z-10 glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-400/30 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Technician Dispatch Queue</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Wrench className="w-7 h-7 text-amber-400" />
              <span>Maintenance Workstation</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Live trade work orders, automated SLA countdowns, and instant atomic resolution.
            </p>
          </div>

          {/* Skiper UI Segmented Control Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/80 border border-white/10">
            {(['ALL', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filter === tab
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Task Cards */}
      <div className="relative z-10 space-y-4">
        {loading ? (
          <div className="glass-panel rounded-3xl p-12 text-center text-slate-400">
            Fetching assigned work orders from PostgreSQL...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center border border-white/10 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <p className="font-semibold text-white">No work orders matching &ldquo;{filter}&rdquo;</p>
            <p className="text-xs text-slate-400">All tasks in this category are up to date.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredTasks.map((task) => (
              <motion.div
                key={task.complaint_id}
                whileHover={{ scale: 1.005 }}
                className="glass-card p-6 rounded-2xl border border-white/10 hover:border-amber-500/40 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-white/5">
                        #{task.complaint_id}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        task.status === 'IN_PROGRESS' 
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : task.status === 'RESOLVED'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                      }`}>
                        {task.status}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        task.priority === 'CRITICAL'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : task.priority === 'HIGH'
                          ? 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}>
                        {task.priority} Priority
                      </span>
                      <span className="text-xs text-slate-400 bg-slate-800/60 px-2.5 py-0.5 rounded-full border border-white/5">
                        {task.category_name}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white pt-1">
                      {task.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {task.description}
                    </p>
                  </div>

                  {/* SLA Badge */}
                  <div className="sm:text-right flex-shrink-0">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-semibold ${
                      task.sla_status === 'BREACHED'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      {task.sla_status === 'BREACHED' ? 'SLA Breached' : 'On Schedule'}
                    </span>
                    {task.sla_due_at && (
                      <div className="text-[11px] text-slate-400 font-mono pt-1.5">
                        Due: {new Date(task.sla_due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Location & Reporter Info Strip */}
                <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-white/5">
                  <span className="flex items-center gap-1.5 font-medium text-amber-300">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    {task.building} · Floor {task.floor} · Room {task.room}
                  </span>
                  <span>
                    Reported by: <strong className="text-white">{task.reporter_name}</strong>
                  </span>
                  <span>
                    Logged: {new Date(task.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Tactile Action Triggers */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                  <Link
                    href={`/complaints/${task.complaint_id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                  >
                    <span>View Discussion & Timeline</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <div className="flex items-center gap-2">
                    {task.status === 'ASSIGNED' && (
                      <GlowButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleStatusChange(task.complaint_id, 'IN_PROGRESS')}
                        isLoading={updatingId === task.complaint_id}
                        icon={<Play className="w-3.5 h-3.5" />}
                      >
                        Start Work (In Progress)
                      </GlowButton>
                    )}

                    {task.status === 'IN_PROGRESS' && (
                      <GlowButton
                        variant="emerald"
                        size="sm"
                        onClick={() => setResolveModalId(task.complaint_id)}
                        isLoading={updatingId === task.complaint_id}
                        icon={<Check className="w-3.5 h-3.5" />}
                      >
                        Mark Task Resolved
                      </GlowButton>
                    )}
                  </div>
                </div>

                {/* Inline Resolution Modal (Animmaster Slide) */}
                <AnimatePresence>
                  {resolveModalId === task.complaint_id && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-500/30 space-y-3"
                    >
                      <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Confirm Work Completion (fn_resolve_complaint)</span>
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Enter technician remarks (e.g., Replaced faulty capacitor, safety inspection complete)..."
                        value={resolutionRemarks}
                        onChange={(e) => setResolutionRemarks(e.target.value)}
                        className="w-full text-xs p-3 bg-slate-900/90 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                      />
                      <div className="flex justify-end gap-2.5">
                        <GlowButton
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setResolveModalId(null)}
                        >
                          Cancel
                        </GlowButton>
                        <GlowButton
                          type="button"
                          variant="emerald"
                          size="sm"
                          onClick={() => handleStatusChange(task.complaint_id, 'RESOLVED', resolutionRemarks)}
                          isLoading={updatingId === task.complaint_id}
                        >
                          Submit Resolution
                        </GlowButton>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

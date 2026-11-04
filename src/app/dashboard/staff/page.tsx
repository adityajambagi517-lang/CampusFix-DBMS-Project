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
  Sparkles,
  Calendar
} from 'lucide-react';
import { Complaint } from '@/types';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

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
        if (newStatus === 'RESOLVED') {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#10b981', '#38bdf8', '#6366f1']
          });
        }
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
    <div className="space-y-8 pb-16">
      
      {/* Header & Segmented Filter Bar */}
      <div className="saas-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Technician Workstation Queue</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Wrench className="w-6 h-6 text-amber-400" />
              <span>Maintenance Work Orders</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Assigned facility orders with live SLA timers and atomic resolution execution.
            </p>
          </div>

          {/* Segmented Control Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 self-start sm:self-center">
            {(['ALL', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === tab
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Work Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="saas-card p-8">
            <LoadingSkeleton lines={4} />
          </div>
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title={`No work orders matching "${filter.replace('_', ' ')}"`}
            description="All facility orders in this category have been attended to."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredTasks.map((task) => (
              <div
                key={task.complaint_id}
                className="saas-card p-6 hover:border-amber-500/30 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                        #{task.complaint_id}
                      </span>
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                      <span className="text-xs text-slate-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
                        {task.category_name}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white pt-1">
                      {task.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {task.description}
                    </p>
                  </div>

                  {/* SLA Countdown Badge */}
                  <div className="sm:text-right flex-shrink-0">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${
                      task.sla_status === 'BREACHED'
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 animate-pulse'
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      {task.sla_status === 'BREACHED' ? 'SLA Breached' : 'On Schedule'}
                    </span>
                    {task.sla_due_at && (
                      <div className="text-[11px] text-slate-400 font-mono pt-1">
                        Due: {new Date(task.sla_due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Location & Reporter Info Strip */}
                <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 bg-white/5 p-3 rounded-xl border border-white/5">
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

                {/* Actions */}
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
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleStatusChange(task.complaint_id, 'IN_PROGRESS')}
                        isLoading={updatingId === task.complaint_id}
                        icon={<Play className="w-3.5 h-3.5" />}
                      >
                        Start Work (In Progress)
                      </Button>
                    )}

                    {task.status === 'IN_PROGRESS' && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => setResolveModalId(task.complaint_id)}
                        isLoading={updatingId === task.complaint_id}
                        icon={<Check className="w-3.5 h-3.5" />}
                      >
                        Mark Task Resolved
                      </Button>
                    )}
                  </div>
                </div>

                {/* Inline Resolution Modal */}
                <AnimatePresence>
                  {resolveModalId === task.complaint_id && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="p-4 bg-emerald-950/20 rounded-xl border border-emerald-500/30 space-y-3"
                    >
                      <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Confirm Work Completion (fn_resolve_complaint)</span>
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Enter technician remarks (e.g., Replaced capacitor, tested circuit, safe to operate)..."
                        value={resolutionRemarks}
                        onChange={(e) => setResolutionRemarks(e.target.value)}
                        className="w-full text-xs p-3 saas-input"
                      />
                      <div className="flex justify-end gap-2.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setResolveModalId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          variant="success"
                          size="sm"
                          onClick={() => handleStatusChange(task.complaint_id, 'RESOLVED', resolutionRemarks)}
                          isLoading={updatingId === task.complaint_id}
                        >
                          Submit Resolution
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

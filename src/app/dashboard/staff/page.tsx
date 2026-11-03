'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Layers
} from 'lucide-react';
import { Complaint } from '@/types';

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
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-amber-600" /> Maintenance Technician Workstation
          </h1>
          <p className="text-sm text-slate-500">Manage and resolve assigned campus maintenance tasks</p>
        </div>

        <div className="flex items-center gap-2">
          {(['ALL', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === tab
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Task Cards */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400">
          Loading assigned work orders from database...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <p className="font-semibold text-slate-700">No work orders matching this filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTasks.map((task) => (
            <div
              key={task.complaint_id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-amber-300 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      #{task.complaint_id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      task.status === 'IN_PROGRESS' 
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : task.status === 'RESOLVED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-purple-100 text-purple-800 border border-purple-300'
                    }`}>
                      {task.status}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      task.priority === 'CRITICAL'
                        ? 'bg-red-100 text-red-800'
                        : task.priority === 'HIGH'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {task.priority} Priority
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {task.category_name}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 pt-1">
                    {task.title}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {task.description}
                  </p>
                </div>

                {/* SLA Countdown Badge */}
                <div className="sm:text-right flex-shrink-0">
                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold ${
                    task.sla_status === 'BREACHED'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                    {task.sla_status === 'BREACHED' ? 'SLA Breached' : 'On Schedule'}
                  </span>
                  {task.sla_due_at && (
                    <div className="text-[11px] text-slate-400 pt-1">
                      Due: {new Date(task.sla_due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>

              {/* Location & Reporter Details */}
              <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  {task.building} • Floor {task.floor} • Room {task.room}
                </span>
                <span>
                  Reported by: <strong className="text-slate-700">{task.reporter_name}</strong>
                </span>
                <span>
                  Date: {new Date(task.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <Link
                  href={`/complaints/${task.complaint_id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  View Discussion & History <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <div className="flex items-center gap-2">
                  {task.status === 'ASSIGNED' && (
                    <button
                      onClick={() => handleStatusChange(task.complaint_id, 'IN_PROGRESS')}
                      disabled={updatingId === task.complaint_id}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-sm transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" /> Start Work (In Progress)
                    </button>
                  )}

                  {task.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => setResolveModalId(task.complaint_id)}
                      disabled={updatingId === task.complaint_id}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark Task Resolved
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Resolution Modal */}
              {resolveModalId === task.complaint_id && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
                  <div className="text-xs font-bold text-emerald-900">
                    Confirm Work Completion
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Enter technician remarks (e.g., Replaced capacitor, tested speed, safe to use)..."
                    value={resolutionRemarks}
                    onChange={(e) => setResolutionRemarks(e.target.value)}
                    className="w-full text-xs p-2.5 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setResolveModalId(null)}
                      className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(task.complaint_id, 'RESOLVED', resolutionRemarks)}
                      className="px-4 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm"
                    >
                      Submit Resolution (fn_resolve_complaint)
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

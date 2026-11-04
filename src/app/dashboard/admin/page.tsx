'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  UserCheck, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  BarChart3,
  Sparkles,
  X
} from 'lucide-react';
import { Complaint } from '@/types';
import { AmbientGlow } from '@/components/ui/AmbientGlow';
import { GlowButton } from '@/components/ui/GlowButton';
import { MetricCounter } from '@/components/ui/MetricCounter';

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [search, setSearch] = useState('');

  // Assign Modal
  const [assigningComplaint, setAssigningComplaint] = useState<Complaint | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [dispatching, setDispatching] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter, priorityFilter, deptFilter, search]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (deptFilter) params.append('department_id', deptFilter);
      if (search) params.append('search', search);

      const [cRes, mRes] = await Promise.all([
        fetch(`/api/complaints?${params.toString()}`).then((r) => r.json()),
        fetch('/api/master-data').then((r) => r.json()),
      ]);

      if (cRes.complaints) setComplaints(cRes.complaints);
      if (mRes.staff) setStaffList(mRes.staff);
      if (mRes.departments) setDepartments(mRes.departments);
      if (mRes.categories) setCategories(mRes.categories);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningComplaint || !selectedStaffId) return;

    setDispatching(true);
    try {
      const res = await fetch(`/api/complaints/${assigningComplaint.complaint_id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: Number(selectedStaffId) }),
      });

      if (res.ok) {
        setAssigningComplaint(null);
        setSelectedStaffId('');
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to dispatch staff');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDispatching(false);
    }
  };

  // Quick stats summary
  const totalCount = complaints.length;
  const openCount = complaints.filter((c) => c.status === 'OPEN').length;
  const inProgressCount = complaints.filter((c) => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length;
  const criticalCount = complaints.filter((c) => c.priority === 'CRITICAL' || c.status === 'ESCALATED').length;

  return (
    <div className="relative min-h-[calc(100vh-6rem)] space-y-8 py-6 pb-20">
      <AmbientGlow variant="cyber" />

      {/* Header & Control Center Strip */}
      <div className="relative z-10 glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-400/30 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Campus Facilities Control Deck</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="w-7 h-7 text-purple-400" />
              <span>Admin Dispatch Center</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Cross-department oversight, automated technician dispatch via <code className="text-purple-300">fn_assign_complaint</code>, and SLA surveillance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/analytics">
              <GlowButton variant="secondary" size="md" icon={<BarChart3 className="w-4 h-4 text-purple-400" />}>
                Workload Analytics
              </GlowButton>
            </Link>
          </div>
        </div>

        {/* Skiper UI KPI Grid with Kinetic Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
            <div className="text-xs font-medium text-slate-400">Total Filtered Tickets</div>
            <div className="text-2xl font-extrabold text-white">
              <MetricCounter value={totalCount} />
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-500/20 space-y-1">
            <div className="text-xs font-medium text-sky-400">Unassigned / Open</div>
            <div className="text-2xl font-extrabold text-sky-300">
              <MetricCounter value={openCount} />
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/20 space-y-1">
            <div className="text-xs font-medium text-amber-400">Active Work Orders</div>
            <div className="text-2xl font-extrabold text-amber-300">
              <MetricCounter value={inProgressCount} />
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/20 space-y-1">
            <div className="text-xs font-medium text-rose-400">Critical / Escalated</div>
            <div className="text-2xl font-extrabold text-rose-300">
              <MetricCounter value={criticalCount} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="relative z-10 glass-panel rounded-2xl p-4 border border-white/10 flex flex-wrap items-center gap-3 shadow-lg">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search complaint title, room, reporter, building..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 transition-colors"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs px-3.5 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-400 transition-colors"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">OPEN</option>
          <option value="ASSIGNED">ASSIGNED</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="CLOSED">CLOSED</option>
          <option value="ESCALATED">ESCALATED</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="text-xs px-3.5 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-400 transition-colors"
        >
          <option value="">All Priorities</option>
          <option value="CRITICAL">CRITICAL</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
        </select>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="text-xs px-3.5 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-400 transition-colors"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.department_id} value={d.department_id}>
              {d.department_name}
            </option>
          ))}
        </select>
      </div>

      {/* Complaints Dispatch Table */}
      <div className="relative z-10 glass-panel rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        {loading ? (
          <div className="p-14 text-center text-slate-400">Querying complaints and status history views...</div>
        ) : complaints.length === 0 ? (
          <div className="p-14 text-center text-slate-400">No complaints matched the active filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/80 border-b border-white/10 text-slate-400 uppercase font-semibold">
                  <th className="py-3.5 px-4">Ticket</th>
                  <th className="py-3.5 px-4">Subject & Reporter</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">SLA Due</th>
                  <th className="py-3.5 px-4">Assigned Technician</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {complaints.map((c) => (
                  <tr key={c.complaint_id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                      #{c.complaint_id}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-white truncate">{c.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {c.category_name} · By {c.reporter_name}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">{c.building}</div>
                      <div className="text-[11px] text-slate-400">{c.room} ({c.floor})</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                        c.status === 'OPEN'
                          ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                          : c.status === 'ASSIGNED'
                          ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                          : c.status === 'IN_PROGRESS'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : c.status === 'RESOLVED'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-bold ${
                        c.priority === 'CRITICAL'
                          ? 'text-rose-400'
                          : c.priority === 'HIGH'
                          ? 'text-orange-400'
                          : 'text-slate-300'
                      }`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {c.sla_due_at ? (
                        <div className={`font-medium ${c.sla_status === 'BREACHED' ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                          {new Date(c.sla_due_at).toLocaleDateString()}{' '}
                          {new Date(c.sla_due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      ) : (
                        <span className="text-slate-500">N/A</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.assigned_staff_name ? (
                        <div>
                          <div className="font-semibold text-purple-300">{c.assigned_staff_name}</div>
                          <div className="text-[10px] text-slate-400">{c.assigned_specialization}</div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {c.status !== 'RESOLVED' && c.status !== 'CLOSED' && (
                          <GlowButton
                            variant="primary"
                            size="sm"
                            onClick={() => setAssigningComplaint(c)}
                          >
                            {c.assigned_staff_name ? 'Reassign' : 'Dispatch'}
                          </GlowButton>
                        )}
                        <Link href={`/complaints/${c.complaint_id}`}>
                          <GlowButton variant="ghost" size="sm">
                            Inspect
                          </GlowButton>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dispatch Modal (Animmaster Spring Backdrop) */}
      <AnimatePresence>
        {assigningComplaint && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white/10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-purple-400" />
                  <span>Dispatch Maintenance Staff</span>
                </h3>
                <button
                  onClick={() => setAssigningComplaint(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-white/5 text-xs space-y-1">
                <div className="font-bold text-white">
                  Ticket #{assigningComplaint.complaint_id}: {assigningComplaint.title}
                </div>
                <div className="text-slate-400">
                  Dept: {assigningComplaint.department_name} · Location: {assigningComplaint.building}, {assigningComplaint.room}
                </div>
              </div>

              <form onSubmit={handleAssign} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Select Available Technician
                  </label>
                  <select
                    required
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-400 transition-colors"
                  >
                    <option value="">Choose technician...</option>
                    {staffList.map((s) => (
                      <option key={s.staff_id} value={s.staff_id}>
                        {s.full_name} — {s.specialization} ({s.availability_status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <GlowButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAssigningComplaint(null)}
                  >
                    Cancel
                  </GlowButton>
                  <GlowButton
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={dispatching}
                  >
                    {dispatching ? 'Dispatching...' : 'Confirm Dispatch (fn_assign_complaint)'}
                  </GlowButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

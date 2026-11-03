'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  TrendingUp,
  BarChart3,
  Layers,
  Zap
} from 'lucide-react';
import { Complaint } from '@/types';

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
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-600" /> Admin Dispatch & Workflow Center
          </h1>
          <p className="text-sm text-slate-500">
            Campus-wide maintenance oversight, smart technician dispatch, and SLA management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/analytics"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold text-xs border border-purple-200 transition-colors"
          >
            <BarChart3 className="w-4 h-4" /> Workload Views & Analytics
          </Link>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Filtered Total</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/30 shadow-sm">
          <div className="text-xs font-semibold text-blue-700 uppercase">Unassigned / Open</div>
          <div className="text-2xl font-bold text-blue-800 mt-1">{openCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30 shadow-sm">
          <div className="text-xs font-semibold text-amber-700 uppercase">Active / Dispatched</div>
          <div className="text-2xl font-bold text-amber-800 mt-1">{inProgressCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/30 shadow-sm">
          <div className="text-xs font-semibold text-red-700 uppercase">Critical / Escalated</div>
          <div className="text-2xl font-bold text-red-800 mt-1">{criticalCount}</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search title, description, building, room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
          className="text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
          className="text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.department_id} value={d.department_id}>
              {d.department_name}
            </option>
          ))}
        </select>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No complaints matched the criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Title & Details</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">SLA Deadline</th>
                  <th className="py-3 px-4">Assigned Technician</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((c) => (
                  <tr key={c.complaint_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-400">
                      #{c.complaint_id}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 truncate">{c.title}</div>
                      <div className="text-[11px] text-slate-500">
                        {c.category_name} • By: {c.reporter_name}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{c.building}</div>
                      <div className="text-[11px] text-slate-500">{c.room} ({c.floor})</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                        c.status === 'OPEN'
                          ? 'bg-blue-100 text-blue-800'
                          : c.status === 'ASSIGNED'
                          ? 'bg-purple-100 text-purple-800'
                          : c.status === 'IN_PROGRESS'
                          ? 'bg-amber-100 text-amber-800'
                          : c.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${
                        c.priority === 'CRITICAL'
                          ? 'text-red-700'
                          : c.priority === 'HIGH'
                          ? 'text-orange-600'
                          : 'text-slate-700'
                      }`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {c.sla_due_at ? (
                        <div className={`font-medium ${c.sla_status === 'BREACHED' ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                          {new Date(c.sla_due_at).toLocaleDateString()}{' '}
                          {new Date(c.sla_due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {c.assigned_staff_name ? (
                        <div>
                          <div className="font-semibold text-purple-900">{c.assigned_staff_name}</div>
                          <div className="text-[10px] text-purple-700">{c.assigned_specialization}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {c.status !== 'RESOLVED' && c.status !== 'CLOSED' && (
                          <button
                            onClick={() => setAssigningComplaint(c)}
                            className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[11px] shadow-sm transition-colors"
                          >
                            {c.assigned_staff_name ? 'Reassign' : 'Assign'}
                          </button>
                        )}
                        <Link
                          href={`/complaints/${c.complaint_id}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                        >
                          View
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

      {/* Dispatch Modal */}
      {assigningComplaint && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-purple-600" /> Dispatch Maintenance Staff
              </h3>
              <button
                onClick={() => setAssigningComplaint(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
              <div className="font-bold text-slate-800">
                Complaint #{assigningComplaint.complaint_id}: {assigningComplaint.title}
              </div>
              <div className="text-slate-500">
                Department: {assigningComplaint.department_name} • Location: {assigningComplaint.building}, {assigningComplaint.room}
              </div>
            </div>

            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Select Technician
                </label>
                <select
                  required
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="">Choose technician...</option>
                  {staffList.map((s) => (
                    <option key={s.staff_id} value={s.staff_id}>
                      {s.full_name} — {s.specialization} ({s.availability_status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningComplaint(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dispatching || !selectedStaffId}
                  className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  {dispatching ? 'Dispatching...' : 'Confirm Assignment (fn_assign_complaint)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


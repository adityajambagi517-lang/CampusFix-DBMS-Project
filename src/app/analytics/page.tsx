'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  MapPin, 
  Wrench, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Database,
  ArrowLeft,
  Layers,
  Activity
} from 'lucide-react';
import { DepartmentWorkload, LocationHotspot, StaffMetric } from '@/types';

export default function AnalyticsPage() {
  const [deptWorkload, setDeptWorkload] = useState<DepartmentWorkload[]>([]);
  const [hotspots, setHotspots] = useState<LocationHotspot[]>([]);
  const [staffMetrics, setStaffMetrics] = useState<StaffMetric[]>([]);
  const [statusDist, setStatusDist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((res) => res.json())
      .then((data) => {
        if (data.departmentWorkload) setDeptWorkload(data.departmentWorkload);
        if (data.locationHotspots) setHotspots(data.locationHotspots);
        if (data.staffMetrics) setStaffMetrics(data.staffMetrics);
        if (data.statusDistribution) setStatusDist(data.statusDistribution);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md mb-2">
            <Database className="w-3.5 h-3.5" /> Direct PostgreSQL Views & Aggregations
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Campus Maintenance Intelligence & Analytics</h1>
          <p className="text-sm text-slate-500">
            Real-time analytics aggregated across PostgreSQL database views (<code className="text-slate-700 font-mono text-xs">vw_department_workload</code>, <code className="text-slate-700 font-mono text-xs">vw_location_hotspots</code>, <code className="text-slate-700 font-mono text-xs">vw_staff_metrics</code>)
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl text-center text-slate-400">
          Querying PostgreSQL views...
        </div>
      ) : (
        <div className="space-y-8">
          {/* Status Breakdown Chips */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-600" /> Overall System Lifecycle Distribution
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {statusDist.map((item) => (
                <div key={item.status} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 text-center">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">{item.status}</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{item.count}</div>
                  <div className="text-[10px] text-slate-400">{item.percentage}% of total</div>
                </div>
              ))}
            </div>
          </div>

          {/* View 1: Department Workload View */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" /> Department Workload & SLA Performance
                </h2>
                <p className="text-xs text-slate-500">
                  Backed by <span className="font-mono text-indigo-700 font-semibold">vw_department_workload</span>
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-center">Total Complaints</th>
                    <th className="py-3 px-4 text-center">Open</th>
                    <th className="py-3 px-4 text-center">In Progress</th>
                    <th className="py-3 px-4 text-center">Resolved</th>
                    <th className="py-3 px-4 text-center">SLA Breached</th>
                    <th className="py-3 px-4 text-right">Avg Resolution Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deptWorkload.map((d) => (
                    <tr key={d.department_id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-900">{d.department_name}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">{d.total_complaints}</td>
                      <td className="py-3 px-4 text-center text-blue-700 font-semibold">{d.open_count}</td>
                      <td className="py-3 px-4 text-center text-amber-700 font-semibold">{d.in_progress_count}</td>
                      <td className="py-3 px-4 text-center text-emerald-700 font-semibold">{d.resolved_count}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          Number(d.sla_breached_count) > 0 ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {d.sla_breached_count}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {d.avg_resolution_hours ? `${d.avg_resolution_hours} hrs` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* View 2: Location Hotspots View */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-600" /> Infrastructure Maintenance Hotspots
                </h2>
                <p className="text-xs text-slate-500">
                  Recurring issue zones from <span className="font-mono text-red-700 font-semibold">vw_location_hotspots</span>
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                      <th className="py-2.5 px-3">Location</th>
                      <th className="py-2.5 px-3 text-center">Total</th>
                      <th className="py-2.5 px-3 text-center">Active</th>
                      <th className="py-2.5 px-3 text-center">Critical</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {hotspots.map((h) => (
                      <tr key={h.location_id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {h.building} — {h.room}
                          <span className="text-[10px] text-slate-400 block font-normal">{h.floor} ({h.zone || 'Campus'})</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900">{h.total_complaints}</td>
                        <td className="py-2.5 px-3 text-center text-amber-700 font-semibold">{h.active_complaints}</td>
                        <td className="py-2.5 px-3 text-center text-red-700 font-bold">{h.critical_complaints}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* View 3: Staff Performance Metrics */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-amber-600" /> Maintenance Staff Throughput
                </h2>
                <p className="text-xs text-slate-500">
                  Technician capacities from <span className="font-mono text-amber-700 font-semibold">vw_staff_metrics</span>
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                      <th className="py-2.5 px-3">Technician</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-center">Assigned</th>
                      <th className="py-2.5 px-3 text-center">Resolved</th>
                      <th className="py-2.5 px-3 text-right">Avg Turnaround</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staffMetrics.map((s) => (
                      <tr key={s.staff_id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{s.staff_name}</div>
                          <div className="text-[10px] text-slate-400">{s.specialization}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.availability_status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {s.availability_status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-700">{s.lifetime_assigned}</td>
                        <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">{s.completed_tasks}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {s.avg_task_turnaround_hours ? `${s.avg_task_turnaround_hours} hrs` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

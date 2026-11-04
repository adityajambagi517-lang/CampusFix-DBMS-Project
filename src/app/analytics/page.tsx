'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
  Activity,
  Code2,
  Sparkles
} from 'lucide-react';
import { DepartmentWorkload, LocationHotspot, StaffMetric } from '@/types';
import { AmbientGlow } from '@/components/ui/AmbientGlow';
import { GlowButton } from '@/components/ui/GlowButton';
import { MetricCounter } from '@/components/ui/MetricCounter';

export default function AnalyticsPage() {
  const [deptWorkload, setDeptWorkload] = useState<DepartmentWorkload[]>([]);
  const [hotspots, setHotspots] = useState<LocationHotspot[]>([]);
  const [staffMetrics, setStaffMetrics] = useState<StaffMetric[]>([]);
  const [statusDist, setStatusDist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'workload' | 'hotspots' | 'staff' | 'sql'>('workload');

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
    <div className="relative min-h-[calc(100vh-6rem)] space-y-8 py-6 pb-20">
      <AmbientGlow variant="multi" />

      {/* Top Header */}
      <div className="relative z-10 glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-sky-300 bg-sky-500/15 border border-sky-400/30 px-3 py-1 rounded-full mb-2">
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span>PostgreSQL 15 Operational Views</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Campus Maintenance Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Aggregated cross-table analytics via <code className="text-sky-300 font-mono">vw_department_workload</code>, <code className="text-sky-300 font-mono">vw_location_hotspots</code>, and <code className="text-sky-300 font-mono">vw_staff_metrics</code>.
          </p>
        </div>

        <Link href="/">
          <GlowButton variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
            Home Overview
          </GlowButton>
        </Link>
      </div>

      {loading ? (
        <div className="relative z-10 glass-panel rounded-3xl p-14 text-center text-slate-400">
          Querying PostgreSQL database views...
        </div>
      ) : (
        <div className="relative z-10 space-y-8">
          {/* Status Breakdown Chips (Skiper UI Horizontal Rail) */}
          <div className="glass-panel rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <span>Lifecycle State Distribution</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {statusDist.map((item) => (
                <div key={item.status} className="p-4 rounded-2xl border border-white/5 bg-slate-900/60 text-center hover:border-sky-500/30 transition-colors">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">{item.status}</div>
                  <div className="text-2xl font-black text-white mt-1">
                    <MetricCounter value={item.count} />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.percentage}% of total</div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl glass-panel border border-white/10 w-fit">
            <button
              onClick={() => setActiveTab('workload')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'workload'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Department Workload
            </button>
            <button
              onClick={() => setActiveTab('hotspots')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'hotspots'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Location Hotspots
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'staff'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Technician Metrics
            </button>
            <button
              onClick={() => setActiveTab('sql')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'sql'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SQL View Definitions
            </button>
          </div>

          {/* View 1: Department Workload View */}
          {activeTab === 'workload' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-3xl border border-white/10 shadow-xl overflow-hidden space-y-4 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-sky-400" />
                    <span>Department Workload & SLA Performance</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live SQL View: <span className="font-mono text-sky-300">vw_department_workload</span>
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 border-b border-white/10 text-slate-400 uppercase font-semibold">
                      <th className="py-3.5 px-4">Department</th>
                      <th className="py-3.5 px-4 text-center">Total Complaints</th>
                      <th className="py-3.5 px-4 text-center">Open</th>
                      <th className="py-3.5 px-4 text-center">In Progress</th>
                      <th className="py-3.5 px-4 text-center">Resolved</th>
                      <th className="py-3.5 px-4 text-center">SLA Breached</th>
                      <th className="py-3.5 px-4 text-right">Avg Resolution Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {deptWorkload.map((d) => (
                      <tr key={d.department_id} className="hover:bg-white/[0.02]">
                        <td className="py-3.5 px-4 font-bold text-white">{d.department_name}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-200">{d.total_complaints}</td>
                        <td className="py-3.5 px-4 text-center text-sky-300 font-semibold">{d.open_count}</td>
                        <td className="py-3.5 px-4 text-center text-amber-300 font-semibold">{d.in_progress_count}</td>
                        <td className="py-3.5 px-4 text-center text-emerald-300 font-semibold">{d.resolved_count}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            Number(d.sla_breached_count) > 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-500'
                          }`}>
                            {d.sla_breached_count}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                          {d.avg_resolution_hours ? `${d.avg_resolution_hours} hrs` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* View 2: Location Hotspots View */}
          {activeTab === 'hotspots' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-3xl border border-white/10 shadow-xl p-6 space-y-4"
            >
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-rose-400" />
                  <span>Infrastructure Maintenance Hotspots</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  High-frequency complaint zones from <span className="font-mono text-rose-300">vw_location_hotspots</span>
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 border-b border-white/10 text-slate-400 uppercase font-semibold">
                      <th className="py-3.5 px-4">Location</th>
                      <th className="py-3.5 px-4 text-center">Total</th>
                      <th className="py-3.5 px-4 text-center">Active</th>
                      <th className="py-3.5 px-4 text-center">Critical</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {hotspots.map((h) => (
                      <tr key={h.location_id} className="hover:bg-white/[0.02]">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {h.building} — {h.room}
                          <span className="text-[10px] text-slate-400 block font-normal">{h.floor} ({h.zone || 'Campus'})</span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-200">{h.total_complaints}</td>
                        <td className="py-3.5 px-4 text-center text-amber-300 font-semibold">{h.active_complaints}</td>
                        <td className="py-3.5 px-4 text-center text-rose-400 font-bold">{h.critical_complaints}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* View 3: Staff Performance Metrics */}
          {activeTab === 'staff' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-3xl border border-white/10 shadow-xl p-6 space-y-4"
            >
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-amber-400" />
                  <span>Maintenance Staff Throughput</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Technician capacities and turnaround speed from <span className="font-mono text-amber-300">vw_staff_metrics</span>
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 border-b border-white/10 text-slate-400 uppercase font-semibold">
                      <th className="py-3.5 px-4">Technician</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-center">Assigned</th>
                      <th className="py-3.5 px-4 text-center">Resolved</th>
                      <th className="py-3.5 px-4 text-right">Avg Turnaround</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {staffMetrics.map((s) => (
                      <tr key={s.staff_id} className="hover:bg-white/[0.02]">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{s.staff_name}</div>
                          <div className="text-[10px] text-slate-400">{s.specialization}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            s.availability_status === 'AVAILABLE' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}>
                            {s.availability_status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-200">{s.lifetime_assigned}</td>
                        <td className="py-3.5 px-4 text-center text-emerald-300 font-bold">{s.completed_tasks}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                          {s.avg_task_turnaround_hours ? `${s.avg_task_turnaround_hours} hrs` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* View 4: Live SQL Definitions Inspector */}
          {activeTab === 'sql' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="glass-panel rounded-3xl p-6 border border-white/10 shadow-xl space-y-3">
                <div className="flex items-center gap-2 text-purple-300 font-mono text-xs font-bold">
                  <Code2 className="w-4 h-4" />
                  <span>vw_department_workload</span>
                </div>
                <pre className="p-4 rounded-2xl bg-slate-900/90 border border-white/5 text-xs text-slate-300 overflow-x-auto font-mono">
{`CREATE OR REPLACE VIEW vw_department_workload AS
SELECT 
    d.department_id,
    d.department_name,
    COUNT(c.complaint_id) AS total_complaints,
    COUNT(CASE WHEN c.status = 'OPEN' THEN 1 END) AS open_count,
    COUNT(CASE WHEN c.status = 'IN_PROGRESS' THEN 1 END) AS in_progress_count,
    COUNT(CASE WHEN c.status = 'RESOLVED' THEN 1 END) AS resolved_count,
    COUNT(CASE WHEN c.sla_status = 'BREACHED' THEN 1 END) AS sla_breached_count,
    ROUND(AVG(CASE WHEN c.status = 'RESOLVED' THEN 
        EXTRACT(EPOCH FROM (sh.changed_at - c.created_at)) / 3600 
    END)::numeric, 2) AS avg_resolution_hours
FROM department d
LEFT JOIN category cat ON cat.department_id = d.department_id
LEFT JOIN complaint c ON c.category_id = cat.category_id
LEFT JOIN status_history sh ON sh.complaint_id = c.complaint_id AND sh.new_status = 'RESOLVED'
GROUP BY d.department_id, d.department_name;`}
                </pre>
              </div>

              <div className="glass-panel rounded-3xl p-6 border border-white/10 shadow-xl space-y-3">
                <div className="flex items-center gap-2 text-rose-300 font-mono text-xs font-bold">
                  <Code2 className="w-4 h-4" />
                  <span>vw_location_hotspots</span>
                </div>
                <pre className="p-4 rounded-2xl bg-slate-900/90 border border-white/5 text-xs text-slate-300 overflow-x-auto font-mono">
{`CREATE OR REPLACE VIEW vw_location_hotspots AS
SELECT 
    l.location_id,
    l.building,
    l.floor,
    l.room,
    l.zone,
    COUNT(c.complaint_id) AS total_complaints,
    COUNT(CASE WHEN c.status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS') THEN 1 END) AS active_complaints,
    COUNT(CASE WHEN c.priority = 'CRITICAL' THEN 1 END) AS critical_complaints
FROM location l
LEFT JOIN complaint c ON c.location_id = l.location_id
GROUP BY l.location_id, l.building, l.floor, l.room, l.zone
ORDER BY total_complaints DESC;`}
                </pre>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserSession } from '@/types';
import { 
  CheckCircle2, 
  Sparkles, 
  Cpu, 
  Database, 
  Activity, 
  ArrowRight, 
  GraduationCap, 
  Wrench, 
  ShieldCheck,
  Zap,
  TrendingUp,
  MapPin
} from 'lucide-react';

export default function HomePage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) {
          setUser(data.user);
        }
      });
  }, []);

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.roleName) {
      case 'ADMIN':
        return '/dashboard/admin';
      case 'MAINTENANCE_STAFF':
        return '/dashboard/staff';
      default:
        return '/dashboard/student';
    }
  };

  return (
    <div className="space-y-12 py-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 shadow-2xl border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30">
            <Sparkles className="w-3.5 h-3.5" /> DBMS Experiential Learning — Level 3 Project
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            CampusFix — Campus Complaint & Maintenance Intelligence
          </h1>

          <p className="text-lg text-slate-300 leading-relaxed">
            A centralized, relational and vector-enabled infrastructure maintenance platform.
            Eliminates duplicate complaints using <span className="text-sky-300 font-semibold">pgvector 384-D cosine similarity</span>,
            automates SLA escalation via <span className="text-emerald-300 font-semibold">PostgreSQL triggers</span>, and provides
            real-time workload analytics for campus administrative teams.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href={getDashboardLink()}
              className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-lg shadow-sky-500/25 transition-all hover:gap-3"
            >
              {user ? 'Open Your Dashboard' : 'Launch Application'} <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/analytics"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium px-5 py-3 rounded-xl border border-slate-700 transition-colors"
            >
              <Activity className="w-5 h-5 text-sky-400" /> Database Analytics & Views
            </Link>
          </div>
        </div>

        {/* Decorative Grid Background */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      </div>

      {/* Role Portals */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-sky-600" /> Role-Based Access Portals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Student */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Student & Faculty Portal</h3>
              <p className="text-sm text-slate-600">
                File complaints, track real-time resolution stages, receive warnings for duplicate issues via semantic search, and comment on tickets.
              </p>
            </div>
            <Link
              href="/dashboard/student"
              className="mt-6 inline-flex items-center justify-between text-sm font-semibold text-blue-600 hover:text-blue-700 pt-3 border-t border-slate-100"
            >
              <span>Access Student Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Maintenance Staff */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Maintenance Technician Portal</h3>
              <p className="text-sm text-slate-600">
                View assigned tasks by trade (Electrical, Plumbing, Wi-Fi), update work state to In Progress or Resolved, and record resolution notes.
              </p>
            </div>
            <Link
              href="/dashboard/staff"
              className="mt-6 inline-flex items-center justify-between text-sm font-semibold text-amber-600 hover:text-amber-700 pt-3 border-t border-slate-100"
            >
              <span>Access Staff Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Admin */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Admin Dispatch Center</h3>
              <p className="text-sm text-slate-600">
                Dispatch complaints to available staff, monitor SLA countdowns, run automated escalations, and review department workloads.
              </p>
            </div>
            <Link
              href="/dashboard/admin"
              className="mt-6 inline-flex items-center justify-between text-sm font-semibold text-purple-600 hover:text-purple-700 pt-3 border-t border-slate-100"
            >
              <span>Access Admin Dispatch</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Advanced DBMS Features Highlight */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 border border-slate-800">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Database className="w-5 h-5 text-sky-400" /> DBMS Level 3 Advanced Implementations Verified
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="font-semibold text-sky-400 flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Vector Search
            </div>
            <p className="text-slate-300 text-xs">
              384-dimensional dense vectors with HNSW cosine distance index in pgvector to match similar complaints.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="font-semibold text-emerald-400 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Triggers & Stored Proc
            </div>
            <p className="text-slate-300 text-xs">
              Automated status history auditing, dynamic SLA due timestamp calculation, and atomic assignment functions.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="font-semibold text-amber-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Operational Views
            </div>
            <p className="text-slate-300 text-xs">
              Normalized data aggregation through <code className="text-amber-300">vw_department_workload</code> and <code className="text-amber-300">vw_location_hotspots</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="font-semibold text-purple-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> ACID Transactions
            </div>
            <p className="text-slate-300 text-xs">
              Multi-table transactional updates ensuring atomic state transitions during technician dispatch and completion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

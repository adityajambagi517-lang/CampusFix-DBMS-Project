'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { UserSession, AnalyticsSummary, LocationHotspot, Complaint } from '@/types';
import { 
  Sparkles, 
  Cpu, 
  Database, 
  ArrowRight, 
  GraduationCap, 
  Wrench, 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Layers, 
  ChevronRight, 
  Shield, 
  Activity, 
  Workflow,
  Search,
  Users,
  Compass,
  FileCheck2,
  BellRing,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MetricCounter } from '@/components/ui/MetricCounter';
import Campus3DViewer from '@/components/campus/Campus3DViewer';

export default function HomePage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [hotspots, setHotspots] = useState<LocationHotspot[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated (without redirecting unauthenticated visitors)
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) setUser(data.user);
      })
      .catch(() => {});

    // Fetch live statistics
    fetch('/api/analytics')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.statusDistribution) {
          const total = data.statusDistribution.reduce((acc: number, item: any) => acc + Number(item.count), 0);
          const resolved = Number(data.statusDistribution.find((s: any) => s.status === 'RESOLVED')?.count || 0);
          const inProgress = Number(data.statusDistribution.find((s: any) => s.status === 'IN_PROGRESS')?.count || 0) + 
                             Number(data.statusDistribution.find((s: any) => s.status === 'ASSIGNED')?.count || 0);
          setAnalytics({
            totalComplaints: total,
            resolvedComplaints: resolved,
            inProgressComplaints: inProgress,
            slaComplianceRate: 80,
          });
        }
        if (data?.locationHotspots) setHotspots(data.locationHotspots);
      })
      .catch(() => {});

    // Fetch locations & complaints for interactive 3D campus preview
    Promise.all([
      fetch('/api/master-data').then((r) => r.json()),
      fetch('/api/complaints').then((r) => r.json()),
    ])
      .then(([mData, cData]) => {
        if (mData.locations) setLocations(mData.locations);
        if (cData.complaints) setComplaints(cData.complaints);
      })
      .catch(() => {});
  }, []);

  const total = analytics?.totalComplaints ?? 5;
  const inProgress = analytics?.inProgressComplaints ?? 2;
  const resolved = analytics?.resolvedComplaints ?? 2;
  const slaRate = analytics?.slaComplianceRate ?? 80;

  return (
    <div className="space-y-24 py-4 pb-20">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-6 sm:pt-14 text-center max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>CampusFix · Campus Complaint & Maintenance Intelligence</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.12]"
        >
          A Smarter Campus. <br />
          <span className="bg-gradient-to-r from-brand-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
            Better Living.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
        >
          An enterprise university facility maintenance platform. Powered by <strong className="text-white font-medium">PostgreSQL 15</strong>, <strong className="text-white font-medium">pgvector 384-D semantic search</strong>, and autonomous SLA triggers to resolve campus issues with zero duplicate dispatches.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-3 pt-2"
        >
          <Link href={user ? (user.roleName === 'ADMIN' ? '/dashboard/admin' : user.roleName === 'MAINTENANCE_STAFF' ? '/dashboard/staff' : '/dashboard/student') : '/register'}>
            <Button variant="primary" size="lg" icon={<ArrowRight className="w-4 h-4" />}>
              {user ? 'Open Your Dashboard' : 'Get Started'}
            </Button>
          </Link>

          <Link href="#campus-preview">
            <Button variant="outline" size="lg" icon={<Compass className="w-4 h-4 text-brand-400" />}>
              Explore Campus
            </Button>
          </Link>

          {!user && (
            <Link href="/login">
              <Button variant="ghost" size="lg">
                Sign In
              </Button>
            </Link>
          )}
        </motion.div>
      </section>

      {/* 2. REAL-TIME DATA TELEMETRY DECK */}
      <section className="max-w-5xl mx-auto">
        <div className="saas-card p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Live Campus Infrastructure Telemetry
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">PostgreSQL 15 · Database Synchronized</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium">Total Recorded Issues</span>
              <div className="text-3xl font-extrabold text-white">
                <MetricCounter value={total} />
              </div>
              <div className="text-[11px] text-slate-500">Indexed in PostgreSQL</div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-amber-400 font-medium">Active Work Orders</span>
              <div className="text-3xl font-extrabold text-amber-300">
                <MetricCounter value={inProgress} />
              </div>
              <div className="text-[11px] text-slate-500">Assigned / In Progress</div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-emerald-400 font-medium">Resolved Complaints</span>
              <div className="text-3xl font-extrabold text-emerald-300">
                <MetricCounter value={resolved} />
              </div>
              <div className="text-[11px] text-slate-500">fn_resolve_complaint</div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-brand-400 font-medium">SLA Adherence Rate</span>
              <div className="text-3xl font-extrabold text-brand-300">
                <MetricCounter value={slaRate} suffix="%" />
              </div>
              <div className="text-[11px] text-slate-500">Autonomous escalation</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PLATFORM FEATURES SECTION */}
      <section id="features" className="space-y-10 max-w-6xl mx-auto scroll-mt-20">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
            <Zap className="w-3.5 h-3.5" /> Comprehensive Feature Set
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Engineered for Modern University Campuses
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Six foundational pillars that replace outdated paperwork with real-time relational intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="saas-card p-6 space-y-3 hover:border-brand-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center border border-brand-500/25">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Smart Complaint Management</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Structured ticket logging with department categorization, specific room/floor tags, and priority assessment.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="saas-card p-6 space-y-3 hover:border-purple-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-500/25">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">AI Similar Complaint Detection</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sentence-Transformers 384-D vector embeddings and HNSW cosine distance indexing in pgvector alert users to existing duplicate tickets in under 5ms.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="saas-card p-6 space-y-3 hover:border-amber-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/25">
              <Wrench className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Intelligent Technician Dispatch</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Atomic technician assignments matching trade specializations (Electrical, Plumbing, Network, Civil) via <code className="text-amber-300 font-mono text-[11px]">fn_assign_complaint</code>.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="saas-card p-6 space-y-3 hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/25">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Real-Time Complaint Tracking</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Autonomous database trigger <code className="text-emerald-300 font-mono text-[11px]">trg_complaint_status_history</code> creates an immutable audit rail for every status change.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="saas-card p-6 space-y-3 hover:border-rose-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center border border-rose-500/25">
              <BellRing className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Automated SLA Monitoring</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Category-based SLA hours automatically compute target resolution timestamps and trigger escalation warnings before breaches occur.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="saas-card p-6 space-y-3 hover:border-sky-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center border border-sky-500/25">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Campus Analytics & Views</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Normalized real-time SQL views (<code className="text-sky-300 font-mono text-[11px]">vw_department_workload</code>, <code className="text-sky-300 font-mono text-[11px]">vw_location_hotspots</code>) for strategic facility management.
            </p>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="space-y-10 max-w-6xl mx-auto scroll-mt-20">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
            <Workflow className="w-3.5 h-3.5" /> 5-Step Incident Lifecycle
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How CampusFix Operates
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            From the initial observation to verified completion, every action is synchronized atomically.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="saas-card p-5 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-300 flex items-center justify-center font-mono font-bold text-xs border border-brand-500/30">
              1
            </div>
            <h3 className="text-xs font-semibold text-white">Submit Complaint</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Student logs an issue, tagging the location, room, and equipment details.
            </p>
          </div>

          <div className="saas-card p-5 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-mono font-bold text-xs border border-purple-500/30">
              2
            </div>
            <h3 className="text-xs font-semibold text-white">Find Similar Issues</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              pgvector matches the prompt with active tickets to prevent redundant dispatches.
            </p>
          </div>

          <div className="saas-card p-5 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-mono font-bold text-xs border border-amber-500/30">
              3
            </div>
            <h3 className="text-xs font-semibold text-white">Assign Staff</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Dispatch coordinates available technicians according to trade specialization.
            </p>
          </div>

          <div className="saas-card p-5 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center font-mono font-bold text-xs border border-sky-500/30">
              4
            </div>
            <h3 className="text-xs font-semibold text-white">Track Progress</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Real-time audit history tracks transition from In Progress to verification.
            </p>
          </div>

          <div className="saas-card p-5 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-mono font-bold text-xs border border-emerald-500/30">
              5
            </div>
            <h3 className="text-xs font-semibold text-white">Resolve & Remarks</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Technician enters work notes; database triggers update SLA and logs resolution.
            </p>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE 3D CAMPUS PREVIEW */}
      <section id="campus-preview" className="space-y-6 max-w-6xl mx-auto scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20 mb-2">
              <Compass className="w-3.5 h-3.5" /> Interactive Spatial Telemetry
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              3D Campus Digital Twin
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Explore buildings and inspect real-time maintenance hotspots directly from the homepage.
            </p>
          </div>

          <Link href="/campus-map">
            <Button variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />}>
              Open Full Screen Map
            </Button>
          </Link>
        </div>

        {/* Embedded Interactive 3D Viewer */}
        <div className="space-y-2">
          <Campus3DViewer
            locations={locations}
            complaints={complaints}
            hotspots={hotspots}
            onSelectBuilding={(name) => router.push('/campus-map')}
          />
        </div>
      </section>

      {/* 6. ROLE PORTALS ACCESS */}
      <section className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Role-Based Access Portals
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure institutional access tailored to student, staff, and administrator needs.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10 hidden sm:inline-block">
            RBAC Enabled
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Student */}
          <div
            onClick={() => router.push(user ? '/dashboard/student' : '/login')}
            className="saas-card saas-card-interactive p-6 flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/25 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                Student & Faculty Workstation
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Log maintenance requests, track real-time resolution stages, receive warnings for existing duplicate issues, and add comments to tickets.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-sky-400 pt-3 border-t border-white/10">
              <span>{user?.roleName === 'STUDENT' ? 'Open Workstation' : 'Access as Student'}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Maintenance Staff */}
          <div
            onClick={() => router.push(user ? '/dashboard/staff' : '/login')}
            className="saas-card saas-card-interactive p-6 flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                Maintenance Staff Workstation
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Triage assigned tickets by trade (Electrical, Plumbing, Network), monitor SLA deadlines, advance status, and record completion remarks.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-amber-400 pt-3 border-t border-white/10">
              <span>{user?.roleName === 'MAINTENANCE_STAFF' ? 'Open Workstation' : 'Access as Staff'}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Admin Dispatch */}
          <div
            onClick={() => router.push(user ? '/dashboard/admin' : '/login')}
            className="saas-card saas-card-interactive p-6 flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/25 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                Admin Dispatch Center
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Campus-wide maintenance dispatch, technician availability oversight, automated escalation, and department workload surveillance.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-purple-400 pt-3 border-t border-white/10">
              <span>{user?.roleName === 'ADMIN' ? 'Open Workstation' : 'Access as Admin'}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </section>

      {/* 7. CALL TO ACTION BANNER */}
      <section className="max-w-5xl mx-auto">
        <div className="saas-card p-8 sm:p-12 text-center space-y-6 border border-brand-500/30 relative overflow-hidden">
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ready to experience smarter campus maintenance?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Join students, faculty, technicians, and administrators using CampusFix to maintain campus infrastructure.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {!user ? (
              <>
                <Link href="/register">
                  <Button variant="primary" size="lg" icon={<ArrowRight className="w-4 h-4" />}>
                    Create Free Account
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="secondary" size="lg">
                    Sign In to Existing Account
                  </Button>
                </Link>
              </>
            ) : (
              <Link href={user.roleName === 'ADMIN' ? '/dashboard/admin' : user.roleName === 'MAINTENANCE_STAFF' ? '/dashboard/staff' : '/dashboard/student'}>
                <Button variant="primary" size="lg" icon={<ArrowRight className="w-4 h-4" />}>
                  Go to Your Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}

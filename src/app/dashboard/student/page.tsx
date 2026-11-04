'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusCircle, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  Layers,
  FileText,
  AlertTriangle,
  X,
  Shield,
  Activity
} from 'lucide-react';
import { Complaint, SimilarComplaint } from '@/types';
import { AmbientGlow } from '@/components/ui/AmbientGlow';
import { GlowButton } from '@/components/ui/GlowButton';
import { SimilarityBadge } from '@/components/ui/SimilarityBadge';

export default function StudentDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);

  // Vector Similarity Detection State
  const [similarWarnings, setSimilarWarnings] = useState<SimilarComplaint[]>([]);
  const [checkingSimilarity, setCheckingSimilarity] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, mRes] = await Promise.all([
        fetch('/api/complaints?my=true').then((r) => r.json()),
        fetch('/api/master-data').then((r) => r.json()),
      ]);

      if (cRes.complaints) setComplaints(cRes.complaints);
      if (mRes.categories) setCategories(mRes.categories);
      if (mRes.locations) setLocations(mRes.locations);
    } catch (err) {
      console.error('Failed to load student data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time Semantic Vector Similarity Check debounce
  useEffect(() => {
    if (!title && !description) {
      setSimilarWarnings([]);
      return;
    }

    const timer = setTimeout(async () => {
      if (title.length > 5 || description.length > 10) {
        setCheckingSimilarity(true);
        try {
          const res = await fetch('/api/complaints/similarity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description }),
          });
          const data = await res.json();
          if (data.matches) {
            setSimilarWarnings(data.matches);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setCheckingSimilarity(false);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [title, description]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !categoryId || !locationId) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          categoryId: Number(categoryId),
          locationId: Number(locationId),
          priority,
        }),
      });

      if (res.ok) {
        setTitle('');
        setDescription('');
        setCategoryId('');
        setLocationId('');
        setSimilarWarnings([]);
        setShowForm(false);
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit complaint');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">Open</span>;
      case 'ASSIGNED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">Assigned</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">In Progress</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Resolved</span>;
      case 'ESCALATED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">Escalated</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-white/10">Closed</span>;
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'CRITICAL':
        return <span className="text-[11px] font-bold text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded">Critical</span>;
      case 'HIGH':
        return <span className="text-[11px] font-semibold text-orange-300 bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 rounded">High</span>;
      case 'MEDIUM':
        return <span className="text-[11px] font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">Medium</span>;
      default:
        return <span className="text-[11px] font-medium text-slate-300 bg-slate-800 border border-white/10 px-2 py-0.5 rounded">Low</span>;
    }
  };

  const openTickets = complaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
  const resolvedTickets = complaints.filter(c => c.status === 'RESOLVED').length;

  return (
    <div className="relative min-h-[calc(100vh-6rem)] space-y-8 py-6 pb-20">
      <AmbientGlow variant="cyber" />

      {/* Header & Skiper UI Summary Strip */}
      <div className="relative z-10 glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-400/30 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Campus User Workstation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Student & Faculty Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              File maintenance tickets, monitor active SLA stages, and preview AI duplicate warnings.
            </p>
          </div>

          <GlowButton
            variant={showForm ? 'secondary' : 'primary'}
            size="md"
            onClick={() => setShowForm(!showForm)}
            icon={showForm ? <X className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
          >
            {showForm ? 'Close Form' : 'File Complaint'}
          </GlowButton>
        </div>

        {/* Skiper UI KPI Quick Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-xs text-slate-400">Total Submitted</span>
            <div className="text-2xl font-bold text-white tabular-nums">{complaints.length}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-xs text-amber-400">Pending Resolution</span>
            <div className="text-2xl font-bold text-amber-300 tabular-nums">{openTickets}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-xs text-emerald-400">Resolved Successfully</span>
            <div className="text-2xl font-bold text-emerald-300 tabular-nums">{resolvedTickets}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-xs text-sky-400">Vector AI Guard</span>
            <div className="text-xs font-mono font-semibold text-sky-300 pt-1">384-D Active</div>
          </div>
        </div>
      </div>

      {/* Submission Form (Animmaster Spring Slide) */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="relative z-10 glass-panel rounded-3xl border border-sky-500/30 shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                <h2 className="text-lg font-bold text-white">Log Maintenance Request</h2>
              </div>
              <span className="text-xs font-mono text-sky-300 bg-sky-500/15 border border-sky-500/30 px-2.5 py-1 rounded-full">
                pgvector cosine check active
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Infrastructure Category
                  </label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-900/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-sky-400 transition-colors"
                  >
                    <option value="">Select category...</option>
                    {categories.map((cat) => (
                      <option key={cat.category_id} value={cat.category_id}>
                        {cat.department_name} — {cat.category_name} (SLA: {cat.default_sla_hours}h)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Campus Location
                  </label>
                  <select
                    required
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-900/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-sky-400 transition-colors"
                  >
                    <option value="">Select location...</option>
                    {locations.map((loc) => (
                      <option key={loc.location_id} value={loc.location_id}>
                        {loc.building} — {loc.floor}, {loc.room} {loc.zone ? `(${loc.zone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Complaint Subject / Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Tube light flickering violently in Lab 302"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Detailed Diagnostic Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue, specific spot, equipment number, or urgency..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Initial Priority Assessment
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="px-3.5 py-2 text-sm bg-slate-900/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-sky-400 transition-colors"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical (Safety hazard)</option>
                  </select>
                </div>
              </div>

              {/* Real-time Semantic Vector Similarity Warning Strip */}
              {checkingSimilarity && (
                <div className="text-xs text-sky-400 flex items-center gap-2 font-medium py-1">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-sky-300" />
                  <span>Computing 384-D vector & scanning pgvector index for duplicates...</span>
                </div>
              )}

              {similarWarnings.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-3">
                  <div className="text-xs font-bold flex items-center gap-2 text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>pgvector Duplicate Warning: Similar issues already exist!</span>
                  </div>
                  <div className="space-y-2">
                    {similarWarnings.map((sim) => (
                      <div
                        key={sim.complaint_id}
                        className="text-xs bg-slate-900/80 p-3 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <span className="font-semibold text-white">{sim.title}</span>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {sim.building} · {sim.room} · Status: <span className="font-mono text-sky-300">{sim.status}</span>
                          </div>
                        </div>
                        <SimilarityBadge score={sim.similarity} />
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    If your issue refers to the same fault, maintenance is already dispatching technicians. You may still submit if providing additional context.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <GlowButton
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </GlowButton>
                <GlowButton
                  type="submit"
                  variant="primary"
                  isLoading={submitting}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  {submitting ? 'Generating Embeddings & Storing...' : 'Submit Complaint'}
                </GlowButton>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complaints List */}
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-400" />
            <span>My Submitted Complaints ({complaints.length})</span>
          </h2>
        </div>

        {loading ? (
          <div className="glass-panel rounded-3xl p-12 text-center text-slate-400">
            Querying PostgreSQL 15 database...
          </div>
        ) : complaints.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center border border-white/10 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <p className="font-semibold text-white">No active complaints found</p>
            <p className="text-xs text-slate-400">Click &ldquo;File Complaint&rdquo; above to report an issue on campus.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {complaints.map((c) => (
              <motion.div
                key={c.complaint_id}
                whileHover={{ scale: 1.005 }}
                className="glass-card p-5 rounded-2xl border border-white/10 hover:border-sky-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-400 font-bold bg-slate-800/80 px-2 py-0.5 rounded border border-white/5">
                      #{c.complaint_id}
                    </span>
                    {getStatusBadge(c.status)}
                    {getPriorityBadge(c.priority)}
                    <span className="text-xs text-slate-400 bg-slate-800/60 px-2.5 py-0.5 rounded-full border border-white/5">
                      {c.category_name}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base">
                    {c.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-1">
                    {c.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                      {c.building}, {c.room}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                    {c.assigned_staff_name && (
                      <span className="text-purple-300 font-medium bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                        Technician: {c.assigned_staff_name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link href={`/complaints/${c.complaint_id}`}>
                    <GlowButton variant="secondary" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Details & History
                    </GlowButton>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

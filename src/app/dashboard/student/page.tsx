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
  Search,
  Filter
} from 'lucide-react';
import { Complaint, SimilarComplaint } from '@/types';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { SimilarityBadge } from '@/components/ui/SimilarityBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

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

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

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
    }, 450);

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

  const filteredComplaints = complaints.filter((c) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.building.toLowerCase().includes(q) ||
      c.room.toLowerCase().includes(q) ||
      c.category_name.toLowerCase().includes(q)
    );
  });

  const openTickets = complaints.filter((c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
  const resolvedTickets = complaints.filter((c) => c.status === 'RESOLVED').length;

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header & KPI Summary Strip */}
      <div className="saas-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Campus User Workstation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Student & Faculty Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              File facility complaints, track real-time resolution stages, and inspect pgvector duplicate warnings.
            </p>
          </div>

          <Button
            variant={showForm ? 'outline' : 'primary'}
            size="md"
            onClick={() => setShowForm(!showForm)}
            icon={showForm ? <X className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
          >
            {showForm ? 'Cancel Form' : 'Log Maintenance Request'}
          </Button>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-xs text-slate-400">Total Submitted</span>
            <div className="text-2xl font-bold text-white tabular-nums">{complaints.length}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/15 space-y-1">
            <span className="text-xs text-amber-400">In Active Progress</span>
            <div className="text-2xl font-bold text-amber-300 tabular-nums">{openTickets}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 space-y-1">
            <span className="text-xs text-emerald-400">Resolved Successfully</span>
            <div className="text-2xl font-bold text-emerald-300 tabular-nums">{resolvedTickets}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-sky-500/5 border border-sky-500/15 space-y-1">
            <span className="text-xs text-sky-400">Vector AI Guard</span>
            <div className="text-xs font-mono font-semibold text-sky-300 pt-1">384-D Deduplication</div>
          </div>
        </div>
      </div>

      {/* Complaint Submission Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="saas-card p-6 sm:p-8 space-y-6 overflow-hidden border-brand-500/30"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-400" />
                <h2 className="text-base font-bold text-white">Log Maintenance Request</h2>
              </div>
              <span className="text-xs font-mono text-brand-300 bg-brand-500/10 border border-brand-500/20 px-2.5 py-1 rounded-full">
                pgvector cosine check active
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Infrastructure Category
                  </label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs saas-input"
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
                  <label className="block text-xs font-medium text-slate-300">
                    Campus Location
                  </label>
                  <select
                    required
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs saas-input"
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
                <label className="block text-xs font-medium text-slate-300">
                  Complaint Subject / Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Tube light flickering violently in Lab 302"
                  className="w-full px-3.5 py-2.5 text-xs saas-input"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Detailed Diagnostic Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue, specific spot, equipment number, or urgency..."
                  className="w-full px-3.5 py-2.5 text-xs saas-input"
                />
              </div>

              <div className="space-y-1.5 max-w-xs">
                <label className="block text-xs font-medium text-slate-300">
                  Initial Priority Assessment
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs saas-input"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical (Safety hazard)</option>
                </select>
              </div>

              {/* Semantic Vector Duplicate Alert */}
              {checkingSimilarity && (
                <div className="text-xs text-sky-400 flex items-center gap-2 font-medium py-1">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-sky-300" />
                  <span>Computing 384-D vector & scanning pgvector index for duplicates...</span>
                </div>
              )}

              {similarWarnings.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 space-y-3">
                  <div className="text-xs font-bold flex items-center gap-2 text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>pgvector Duplicate Warning: Similar issues already exist!</span>
                  </div>
                  <div className="space-y-2">
                    {similarWarnings.map((sim) => (
                      <div
                        key={sim.complaint_id}
                        className="text-xs bg-slate-900/80 p-3 rounded-lg border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
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
                    If your issue refers to the same fault, technicians may already be working on it. You can still proceed if submitting additional details.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={submitting}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  {submitting ? 'Generating Embeddings & Storing...' : 'Submit Complaint'}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complaints List Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-400" />
            <span>My Submitted Complaints ({filteredComplaints.length})</span>
          </h2>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Filter by keyword, room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs saas-input"
            />
          </div>
        </div>

        {loading ? (
          <div className="saas-card p-8">
            <LoadingSkeleton lines={4} />
          </div>
        ) : filteredComplaints.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title={complaints.length === 0 ? 'No active complaints logged' : 'No complaints match filter'}
            description={complaints.length === 0 ? 'Click "Log Maintenance Request" above to report a campus facility issue.' : 'Try adjusting your search keywords.'}
            actionLabel={complaints.length === 0 ? 'File First Complaint' : undefined}
            onAction={complaints.length === 0 ? () => setShowForm(true) : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredComplaints.map((c) => (
              <div
                key={c.complaint_id}
                className="saas-card p-5 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-400 font-bold bg-white/5 px-2 py-0.5 rounded">
                      #{c.complaint_id}
                    </span>
                    <StatusBadge status={c.status} />
                    <PriorityBadge priority={c.priority} />
                    <span className="text-xs text-slate-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
                      {c.category_name}
                    </span>
                  </div>

                  <h3 className="font-semibold text-white text-sm">
                    {c.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-1">
                    {c.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-0.5">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-400" />
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
                    <Button variant="secondary" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Details & History
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

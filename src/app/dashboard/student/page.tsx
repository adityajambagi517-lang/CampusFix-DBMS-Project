'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusCircle, 
  Search, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';
import { Complaint, SimilarComplaint } from '@/types';

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
    }, 600);

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
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Open</span>;
      case 'ASSIGNED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">Assigned</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">In Progress</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Resolved</span>;
      case 'ESCALATED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">Escalated</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">Closed</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">Critical</span>;
      case 'HIGH':
        return <span className="text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">High</span>;
      case 'MEDIUM':
        return <span className="text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded">Medium</span>;
      default:
        return <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">Low</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student & Campus User Portal</h1>
          <p className="text-sm text-slate-500">Report campus maintenance issues and track resolution in real time</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          {showForm ? 'Cancel' : 'Report New Issue'}
        </button>
      </div>

      {/* Submission Form Modal / Card */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-sky-200 shadow-lg p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-600" /> New Complaint Submission
            </h2>
            <span className="text-xs font-mono text-sky-700 bg-sky-50 px-2 py-1 rounded">
              pgvector similarity enabled
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.department_name} — {cat.category_name} (SLA: {cat.default_sla_hours}h)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Campus Location
                </label>
                <select
                  required
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Complaint Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Tube light flickering violently in Lab 302"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Detailed Description
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue, specific spot, equipment number, or urgency..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Initial Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical (Safety hazard)</option>
                </select>
              </div>
            </div>

            {/* Real-time Semantic Duplicate Warnings */}
            {checkingSimilarity && (
              <div className="text-xs text-sky-600 flex items-center gap-2 font-medium">
                <Sparkles className="w-3.5 h-3.5 animate-spin" /> Checking pgvector for similar complaints in database...
              </div>
            )}

            {similarWarnings.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                <div className="text-xs font-bold flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Semantic Match Warning: Similar issue(s) already reported!
                </div>
                <div className="space-y-1.5">
                  {similarWarnings.map((sim) => (
                    <div key={sim.complaint_id} className="text-xs bg-white/80 p-2.5 rounded-lg border border-amber-200 flex justify-between items-center">
                      <div>
                        <span className="font-semibold">{sim.title}</span>
                        <div className="text-[11px] text-amber-800">
                          {sim.building} • {sim.room} • Status: <span className="font-mono">{sim.status}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                        {Math.round(sim.similarity * 100)}% match
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-amber-700">
                  If your issue is identical, the technicians are already working on it. You can still submit if you have unique details.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-5 py-2 rounded-xl shadow-sm text-sm disabled:opacity-50"
              >
                {submitting ? 'Registering & Computing Vectors...' : 'Submit Complaint'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Complaints List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-slate-700" /> Your Submitted Complaints ({complaints.length})
        </h2>

        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400">
            Loading complaints from database...
          </div>
        ) : complaints.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No active complaints found</p>
            <p className="text-xs text-slate-400">Click &ldquo;Report New Issue&rdquo; above to submit your first complaint.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {complaints.map((c) => (
              <div
                key={c.complaint_id}
                className="bg-white rounded-xl p-5 border border-slate-200 hover:border-sky-300 shadow-sm hover:shadow transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-400 font-bold">
                      #{c.complaint_id}
                    </span>
                    {getStatusBadge(c.status)}
                    {getPriorityBadge(c.priority)}
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {c.category_name}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">
                    {c.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-1">
                    {c.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {c.building}, {c.room}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Reported {new Date(c.created_at).toLocaleDateString()}
                    </span>
                    {c.assigned_staff_name && (
                      <span className="text-purple-700 font-medium">
                        Assigned to: {c.assigned_staff_name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/complaints/${c.complaint_id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold text-xs transition-colors"
                  >
                    View Details & History <ArrowRight className="w-3.5 h-3.5" />
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


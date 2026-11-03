'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare, 
  Sparkles, 
  Send,
  History,
  Shield,
  Wrench,
  GraduationCap
} from 'lucide-react';
import { Complaint, StatusHistoryItem, CommentItem, SimilarComplaint, UserSession } from '@/types';

export default function ComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const complaintId = params.id as string;

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [similar, setSimilar] = useState<SimilarComplaint[]>([]);
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  // New Comment
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Status update
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    loadAll();
  }, [complaintId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [cRes, uRes] = await Promise.all([
        fetch(`/api/complaints/${complaintId}`).then((r) => r.json()),
        fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (cRes.complaint) {
        setComplaint(cRes.complaint);
        setHistory(cRes.statusHistory || []);
        setComments(cRes.comments || []);
        setSimilar(cRes.similarComplaints || []);
      }
      if (uRes?.user) setUser(uRes.user);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/complaints/${complaintId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: commentText.trim() }),
      });

      if (res.ok) {
        setCommentText('');
        loadAll();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleQuickStatus = async (newStatus: string) => {
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, remarks: `Status changed to ${newStatus}` }),
      });
      if (res.ok) loadAll();
    } catch (err) {
      console.error(err);
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-2xl text-center text-slate-400">
        Loading complaint record #{complaintId}...
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="bg-white p-12 rounded-2xl text-center text-slate-500">
        Complaint not found.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <span className="font-mono text-xs text-slate-400">Record ID: #{complaint.complaint_id}</span>
      </div>

      {/* Main Ticket Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                complaint.status === 'OPEN'
                  ? 'bg-blue-100 text-blue-800'
                  : complaint.status === 'ASSIGNED'
                  ? 'bg-purple-100 text-purple-800'
                  : complaint.status === 'IN_PROGRESS'
                  ? 'bg-amber-100 text-amber-800'
                  : complaint.status === 'RESOLVED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {complaint.status}
              </span>

              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                complaint.priority === 'CRITICAL'
                  ? 'bg-red-100 text-red-800'
                  : complaint.priority === 'HIGH'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {complaint.priority} Priority
              </span>

              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded font-medium">
                {complaint.category_name}
              </span>

              <span className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded font-medium">
                {complaint.department_name}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 pt-1">
              {complaint.title}
            </h1>

            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/70 p-4 rounded-xl border border-slate-100">
              {complaint.description}
            </p>
          </div>

          {/* Quick Staff / Admin Action Box */}
          {user && (user.roleName === 'ADMIN' || user.roleName === 'MAINTENANCE_STAFF') && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex-shrink-0 space-y-2">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Status Controls
              </div>
              <div className="flex flex-col gap-1.5">
                {complaint.status !== 'IN_PROGRESS' && complaint.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleQuickStatus('IN_PROGRESS')}
                    disabled={statusUpdating}
                    className="text-xs font-semibold px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-sm"
                  >
                    Set In Progress
                  </button>
                )}
                {complaint.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleQuickStatus('RESOLVED')}
                    disabled={statusUpdating}
                    className="text-xs font-semibold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
                  >
                    Mark Resolved
                  </button>
                )}
                {complaint.status !== 'CLOSED' && (
                  <button
                    onClick={() => handleQuickStatus('CLOSED')}
                    disabled={statusUpdating}
                    className="text-xs font-semibold px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg shadow-sm"
                  >
                    Close Complaint
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Metadata Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
          <div>
            <span className="font-semibold text-slate-800 block">Reported By:</span>
            {complaint.reporter_name} ({complaint.reporter_email})
          </div>
          <div>
            <span className="font-semibold text-slate-800 block">Campus Location:</span>
            {complaint.building} — {complaint.room} ({complaint.floor})
          </div>
          <div>
            <span className="font-semibold text-slate-800 block">Assigned Technician:</span>
            {complaint.assigned_staff_name ? (
              <span className="text-purple-700 font-bold">{complaint.assigned_staff_name}</span>
            ) : (
              <span className="text-slate-400 italic">Unassigned</span>
            )}
          </div>
          <div>
            <span className="font-semibold text-slate-800 block">SLA Target Deadline:</span>
            {complaint.sla_due_at ? (
              <span className={complaint.sla_status === 'BREACHED' ? 'text-red-600 font-bold' : 'text-slate-700'}>
                {new Date(complaint.sla_due_at).toLocaleString()}
              </span>
            ) : (
              'None'
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Comments & Similar Complaints */}
        <div className="lg:col-span-2 space-y-8">
          {/* Comments Discussion Thread */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-sky-600" /> Discussion & Remarks ({comments.length})
            </h2>

            <div className="space-y-3">
              {comments.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-2">No comments posted yet.</div>
              ) : (
                comments.map((cm) => (
                  <div key={cm.comment_id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">
                        {cm.author_name}{' '}
                        <span className="font-normal text-[10px] text-slate-400">({cm.author_role})</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(cm.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap">{cm.body}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Post Box */}
            <form onSubmit={handlePostComment} className="pt-2 flex gap-2">
              <input
                type="text"
                placeholder="Write a message, repair update, or note..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 text-xs px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" /> Post
              </button>
            </form>
          </div>

          {/* Semantically Similar Complaints via pgvector */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" /> Semantically Similar Complaints (pgvector)
              </h2>
              <p className="text-xs text-slate-500">
                Matched via 384-dimensional cosine distance (<code className="font-mono text-indigo-700 text-[11px]">fn_match_similar_complaints</code>)
              </p>
            </div>

            {similar.length === 0 ? (
              <div className="text-xs text-slate-400 italic py-2">
                No similar issues detected above 60% cosine similarity threshold.
              </div>
            ) : (
              <div className="space-y-2.5">
                {similar.map((s) => (
                  <div key={s.complaint_id} className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/40 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs text-slate-900">{s.title}</div>
                      <div className="text-[11px] text-slate-500">
                        {s.building} — {s.room} • {s.category_name} • Status: <span className="font-semibold text-slate-700">{s.status}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                        {Math.round(s.similarity * 100)}% Match
                      </span>
                      <Link
                        href={`/complaints/${s.complaint_id}`}
                        className="block text-[10px] text-indigo-600 hover:underline pt-1"
                      >
                        Inspect #{s.complaint_id}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Trigger-backed Status History Audit Trail */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-600" /> Lifecycle Audit Trail
            </h2>
            <p className="text-xs text-slate-500">
              Automatic triggers (<code className="font-mono text-emerald-700 text-[11px]">trg_complaint_status_history</code>)
            </p>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {history.map((h, idx) => (
              <div key={h.history_id} className="relative space-y-1">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">
                    {h.new_status}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(h.changed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {h.remarks && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {h.remarks}
                  </p>
                )}
                <div className="text-[10px] text-slate-400">
                  {h.changer_name ? `By ${h.changer_name}` : 'System Trigger'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { SimilarityBadge } from '@/components/ui/SimilarityBadge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

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
      <div className="saas-card p-12 max-w-4xl mx-auto my-8">
        <LoadingSkeleton lines={5} />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="saas-card p-12 text-center text-slate-400 max-w-lg mx-auto my-12">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <h2 className="text-base font-bold text-white">Complaint Not Found</h2>
        <p className="text-xs text-slate-400 mt-1">This record does not exist or may have been deleted.</p>
        <div className="pt-4">
          <Button variant="secondary" size="sm" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Breadcrumb Bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.back()}
          icon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Back
        </Button>
        <span className="font-mono text-xs text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/5">
          Record ID: #{complaint.complaint_id}
        </span>
      </div>

      {/* Main Ticket Header Card */}
      <div className="saas-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />

              <span className="text-xs bg-white/5 text-slate-300 px-3 py-0.5 rounded-full border border-white/5 font-medium">
                {complaint.category_name}
              </span>

              <span className="text-xs text-brand-300 bg-brand-500/10 border border-brand-500/20 px-3 py-0.5 rounded-full font-medium">
                {complaint.department_name}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight pt-1">
              {complaint.title}
            </h1>

            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap bg-white/5 p-4 rounded-xl border border-white/5">
              {complaint.description}
            </div>
          </div>

          {/* Quick Staff / Admin Action Box */}
          {user && (user.roleName === 'ADMIN' || user.roleName === 'MAINTENANCE_STAFF') && (
            <div className="saas-card p-4 flex-shrink-0 space-y-3 min-w-[200px] border-white/10">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Status Controls
              </div>
              <div className="flex flex-col gap-2">
                {complaint.status !== 'IN_PROGRESS' && complaint.status !== 'RESOLVED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleQuickStatus('IN_PROGRESS')}
                    isLoading={statusUpdating}
                  >
                    Set In Progress
                  </Button>
                )}
                {complaint.status !== 'RESOLVED' && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleQuickStatus('RESOLVED')}
                    isLoading={statusUpdating}
                  >
                    Mark Resolved
                  </Button>
                )}
                {complaint.status !== 'CLOSED' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleQuickStatus('CLOSED')}
                    isLoading={statusUpdating}
                  >
                    Close Complaint
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Metadata Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10 text-xs text-slate-400">
          <div>
            <span className="font-semibold text-white block mb-0.5">Reported By:</span>
            {complaint.reporter_name} <span className="font-mono text-slate-500">({complaint.reporter_email})</span>
          </div>
          <div>
            <span className="font-semibold text-white block mb-0.5">Campus Location:</span>
            {complaint.building} — {complaint.room} ({complaint.floor})
          </div>
          <div>
            <span className="font-semibold text-white block mb-0.5">Assigned Technician:</span>
            {complaint.assigned_staff_name ? (
              <span className="text-purple-300 font-bold">{complaint.assigned_staff_name}</span>
            ) : (
              <span className="text-slate-500 italic">Unassigned</span>
            )}
          </div>
          <div>
            <span className="font-semibold text-white block mb-0.5">SLA Target Deadline:</span>
            {complaint.sla_due_at ? (
              <span className={complaint.sla_status === 'BREACHED' ? 'text-rose-400 font-bold' : 'text-slate-300'}>
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
          <div className="saas-card p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-400" />
              <span>Discussion & Remarks ({comments.length})</span>
            </h2>

            <div className="space-y-3">
              {comments.length === 0 ? (
                <div className="text-xs text-slate-500 italic py-2">No comments posted yet.</div>
              ) : (
                comments.map((cm) => (
                  <div key={cm.comment_id} className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">
                        {cm.author_name}{' '}
                        <span className="font-normal text-[10px] text-slate-400 font-mono">({cm.author_role})</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(cm.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{cm.body}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Post Box */}
            <form onSubmit={handlePostComment} className="pt-2 flex gap-2.5">
              <input
                type="text"
                placeholder="Write an update, note, or remarks..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 text-xs px-4 py-2.5 saas-input"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={submittingComment}
                disabled={!commentText.trim()}
                icon={<Send className="w-3.5 h-3.5" />}
              >
                Post
              </Button>
            </form>
          </div>

          {/* Semantically Similar Complaints via pgvector */}
          <div className="saas-card p-6 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Semantically Similar Complaints (pgvector)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Matched via 384-dimensional cosine distance (<code className="font-mono text-purple-300 text-[11px]">fn_match_similar_complaints</code>)
              </p>
            </div>

            {similar.length === 0 ? (
              <div className="text-xs text-slate-500 italic py-2">
                No similar issues detected above 60% cosine similarity threshold.
              </div>
            ) : (
              <div className="space-y-2.5">
                {similar.map((s) => (
                  <div
                    key={s.complaint_id}
                    className="p-3.5 rounded-xl border border-white/5 bg-white/5 flex items-center justify-between gap-3 hover:border-purple-500/30 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-xs text-white">{s.title}</div>
                      <div className="text-[11px] text-slate-400">
                        {s.building} — {s.room} · {s.category_name} · Status: <span className="font-semibold text-sky-300">{s.status}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 flex items-center gap-3">
                      <SimilarityBadge score={s.similarity} />
                      <Link
                        href={`/complaints/${s.complaint_id}`}
                        className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
                      >
                        Inspect
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Trigger-backed Status History Audit Trail */}
        <div className="saas-card p-6 space-y-4 h-fit">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <span>Lifecycle Audit Trail</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated database trigger (<code className="font-mono text-emerald-300 text-[11px]">trg_complaint_status_history</code>)
            </p>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
            {history.map((h, idx) => (
              <div key={h.history_id} className="relative space-y-1">
                <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">
                    {h.new_status}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(h.changed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {h.remarks && (
                  <p className="text-xs text-slate-300 bg-white/5 p-2 rounded-lg border border-white/5">
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

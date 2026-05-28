import React, { useState } from 'react';
import {
  CheckCircle2, XCircle, AlertTriangle, MessageSquare, Filter,
  ArrowLeft, ThumbsUp, ThumbsDown, RotateCcw, Eye, User, Clock
} from 'lucide-react';
import { Review, ReviewComment, Annotation } from '../types';

interface Props {
  dark: boolean;
  annotations: Annotation[];
  onApprove: (annotationId: string) => void;
  onReject: (annotationId: string, reason: string, category: string) => void;
  onRequestRevision: (annotationId: string, comment: string) => void;
}

const MOCK_REVIEWS = [
  { id: '1', annotationId: 'a1', annotationLabel: 'Vehicle', type: 'rectangle', status: 'pending', reviewer: 'QA Team', comment: '', category: 'general' },
  { id: '2', annotationId: 'a2', annotationLabel: 'Person', type: 'polygon', status: 'pending', reviewer: 'QA Team', comment: 'Vertices not aligned', category: 'geometry' },
  { id: '3', annotationId: 'a3', annotationLabel: 'Cyclist', type: 'bounding-box', status: 'rejected', reviewer: 'QA Team', comment: 'Wrong class label', category: 'mislabel' },
  { id: '4', annotationId: 'a4', annotationLabel: 'Traffic Sign', type: 'rectangle', status: 'approved', reviewer: 'QA Team', comment: '', category: 'general' },
  { id: '5', annotationId: 'a5', annotationLabel: 'Pedestrian', type: 'polygon', status: 'pending', reviewer: 'QA Team', comment: 'Missing occlusion attribute', category: 'attribute' },
  { id: '6', annotationId: 'a6', annotationLabel: 'Car', type: 'bounding-box', status: 'pending', reviewer: 'QA Team', comment: 'Possible duplicate', category: 'duplicate' },
];

const CATEGORIES = [
  { value: 'general', label: 'General', color: 'gray' },
  { value: 'geometry', label: 'Geometry', color: 'blue' },
  { value: 'attribute', label: 'Attribute', color: 'amber' },
  { value: 'missing', label: 'Missing', color: 'rose' },
  { value: 'duplicate', label: 'Duplicate', color: 'orange' },
  { value: 'mislabel', label: 'Mislabel', color: 'red' },
];

export default function QAReviewPanel({ dark, annotations, onApprove, onReject, onRequestRevision }: Props) {
  const [filter, setFilter] = useState<string>('all');
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectCategory, setRejectCategory] = useState('general');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const filtered = filter === 'all' ? MOCK_REVIEWS : MOCK_REVIEWS.filter(r => r.status === filter);
  const pendingCount = MOCK_REVIEWS.filter(r => r.status === 'pending').length;
  const approvedCount = MOCK_REVIEWS.filter(r => r.status === 'approved').length;
  const rejectedCount = MOCK_REVIEWS.filter(r => r.status === 'rejected').length;

  const card = `rounded-xl border ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`;

  const statusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 size={18} className="text-emerald-500" />;
      case 'rejected': return <XCircle size={18} className="text-rose-500" />;
      default: return <AlertTriangle size={18} className="text-amber-500" />;
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: dark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700',
      approved: dark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700',
      rejected: dark ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-100 text-rose-700',
      needs_revision: dark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700',
    };
    return `px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || map.pending}`;
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>QA Review</h1>
          <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Review and validate annotations</p>
        </div>
        <div className="flex items-center gap-3">
          {[
            { key: 'all', label: 'All', count: MOCK_REVIEWS.length },
            { key: 'pending', label: 'Pending', count: pendingCount },
            { key: 'approved', label: 'Approved', count: approvedCount },
            { key: 'rejected', label: 'Rejected', count: rejectedCount },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f.key
                  ? 'bg-blue-600 text-white'
                  : dark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className={`${card} p-4 flex items-center gap-3`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${dark ? 'bg-amber-900/30' : 'bg-amber-50'}`}>
            <Clock size={20} className="text-amber-500" />
          </div>
          <div>
            <p className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{pendingCount}</p>
            <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Pending Review</p>
          </div>
        </div>
        <div className={`${card} p-4 flex items-center gap-3`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${dark ? 'bg-emerald-900/30' : 'bg-emerald-50'}`}>
            <ThumbsUp size={20} className="text-emerald-500" />
          </div>
          <div>
            <p className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{approvedCount}</p>
            <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Approved</p>
          </div>
        </div>
        <div className={`${card} p-4 flex items-center gap-3`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${dark ? 'bg-rose-900/30' : 'bg-rose-50'}`}>
            <ThumbsDown size={20} className="text-rose-500" />
          </div>
          <div>
            <p className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{rejectedCount}</p>
            <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Rejected</p>
          </div>
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-3">
        {filtered.map(review => (
          <div key={review.id} className={card}>
            <div className="flex items-center gap-4 p-4">
              {statusIcon(review.status)}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{review.annotationLabel}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${dark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                    {review.type}
                  </span>
                </div>
                {review.comment && (
                  <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{review.comment}</p>
                )}
              </div>
              <span className={statusBadge(review.status)}>{review.status.replace('_', ' ')}</span>
              {review.category && review.category !== 'general' && (
                <span className={`px-1.5 py-0.5 rounded text-xs ${dark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                  {review.category}
                </span>
              )}
              {review.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onApprove(review.annotationId)}
                    className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                    title="Approve"
                  >
                    <ThumbsUp size={16} />
                  </button>
                  <button
                    onClick={() => { setSelectedReview(review.id); setShowRejectForm(true); }}
                    className="p-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                    title="Reject"
                  >
                    <ThumbsDown size={16} />
                  </button>
                  <button
                    onClick={() => onRequestRevision(review.annotationId, 'Needs revision')}
                    className={`p-2 rounded-lg transition-colors ${dark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    title="Request Revision"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Reject form */}
            {showRejectForm && selectedReview === review.id && (
              <div className={`border-t p-4 ${dark ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="space-y-3">
                  <div>
                    <label className={`text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>Category</label>
                    <select
                      value={rejectCategory}
                      onChange={(e) => setRejectCategory(e.target.value)}
                      className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                        dark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>Reason</label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className={`w-full mt-1 px-3 py-2 rounded-lg border h-20 resize-none ${
                        dark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Explain why this annotation was rejected..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowRejectForm(false)} className={`px-3 py-1.5 rounded-lg text-sm ${dark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>
                      Cancel
                    </button>
                    <button
                      onClick={() => { onReject(review.annotationId, rejectReason, rejectCategory); setShowRejectForm(false); setRejectReason(''); }}
                      className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-sm hover:bg-rose-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

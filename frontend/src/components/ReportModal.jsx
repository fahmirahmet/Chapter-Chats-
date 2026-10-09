import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Flag, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Send, 
  ShieldAlert 
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const REPORT_REASONS = [
  { id: 'HARASSMENT', label: 'Harassment or Inappropriate Tone', desc: 'Disrespectful language, insults, personal attacks, or hate speech.' },
  { id: 'SPOILER', label: 'Unmarked Critical Spoilers', desc: 'Reveals plot twists or endings without using the required >!spoiler!< markdown tag.' },
  { id: 'IRRELEVANT', label: 'Spam or Inappropriate Pitch', desc: 'Self-promotion, commercial advertising, or off-topic content.' },
  { id: 'OTHER', label: 'Other Policy Violation', desc: 'Any other violation of the Chapter & Chats Member Code of Conduct.' },
];

export default function ReportModal({ 
  isOpen, 
  onClose, 
  targetType = 'thread', // 'thread' | 'submission'
  targetId, 
  targetTitle = '',
  targetAuthor = ''
}) {
  const { user } = useAuth();
  const [reason, setReason] = useState('HARASSMENT');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetId) return;

    if (!user) {
      setFeedback({ type: 'error', message: 'You must be signed in to submit a content report.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payload = {
        reason,
        details: details.trim(),
        target_type: targetType,
        target_id: targetId
      };
      if (targetType === 'thread') {
        payload.thread_id = targetId;
      } else if (targetType === 'reply') {
        payload.reply_id = targetId;
      } else if (targetType === 'proposal') {
        payload.proposal_id = targetId;
      } else {
        payload.submission_id = targetId;
      }

      const res = await apiClient.post('/activities/reports/', payload);
      setIsSuccess(true);
      setFeedback({
        type: 'success',
        message: res.data?.message || 'Report submitted. Executive officers will review this content shortly.'
      });
      setTimeout(() => {
        setIsSuccess(false);
        setFeedback(null);
        setDetails('');
        onClose();
      }, 2500);
    } catch (err) {
      console.error('Report submission error:', err);
      const errMsg = err.response?.data?.detail || 'Failed to submit report. Please try again.';
      setFeedback({ type: 'error', message: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const itemLabel = targetType === 'thread' 
    ? 'Discussion Topic' 
    : targetType === 'reply'
    ? 'Discussion Reply'
    : targetType === 'proposal'
    ? 'Book Proposal'
    : 'Story Submission';

  const modalContent = (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
    >
      {/* Modal Card */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#F8F4EC] rounded-2xl shadow-2xl border-2 border-[#D8C8B0] overflow-hidden z-10 flex flex-col my-auto animate-slide-down"
      >
        
        {/* Header */}
        <div className="bg-[#2D1B0F] text-[#F8F4EC] p-5 sm:p-6 border-b-2 border-[#C48B47]/40 relative">
          <button
            onClick={onClose}
            type="button"
            className="absolute top-5 right-5 p-2 rounded-full text-[#EFE7DA]/70 hover:text-white hover:bg-[#422817] transition-colors cursor-pointer"
            aria-label="Close report modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-900/80 border border-rose-500/50 flex items-center justify-center text-rose-300 shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-300" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg sm:text-xl text-white">
                Report {itemLabel}
              </h3>
              <p className="text-xs text-[#EFE7DA]/75">
                Flag content violating community standards or Code of Conduct
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Target Summary Excerpt */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#D8C8B0] space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[#2D1B0F]/60">
              <span className="font-bold uppercase tracking-wider text-[#A35C33]">Target Item</span>
              {targetAuthor && <span>Author: <strong>{targetAuthor}</strong></span>}
            </div>
            <p className="font-serif text-sm font-bold text-[#2D1B0F] line-clamp-2">
              "{targetTitle || `${itemLabel} #${targetId}`}"
            </p>
          </div>

          {feedback && (
            <div className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-semibold animate-fade-in ${
              feedback.type === 'success' 
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border border-rose-300 text-rose-900'
            }`}>
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="py-6 text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
              <h4 className="font-serif font-bold text-lg text-[#2D1B0F]">Report Submitted</h4>
              <p className="text-xs text-[#2D1B0F]/70">
                Thank you for helping keep Chapter &amp; Chats safe, constructive, and respectful.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#2D1B0F]">
                  Select Violation Category *
                </label>
                <div className="space-y-2">
                  {REPORT_REASONS.map((r) => (
                    <label 
                      key={r.id}
                      className={`flex items-start gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                        reason === r.id
                          ? 'bg-[#2D1B0F] text-[#FFF8EE] border-[#C48B47] shadow-xs'
                          : 'bg-white text-[#2D1B0F] border-[#D8C8B0] hover:bg-[#EFE7DA]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="report_reason"
                        value={r.id}
                        checked={reason === r.id}
                        onChange={() => setReason(r.id)}
                        className="mt-0.5 cursor-pointer accent-[#A35C33]"
                      />
                      <div className="space-y-0.5">
                        <span className="font-bold text-xs block leading-tight">{r.label}</span>
                        <span className={`text-[11px] block leading-snug ${reason === r.id ? 'text-[#EFE7DA]/80' : 'text-[#2D1B0F]/65'}`}>
                          {r.desc}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide context on why this content violates club rules..."
                  className="w-full p-3 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:border-[#A35C33] focus:outline-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-[#D8C8B0] bg-white text-[#2D1B0F] font-bold text-xs hover:bg-[#EFE7DA] transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Report...</span>
                    </>
                  ) : (
                    <>
                      <Flag className="w-4 h-4" />
                      <span>Submit Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

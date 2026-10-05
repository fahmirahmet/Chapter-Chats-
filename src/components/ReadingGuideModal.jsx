import React from 'react';
import { X, BookOpen, FileText, Download, HelpCircle, Sparkles, CheckCircle2, Calendar } from 'lucide-react';

export default function ReadingGuideModal({ book, isOpen, onClose, onDownloadGuide }) {
  if (!isOpen || !book) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-brand-dark/65 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      {/* Modal Content Container */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-brand-surface rounded-3xl shadow-2xl border-2 border-brand-accent/50 overflow-hidden z-10 flex flex-col animate-slide-down">
        {/* Modal Header */}
        <div className="bg-brand-dark text-brand-surface p-6 border-b border-brand-accent/30 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-brand-cream/70 hover:text-brand-cream hover:bg-brand-dark-light transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary text-brand-accent flex items-center justify-center shrink-0 border border-brand-accent/40 shadow-sm">
              <BookOpen className="w-6 h-6 text-brand-accent" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-accent text-brand-dark px-2.5 py-0.5 rounded-full">
                  Official Discussion Guide Sheet
                </span>
                <span className="text-[11px] font-semibold text-brand-cream/80">
                  {book.genre}
                </span>
              </div>
              <h3 className="font-serif font-bold text-2xl text-white leading-snug">
                {book.title}
              </h3>
              <p className="text-xs text-brand-cream/90 font-medium">
                by {book.author} • {book.totalPages} Pages
              </p>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-brand-dark">
          {/* Overview Section */}
          <div className="space-y-2">
            <h4 className="font-serif font-bold text-base text-brand-dark flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-secondary" />
              <span>Literary Overview &amp; Synopsis</span>
            </h4>
            <p className="text-xs sm:text-sm text-brand-dark/80 leading-relaxed bg-white p-4 rounded-2xl border border-brand-cream/70">
              {book.synopsis}
            </p>
          </div>

          {/* Meeting Discussion Questions List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-serif font-bold text-base text-brand-dark flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-brand-primary" />
                <span>Tuesday Meeting Discussion Questions</span>
              </h4>
              <span className="text-[10px] font-bold text-brand-primary bg-brand-cream/50 px-2 py-0.5 rounded">
                Prepared by Club Executives
              </span>
            </div>

            <div className="space-y-2.5">
              {book.discussionQuestions.map((q, idx) => (
                <div 
                  key={idx} 
                  className="p-3.5 rounded-2xl bg-white border border-brand-cream/80 flex items-start gap-3 shadow-warm-sm"
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-dark text-brand-accent font-serif font-bold text-xs shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs sm:text-sm font-medium text-brand-dark/90 leading-relaxed">
                    {q}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Meeting Tip Banner */}
          <div className="p-4 rounded-2xl bg-brand-cream/30 border border-brand-cream flex items-center gap-3 text-xs text-brand-dark">
            <Calendar className="w-5 h-5 text-brand-secondary shrink-0" />
            <div>
              <strong className="block font-serif text-sm">Physical Meetup Note:</strong>
              <span>Bring your notes to Student Center Library Hall B on Tuesday at 12:30 PM for group review.</span>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-brand-cream flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-brand-dark/60">
            <span>IEEE Std 830 Verified Discussion Worksheet</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-brand-cream text-brand-dark font-bold text-xs hover:bg-brand-cream/40 transition-colors"
            >
              Close
            </button>

            <button
              onClick={() => onDownloadGuide(book)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-accent text-brand-dark font-bold text-xs hover:bg-brand-secondary hover:text-white transition-colors shadow-warm-sm flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-brand-dark" />
              <span>Download Guide PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

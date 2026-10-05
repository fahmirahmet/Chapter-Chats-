import React from 'react';
import { BookOpen, Download, FileText, Sparkles, Trash2 } from 'lucide-react';

export default function BookCard({ book, onOpenGuide, onDownloadPdf, isExecutive = false, onDeleteBook = null }) {
  const isCurrentCycle = book.cycleFeatured === 'Active Cycle Pick';

  return (
    <div className={`group bg-white rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative ${
      isCurrentCycle 
        ? 'border-2 border-brand-accent shadow-warm-md hover:shadow-warm-lg ring-4 ring-brand-cream/30' 
        : 'border-brand-cream/80 shadow-warm-sm hover:shadow-warm-md hover:border-brand-accent/60'
    }`}>
      {/* Cover Image & Top Badges Header */}
      <div className="relative h-48 w-full bg-brand-dark/90 overflow-hidden">
        <img
          src={book.coverUrl || book.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'}
          alt={book.title}
          className="w-full h-full object-cover opacity-85 group-hover:scale-105 group-hover:opacity-95 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/30 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-surface/90 text-brand-dark px-2.5 py-1 rounded-full backdrop-blur-md shadow-sm border border-brand-cream/40">
            {book.genre}
          </span>
          
          <div className="flex items-center gap-1.5 ml-auto">
            {book.cycleFeatured && (
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 backdrop-blur-md ${
                isCurrentCycle
                  ? 'bg-brand-accent text-brand-dark font-extrabold border border-brand-dark'
                  : 'bg-brand-dark/80 text-brand-cream border border-brand-cream/30'
              }`}>
                {isCurrentCycle && <Sparkles className="w-3 h-3 text-brand-dark fill-brand-dark" />}
                {book.cycleFeatured}
              </span>
            )}

            {isExecutive && onDeleteBook && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteBook(book);
                }}
                type="button"
                title={`Remove "${book.title}" from library`}
                className="p-1.5 rounded-full bg-red-950/80 hover:bg-red-600 text-red-200 hover:text-white border border-red-400/40 backdrop-blur-md transition-all shadow-md cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Title overlay over cover */}
        <div className="absolute bottom-3 left-4 right-4 z-10 space-y-0.5">
          <h3 className="font-serif font-bold text-lg text-white leading-tight drop-shadow-md line-clamp-1">
            {book.title}
          </h3>
          <p className="text-xs text-brand-cream/90 font-medium drop-shadow">
            by {book.author}
          </p>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <p className="text-xs text-brand-dark/80 leading-relaxed line-clamp-3">
          {book.synopsis}
        </p>

        {/* Book Specs Row */}
        <div className="pt-3 border-t border-brand-cream/60 flex items-center justify-between text-[11px] font-semibold text-brand-dark/70">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-brand-secondary" />
            {book.totalPages} Pages
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-brand-primary" />
            {book.fileSize} PDF
          </span>
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="p-4 bg-brand-surface border-t border-brand-cream/60 flex items-center gap-2">
        {/* Study Guide Button */}
        <button
          onClick={() => onOpenGuide(book)}
          type="button"
          className="flex-1 py-2.5 px-3 rounded-xl bg-white border border-brand-cream text-brand-dark font-bold text-xs hover:bg-brand-cream/50 transition-colors flex items-center justify-center gap-1.5 shadow-warm-sm cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-brand-secondary" />
          <span>Study Guide</span>
        </button>

        {/* Download PDF Button */}
        <button
          onClick={() => onDownloadPdf(book)}
          type="button"
          className="flex-1 py-2.5 px-3 rounded-xl bg-brand-dark text-brand-cream font-bold text-xs hover:bg-brand-primary transition-colors flex items-center justify-center gap-1.5 shadow-warm-sm group/btn cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-brand-accent group-hover/btn:translate-y-0.5 transition-transform" />
          <span>Download PDF</span>
        </button>

        {/* Executive Delete Action Button */}
        {isExecutive && onDeleteBook && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteBook(book);
            }}
            type="button"
            title={`Delete "${book.title}"`}
            className="p-2.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 transition-colors border border-red-200 shadow-warm-sm flex items-center justify-center shrink-0 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { BookOpen, Download, FileText, Sparkles, Trash2 } from 'lucide-react';

export default function BookCard({ book, onOpenGuide, onDownloadPdf, isExecutive = false, onDeleteBook = null }) {
  const [imgError, setImgError] = useState(false);
  const isCurrentCycle = book.cycleFeatured === 'Active Cycle Pick';

  const rawCover = book.coverUrl || book.cover_url || book.coverImage || book.cover_image;
  const coverSrc = rawCover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';

  const fileSizeDisplay = book.file_size_formatted || (book.file_size ? `${(book.file_size / (1024 * 1024)).toFixed(1)} MB` : (book.fileSize || 'PDF'));

  return (
    <div className={`group bg-white rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative ${
      isCurrentCycle 
        ? 'border-2 border-brand-accent shadow-warm-md hover:shadow-warm-lg ring-4 ring-brand-cream/30' 
        : 'border-brand-cream/80 shadow-warm-sm hover:shadow-warm-md hover:border-brand-accent/60'
    }`}>
      {/* Top Badges & Actions Strip */}
      <div className="p-4 pb-2 bg-brand-surface/40 flex items-center justify-between gap-2 border-b border-brand-cream/40">
        <span className="text-[10px] font-bold uppercase tracking-wider bg-white text-brand-dark px-2.5 py-1 rounded-full shadow-xs border border-brand-cream/60">
          {book.genre}
        </span>
        
        <div className="flex items-center gap-1.5 ml-auto">
          {book.cycleFeatured && (
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1 ${
              isCurrentCycle
                ? 'bg-brand-accent text-brand-dark font-extrabold border border-brand-dark'
                : 'bg-brand-dark text-brand-cream border border-brand-cream/30'
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

      {/* Standard 2:3 Book Cover Wrapper */}
      <div className="p-4 pt-3 bg-brand-surface/20 flex flex-col items-center">
        <div className="aspect-[2/3] w-full max-w-[220px] mx-auto overflow-hidden rounded-xl bg-stone-900/10 dark:bg-stone-800 flex items-center justify-center relative shadow-sm border border-brand-cream/80">
          {!imgError && coverSrc ? (
            <img
              src={coverSrc}
              alt={book.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-contain group-hover:scale-105 transition-all duration-500"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center space-y-2 select-none">
              <div className="w-12 h-12 rounded-xl bg-brand-cream/80 flex items-center justify-center text-brand-primary">
                <BookOpen className="w-6 h-6 text-brand-primary" />
              </div>
              <span className="text-xs font-serif font-bold text-brand-dark line-clamp-2">{book.title}</span>
              <span className="text-[10px] uppercase font-bold text-brand-secondary bg-brand-cream/60 px-2 py-0.5 rounded">
                {book.genre || 'Reading Copy'}
              </span>
            </div>
          )}
        </div>

        {/* Title and Author Header below cover */}
        <div className="mt-3 text-center space-y-0.5 px-2 w-full">
          <h3 className="font-serif font-bold text-base text-brand-dark leading-tight line-clamp-1" title={book.title}>
            {book.title}
          </h3>
          <p className="text-xs text-brand-dark/70 font-medium">
            by {book.author}
          </p>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5 pt-2 flex-1 flex flex-col justify-between space-y-4">
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
            {fileSizeDisplay}
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

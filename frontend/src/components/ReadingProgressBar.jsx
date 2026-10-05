import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, Bookmark, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ReadingProgressBar({ initialPages, totalPages, onSavePages }) {
  const { user, updateReadingProgress } = useAuth();
  const [currentPage, setCurrentPage] = useState(initialPages || user?.current_page_read || 185);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (user?.current_page_read) {
      setCurrentPage(user.current_page_read);
    }
  }, [user?.current_page_read]);

  const percentage = Math.min(Math.round((currentPage / (totalPages || 340)) * 100), 100);

  const handleSliderChange = (e) => {
    setCurrentPage(Number(e.target.value));
    setIsSaved(false);
  };

  const handleSave = async () => {
    if (updateReadingProgress) {
      await updateReadingProgress(currentPage);
    }
    if (onSavePages) onSavePages(currentPage);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-brand-cream/80 shadow-warm-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-primary text-brand-cream flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-base text-brand-dark leading-tight">
              Personal Reading Progress Log
            </h4>
            <p className="text-xs text-brand-dark/70">
              Active Book: "The Crucible of Reflection"
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="font-serif font-bold text-xl text-brand-primary block">
            {currentPage} <span className="text-xs font-sans text-brand-dark/60">/ {totalPages} Pages</span>
          </span>
          <span className="text-[10px] font-bold uppercase bg-brand-cream/50 text-brand-dark px-2 py-0.5 rounded">
            {percentage}% Completed
          </span>
        </div>
      </div>

      {/* Interactive Slider Input */}
      <div className="space-y-2 pt-2">
        <input
          type="range"
          min="1"
          max={totalPages}
          value={currentPage}
          onChange={handleSliderChange}
          className="w-full h-2.5 bg-brand-cream/60 rounded-lg appearance-none cursor-pointer accent-brand-secondary"
        />

        <div className="flex items-center justify-between text-[11px] font-semibold text-brand-dark/60">
          <span>Start (Pg 1)</span>
          <span className="text-brand-secondary font-bold">Week 2 Target: Pg 224 (66%)</span>
          <span>Finish (Pg {totalPages})</span>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-2 flex items-center justify-between">
        {isSaved ? (
          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Logged Page {currentPage}! Progress saved.
          </span>
        ) : (
          <span className="text-[11px] text-brand-dark/60 italic">
            Drag the slider to update your current reading page.
          </span>
        )}

        <button
          onClick={handleSave}
          type="button"
          className="px-4 py-2 rounded-xl bg-brand-dark text-brand-cream font-bold text-xs hover:bg-brand-primary transition-colors shadow-warm-sm"
        >
          Save Reading Progress
        </button>
      </div>
    </div>
  );
}

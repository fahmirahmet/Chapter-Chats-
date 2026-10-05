import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

export default function DeleteConfirmModal({
  isOpen,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this item?',
  itemTitle = null,
  dangerNote = 'This action cannot be undone and will permanently remove this record.',
  confirmLabel = 'Delete Permanently',
  isDeleting = false,
  onConfirm,
  onClose
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        onClick={!isDeleting ? onClose : undefined} 
        className="fixed inset-0 bg-[#1E110A]/75 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-[#F8F4EC] rounded-3xl border-2 border-[#D8C8B0] shadow-2xl overflow-hidden z-10 my-auto animate-slide-down text-[#2D1B0F]">
        {/* Header Ribbon */}
        <div className="bg-[#2D1B0F] text-[#F8F4EC] p-5 flex items-center justify-between border-b-2 border-[#C48B47]/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/40 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-rose-300" />
            </div>
            <h3 className="font-serif font-bold text-lg text-white">
              {title}
            </h3>
          </div>

          {!isDeleting && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[#EFE7DA]/70 hover:text-white hover:bg-[#422817] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs sm:text-sm text-[#2D1B0F]/85 leading-relaxed font-medium">
            {message}
          </p>

          {itemTitle && (
            <div className="p-3.5 bg-white rounded-2xl border border-[#D8C8B0] shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A35C33] block mb-1">
                Selected Item
              </span>
              <p className="font-serif font-bold text-sm text-[#2D1B0F] line-clamp-2">
                "{itemTitle}"
              </p>
            </div>
          )}

          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="text-[11px] leading-relaxed font-semibold">
              {dangerNote}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-white border-t border-[#D8C8B0] flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#D8C8B0] text-xs font-bold text-[#2D1B0F] hover:bg-[#EFE7DA] transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

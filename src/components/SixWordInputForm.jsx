import React, { useState } from 'react';
import { PenTool, CheckCircle2, AlertCircle, Sparkles, BookOpen } from 'lucide-react';

export default function SixWordInputForm({ onSubmitStory }) {
  const [content, setContent] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute live word count
  const words = content.trim() ? content.trim().split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const isValidCount = wordCount >= 30 && wordCount <= 350;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (wordCount < 30) {
      setErrorMsg(`Your ending contains ${wordCount} word${wordCount === 1 ? '' : 's'}. It must contain at least 30 words.`);
      setIsSuccess(false);
      return;
    }
    if (wordCount > 350) {
      setErrorMsg(`Ending exceeds 350 words (current count: ${wordCount}). Please trim your submission.`);
      setIsSuccess(false);
      return;
    }

    setIsSubmitting(true);
    try {
      if (onSubmitStory) {
        await onSubmitStory(content.trim());
      }
      setContent('');
      setErrorMsg('');
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    } catch (err) {
      const serverErr = err?.response?.data?.content?.[0] || 
                        err?.response?.data?.error || 
                        err?.response?.data?.detail || 
                        'Failed to submit ending. Please check your connection and try again.';
      setErrorMsg(serverErr);
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-[#D8C8B0] shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D8C8B0]/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#A35C33] text-white flex items-center justify-center font-bold shadow-sm">
            <PenTool className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl text-[#2D1B0F] leading-tight">
              Submit Your Story Conclusion
            </h3>
            <p className="text-xs text-[#2D1B0F]/70">
              Craft a compelling conclusion between 30 and 350 words.
            </p>
          </div>
        </div>

        {/* Live Word Count Indicator */}
        <div className={`self-start sm:self-auto px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
          isValidCount
            ? 'bg-[#EFE7DA] text-[#A35C33] ring-1 ring-[#A35C33]/40'
            : wordCount > 350
              ? 'bg-rose-100 text-rose-800 ring-1 ring-rose-300'
              : 'bg-[#F6EFE2] text-[#2D1B0F]/70 ring-1 ring-[#D8C8B0]'
        }`}>
          {isValidCount ? (
            <Sparkles className="w-3.5 h-3.5 text-[#A35C33]" />
          ) : (
            <BookOpen className="w-3.5 h-3.5 text-[#2D1B0F]/50" />
          )}
          <span>Word Count: {wordCount} / 350 (Minimum 30 words)</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            rows={6}
            placeholder="Write your ending here... How does Henok resolve the mystery? What happened before Tuesday?"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setErrorMsg('');
              setIsSuccess(false);
            }}
            className={`w-full px-4 py-3.5 bg-[#FDFBF7] border rounded-2xl font-serif text-base text-[#2D1B0F] placeholder-[#2D1B0F]/40 leading-relaxed focus:outline-none transition-all ${
              isValidCount 
                ? 'border-[#A35C33] ring-2 ring-[#A35C33]/20 bg-white' 
                : wordCount > 350
                  ? 'border-rose-400 ring-2 ring-rose-200'
                  : 'border-[#D8C8B0] focus:border-[#A35C33] focus:ring-2 focus:ring-[#A35C33]/20'
            }`}
          />
        </div>

        {/* Helper guide / Word status pill */}
        <div className="flex flex-wrap items-center justify-between text-xs text-[#2D1B0F]/60 px-1">
          {wordCount < 30 ? (
            <span className="text-amber-700 font-medium">
              {wordCount === 0 
                ? 'Write at least 30 words to submit your creative ending.' 
                : `Need ${30 - wordCount} more word${30 - wordCount === 1 ? '' : 's'} to meet the 30-word minimum.`}
            </span>
          ) : wordCount > 350 ? (
            <span className="text-rose-600 font-bold">
              Exceeds 350 words by {wordCount - 350} words. Please trim your text.
            </span>
          ) : (
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Valid length ({wordCount} words). Ready for community voting!
            </span>
          )}

          <span className="text-[11px] text-[#2D1B0F]/50">
            One submission per member per prompt.
          </span>
        </div>

        {/* Validation Error Message */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-fade-in font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Message */}
        {isSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Ending published successfully! +15 XP earned. Your story is now open for voting.</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <p className="text-[11px] text-[#2D1B0F]/60 italic">
            Tips: Match the tone of the opening paragraph, provide closure, or create a surprising twist.
          </p>

          <button
            type="submit"
            disabled={!isValidCount || isSubmitting}
            className="bg-[#A35C33] hover:bg-[#8B4C28] text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <PenTool className="w-4 h-4 text-white" />
            <span>{isSubmitting ? 'Publishing...' : 'Publish Story Ending (+15 XP)'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

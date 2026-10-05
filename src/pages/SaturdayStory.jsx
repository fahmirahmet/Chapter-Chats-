import React, { useState, useEffect } from 'react';
import { 
  PenTool, 
  Sparkles, 
  ThumbsUp, 
  Trophy, 
  Clock, 
  HelpCircle, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Send,
  Flag,
  UserCheck,
  Calendar,
  Lock,
  Trash2
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import ThursdayQuizModal from '../components/ThursdayQuizModal';
import ReportModal from '../components/ReportModal';
import AuthModal from '../components/AuthModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import AuthorBadge from '../components/AuthorBadge';
import { getAuthorDisplayName, getAuthorProfileTarget } from '../utils/avatar';

export default function SaturdayStory() {
  const { user } = useAuth();

  const [activePrompt, setActivePrompt] = useState(null);
  const [userSubmitted, setUserSubmitted] = useState(false);
  const [userSubmission, setUserSubmission] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [hallOfFame, setHallOfFame] = useState([]);
  const [activeTab, setActiveTab] = useState('top'); // 'top' | 'recent' | 'hof'
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [reportModalData, setReportModalData] = useState(null);
  const [submissionToDelete, setSubmissionToDelete] = useState(null);
  const [isDeletingSubmission, setIsDeletingSubmission] = useState(false);

  // Check executive & moderation permissions
  const canModerate = Boolean(
    user && (
      user.is_staff || 
      user.is_superuser || 
      user.is_president ||
      ['OWNER', 'ADMIN', 'OFFICER'].includes(user.role) || 
      (user.officer_title && user.officer_title !== 'NONE')
    )
  );

  // Form states
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Word count validation (30 to 350 words)
  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const isValid = wordCount >= 30 && wordCount <= 350;

  // Fetch live prompt & submissions from API
  const fetchStories = async () => {
    try {
      let promptObj = null;
      let subsList = [];

      // 1. Fetch Active Prompt & Current User Status
      try {
        const promptRes = await apiClient.get('/activities/finish-the-story/active/');
        if (promptRes.data?.activePrompt) {
          promptObj = promptRes.data.activePrompt;
          setActivePrompt(promptObj);
          setUserSubmitted(Boolean(promptRes.data.userSubmitted));
          if (promptRes.data.userSubmission) {
            setUserSubmission(promptRes.data.userSubmission);
          }
        }
      } catch (pErr) {
        console.warn('Finish the story active prompt fetch error:', pErr);
      }

      // 2. Fetch All Submissions for Active Prompt
      try {
        const subsRes = await apiClient.get('/activities/finish-the-story/submissions/');
        if (Array.isArray(subsRes.data)) {
          subsList = subsRes.data;
        }
      } catch (sErr) {
        console.warn('Submissions fetch error:', sErr);
      }

      // 3. Fetch Winner & Hall of Fame
      try {
        const winRes = await apiClient.get('/activities/finish-the-story/winner/');
        if (winRes.data?.hallOfFame && Array.isArray(winRes.data.hallOfFame)) {
          setHallOfFame(winRes.data.hallOfFame);
        }
      } catch (wErr) {
        console.warn('Winner fetch error:', wErr);
      }

      // Fallback: If primary endpoints didn't return data, try legacy six-word-stories
      if (!promptObj && subsList.length === 0) {
        try {
          const legRes = await apiClient.get('/activities/six-word-stories/');
          if (legRes.data?.activePrompt) {
            promptObj = legRes.data.activePrompt;
            setActivePrompt(promptObj);
          }
          if (Array.isArray(legRes.data?.submissions)) {
            subsList = legRes.data.submissions;
          }
          if (Array.isArray(legRes.data?.hallOfFame)) {
            setHallOfFame(legRes.data.hallOfFame);
          }
        } catch (legErr) {
          console.warn('Legacy stories fetch error:', legErr);
        }
      }

      // Normalize & Map Submissions into Clean State
      if (subsList && Array.isArray(subsList)) {
        const formatted = subsList.map(sub => {
          const authorDisplayName = getAuthorDisplayName(sub);
          const authorUsername = sub.author_username || (typeof sub.author === 'string' && sub.author) || (sub.user?.username);
          const authorId = sub.author_id || (typeof sub.user === 'object' ? sub.user?.id : sub.user);
          const profileTarget = getAuthorProfileTarget(sub);
          return {
            id: sub.id,
            promptId: sub.prompt,
            author: authorDisplayName,
            authorName: authorDisplayName,
            authorUsername: authorUsername,
            authorId: authorId,
            profileTarget: profileTarget,
            rawItem: sub,
            avatar: sub.author_avatar || sub.avatar || null,
            content: sub.content,
            wordCount: sub.word_count || (sub.content ? sub.content.trim().split(/\s+/).length : 0),
            upvotes: sub.upvote_count ?? sub.upvotes ?? 0,
            isUpvotedByMe: Boolean(sub.is_upvoted),
            createdAt: sub.created_at ? new Date(sub.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently',
            isWinner: Boolean(sub.is_winner),
          };
        });
        setSubmissions(formatted);
      }
    } catch (err) {
      console.error('Failed to hydrate Saturday Story data:', err);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [user]);

  // Post new story entry to API
  const handleAddNewStory = async (text) => {
    setSubmitError('');

    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (userSubmitted) {
      setSubmitError('You have already submitted an ending for this active prompt. Only one submission is permitted per member.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const payload = {
        content: text,
        ending_text: text,
        prompt: activePrompt?.id,
        prompt_id: activePrompt?.id
      };

      let res;
      try {
        res = await apiClient.post('/activities/finish-the-story/submit/', payload, { headers });
      } catch (postErr) {
        if (postErr.response?.status === 404 || postErr.response?.status === 405) {
          res = await apiClient.post('/activities/six-word-stories/', payload, { headers });
        } else {
          throw postErr;
        }
      }

      if (res?.data) {
        setContent('');
        setSubmitSuccess(true);
        setUserSubmitted(true);
        setUserSubmission(res.data);
        setTimeout(() => setSubmitSuccess(false), 6000);
        await fetchStories();
      }
    } catch (err) {
      console.error('Story submission error:', err);
      const errorMsg = 
        err.response?.data?.error || 
        err.response?.data?.content?.[0] || 
        err.response?.data?.detail || 
        'Failed to submit your story ending. Please ensure word count is between 30 and 350 words.';
      setSubmitError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;
    await handleAddNewStory(content.trim());
  };

  // Upvote toggle handler
  const handleToggleUpvote = async (id) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    // Optimistic state update
    setSubmissions(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newUpvoted = !item.isUpvotedByMe;
          return {
            ...item,
            isUpvotedByMe: newUpvoted,
            upvotes: newUpvoted ? item.upvotes + 1 : Math.max(0, item.upvotes - 1),
          };
        }
        return item;
      })
    );

    // Call backend endpoint
    if (typeof id === 'number' || (typeof id === 'string' && !id.startsWith('sub-'))) {
      try {
        let res;
        try {
          res = await apiClient.post(`/activities/finish-the-story/${id}/upvote/`);
        } catch {
          res = await apiClient.post(`/activities/six-word-stories/${id}/upvote/`);
        }

        if (res?.data && typeof res.data.upvotes === 'number') {
          setSubmissions(prev =>
            prev.map(item => item.id === id ? { 
              ...item, 
              upvotes: res.data.upvotes, 
              isUpvotedByMe: res.data.is_upvoted 
            } : item)
          );
        }
      } catch (err) {
        console.warn('API upvote error:', err);
        await fetchStories(); // revert on failure
      }
    }
  };

  // Universal Deletion of Story Submission
  const handleDeleteSubmission = (id, author) => {
    setSubmissionToDelete({ id, author });
  };

  const handleConfirmDeleteSubmission = async () => {
    if (!submissionToDelete) return;
    setIsDeletingSubmission(true);
    try {
      await apiClient.delete(`/activities/submissions/${submissionToDelete.id}/`);
      setSubmissions(prev => prev.filter(s => s.id !== submissionToDelete.id));
      if (userSubmission && (userSubmission.id === submissionToDelete.id || userSubmission.prompt === submissionToDelete.id)) {
        setUserSubmitted(false);
        setUserSubmission(null);
      }
      setSubmissionToDelete(null);
    } catch (err) {
      console.error('Error deleting submission:', err);
      alert(err.response?.data?.detail || 'Failed to delete story submission. Access denied.');
    } finally {
      setIsDeletingSubmission(false);
    }
  };

  // Filtered & sorted submissions based on active tab
  const getDisplayedFeed = () => {
    if (activeTab === 'top') {
      return [...submissions].sort((a, b) => b.upvotes - a.upvotes);
    }
    if (activeTab === 'recent') {
      return submissions;
    }
    return [];
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto px-4 sm:px-6 py-4">
      {/* 1. Header & Active Saturday Prompt Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-brand-dark text-brand-surface p-6 sm:p-8 lg:p-10 border border-brand-accent/30 shadow-warm-lg">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-brand-accent/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-cream/15 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-accent text-brand-dark flex items-center justify-center font-bold shadow-sm">
                <PenTool className="w-5 h-5 text-brand-dark" />
              </div>
              <div>
                <h1 className="font-serif font-bold text-2xl sm:text-3xl text-brand-cream">
                  Finish the Story Initiative
                </h1>
                <p className="text-xs sm:text-sm text-brand-surface/80">
                  Weekend Micro-Creative Writing Contest • Chapter &amp; Chats
                </p>
              </div>
            </div>

            {/* Voting Window Badge */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-dark-light border border-brand-cream/25 text-brand-cream text-xs font-semibold">
              <Clock className="w-4 h-4 text-brand-accent animate-pulse" />
              <span>Voting Closes: Tuesday at 12:30 PM EAT</span>
            </div>
          </div>

          {/* Trigger Banner for Thursday Quiz Modal */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-primary via-brand-dark-light to-brand-dark border border-brand-cream/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-cream text-brand-dark flex items-center justify-center font-bold shrink-0">
                <HelpCircle className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-serif font-bold text-sm text-brand-cream">
                    Pre-Meetup Thursday Mini-Quiz
                  </h4>
                  <span className="text-[10px] font-bold bg-brand-accent text-brand-dark px-2 py-0.5 rounded">
                    +50 XP
                  </span>
                </div>
                <p className="text-xs text-brand-surface/85">
                  5 multiple-choice questions on the active cycle reading target (3 min limit).
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsQuizModalOpen(true)}
              type="button"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-accent text-brand-dark font-bold text-xs hover:bg-brand-cream transition-colors shadow-warm-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <span>Take Thursday Quiz</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Manuscript Card: Active Prompt Hook */}
      {activePrompt ? (
        <div className="bg-[#F6EFE2] border-2 border-[#D8C8B0] rounded-3xl p-6 md:p-8 shadow-warm-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#E5D6BF] text-[#5C3B1E]">
              {activePrompt?.prompt_type === 'ALTERNATE_ENDING' ? 'Alternate Ending Challenge' : 'Weekly Story Hook'}
            </span>
            <span className="text-xs font-semibold text-[#8C6239] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Closes Tuesday at 12:30 PM</span>
            </span>
          </div>

          <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#2D1B0F]">
            {activePrompt?.title || "Finish the Story"}
          </h2>

          <div className="p-4 sm:p-5 rounded-2xl bg-white/70 border border-[#D8C8B0]/70">
            <p className="font-serif italic text-[#4A3423] text-base md:text-lg leading-relaxed whitespace-pre-line">
              "{activePrompt?.story_opening || activePrompt?.prompt_text}"
            </p>
          </div>

          <p className="text-xs font-semibold text-[#8C6239] pt-1">
            Write your conclusion below (30 to 350 words). Authors receive +15 XP upon submission and +5 XP for each upvote!
          </p>
        </div>
      ) : (
        <div className="bg-[#F6EFE2] border-2 border-[#D8C8B0] rounded-3xl p-8 sm:p-12 shadow-warm-sm text-center space-y-4">
          <div className="w-16 h-16 bg-[#E5D6BF] text-[#5C3B1E] rounded-full flex items-center justify-center mx-auto border border-[#BAA587]">
            <PenTool className="w-8 h-8 text-[#A35C33]" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D1B0F]">
            Saturday Story Prompt
          </h2>
          <p className="font-serif italic text-[#4A3423] text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            "No active Saturday writing prompt published yet. Check back when the editorial team posts this week's hook!"
          </p>
        </div>
      )}

      {/* 3. Multi-line Input Form / User Submitted State */}
      {activePrompt && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-brand-cream/80 shadow-warm-md space-y-4">
          {userSubmitted ? (
            <div className="p-5 rounded-2xl bg-amber-50/80 border-2 border-amber-300 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <UserCheck className="w-5 h-5 text-amber-700 shrink-0" />
                <span>You have submitted your ending for this writing challenge!</span>
              </div>
              {userSubmission && (
                <div className="p-4 rounded-xl bg-white border border-amber-200">
                  <p className="font-serif text-[#2D1B0F] text-sm sm:text-base leading-relaxed italic">
                    "{userSubmission.content}"
                  </p>
                  <div className="mt-2 pt-2 border-t border-amber-100 flex items-center justify-between text-xs text-amber-800">
                    <span>{userSubmission.word_count || userSubmission.content?.split(/\s+/).length} words</span>
                    <span>🏆 {userSubmission.upvote_count || 0} Upvotes</span>
                  </div>
                </div>
              )}
              <p className="text-xs text-amber-800/80">
                Each member can submit 1 conclusion per prompt. Members can vote on peer entries below until Tuesday at 12:30 PM!
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-brand-primary" />
                  <h3 className="font-serif font-bold text-xl text-brand-dark">
                    Write Your Conclusion
                  </h3>
                </div>
                <span
                  className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                    isValid
                      ? 'bg-emerald-100 text-emerald-800 font-semibold'
                      : wordCount > 350
                      ? 'bg-rose-100 text-rose-800 font-semibold'
                      : wordCount > 0
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-brand-cream/60 text-brand-dark/70'
                  }`}
                >
                  {wordCount} / 350 words (Minimum 30)
                </span>
              </div>

              {submitError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Your story conclusion was submitted and saved successfully! (+15 XP) Good luck in the voting!</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your story conclusion here... How does this scene resolve? (30 to 350 words)"
                  className="w-full p-4 rounded-2xl border-2 border-brand-cream/80 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 bg-[#FAF7F2] font-serif text-[#2D1B0F] placeholder-[#8C7A6B] text-base leading-relaxed resize-y transition-all outline-none"
                />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-xs text-brand-dark/60">
                    {wordCount < 30 && wordCount > 0
                      ? `Need ${30 - wordCount} more word${30 - wordCount === 1 ? '' : 's'} to meet minimum.`
                      : wordCount > 350
                      ? `Exceeds maximum by ${wordCount - 350} word${wordCount - 350 === 1 ? '' : 's'}.`
                      : isValid
                      ? 'Ready to submit!'
                      : 'Share your creative conclusion with the community.'}
                  </p>

                  <button
                    type="submit"
                    disabled={!isValid || isSubmitting}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-brand-primary text-white font-bold text-sm hover:bg-brand-primary/90 transition-all shadow-warm-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Submitting...' : 'Submit Conclusion (+15 XP)'}</span>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}

      {/* 4. Community Feed & Tab Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="font-serif font-bold text-2xl text-brand-dark flex items-center gap-2">
            <span>Community Submissions</span>
            <span className="text-xs font-sans bg-brand-cream/60 text-brand-dark px-2.5 py-0.5 rounded-full font-bold">
              {submissions.length} Entries
            </span>
          </h3>

          {/* Tab Switcher Pills */}
          <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-brand-cream/80 shadow-warm-sm">
            <button
              onClick={() => setActiveTab('top')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'top'
                  ? 'bg-brand-dark text-brand-cream shadow-warm-sm'
                  : 'text-brand-dark/70 hover:bg-brand-cream/40'
              }`}
            >
              Top Upvoted
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'recent'
                  ? 'bg-brand-dark text-brand-cream shadow-warm-sm'
                  : 'text-brand-dark/70 hover:bg-brand-cream/40'
              }`}
            >
              Recent Submissions
            </button>
            <button
              onClick={() => setActiveTab('hof')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'hof'
                  ? 'bg-brand-dark text-brand-cream shadow-warm-sm'
                  : 'text-brand-dark/70 hover:bg-brand-cream/40'
              }`}
            >
              Hall of Fame
            </button>
          </div>
        </div>

        {/* Tab Content Rendering */}
        {activeTab !== 'hof' ? (
          submissions.length > 0 ? (
            <div className="space-y-3.5">
              {getDisplayedFeed().map((item) => (
                <div 
                  key={item.id} 
                  className={`p-5 sm:p-6 rounded-3xl border transition-all flex flex-col sm:flex-row items-start justify-between gap-4 ${
                    item.isWinner 
                      ? 'bg-gradient-to-r from-amber-50 via-white to-amber-50/50 border-amber-400 shadow-warm-md' 
                      : 'bg-white border-brand-cream/80 shadow-warm-sm hover:border-brand-accent/60'
                  }`}
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <AuthorBadge
                        item={item.rawItem || item}
                        displayName={item.author}
                        profileTarget={item.profileTarget}
                        avatarUrl={item.avatar}
                        subtitle={`${item.createdAt} • ${item.wordCount} words`}
                        size="md"
                      />
                      {item.isWinner && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-amber-200 text-amber-900 border border-amber-400 px-2.5 py-0.5 rounded-full shadow-sm">
                          <Trophy className="w-3 h-3 text-amber-700" />
                          Story of the Week
                        </span>
                      )}
                    </div>

                    <p className="font-serif text-[#2D1B0F] text-base sm:text-lg leading-relaxed whitespace-pre-line">
                      "{item.content}"
                    </p>
                  </div>

                  {/* Actions Area */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setReportModalData({
                        targetType: 'submission',
                        targetId: item.id,
                        targetTitle: item.content,
                        targetAuthor: item.author
                      })}
                      className="p-2 rounded-2xl border border-brand-cream text-brand-dark/50 hover:text-rose-700 hover:border-rose-300 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Report this submission"
                      aria-label="Report submission"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>

                    {(canModerate || (user && (user.username === item.authorUsername || user.username === item.author || user.id === item.authorId))) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSubmission(item.id, item.author)}
                        className="p-2 rounded-2xl border border-brand-cream text-brand-dark/50 hover:text-rose-700 hover:border-rose-300 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete submission"
                        aria-label="Delete submission"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Upvote Button */}
                    <button
                      onClick={() => handleToggleUpvote(item.id)}
                      type="button"
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        item.isUpvotedByMe
                          ? 'bg-brand-primary text-white shadow-warm-sm scale-105'
                          : 'bg-brand-surface border border-brand-cream text-brand-dark hover:bg-brand-accent hover:text-brand-dark'
                      }`}
                      title="Upvote (+1 XP to you, +5 XP to author)"
                    >
                      <ThumbsUp className={`w-4 h-4 ${item.isUpvotedByMe ? 'text-brand-accent fill-brand-accent' : 'text-brand-secondary'}`} />
                      <span>{item.upvotes} Upvotes</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#F8F4EC] p-10 rounded-3xl border-2 border-dashed border-[#D8C8B0] text-center space-y-2">
              <PenTool className="w-8 h-8 text-[#A35C33]/60 mx-auto" />
              <h4 className="font-serif font-bold text-base text-[#2D1B0F]">No submissions yet for this writing cycle.</h4>
              <p className="text-xs text-[#2D1B0F]/70">
                Be the first to submit a conclusion and earn +15 XP!
              </p>
            </div>
          )
        ) : (
          /* Hall of Fame Past Winners Tab */
          hallOfFame.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {hallOfFame.map((hof) => (
                <div key={hof.id} className="bg-white p-6 rounded-3xl border-2 border-brand-accent/50 shadow-warm-md space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-accent text-brand-dark px-2.5 py-0.5 rounded-full">
                        {hof.week}
                      </span>
                      <span className="text-xs font-bold text-brand-secondary">
                        🏆 {hof.upvotes} Votes
                      </span>
                    </div>
                    <p className="text-[11px] text-brand-dark/70 italic">Prompt: "{hof.prompt}"</p>
                    <h4 className="font-serif font-bold text-xl text-brand-dark leading-snug">
                      "{hof.content}"
                    </h4>
                  </div>

                  <div className="pt-3 border-t border-brand-cream/60 flex items-center justify-between text-xs">
                    <span className="font-bold text-brand-primary">Winning Author:</span>
                    <AuthorBadge
                      item={hof}
                      displayName={getAuthorDisplayName(hof)}
                      profileTarget={getAuthorProfileTarget(hof)}
                      avatarUrl={hof.avatar}
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#F8F4EC] p-10 rounded-3xl border-2 border-dashed border-[#D8C8B0] text-center space-y-2">
              <Trophy className="w-8 h-8 text-[#A35C33]/60 mx-auto" />
              <h4 className="font-serif font-bold text-base text-[#2D1B0F]">No Hall of Fame entries yet.</h4>
              <p className="text-xs text-[#2D1B0F]/70">
                Winning submissions will be crowned by club officers and preserved here at the end of each voting period!
              </p>
            </div>
          )
        )}
      </div>

      {/* Thursday Quiz Modal */}
      <ThursdayQuizModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
      />

      {/* Auth Modal for Guests */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab="member"
      />

      {/* Content Report Modal */}
      {reportModalData && (
        <ReportModal
          isOpen={Boolean(reportModalData)}
          onClose={() => setReportModalData(null)}
          targetType={reportModalData.targetType}
          targetId={reportModalData.targetId}
          targetTitle={reportModalData.targetTitle}
          targetAuthor={reportModalData.targetAuthor}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(submissionToDelete)}
        title="Delete Story Submission"
        message={`Are you sure you want to delete this story submission by ${submissionToDelete?.author || 'this member'}? This action cannot be undone.`}
        isDeleting={isDeletingSubmission}
        onConfirm={handleConfirmDeleteSubmission}
        onClose={() => setSubmissionToDelete(null)}
      />
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, NavLink } from 'react-router-dom';
import {
  ShieldCheck,
  BookOpen,
  Bell,
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import HeroCurrentlyReading from '../components/HeroCurrentlyReading';
import SaturdayStoryBanner from '../components/SaturdayStoryBanner';
import HomeSnapshotGrid from '../components/HomeSnapshotGrid';
import ThursdayQuizModal from '../components/ThursdayQuizModal';

// ── Helper: build normalised cycleData from raw API response ──────────────
function buildCycleData(raw, userPageRead) {
  const data = raw?.activeCycle || raw;
  if (!data || !data.book) return null;
  const bookObj = data.book || {};
  return {
    activeCycle: {
      ...data,
      id: data.id,
      cycleNumber: data.id || 1,
      start_date: data.start_date,
      meeting_date: data.meeting_date,
      meeting_title: data.meeting_title,
      display_title: data.display_title,
      active_week: data.active_week,
      target_tuesday: data.target_tuesday,
      milestone_dates: data.milestone_dates,
      targetTuesdayMeeting: data.target_tuesday || data.meeting_date || data.start_date || null,
      userReadingProgressPages: userPageRead || 0,
      book: {
        title: bookObj.title || 'Cycle Reading Selection',
        author: bookObj.author || 'Selected Author',
        totalPages: Number(bookObj.total_pages || bookObj.totalPages) || 300,
        genre: bookObj.genre || 'Curated Literature',
        synopsis: bookObj.synopsis || 'Reading cycle targets will be reviewed at the upcoming Tuesday meeting.',
        coverImage: bookObj.cover_image || bookObj.cover_url || null,
      },
      milestones: data.milestones || {
        week1: { label: 'Week 1 Milestone', pages: `1 to ${Math.round((bookObj.total_pages || 300) * 0.33)} (33%)`, percentage: 33 },
        week2: { label: 'Week 2 Target', pages: `${Math.round((bookObj.total_pages || 300) * 0.33) + 1} to ${Math.round((bookObj.total_pages || 300) * 0.66)} (66%)`, percentage: 66 },
        week3: { label: 'Week 3 Final Sprint', pages: `${Math.round((bookObj.total_pages || 300) * 0.66) + 1} to ${bookObj.total_pages || 300} (100%)`, percentage: 100 },
      },
    }
  };
}

// ── Lightweight skeleton placeholder for cycle hero card ───────────────────
function CycleSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl bg-[#EFE7DA] border-2 border-[#D8C8B0] p-6 sm:p-8 space-y-5">
      <div className="flex items-start gap-5">
        <div className="w-24 h-36 sm:w-28 sm:h-40 rounded-2xl bg-[#D8C8B0]/60 shrink-0" />
        <div className="flex-1 space-y-3 pt-1">
          <div className="h-3 w-24 rounded-full bg-[#D8C8B0]/60" />
          <div className="h-5 w-48 rounded-full bg-[#D8C8B0]/80" />
          <div className="h-4 w-32 rounded-full bg-[#D8C8B0]/50" />
          <div className="h-3 w-full rounded-full bg-[#D8C8B0]/40 mt-3" />
          <div className="h-3 w-3/4 rounded-full bg-[#D8C8B0]/40" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const outletContext = useOutletContext() || {};
  const openCheckInModal = outletContext.openCheckInModal || (() => {});
  const { user } = useAuth();

  // ── Core hero state (initialise from localStorage cache if available) ────
  const [cycleData, setCycleData] = useState(() => {
    try {
      const cached = localStorage.getItem('cached_current_cycle');
      if (cached) return JSON.parse(cached);
    } catch { /* corrupt cache, ignore */ }
    return null;
  });
  const [cycleLoading, setCycleLoading] = useState(!cycleData);
  const [activePoll, setActivePoll] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);

  // ── Supporting state ─────────────────────────────────────────────────────
  const [announcements, setAnnouncements] = useState([]);
  const [topRecommendations, setTopRecommendations] = useState([]);
  const [recentDiscussions, setRecentDiscussions] = useState([]);
  const [winningStoryOfWeek, setWinningStoryOfWeek] = useState(null);

  // ── Quiz modal state ─────────────────────────────────────────────────────
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);

  // ── Data fetching (stale-while-revalidate for cycle) ─────────────────────
  useEffect(() => {
    let isMounted = true;

    const fetchHomeData = async () => {
      // ── 1. Parallel fetch of core hero data ─────────────────────────────
      const [cycleRes, pollRes, quizRes] = await Promise.allSettled([
        apiClient.get('/cycles/active/').catch(() => apiClient.get('/cycles/cycles/active/')),
        apiClient.get('/activities/polls/active/'),
        apiClient.get('/activities/thursday-quiz/').catch(() => apiClient.get('/activities/sunday-quiz/')),
      ]);

      if (!isMounted) return;

      // Cycle — build, update state + persist to localStorage
      if (cycleRes.status === 'fulfilled') {
        const raw = cycleRes.value?.data;
        const freshCycle = buildCycleData(raw, user?.current_page_read);
        setCycleData(freshCycle);
        setCycleLoading(false);
        if (freshCycle) {
          try { localStorage.setItem('cached_current_cycle', JSON.stringify(freshCycle)); }
          catch { /* quota exceeded, ignore */ }
        } else {
          localStorage.removeItem('cached_current_cycle');
        }
        if (raw?.announcements && Array.isArray(raw.announcements)) {
          setAnnouncements(raw.announcements);
        }
      } else {
        // Network failed — keep cached data if present, clear loading
        setCycleData(prev => prev ?? null);
        setCycleLoading(false);
      }

      // Active Poll — API returns { poll: {...}, ...spread } or just the poll object
      if (pollRes.status === 'fulfilled') {
        const raw = pollRes.value?.data;
        const pollObj = raw?.poll ?? (raw?.id ? raw : null);
        setActivePoll(pollObj);
      } else {
        setActivePoll(null);
      }

      // Active Quiz
      if (quizRes.status === 'fulfilled') {
        const qData = quizRes.value?.data;
        // Only mark as active if there are actual questions
        if (qData && Array.isArray(qData.questions) && qData.questions.length > 0) {
          setActiveQuiz({
            ...qData,
            // Normalise completion fields
            has_taken: Boolean(qData.has_completed || qData.user_has_completed),
            user_completed: Boolean(qData.has_completed || qData.user_has_completed),
          });
        } else {
          setActiveQuiz(null);
        }
      } else {
        setActiveQuiz(null);
      }

      // ── 2. Secondary data (announcements, discussions, story, proposals) ──
      try {
        const annRes = await apiClient.get('/cycles/announcements/');
        if (isMounted && annRes?.data) {
          const annList = Array.isArray(annRes.data) ? annRes.data : (annRes.data?.results || []);
          if (annList.length > 0) setAnnouncements(annList);
        }
      } catch { /* quiet */ }

      try {
        const discRes = await apiClient.get('/activities/discussions/');
        if (isMounted && discRes?.data) {
          const discList = Array.isArray(discRes.data) ? discRes.data : (discRes.data?.results || []);
          setRecentDiscussions(discList.slice(0, 3).map(d => ({
            id: d?.id || Math.random(),
            title: typeof d?.title === 'object' ? (d.title?.name || 'Discussion') : String(d?.title || 'Discussion Topic'),
            author: typeof d?.author === 'object' ? (d.author?.username || d.author?.name || 'Member') : String(d?.author || 'Member'),
            timeAgo: typeof d?.time_ago === 'string' ? d.time_ago : (typeof d?.timeAgo === 'string' ? d.timeAgo : 'Recently'),
            snippet: typeof d?.content === 'string' ? d.content : (typeof d?.snippet === 'string' ? d.snippet : ''),
            replyCount: typeof d?.reply_count === 'number'
              ? d.reply_count
              : Array.isArray(d?.replies)
                ? d.replies.length
                : (typeof d?.replies === 'number' ? d.replies : 0)
          })));
        }
      } catch { /* quiet */ }

      try {
        const storyRes = await apiClient.get('/activities/finish-the-story/submissions/')
          .catch(() => apiClient.get('/activities/six-word-stories/'));
        if (isMounted && storyRes?.data) {
          const list = Array.isArray(storyRes.data) ? storyRes.data : (storyRes.data?.submissions || storyRes.data?.results || []);
          const winner = list.find(s => s && s.is_winner);
          if (winner) {
            setWinningStoryOfWeek({
              text: winner.content || '',
              prompt: winner.prompt_title || 'Finish the Story Challenge',
              author: winner.author || winner.username || 'Featured Member',
              upvotes: winner.upvote_count ?? winner.upvotes ?? 0,
              publishedDate: 'Story of the Week'
            });
          }
        }
      } catch { /* quiet */ }

      try {
        const propRes = await apiClient.get('/activities/proposals/?limit=3');
        if (isMounted && propRes?.data) {
          const propList = Array.isArray(propRes.data) ? propRes.data : (propRes.data?.results || []);
          setTopRecommendations(propList.map(p => ({
            id: p.id,
            title: p.title,
            author: p.author,
            genre: p.genre || 'Ethiopian Literature',
            pitch: p.pitch || '',
            pitchSnippet: p.pitch || '',
            pitchedBy: p.author_username || p.proposer || 'Member',
            likes: p.like_count ?? p.likes_count ?? 0,
            hasLiked: Boolean(p.has_liked || p.is_liked),
            created_at: p.created_at
          })));
        }
      } catch { /* quiet */ }
    };

    fetchHomeData();
    return () => { isMounted = false; };
  }, [user]);

  // ── Poll vote handler ────────────────────────────────────────────────────
  const handleVote = useCallback(async (pollId, optionId) => {
    if (!user) return;
    // Optimistic update: mark as voted immediately
    setActivePoll(prev => {
      if (!prev) return prev;
      const totalVotesBefore = prev.total_votes ?? prev.totalVotes ?? 0;
      return {
        ...prev,
        has_voted: true,
        hasVoted: true,
        voted_option_id: optionId,
        user_voted_option_id: optionId,
        total_votes: totalVotesBefore + 1,
        totalVotes: totalVotesBefore + 1,
        options: (prev.options || []).map(opt =>
          opt.id === optionId
            ? { ...opt, votes_count: (opt.votes_count ?? opt.votes ?? 0) + 1, vote_count: (opt.votes_count ?? opt.votes ?? 0) + 1 }
            : opt
        ),
      };
    });

    try {
      await apiClient.post('/activities/polls/vote/', { option_id: optionId });
      // Refresh poll after successful vote to get authoritative server state
      const refreshed = await apiClient.get('/activities/polls/active/');
      const raw = refreshed?.data;
      const pollObj = raw?.poll ?? (raw?.id ? raw : null);
      if (pollObj) setActivePoll(pollObj);
    } catch {
      // Revert optimistic update on failure
      setActivePoll(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          has_voted: false,
          hasVoted: false,
          voted_option_id: null,
          user_voted_option_id: null,
          total_votes: Math.max(0, (prev.total_votes ?? 0) - 1),
          totalVotes: Math.max(0, (prev.totalVotes ?? 0) - 1),
          options: (prev.options || []).map(opt =>
            opt.id === optionId
              ? { ...opt, votes_count: Math.max(0, (opt.votes_count ?? 0) - 1), vote_count: Math.max(0, (opt.vote_count ?? 0) - 1) }
              : opt
          ),
        };
      });
    }
  }, [user]);

  // ── Poll delete handler (admin only) ──────────────────────────────────────
  const handleDeletePoll = useCallback(async (pollId) => {
    if (!window.confirm('Are you sure you want to delete this book poll? This action cannot be undone.')) return;
    // Optimistic: clear poll immediately so Hero transitions to State C
    setActivePoll(null);
    try {
      await apiClient.delete(`/activities/polls/${pollId}/`);
    } catch {
      // If delete failed, re-fetch poll state from server
      try {
        const refreshed = await apiClient.get('/activities/polls/active/');
        const raw = refreshed?.data;
        const pollObj = raw?.poll ?? (raw?.id ? raw : null);
        setActivePoll(pollObj);
      } catch { /* poll truly gone */ }
    }
  }, []);

  // ── Quiz open handler ────────────────────────────────────────────────────
  const handleOpenQuiz = useCallback(() => {
    setIsQuizModalOpen(true);
  }, []);

  // ── Quiz close + status refresh ──────────────────────────────────────────
  const handleCloseQuiz = useCallback(() => {
    setIsQuizModalOpen(false);
    apiClient.get('/activities/thursday-quiz/')
      .then(res => {
        if (res.data) {
          setActiveQuiz(prev => prev ? ({
            ...prev,
            has_taken: Boolean(res.data.has_completed || res.data.user_has_completed),
            user_completed: Boolean(res.data.has_completed || res.data.user_has_completed),
            has_completed: Boolean(res.data.has_completed || res.data.user_has_completed),
            user_has_completed: Boolean(res.data.has_completed || res.data.user_has_completed),
            user_score: res.data.user_score,
          }) : prev);
        }
      })
      .catch(() => {});
  }, []);

  const pinnedAnnouncement = (announcements || []).find(a => a && (a.is_pinned || a.is_banner));

  return (
    <div className="space-y-10 animate-fade-in max-w-7xl mx-auto">

      {/* Thursday Quiz Modal */}
      <ThursdayQuizModal
        isOpen={isQuizModalOpen}
        onClose={handleCloseQuiz}
      />

      {/* Pinned Announcement Banner */}
      {pinnedAnnouncement && (
        <div className="bg-amber-100 border-l-4 border-amber-600 text-amber-900 p-4 sm:p-5 rounded-2xl shadow-sm flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-extrabold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                  {pinnedAnnouncement.category || 'Official Announcement'}
                </span>
                <span className="text-xs text-amber-700 font-medium">
                  {pinnedAnnouncement.created_at ? new Date(pinnedAnnouncement.created_at).toLocaleDateString() : 'Live Notice'}
                </span>
              </div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-amber-950 leading-tight mt-0.5">
                {pinnedAnnouncement.title}
              </h3>
              <p className="text-xs text-amber-900/80 font-medium mt-1">
                {pinnedAnnouncement.content}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero State Machine: Active Sprint | Active Poll | Idle ── */}
      {cycleLoading && !cycleData ? (
        <CycleSkeleton />
      ) : (
        <HeroCurrentlyReading
          cycleData={cycleData}
          activePoll={activePoll}
          activeQuiz={activeQuiz}
          user={user}
          onOpenCheckIn={openCheckInModal}
          onVote={handleVote}
          onOpenQuiz={handleOpenQuiz}
          onDeletePoll={handleDeletePoll}
        />
      )}

      {/* Saturday Story Banner */}
      <SaturdayStoryBanner storyData={winningStoryOfWeek} />

      {/* Home Snapshot Grid */}
      <HomeSnapshotGrid
        announcements={announcements}
        recommendations={topRecommendations}
        discussions={recentDiscussions}
      />

      {/* Club Value & CTA Banner */}
      <section className="bg-[#EFE7DA] border-2 border-[#D8C8B0] p-8 sm:p-10 rounded-3xl text-center space-y-6 shadow-warm-sm">
        <div className="max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#A35C33] bg-[#E5D6BF] px-3 py-1 rounded-full border border-[#BAA587]">
            IEEE Std 830 Digital Community Platform
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D1B0F]">
            Ready for Next Tuesday's Literary Review?
          </h2>
          <p className="text-xs sm:text-sm text-[#2D1B0F]/80 leading-relaxed">
            Log in to access full PDF downloads in the Book House, participate in Saturday creative micro-writing, and verify attendance during physical meeting hours.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={openCheckInModal}
            type="button"
            className="px-6 py-3 rounded-xl bg-[#A35C33] hover:bg-[#8B4C28] text-white font-semibold text-xs border border-[#6E3618] shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-white" />
            <span>Perform Meeting Check-In</span>
          </button>

          <NavLink
            to="/book-house"
            className="px-6 py-3 rounded-xl bg-[#2D1B0F] text-[#FFF8EE] hover:bg-[#1E110A] font-bold text-xs shadow-sm transition-colors flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-[#C48B47]" />
            <span>Browse Digital Repository</span>
          </NavLink>
        </div>
      </section>
    </div>
  );
}

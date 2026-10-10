import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  Bookmark,
  ArrowRight,
  Star,
  CheckCircle2,
  Clock,
  Trash2,
} from 'lucide-react';
import CycleCountdown from './CycleCountdown';
import { computeCycleMilestoneSchedule } from '../utils/cycleUtils';

// ─── Always-visible Thursday Quiz Banner ─────────────────────────────────────
// Renders even when no quiz is published (shows a calm "coming soon" pill).
const ThursdayQuizBanner = ({ activeQuiz, onOpenQuiz }) => {
  const hasActiveQuiz = Boolean(activeQuiz && (activeQuiz.id || activeQuiz.questions?.length > 0));
  const hasTaken = hasActiveQuiz && Boolean(
    activeQuiz.has_taken ||
    activeQuiz.user_completed ||
    activeQuiz.has_completed ||
    activeQuiz.user_has_completed
  );

  return (
    <div className="mt-6 pt-5 border-t border-[#D8C8B0]/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-50 via-orange-50/60 to-transparent p-4 rounded-2xl border border-amber-200/60">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 shadow-inner border border-amber-300/50">
          <span className="text-lg">⚡</span>
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300/60 flex items-center gap-1">
              {hasActiveQuiz ? (
                <>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  Live Club Quiz
                </>
              ) : (
                'Weekly Event'
              )}
            </span>
            {hasActiveQuiz && (
              <span className="text-xs font-semibold text-amber-800">+50 XP</span>
            )}
          </div>
          <h4 className="font-serif font-bold text-[#2D1B0F] text-sm sm:text-base mt-0.5">
            {hasActiveQuiz ? (activeQuiz.title || 'Thursday Literary Quiz') : 'Thursday Literary Quiz'}
          </h4>
          {!hasActiveQuiz && (
            <p className="text-xs text-[#2D1B0F]/50 mt-0.5">
              New edition releases every Thursday at 8:00 PM EAT.
            </p>
          )}
        </div>
      </div>

      {hasActiveQuiz ? (
        <button
          type="button"
          onClick={() => !hasTaken && onOpenQuiz && onOpenQuiz(activeQuiz)}
          disabled={hasTaken}
          className={`shrink-0 w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm border flex items-center justify-center gap-1.5 ${
            hasTaken
              ? 'bg-emerald-50 text-emerald-700 cursor-not-allowed border-emerald-200'
              : 'bg-[#2D1B0F] hover:bg-[#1A0E06] text-[#C48B47] hover:text-[#D49E5B] border-[#C48B47]/40 hover:shadow-md active:scale-98 cursor-pointer'
          }`}
        >
          {hasTaken ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>✓ Quiz Completed</span>
            </>
          ) : (
            'Take Thursday Quiz →'
          )}
        </button>
      ) : (
        <span className="shrink-0 text-xs font-semibold text-[#2D1B0F]/40 bg-[#EFE7DA] px-3 py-1.5 rounded-lg border border-[#D8C8B0]">
          Next Sprint Pending
        </span>
      )}
    </div>
  );
};


// ─── Main Hero Component ──────────────────────────────────────────────────────
export default function HeroCurrentlyReading({
  cycleData,
  activePoll = null,
  activeQuiz = null,
  // legacy prop support
  quizStatus = null,
  user = null,
  onOpenCheckIn = null,
  onVote = null,
  onOpenQuiz = null,
  onDeletePoll = null,
}) {
  // Normalise activeQuiz: support both new "activeQuiz" object and legacy "quizStatus" shape
  const resolvedQuiz = activeQuiz
    ? activeQuiz
    : (quizStatus?.isOpen
      ? {
          id: null,
          title: quizStatus.title || 'Thursday Literary Quiz',
          has_completed: quizStatus.hasCompleted,
          user_has_completed: quizStatus.hasCompleted,
          xpReward: quizStatus.xpReward || 50,
        }
      : null);

  // Executive/admin moderation authority
  const canModerate = Boolean(
    user?.is_staff ||
    user?.is_superuser ||
    ['OWNER', 'ADMIN', 'OFFICER'].includes(user?.role) ||
    (user?.officer_title && user.officer_title !== 'NONE')
  );

  const cycle = cycleData?.activeCycle || null;
  const book = cycle?.book || null;

  // ── STATE A: Active Reading Sprint ──────────────────────────────────────────
  if (cycle && book) {
    const totalPages = Number(book.totalPages || book.total_pages) || 300;
    const schedule = computeCycleMilestoneSchedule(cycle);
    const activeWeek = schedule.activeWeek;
    const safeMilestones = schedule.milestones;
    const activeMilestone = schedule.activeMilestone;
    const targetMeetingDate = schedule.nextMeetingDate;

    const meetingTitle = cycle.meeting_title || cycle.display_title || null;
    const meetingDateObj = new Date(targetMeetingDate);
    const weekdayName = meetingDateObj && !isNaN(meetingDateObj.getTime()) ? meetingDateObj.toLocaleDateString(undefined, { weekday: 'long' }) : 'Tuesday';
    const displayReviewTitle = meetingTitle || `${weekdayName} Review`;

    const userReadingProgressPages = Number(cycle.userReadingProgressPages) || 0;

    return (
      <section className="relative overflow-hidden rounded-3xl bg-[#F6EFE2] border-2 border-[#D8C8B0] shadow-[0_8px_30px_rgb(45,27,15,0.06)] p-6 sm:p-8 md:p-10 transition-all duration-300">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#E5D6BF] text-[#5C3B1E] border border-[#BAA587] text-xs font-bold uppercase tracking-wider shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-[#A35C33]" />
                Cycle #{cycle.cycleNumber || 1} Active Book
              </span>
              <span className="text-xs font-semibold text-[#2D1B0F]/70 bg-[#EFE7DA] px-3 py-1 rounded-full border border-[#D8C8B0]">
                {book.genre || 'Curated Literature'}
              </span>
            </div>

            <div className="space-y-2.5">
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-[#2D1B0F]">
                {book.title || 'Cycle Reading Selection'}
              </h1>
              <p className="text-sm font-semibold text-[#A35C33] italic flex items-center gap-2">
                <span>by {book.author || 'Selected Author'}</span>
                <span className="text-[#D8C8B0]">•</span>
                <span className="text-[#2D1B0F]/60 font-normal">{totalPages} Pages Total</span>
              </p>
              <p className="text-xs sm:text-sm text-[#2D1B0F]/80 leading-relaxed max-w-xl">
                {book.synopsis || `Reading cycle targets will be reviewed at the upcoming ${displayReviewTitle.toLowerCase()} meetup.`}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#EDE2CF] border border-[#CBB79B] space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#2D1B0F] flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-[#A35C33]" />
                  Active Target Window:
                </span>
                <span className="font-bold text-white bg-[#A35C33] px-2.5 py-0.5 rounded text-[11px] shadow-xs">
                  {activeMilestone.label}
                </span>
              </div>
              <p className="text-xs text-[#2D1B0F]/80 font-medium">
                Read <strong className="text-[#A35C33]">{activeMilestone.pages}</strong> before upcoming {displayReviewTitle} at 12:30 PM.
              </p>
            </div>

            <div className="space-y-0 pt-1">
              <div className="flex flex-wrap items-center gap-3">
                {onOpenCheckIn && (
                  <button
                    onClick={onOpenCheckIn}
                    type="button"
                    className="px-6 py-3.5 rounded-xl bg-[#A35C33] hover:bg-[#8B4C28] text-white font-semibold text-sm shadow-md border border-[#6E3618] active:scale-98 transition-all duration-200 flex items-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-5 h-5 text-white" />
                    <span>Perform Check-In</span>
                  </button>
                )}
                <NavLink
                  to="/discussions"
                  className="px-5 py-3.5 rounded-xl border-2 border-[#B59F82] text-[#2D1B0F] bg-[#EFE7DA] hover:bg-[#E5DBCB] font-semibold text-sm transition-all duration-200 flex items-center gap-2 shadow-xs"
                >
                  <MessageSquare className="w-4 h-4 text-[#A35C33]" />
                  <span>Join Discussion</span>
                  <ArrowRight className="w-4 h-4 text-[#2D1B0F]/40" />
                </NavLink>
              </div>

              {/* Thursday Quiz — always rendered (live or idle) */}
              <ThursdayQuizBanner activeQuiz={resolvedQuiz} onOpenQuiz={onOpenQuiz} />
            </div>
          </div>

          {/* Right Column: Countdown */}
          <div className="lg:col-span-6 space-y-5">
            <div className="bg-[#342013] p-6 sm:p-7 rounded-3xl border-2 border-[#503320] shadow-xl text-[#F8F4EC]">
              <CycleCountdown
                targetDate={targetMeetingDate}
                activeWeek={activeWeek}
                cycle={cycle}
                meetingTitle={meetingTitle}
                milestones={safeMilestones}
                currentPages={userReadingProgressPages}
                totalPages={totalPages}
              />
            </div>

            <div className="group flex items-center justify-between p-4 rounded-2xl bg-[#EFE7DA] border-2 border-[#D8C8B0] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#A35C33] text-white flex items-center justify-center font-serif text-lg font-bold shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-300 border border-[#6E3618]">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#A35C33] bg-[#E5D6BF] px-2 py-0.5 rounded border border-[#BAA587]">
                      Featured Pick
                    </span>
                    <span className="text-[11px] text-[#2D1B0F]/60 font-medium">Cycle #{cycle.cycleNumber || 1} Selection</span>
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#2D1B0F] leading-snug group-hover:text-[#A35C33] transition-colors">
                    {book.title || 'Cycle Reading Selection'}
                  </h4>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F6EFE2] border border-[#D8C8B0] text-xs font-semibold text-[#2D1B0F]">
                <Star className="w-3.5 h-3.5 text-[#C48B47] fill-[#C48B47]" />
                <span>4.9 / 5.0</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── STATE B: Active Book Selection Poll ─────────────────────────────────────
  if (activePoll) {
    const totalVotes = activePoll.total_votes ?? activePoll.totalVotes ?? 0;
    const userVotedId = activePoll.user_voted_option_id ?? activePoll.voted_option_id ?? null;
    const hasVoted = Boolean(activePoll.has_voted || activePoll.hasVoted);

    return (
      <section className="relative overflow-hidden rounded-3xl bg-[#FAF7F2] border-2 border-[#E2D9CC] shadow-[0_8px_30px_rgb(45,27,15,0.05)] p-6 sm:p-8 transition-all duration-300">
        {/* Poll header row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-[#E2D9CC]">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#8C6D53]/15 text-[#8C6D53] border border-[#8C6D53]/25">
              🗳️ Bi-Weekly Book Selection Poll
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#2D1B0F] font-bold leading-tight">
              {activePoll.title || 'Vote for the Next Reading Selection'}
            </h2>
            <p className="text-[#2D1B0F]/70 text-sm leading-relaxed">
              {activePoll.description || 'Cast your vote to decide the next literary piece for our upcoming reading cycle.'}
            </p>
          </div>

          {/* Right meta: deadline + admin controls */}
          <div className="flex flex-col sm:items-end shrink-0 gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2D1B0F]/50 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              Voting Deadline
            </div>
            <span className="text-sm font-bold text-[#8C6D53]">
              {activePoll.closes_at
                ? new Date(activePoll.closes_at).toLocaleDateString(undefined, {
                    weekday: 'short', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })
                : activePoll.closesAt || 'Closing Soon'}
            </span>
            <span className="text-xs text-[#2D1B0F]/50">
              {totalVotes} vote{totalVotes !== 1 ? 's' : ''} cast
            </span>

            {/* Admin-only delete button */}
            {canModerate && onDeletePoll && (
              <button
                type="button"
                onClick={() => onDeletePoll(activePoll.id)}
                className="mt-1 p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                title="Delete Poll (Admins Only)"
                aria-label="Delete this book poll"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete Poll</span>
              </button>
            )}
          </div>
        </div>

        {/* Interactive Voting Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          {(activePoll.options || []).map((option) => {
            const hasVotedThis = userVotedId === option.id;
            const voteCount = option.vote_count ?? option.votes_count ?? option.votes ?? 0;
            const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

            return (
              <div
                key={option.id}
                onClick={() => !hasVoted && onVote && onVote(activePoll.id, option.id)}
                className={`relative overflow-hidden p-4 rounded-2xl border transition-all duration-300 ${
                  hasVoted
                    ? hasVotedThis
                      ? 'border-[#8C6D53] bg-[#8C6D53]/10 ring-1 ring-[#8C6D53]/40 shadow-sm'
                      : 'border-[#E2D9CC] bg-white/60 text-[#2D1B0F]/60'
                    : 'border-[#E2D9CC] bg-white hover:border-[#8C6D53] hover:shadow-md hover:-translate-y-0.5 cursor-pointer active:scale-98'
                }`}
              >
                {hasVoted && (
                  <div
                    className="absolute left-0 bottom-0 top-0 bg-[#8C6D53]/12 transition-all duration-700 ease-out pointer-events-none rounded-l-2xl"
                    style={{ width: `${pct}%` }}
                  />
                )}
                <div className="relative z-10 space-y-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className={`font-serif text-base font-bold leading-snug ${hasVotedThis ? 'text-[#6B5040]' : 'text-[#2D1B0F]'}`}>
                      {option.title ?? option.book_title ?? 'Book Option'}
                    </h3>
                    {hasVoted && (
                      <div className="shrink-0 flex items-center gap-1">
                        {hasVotedThis && <CheckCircle2 className="w-4 h-4 text-[#8C6D53]" />}
                        <span className={`text-xs font-bold ${hasVotedThis ? 'text-[#8C6D53]' : 'text-[#2D1B0F]/50'}`}>
                          {pct}%
                        </span>
                      </div>
                    )}
                  </div>
                  {option.author && (
                    <p className="text-xs text-[#2D1B0F]/55 font-medium">by {option.author}</p>
                  )}
                  {option.pitch && (
                    <p className="text-xs text-[#2D1B0F]/65 italic leading-relaxed line-clamp-2">
                      "{option.pitch}"
                    </p>
                  )}
                  {hasVoted && (
                    <p className="text-[11px] text-[#2D1B0F]/40 font-medium pt-0.5">
                      {voteCount} vote{voteCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!user && !hasVoted && (
          <p className="text-center text-xs text-[#2D1B0F]/50 italic pb-2">
            Log in to cast your vote and earn XP.
          </p>
        )}

        {/* Thursday Quiz — always rendered */}
        <ThursdayQuizBanner activeQuiz={resolvedQuiz} onOpenQuiz={onOpenQuiz} />
      </section>
    );
  }

  // ── STATE C: Idle / Club Recess ──────────────────────────────────────────────
  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#F6EFE2] border-2 border-[#D8C8B0] shadow-[0_8px_30px_rgb(45,27,15,0.06)] p-8 sm:p-12 text-center space-y-5 transition-all duration-300">
      <div className="w-16 h-16 bg-[#E5D6BF] text-[#5C3B1E] rounded-2xl flex items-center justify-center mx-auto border border-[#BAA587]">
        <BookOpen className="w-8 h-8 text-[#A35C33]" />
      </div>
      <div className="space-y-2 max-w-xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#E5D6BF] text-[#5C3B1E] border border-[#BAA587] text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#A35C33]" />
          Club Reading Recess
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2D1B0F]">
          No active reading sprint underway.
        </h1>
        <p className="text-xs sm:text-sm text-[#2D1B0F]/75 leading-relaxed">
          The next 3-week book cycle will be announced soon. In the meantime, explore the digital library in the Book House or pitch a recommendation for the upcoming voting poll.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <NavLink
          to="/book-house"
          className="px-6 py-3 rounded-xl bg-[#2D1B0F] text-[#FFF8EE] hover:bg-[#1E110A] font-bold text-xs shadow-sm transition-colors flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4 text-[#C48B47]" />
          <span>Explore Book House Catalog</span>
        </NavLink>
        <NavLink
          to="/admin-portal?tab=cycle-launcher"
          className="px-6 py-3 rounded-xl bg-[#A35C33] hover:bg-[#8B4C28] text-white font-bold text-xs border border-[#6E3618] shadow-sm transition-colors flex items-center gap-2"
        >
          <ShieldCheck className="w-4 h-4 text-white" />
          <span>Launch Cycle in Admin Portal</span>
        </NavLink>
      </div>

      {/* Thursday Quiz — always rendered, left-aligned within centred idle card */}
      <div className="max-w-xl mx-auto w-full text-left">
        <ThursdayQuizBanner activeQuiz={resolvedQuiz} onOpenQuiz={onOpenQuiz} />
      </div>
    </section>
  );
}

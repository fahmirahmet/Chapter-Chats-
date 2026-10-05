import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Bell, 
  BookOpen, 
  MessageSquare, 
  Star, 
  ChevronRight, 
  Tag, 
  Clock, 
  ThumbsUp, 
  Award,
  BookMarked,
  Heart
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getAuthorDisplayName, getAuthorProfileTarget } from '../utils/avatar';

export default function HomeSnapshotGrid({ 
  announcements = [], 
  recommendations = [], 
  discussions = [] 
}) {
  const { user } = useAuth();
  const [localLikedProposals, setLocalLikedProposals] = useState({});
  const [localProposalCounts, setLocalProposalCounts] = useState({});

  const safeAnnouncements = Array.isArray(announcements) ? announcements : [];
  const safeRecommendations = Array.isArray(recommendations) ? recommendations : [];
  const safeDiscussions = Array.isArray(discussions) ? discussions : [];

  const handleToggleProposalLike = async (e, id, initialCount, initialHasLiked) => {
    e.preventDefault();
    e.stopPropagation();

    const currentlyLiked = localLikedProposals[id] !== undefined ? localLikedProposals[id] : initialHasLiked;
    const currentCount = localProposalCounts[id] !== undefined ? localProposalCounts[id] : initialCount;

    const nextLiked = !currentlyLiked;
    const nextCount = nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

    setLocalLikedProposals(prev => ({ ...prev, [id]: nextLiked }));
    setLocalProposalCounts(prev => ({ ...prev, [id]: nextCount }));

    try {
      const res = await apiClient.post(`/activities/proposals/${id}/like/`);
      if (res.data) {
        setLocalLikedProposals(prev => ({ ...prev, [id]: Boolean(res.data.has_liked || res.data.is_liked) }));
        setLocalProposalCounts(prev => ({ ...prev, [id]: res.data.like_count ?? res.data.likes_count ?? nextCount }));
      }
    } catch (err) {
      // Revert on error
      setLocalLikedProposals(prev => ({ ...prev, [id]: currentlyLiked }));
      setLocalProposalCounts(prev => ({ ...prev, [id]: currentCount }));
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-dark">
            Community Activity &amp; Highlights
          </h2>
          <p className="text-xs sm:text-sm text-brand-dark/70 mt-1">
            Real-time updates, member book picks, and discussion threads.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card A: Latest Announcements */}
        <div className="bg-white p-6 rounded-3xl border border-brand-cream/80 shadow-warm-sm hover:shadow-warm-md transition-shadow flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-cream/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-primary text-brand-accent flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-lg text-brand-dark">
                  Latest Announcements
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase bg-brand-cream/60 text-brand-dark px-2 py-0.5 rounded-full">
                Club Updates
              </span>
            </div>

            <div className="space-y-3.5">
              {safeAnnouncements.length > 0 ? (
                safeAnnouncements.map((item, idx) => {
                  const categoryName = typeof item?.category === 'object'
                    ? (item.category?.name || item.category?.title || 'Announcement')
                    : String(item?.category || 'Announcement');
                  const titleStr = typeof item?.title === 'object'
                    ? (item.title?.rendered || 'Club Bulletin')
                    : String(item?.title || 'Club Bulletin');
                  const contentStr = typeof item?.content === 'object'
                    ? (item.content?.rendered || '')
                    : String(item?.content || '');
                  const timeStr = typeof item?.timestamp === 'string'
                    ? item.timestamp
                    : (item?.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent');

                  return (
                    <div key={item?.id || idx} className="p-3.5 rounded-2xl bg-brand-surface border border-brand-cream/60 space-y-2 hover:border-brand-accent transition-colors">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${typeof item?.tagColor === 'string' ? item.tagColor : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                          {categoryName}
                        </span>
                        <span className="text-[10px] text-brand-dark/50 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeStr}
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-sm text-brand-dark">{titleStr}</h4>
                      <p className="text-xs text-brand-dark/75 leading-relaxed line-clamp-2">{contentStr}</p>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 rounded-2xl bg-brand-surface border border-dashed border-brand-cream text-center space-y-1.5">
                  <Bell className="w-6 h-6 text-brand-primary/50 mx-auto" />
                  <p className="font-serif font-bold text-xs text-brand-dark">No announcements published yet.</p>
                  <p className="text-[11px] text-brand-dark/60">Club updates and notices will be pinned here.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2">
            <NavLink
              to="/about"
              className="inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-brand-surface border border-brand-cream text-brand-dark text-xs font-bold hover:bg-brand-dark hover:text-brand-cream transition-colors gap-1.5"
            >
              <span>View All Official Bulletins</span>
              <ChevronRight className="w-4 h-4" />
            </NavLink>
          </div>
        </div>

        {/* Card B: Top Member Recommendations & Book Proposals */}
        <div className="bg-white p-6 rounded-3xl border border-brand-cream/80 shadow-warm-sm hover:shadow-warm-md transition-shadow flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-cream/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-secondary text-white flex items-center justify-center">
                  <BookMarked className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-lg text-brand-dark">
                  Member Book Picks
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase bg-brand-accent/20 text-brand-dark px-2 py-0.5 rounded-full">
                Proposals
              </span>
            </div>

            <div className="space-y-3.5">
              {safeRecommendations.length > 0 ? (
                safeRecommendations.map((book, idx) => {
                  const genreStr = typeof book?.genre === 'object' ? (book.genre?.name || 'Literature') : String(book?.genre || 'Ethiopian Literature');
                  const titleStr = typeof book?.title === 'object' ? (book.title?.name || 'Nominated Volume') : String(book?.title || 'Nominated Volume');
                  const authorStr = typeof book?.author === 'object' ? (book.author?.name || book.author?.username || 'Selected Author') : String(book?.author || 'Selected Author');
                  const pitchStr = typeof book?.pitchSnippet === 'string' ? book.pitchSnippet : (typeof book?.pitch === 'string' ? book.pitch : 'Recommended for discussion.');
                  const pitchedByDisplayName = getAuthorDisplayName(book?.pitchedBy || book);
                  const pitchedByProfileTarget = getAuthorProfileTarget(book?.pitchedBy || book);
                  
                  const proposalId = book?.id;
                  const initialLikes = typeof book?.likes === 'number' ? book.likes : (typeof book?.like_count === 'number' ? book.like_count : 0);
                  const initialHasLiked = Boolean(book?.hasLiked || book?.has_liked || book?.is_liked);

                  const isLiked = localLikedProposals[proposalId] !== undefined ? localLikedProposals[proposalId] : initialHasLiked;
                  const likeCount = localProposalCounts[proposalId] !== undefined ? localProposalCounts[proposalId] : initialLikes;

                  return (
                    <div key={proposalId || idx} className="p-3.5 rounded-2xl bg-brand-surface border border-brand-cream/60 space-y-2 hover:border-brand-secondary transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold text-brand-primary bg-brand-cream/40 px-2 py-0.5 rounded">
                          {genreStr}
                        </span>

                        {proposalId ? (
                          <button
                            type="button"
                            onClick={(e) => handleToggleProposalLike(e, proposalId, initialLikes, initialHasLiked)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              isLiked
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                                : 'bg-white border border-brand-cream text-brand-dark/70 hover:text-brand-dark hover:bg-brand-cream/40'
                            }`}
                            title="Endorse proposal (+1 XP)"
                          >
                            <ThumbsUp className={`w-3 h-3 ${isLiked ? 'text-amber-700 fill-amber-600' : 'text-brand-dark/60'}`} />
                            <span className="text-[11px]">{likeCount}</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-amber-600 font-bold text-xs">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span>4.9</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-serif font-bold text-sm text-brand-dark leading-snug">{titleStr}</h4>
                        <p className="text-[11px] text-brand-dark/60">by {authorStr}</p>
                      </div>

                      <p className="text-xs text-brand-dark/75 italic line-clamp-2">"{pitchStr}"</p>
                      <p className="text-[10px] font-medium text-brand-dark/60 text-right">
                        Pitched by <NavLink to={pitchedByProfileTarget} className="text-brand-primary font-bold hover:underline">{pitchedByDisplayName}</NavLink>
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 rounded-2xl bg-brand-surface border border-dashed border-brand-cream text-center space-y-1.5">
                  <BookMarked className="w-6 h-6 text-brand-secondary/50 mx-auto" />
                  <p className="font-serif font-bold text-xs text-brand-dark">No member proposals yet.</p>
                  <p className="text-[11px] text-brand-dark/60">Be the first to pitch a book recommendation!</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2">
            <NavLink
              to="/discussions?tab=proposals&openForm=true"
              className="inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-brand-surface border border-brand-cream text-brand-dark text-xs font-bold hover:bg-brand-dark hover:text-brand-cream transition-colors gap-1.5"
            >
              <span>View All Book Proposals</span>
              <ChevronRight className="w-4 h-4" />
            </NavLink>
          </div>
        </div>

        {/* Card C: Live Community Chatter */}
        <div className="bg-white p-6 rounded-3xl border border-brand-cream/80 shadow-warm-sm hover:shadow-warm-md transition-shadow flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-cream/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-accent text-brand-dark flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-lg text-brand-dark">
                  Live Forum Chatter
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase bg-brand-cream/60 text-brand-dark px-2 py-0.5 rounded-full">
                Active Discussions
              </span>
            </div>

            <div className="space-y-3.5">
              {safeDiscussions.length > 0 ? (
                safeDiscussions.map((disc, idx) => {
                  const authorDisplayName = getAuthorDisplayName(disc);
                  const authorProfileTarget = getAuthorProfileTarget(disc);

                  const replyCount = typeof disc?.replyCount === 'number'
                    ? disc.replyCount
                    : typeof disc?.reply_count === 'number'
                      ? disc.reply_count
                      : Array.isArray(disc?.replies)
                        ? disc.replies.length
                        : typeof disc?.replies === 'number'
                          ? disc.replies
                          : 0;

                  const timeAgoStr = typeof disc?.timeAgo === 'string'
                    ? disc.timeAgo
                    : typeof disc?.time_ago === 'string'
                      ? disc.time_ago
                      : (disc?.created_at ? new Date(disc.created_at).toLocaleDateString() : 'Recently');

                  const titleStr = typeof disc?.title === 'object'
                    ? (disc.title?.name || 'Discussion Topic')
                    : String(disc?.title || 'Discussion Topic');

                  const contentStr = typeof disc?.snippet === 'string'
                    ? disc.snippet
                    : (typeof disc?.content === 'string' ? disc.content : '');

                  return (
                    <div key={disc?.id || idx} className="p-3.5 rounded-2xl bg-brand-surface border border-brand-cream/60 space-y-2 hover:border-brand-accent transition-colors">
                      <div className="flex items-center justify-between text-[10px] text-brand-dark/60">
                        <NavLink to={authorProfileTarget} className="font-bold text-brand-primary hover:underline">
                          by {authorDisplayName}
                        </NavLink>
                        <span>{timeAgoStr}</span>
                      </div>
                      <h4 className="font-serif font-bold text-sm text-brand-dark leading-snug">{titleStr}</h4>
                      <p className="text-xs text-brand-dark/75 leading-relaxed line-clamp-2">{contentStr}</p>
                      <div className="flex items-center justify-end gap-1 text-[11px] font-bold text-brand-secondary">
                        <span>💬 {replyCount} {replyCount === 1 ? 'Reply' : 'Replies'}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 rounded-2xl bg-brand-surface border border-dashed border-brand-cream text-center space-y-1.5">
                  <MessageSquare className="w-6 h-6 text-brand-accent/60 mx-auto" />
                  <p className="font-serif font-bold text-xs text-brand-dark">No discussions started yet.</p>
                  <p className="text-[11px] text-brand-dark/60">Start a thread on this cycle's reading targets.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2">
            <NavLink
              to="/discussions"
              className="inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-brand-dark text-brand-cream text-xs font-bold hover:bg-brand-primary transition-colors gap-1.5 shadow-warm-sm"
            >
              <span>Join Active Boards</span>
              <ChevronRight className="w-4 h-4 text-brand-accent" />
            </NavLink>
          </div>
        </div>
      </div>
    </section>
  );
}

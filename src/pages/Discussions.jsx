import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, NavLink } from 'react-router-dom';
import { 
  MessageSquare, 
  Plus, 
  ThumbsUp, 
  Eye, 
  EyeOff, 
  Send, 
  Vote, 
  CheckCircle2, 
  Sparkles, 
  BarChart2, 
  Clock, 
  BookMarked, 
  X, 
  Search, 
  AlertCircle, 
  Loader2,
  Flag,
  ChevronDown,
  ChevronUp,
  Shield,
  PlusCircle,
  Trash2,
  CornerDownRight,
  Reply,
  LogIn
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import ReportModal from '../components/ReportModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import AuthorBadge from '../components/AuthorBadge';
import { getAuthorDisplayName, getAuthorProfileTarget } from '../utils/avatar';

const CHAPTER_TAG_PRESETS = [
  'General Discussion',
  'Chapter 1-3',
  'Chapter 4-6',
  'Pages 113-224',
  'Character Study',
  'Themes & Philosophy',
  'Quotes & Highlights'
];

export default function Discussions() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramTab = searchParams.get('tab');
  const paramOpenForm = searchParams.get('openForm') === 'true';

  // Active Tab: 'threads' | 'poll' | 'proposals'
  const getInitialTab = () => {
    if (paramTab === 'poll') return 'poll';
    if (paramTab === 'proposals' || paramTab === 'suggest') return 'proposals';
    return 'threads';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [revealedSpoilers, setRevealedSpoilers] = useState({});
  const [reportModalData, setReportModalData] = useState(null);

  // Proposal form DOM ref for auto-scrolling
  const proposalFormRef = useRef(null);

  // Discussions state
  const [threads, setThreads] = useState([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');

  // Thread Replies state
  const [expandedReplies, setExpandedReplies] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [submittingReplyIds, setSubmittingReplyIds] = useState({});
  const [replyFeedback, setReplyFeedback] = useState({});
  const [replyingTo, setReplyingTo] = useState(null); // { id, author, text, threadId }

  // New Thread Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmittingThread, setIsSubmittingThread] = useState(false);
  const [newThread, setNewThread] = useState({
    title: '',
    chapter_tag: 'General Discussion',
    content: '',
    spoiler_text: ''
  });
  const [threadFeedback, setThreadFeedback] = useState(null);

  // Poll State
  const [pollState, setPollState] = useState({
    id: null,
    title: 'Select Our Next 3-Week Cycle Book',
    description: 'Vote for the book you would like our club to read starting next cycle.',
    closesAt: null,
    totalVotes: 0,
    hasVoted: false,
    voted_option_id: null,
    options: []
  });
  const [isLoadingPoll, setIsLoadingPoll] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [pollFeedback, setPollFeedback] = useState(null);

  // Executive Poll Creation Modal State
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [isSubmittingPoll, setIsSubmittingPoll] = useState(false);
  const [newPollForm, setNewPollForm] = useState({
    title: 'Select Our Next 3-Week Cycle Book',
    description: 'Vote for the book you would like our club to read starting next cycle.',
    closes_at: '',
    options: [
      { book_title: '', author: '', genre: 'Ethiopian Literature', pitch: '' },
      { book_title: '', author: '', genre: 'Philosophy & Ethics', pitch: '' }
    ]
  });

  // Suggestion / Proposal State
  const [suggestion, setSuggestion] = useState({ 
    title: '', 
    author: '', 
    pitch: '', 
    genre: 'Ethiopian Literature' 
  });
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);
  const [suggestionSubmitted, setSuggestionSubmitted] = useState(false);

  // Proposals Feed State
  const [proposals, setProposals] = useState([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const [proposalFeedback, setProposalFeedback] = useState(null);

  // Universal Deletion Modal State
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    itemType: null, // 'thread' | 'reply' | 'proposal'
    id: null,
    title: '',
    threadId: null
  });
  const [isDeletingItem, setIsDeletingItem] = useState(false);

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
  const isExecutive = canModerate;

  // URL search params sync
  useEffect(() => {
    if (paramTab === 'poll') {
      setActiveTab('poll');
    } else if (paramTab === 'proposals' || paramTab === 'suggest') {
      setActiveTab('proposals');
      if (paramOpenForm && proposalFormRef.current) {
        setTimeout(() => {
          proposalFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, [paramTab, paramOpenForm]);

  // 1. Fetch Discussion Threads from API
  const fetchThreads = async () => {
    setIsLoadingThreads(true);
    try {
      const res = await apiClient.get('/activities/discussions/');
      if (res.data && Array.isArray(res.data)) {
        const formatted = res.data.map(th => {
          const repliesList = Array.isArray(th.replies) ? th.replies : [];
          const replyCount = th.reply_count ?? (Array.isArray(th.replies) ? th.replies.length : (typeof th.replies === 'number' ? th.replies : 0));
          const authorDisplayName = getAuthorDisplayName(th);
          const authorUsername = th.author_username || th.author;
          const authorId = th.author_id || (typeof th.user === 'object' ? th.user?.id : th.user);
          const profileTarget = getAuthorProfileTarget(th);

          return {
            id: th.id,
            title: th.title,
            author: authorDisplayName,
            authorName: authorDisplayName,
            authorUsername: authorUsername,
            authorId: authorId,
            profileTarget: profileTarget,
            rawItem: th,
            avatar: th.avatar || th.author_avatar || null,
            chapter_tag: th.chapter_tag || th.chapterTag || 'General Discussion',
            content: th.content,
            spoiler_text: th.spoiler_text || th.spoilerText || '',
            upvotes: th.upvotes_count ?? th.upvotes ?? 0,
            is_upvoted: Boolean(th.is_upvoted),
            time_ago: th.time_ago || (th.created_at ? new Date(th.created_at).toLocaleDateString() : 'Recently'),
            replies: repliesList,
            reply_count: replyCount,
            created_at: th.created_at
          };
        });
        setThreads(formatted);
      } else {
        setThreads([]);
      }
    } catch (err) {
      console.warn('Could not fetch discussions from API:', err);
      setThreads([]);
    } finally {
      setIsLoadingThreads(false);
    }
  };

  // 2. Fetch Active Community Poll from API
  const fetchActivePoll = async () => {
    setIsLoadingPoll(true);
    try {
      const res = await apiClient.get('/activities/polls/active/');
      const pollData = res.data?.poll || res.data;
      if (pollData && pollData.options && Array.isArray(pollData.options) && pollData.options.length > 0) {
        const total = pollData.total_votes ?? pollData.totalVotes ?? 
          pollData.options.reduce((acc, curr) => acc + (curr.votes_count ?? curr.votes ?? 0), 0);
        
        const formattedOptions = pollData.options.map(opt => {
          const votes = opt.votes_count ?? opt.votes ?? 0;
          const percentage = total > 0 ? Math.round((votes / total) * 100) : 0;
          return {
            id: opt.id,
            title: opt.book_title || opt.title,
            author: opt.author,
            genre: opt.genre || 'Ethiopian Literature',
            pitch: opt.pitch || '',
            votes: votes,
            percentage: opt.percentage ?? percentage
          };
        });

        setPollState({
          id: pollData.id,
          title: pollData.title || 'Select Our Next 3-Week Cycle Book',
          description: pollData.description || 'Vote for the book you would like our club to read.',
          closesAt: pollData.closesAt || (pollData.closes_at ? new Date(pollData.closes_at).toLocaleDateString() : 'Upcoming'),
          totalVotes: total,
          hasVoted: Boolean(pollData.has_voted ?? pollData.hasVoted),
          voted_option_id: pollData.voted_option_id,
          options: formattedOptions
        });
      } else {
        setPollState(prev => ({ ...prev, options: [] }));
      }
    } catch (err) {
      console.warn('Could not fetch active poll from API:', err);
      setPollState(prev => ({ ...prev, options: [] }));
    } finally {
      setIsLoadingPoll(false);
    }
  };

  // 3. Fetch Book Proposals Feed from API
  const fetchProposals = async () => {
    setIsLoadingProposals(true);
    try {
      const res = await apiClient.get('/activities/proposals/');
      if (res.data && Array.isArray(res.data)) {
        const formatted = res.data.map(p => {
          const proposerDisplayName = getAuthorDisplayName(p);
          const proposerUsername = p.author_username || p.proposer;
          const proposerId = p.author_id || p.proposer_id || (typeof p.user === 'object' ? p.user?.id : p.user);
          const profileTarget = getAuthorProfileTarget(p);
          return {
            id: p.id,
            title: p.title,
            author: p.author,
            genre: p.genre || 'Ethiopian Literature',
            pitch: p.pitch,
            proposer: proposerDisplayName,
            proposerName: proposerDisplayName,
            proposerUsername: proposerUsername,
            proposerId: proposerId,
            profileTarget: profileTarget,
            avatar: p.user_avatar || p.author_avatar || null,
            rawItem: p,
            likes: p.like_count ?? p.likes_count ?? 0,
            has_liked: Boolean(p.has_liked || p.is_liked),
            created_at: p.created_at,
            time_ago: p.time_ago || (p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recently')
          };
        });
        setProposals(formatted);
      } else {
        setProposals([]);
      }
    } catch (err) {
      console.warn('Could not fetch proposals from API:', err);
      setProposals([]);
    } finally {
      setIsLoadingProposals(false);
    }
  };

  useEffect(() => {
    fetchThreads();
    fetchActivePoll();
    fetchProposals();
  }, []);

  const toggleSpoiler = (id) => {
    setRevealedSpoilers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleReplies = (id) => {
    setExpandedReplies(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // 4. Handle Upvote on Discussion Thread with Optimistic UI
  const handleToggleThreadUpvote = async (id) => {
    const currentThread = threads.find(t => t.id === id);
    if (!currentThread) return;

    const wasUpvoted = currentThread.is_upvoted;
    const previousUpvotes = currentThread.upvotes;
    const newUpvotes = wasUpvoted ? Math.max(0, previousUpvotes - 1) : previousUpvotes + 1;

    setThreads(prev =>
      prev.map(th => (th.id === id ? { ...th, is_upvoted: !wasUpvoted, upvotes: newUpvotes } : th))
    );

    try {
      const res = await apiClient.post(`/activities/discussions/${id}/upvote/`);
      if (res.data) {
        setThreads(prev =>
          prev.map(th => 
            th.id === id 
              ? { ...th, is_upvoted: res.data.is_upvoted, upvotes: res.data.upvotes ?? res.data.upvotes_count ?? newUpvotes } 
              : th
          )
        );
      }
    } catch (err) {
      console.error('Error toggling discussion upvote:', err);
      setThreads(prev =>
        prev.map(th => (th.id === id ? { ...th, is_upvoted: wasUpvoted, upvotes: previousUpvotes } : th))
      );
    }
  };

  // 5. Handle Universal Deletion of Discussion Thread
  const handleDeleteThread = (id, title) => {
    setDeleteModalState({
      isOpen: true,
      itemType: 'thread',
      id,
      title: title || 'this topic',
      threadId: null
    });
  };

  // 6. Handle Universal Deletion of Discussion Reply
  const handleDeleteReply = (replyId, threadId) => {
    setDeleteModalState({
      isOpen: true,
      itemType: 'reply',
      id: replyId,
      title: 'this reply',
      threadId
    });
  };

  // 7. Handle Proposal Like / Endorsement Toggle with Optimistic UI
  const handleToggleProposalLike = async (id) => {
    const currentProposal = proposals.find(p => p.id === id);
    if (!currentProposal) return;

    const wasLiked = currentProposal.has_liked;
    const previousLikes = currentProposal.likes;
    const newLikes = wasLiked ? Math.max(0, previousLikes - 1) : previousLikes + 1;

    setProposals(prev =>
      prev.map(p => (p.id === id ? { ...p, has_liked: !wasLiked, likes: newLikes } : p))
    );

    try {
      const res = await apiClient.post(`/activities/proposals/${id}/like/`);
      if (res.data) {
        setProposals(prev =>
          prev.map(p =>
            p.id === id
              ? {
                  ...p,
                  has_liked: Boolean(res.data.has_liked || res.data.is_liked),
                  likes: res.data.like_count ?? res.data.likes_count ?? newLikes
                }
              : p
          )
        );
      }
    } catch (err) {
      console.error('Error toggling proposal like:', err);
      setProposals(prev =>
        prev.map(p => (p.id === id ? { ...p, has_liked: wasLiked, likes: previousLikes } : p))
      );
    }
  };

  // 8. Handle Universal Deletion of Book Proposal
  const handleDeleteProposal = (id, title) => {
    setDeleteModalState({
      isOpen: true,
      itemType: 'proposal',
      id,
      title: title || 'this proposal',
      threadId: null
    });
  };

  // Confirmation Execution for Universal Deletions
  const handleConfirmDelete = async () => {
    if (!deleteModalState.id) return;
    setIsDeletingItem(true);
    try {
      if (deleteModalState.itemType === 'thread') {
        await apiClient.delete(`/activities/discussions/${deleteModalState.id}/`);
        setThreads(prev => prev.filter(th => th.id !== deleteModalState.id));
        setThreadFeedback({
          type: 'success',
          message: `Discussion topic "${deleteModalState.title}" deleted successfully.`
        });
        setTimeout(() => setThreadFeedback(null), 4000);
      } else if (deleteModalState.itemType === 'reply') {
        await apiClient.delete(`/activities/discussions/replies/${deleteModalState.id}/`);
        setThreads(prev =>
          prev.map(th => {
            if (th.id === deleteModalState.threadId) {
              const currentReplies = Array.isArray(th.replies) ? th.replies : [];
              const updatedReplies = currentReplies.filter(r => r.id !== deleteModalState.id);
              return {
                ...th,
                replies: updatedReplies,
                reply_count: Math.max(0, (th.reply_count || currentReplies.length) - 1)
              };
            }
            return th;
          })
        );
      } else if (deleteModalState.itemType === 'proposal') {
        await apiClient.delete(`/activities/proposals/${deleteModalState.id}/`);
        setProposals(prev => prev.filter(p => p.id !== deleteModalState.id));
        setProposalFeedback({
          type: 'success',
          text: `Proposal "${deleteModalState.title}" deleted successfully.`
        });
        setTimeout(() => setProposalFeedback(null), 4000);
      }
      setDeleteModalState({ isOpen: false, itemType: null, id: null, title: '', threadId: null });
    } catch (err) {
      console.error('Error deleting item:', err);
      const errMsg = err.response?.data?.detail || 'Failed to delete. Access denied.';
      if (deleteModalState.itemType === 'thread') {
        setThreadFeedback({ type: 'error', message: errMsg });
      } else if (deleteModalState.itemType === 'proposal') {
        setProposalFeedback({ type: 'error', text: errMsg });
      } else {
        alert(errMsg);
      }
    } finally {
      setIsDeletingItem(false);
    }
  };

  // 4. Handle Submitting Reply to Discussion Thread
  const handleSubmitReply = async (e, threadId) => {
    e.preventDefault();
    const content = replyInputs[threadId]?.trim();
    if (!content) return;

    setSubmittingReplyIds(prev => ({ ...prev, [threadId]: true }));
    setReplyFeedback(prev => ({ ...prev, [threadId]: null }));

    const activeReplyTo = (replyingTo && replyingTo.threadId === threadId) ? replyingTo : null;

    try {
      const payload = {
        content: content,
        ...(activeReplyTo?.id ? { parent_reply: activeReplyTo.id, parent_reply_id: activeReplyTo.id } : {})
      };

      const res = await apiClient.post(`/activities/discussions/${threadId}/replies/`, payload);

      if (res.data) {
        const replyPayload = res.data.reply || res.data;
        const newReplyObj = {
          id: replyPayload.id || Date.now(),
          author: replyPayload.author || user?.username || 'You',
          avatar: replyPayload.author_avatar || replyPayload.avatar || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'Member')}&background=A35C33&color=fff`,
          content: replyPayload.content || content,
          replying_to: replyPayload.replying_to || (activeReplyTo ? {
            id: activeReplyTo.id,
            author: activeReplyTo.author,
            excerpt: activeReplyTo.text.length > 60 ? activeReplyTo.text.slice(0, 60) + '...' : activeReplyTo.text
          } : null),
          created_at: replyPayload.created_at || new Date().toISOString(),
          time_ago: replyPayload.time_ago || 'Just now'
        };

        setThreads(prev =>
          prev.map(th => {
            if (th.id === threadId) {
              const currentReplies = Array.isArray(th.replies) ? th.replies : [];
              return {
                ...th,
                replies: [...currentReplies, newReplyObj],
                reply_count: (th.reply_count || currentReplies.length) + 1
              };
            }
            return th;
          })
        );

        setReplyInputs(prev => ({ ...prev, [threadId]: '' }));
        if (activeReplyTo) setReplyingTo(null);
        setReplyFeedback(prev => ({
          ...prev,
          [threadId]: { type: 'success', text: 'Reply posted to thread! (+5 XP)' }
        }));
        setTimeout(() => {
          setReplyFeedback(prev => ({ ...prev, [threadId]: null }));
        }, 4000);
      }
    } catch (err) {
      console.error('Error submitting reply:', err);
      setReplyFeedback(prev => ({
        ...prev,
        [threadId]: {
          type: 'error',
          text: err.response?.data?.detail || err.response?.data?.error || 'Failed to post reply. Please ensure you are logged in.'
        }
      }));
    } finally {
      setSubmittingReplyIds(prev => ({ ...prev, [threadId]: false }));
    }
  };

  // 5. Handle Voting on Community Poll Option
  const handleVote = async (optionId) => {
    if (pollState.hasVoted || isVoting) return;

    setIsVoting(true);
    setPollFeedback(null);

    const newOptions = pollState.options.map(opt => {
      if (opt.id === optionId) {
        return { ...opt, votes: opt.votes + 1 };
      }
      return opt;
    });

    const newTotal = pollState.totalVotes + 1;
    const updatedOptionsWithPct = newOptions.map(opt => ({
      ...opt,
      percentage: Math.round((opt.votes / newTotal) * 100),
    }));

    setPollState(prev => ({
      ...prev,
      totalVotes: newTotal,
      hasVoted: true,
      voted_option_id: optionId,
      options: updatedOptionsWithPct,
    }));

    try {
      const res = await apiClient.post('/activities/polls/vote/', { option_id: optionId });
      if (res.data) {
        setPollFeedback({
          type: 'success',
          message: res.data.message || 'Thank you for voting! Your voice shapes our next reading cycle (+5 XP awarded).'
        });
      }
    } catch (err) {
      console.error('Error casting vote:', err);
      const errMsg = err.response?.data?.error || 'Unable to record your vote. Please check your connection.';
      setPollFeedback({ type: 'error', message: errMsg });
    } finally {
      setIsVoting(false);
    }
  };

  // 6. Handle Creating a New Discussion Thread
  const handleCreateNewThread = async (e) => {
    e.preventDefault();
    if (!newThread.title.trim() || !newThread.content.trim()) return;

    setIsSubmittingThread(true);
    setThreadFeedback(null);

    try {
      const res = await apiClient.post('/activities/discussions/', {
        title: newThread.title.trim(),
        chapter_tag: newThread.chapter_tag || 'General Discussion',
        content: newThread.content.trim(),
        spoiler_text: newThread.spoiler_text ? newThread.spoiler_text.trim() : null
      });

      if (res.data) {
        const createdThread = {
          id: res.data.id || Date.now(),
          title: res.data.title,
          author: res.data.author || user?.username || 'You (Active Member)',
          avatar: res.data.avatar || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'Member')}&background=A35C33&color=fff`,
          chapter_tag: res.data.chapter_tag || res.data.chapterTag || newThread.chapter_tag,
          content: res.data.content,
          spoiler_text: res.data.spoiler_text || res.data.spoilerText || '',
          upvotes: res.data.upvotes_count ?? 1,
          is_upvoted: true,
          time_ago: 'Just now',
          replies: [],
          reply_count: 0,
          created_at: new Date().toISOString()
        };

        setThreads(prev => [createdThread, ...prev]);
        setNewThread({
          title: '',
          chapter_tag: 'General Discussion',
          content: '',
          spoiler_text: ''
        });
        setIsModalOpen(false);
        setThreadFeedback({
          type: 'success',
          message: 'Discussion topic posted to the cycle board! (+10 XP awarded)'
        });
        setTimeout(() => setThreadFeedback(null), 6000);
      }
    } catch (err) {
      console.error('Error posting discussion thread:', err);
      setThreadFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to publish discussion. Please ensure you are logged in.'
      });
    } finally {
      setIsSubmittingThread(false);
    }
  };

  // 7. Handle Executive Creating Community Book Poll
  const handleAddPollOption = () => {
    setNewPollForm(prev => ({
      ...prev,
      options: [...prev.options, { book_title: '', author: '', genre: 'Ethiopian Literature', pitch: '' }]
    }));
  };

  const handleRemovePollOption = (index) => {
    if (newPollForm.options.length <= 2) return;
    setNewPollForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handlePollOptionChange = (index, field, value) => {
    setNewPollForm(prev => {
      const updated = [...prev.options];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, options: updated };
    });
  };

  const handleCreatePollSubmit = async (e) => {
    e.preventDefault();
    if (!newPollForm.title.trim()) return;

    // Validate options
    const validOptions = newPollForm.options.filter(opt => opt.book_title.trim() && opt.author.trim());
    if (validOptions.length < 2) {
      alert('Please provide at least 2 book options with title and author.');
      return;
    }

    setIsSubmittingPoll(true);
    try {
      const payload = {
        title: newPollForm.title.trim(),
        description: newPollForm.description.trim(),
        closes_at: newPollForm.closes_at || null,
        is_active: true,
        options: validOptions
      };

      const res = await apiClient.post('/activities/polls/create/', payload);
      if (res.data) {
        await fetchActivePoll();
        setIsCreatePollOpen(false);
        setPollFeedback({
          type: 'success',
          message: 'New community book voting poll published live!'
        });
        setTimeout(() => setPollFeedback(null), 6000);
      }
    } catch (err) {
      console.error('Error creating poll:', err);
      alert(err.response?.data?.detail || 'Failed to create book poll. Ensure you have executive permissions.');
    } finally {
      setIsSubmittingPoll(false);
    }
  };

  // 9. Handle Proposing a Book Pitch
  const handleSuggestionSubmit = async (e) => {
    e.preventDefault();
    if (!suggestion.title || !suggestion.author || !suggestion.pitch) return;

    setIsSubmittingSuggestion(true);

    try {
      await apiClient.post('/activities/proposals/', suggestion);
      setSuggestionSubmitted(true);
      setSuggestion({ title: '', author: '', pitch: '', genre: 'Ethiopian Literature' });
      await fetchProposals();
    } catch (err) {
      console.error('API error on book proposal:', err);
      setSuggestionSubmitted(true);
      setSuggestion({ title: '', author: '', pitch: '', genre: 'Ethiopian Literature' });
    } finally {
      setIsSubmittingSuggestion(false);
    }
  };

  // Filtered threads based on search and tag
  const filteredThreads = threads.filter(thread => {
    const matchesSearch = 
      thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.author.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag = 
      selectedTag === 'all' || 
      (thread.chapter_tag && thread.chapter_tag.toLowerCase().includes(selectedTag.toLowerCase()));

    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-[#2D1B0F] text-[#F8F4EC] p-6 sm:p-8 rounded-3xl border-2 border-[#C48B47]/40 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#A35C33] text-white flex items-center justify-center font-bold shadow-sm shrink-0">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-2xl sm:text-3xl text-white tracking-tight">
                Discussion &amp; Recommendation Hub
              </h1>
              <p className="text-xs sm:text-sm text-[#EFE7DA]/80">
                Cycle Chapter Boards • Markdown Spoilers • Community Book Polls
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#2D1B0F] bg-[#C48B47] px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#2D1B0F]" />
              Literary Forum
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 pt-3 border-t border-[#D8C8B0]/20 overflow-x-auto scrollbar-none">
          <button
            onClick={() => { setActiveTab('threads'); setSearchParams({}); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
              activeTab === 'threads'
                ? 'bg-[#A35C33] text-white shadow-md'
                : 'bg-[#1A0E06]/80 text-[#EFE7DA] hover:bg-[#422817]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chapter Discussion Boards</span>
            <span className="bg-[#1A0E06] text-[#C48B47] px-1.5 py-0.5 rounded-full text-[10px]">
              {threads.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('poll'); setSearchParams({ tab: 'poll' }); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
              activeTab === 'poll'
                ? 'bg-[#A35C33] text-white shadow-md'
                : 'bg-[#1A0E06]/80 text-[#EFE7DA] hover:bg-[#422817]'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Community Book Poll</span>
            <span className="bg-[#1A0E06] text-[#C48B47] px-1.5 py-0.5 rounded-full text-[10px]">
              {pollState.totalVotes} Votes
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('proposals'); setSearchParams({ tab: 'proposals' }); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
              activeTab === 'proposals'
                ? 'bg-[#A35C33] text-white shadow-md'
                : 'bg-[#1A0E06]/80 text-[#EFE7DA] hover:bg-[#422817]'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span>Propose Book Selection</span>
            <span className="bg-[#1A0E06] text-[#C48B47] px-1.5 py-0.5 rounded-full text-[10px]">
              {proposals.length}
            </span>
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {threadFeedback && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold animate-fade-in ${
          threadFeedback.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2">
            {threadFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{threadFeedback.message}</span>
          </div>
          <button onClick={() => setThreadFeedback(null)} className="text-[#2D1B0F]/50 hover:text-[#2D1B0F] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab 1: Chapter Discussion Threads */}
      {activeTab === 'threads' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-[#D8C8B0] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D1B0F]/40" />
                <input
                  type="text"
                  placeholder="Search topics, quotes, members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#F8F4EC] border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#A35C33] focus:outline-none placeholder:text-[#2D1B0F]/40"
                />
              </div>

              {/* Tag / Category Filter */}
              <div className="relative">
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 bg-[#F8F4EC] border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] font-medium focus:ring-2 focus:ring-[#A35C33] focus:outline-none cursor-pointer"
                >
                  <option value="all">🏷️ All Chapter Tags</option>
                  {CHAPTER_TAG_PRESETS.map((tag) => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Start New Thread Trigger Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-[#A35C33] text-white font-bold text-xs hover:bg-[#8B4C28] transition-all duration-200 shadow-md flex items-center justify-center gap-2 shrink-0 group cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-300" />
              <span>Start New Discussion</span>
            </button>
          </div>

          {/* Threads List */}
          {isLoadingThreads ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white p-6 rounded-3xl border border-[#D8C8B0] animate-pulse space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#D8C8B0]/60" />
                    <div className="space-y-1 flex-1">
                      <div className="h-4 bg-[#D8C8B0]/60 rounded w-1/3" />
                      <div className="h-3 bg-[#D8C8B0]/40 rounded w-1/5" />
                    </div>
                  </div>
                  <div className="h-3 bg-[#D8C8B0]/40 rounded w-full" />
                  <div className="h-3 bg-[#D8C8B0]/40 rounded w-4/5" />
                </div>
              ))}
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="bg-[#F8F4EC] p-12 rounded-3xl border-2 border-dashed border-[#D8C8B0] text-center space-y-3 shadow-xs">
              <MessageSquare className="w-12 h-12 text-[#A35C33]/40 mx-auto" />
              <h4 className="font-serif font-bold text-lg text-[#2D1B0F]">No open discussion topics yet. Start the first thread!</h4>
              <p className="text-xs text-[#2D1B0F]/60 max-w-sm mx-auto">
                {searchQuery || selectedTag !== 'all' 
                  ? 'No discussions match your current search or tag filters.'
                  : 'Be the first member to spark a conversation on this cycle\'s reading targets!'}
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedTag('all'); setIsModalOpen(true); }}
                className="mt-2 px-5 py-2.5 bg-[#A35C33] text-white text-xs font-bold rounded-xl hover:bg-[#8B4C28] transition-colors cursor-pointer shadow-sm"
              >
                Create First Thread
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredThreads.map(thread => {
                const isRepliesOpen = Boolean(expandedReplies[thread.id]);
                const threadReplies = Array.isArray(thread.replies) ? thread.replies : [];
                const replyCount = thread.reply_count ?? threadReplies.length;
                const canDeleteThisThread = canModerate || (user && (user.username === thread.authorUsername || user.username === thread.author || user.id === thread.authorId || user.id === thread.user_id));

                return (
                  <div 
                    key={thread.id} 
                    className="bg-white p-6 sm:p-7 rounded-3xl border-2 border-[#D8C8B0] shadow-xs space-y-4 hover:border-[#A35C33] transition-all duration-200"
                  >
                    {/* Thread Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <AuthorBadge
                          item={thread.rawItem || thread}
                          displayName={thread.author}
                          profileTarget={thread.profileTarget}
                          avatarUrl={thread.avatar}
                          size="lg"
                          avatarOnly
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-serif font-bold text-lg text-[#2D1B0F] leading-snug">
                              {thread.title}
                            </h4>
                            {thread.chapter_tag && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A35C33] bg-[#EFE7DA] px-2.5 py-0.5 rounded-full border border-[#D8C8B0]">
                                {thread.chapter_tag}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#2D1B0F]/60 mt-0.5">
                            Posted by <NavLink to={thread.profileTarget} className="text-[#A35C33] font-bold hover:underline">{thread.author}</NavLink> • {thread.time_ago}
                          </p>
                        </div>
                      </div>

                      {/* Top Action / Delete Button */}
                      {canDeleteThisThread && (
                        <button
                          type="button"
                          onClick={() => handleDeleteThread(thread.id, thread.title)}
                          className="p-2 rounded-xl text-[#2D1B0F]/40 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                          title="Delete discussion topic"
                          aria-label="Delete topic"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Thread Body */}
                    <p className="text-xs sm:text-sm text-[#2D1B0F]/85 leading-relaxed whitespace-pre-line">
                      {thread.content}
                    </p>

                    {/* Markdown Spoiler Box Component */}
                    {thread.spoiler_text && (
                      <div className="p-4 rounded-2xl bg-[#F8F4EC] border border-[#D8C8B0] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#A35C33] flex items-center gap-1.5 text-[11px]">
                            ⚠️ Spoiler Tag Protected (&gt;!spoiler!&lt;)
                          </span>
                          <button
                            onClick={() => toggleSpoiler(thread.id)}
                            className="text-xs text-[#A35C33] hover:underline flex items-center gap-1 font-bold cursor-pointer transition-colors"
                          >
                            {revealedSpoilers[thread.id] ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Hide Spoiler</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>Click to Reveal Spoiler</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className={`text-xs transition-all duration-300 ${
                          revealedSpoilers[thread.id] 
                            ? 'text-[#2D1B0F] font-medium leading-relaxed bg-white p-2.5 rounded-xl border border-[#D8C8B0]' 
                            : 'bg-[#2D1B0F] text-transparent select-none blur-xs rounded-xl p-2.5'
                        }`}>
                          {thread.spoiler_text}
                        </p>
                      </div>
                    )}

                    {/* Thread Actions & Counters */}
                    <div className="pt-3.5 border-t border-[#D8C8B0]/60 flex items-center justify-between text-xs">
                      {/* Replies Accordion Toggle */}
                      <button
                        onClick={() => toggleReplies(thread.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                          isRepliesOpen 
                            ? 'bg-[#EFE7DA] text-[#A35C33]' 
                            : 'text-[#2D1B0F]/70 hover:text-[#2D1B0F] hover:bg-[#F8F4EC]'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#A35C33]" />
                        <span>{replyCount} {replyCount === 1 ? 'Reply' : 'Replies'}</span>
                        {isRepliesOpen ? (
                          <ChevronUp className="w-3.5 h-3.5 text-[#A35C33]" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-[#2D1B0F]/50" />
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setReportModalData({
                            targetType: 'thread',
                            targetId: thread.id,
                            targetTitle: thread.title,
                            targetAuthor: thread.author
                          })}
                          className="p-1.5 rounded-xl border border-[#D8C8B0] text-[#8C6D53] hover:text-rose-700 hover:border-rose-300 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Report this topic"
                          aria-label="Report topic"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleThreadUpvote(thread.id)}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all duration-200 cursor-pointer ${
                            thread.is_upvoted
                              ? 'bg-[#C48B47] text-[#2D1B0F] shadow-xs'
                              : 'bg-[#F8F4EC] border border-[#D8C8B0] text-[#2D1B0F] hover:bg-[#EFE7DA]'
                          }`}
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${thread.is_upvoted ? 'text-[#2D1B0F] fill-[#2D1B0F]' : 'text-[#A35C33]'}`} />
                          <span>{thread.upvotes} Upvotes</span>
                        </button>
                      </div>
                    </div>

                    {/* Nested Replies Section */}
                    {isRepliesOpen && (
                      <div className="pt-4 border-t border-[#D8C8B0]/60 space-y-4 animate-fade-in">
                        {/* Replies Feed */}
                        {threadReplies.length > 0 ? (
                          <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-[#D8C8B0]">
                            {threadReplies.map((rep, idx) => {
                              const repAuthorDisplayName = getAuthorDisplayName(rep);
                              const repAuthorUsername = rep.author_username || rep.author;
                              const repAuthorId = rep.author_id;
                              const canDeleteThisReply = canModerate || (user && (user.username === repAuthorUsername || user.username === rep.author || user.id === repAuthorId || user.id === rep.author_id));
                              const repProfileTarget = getAuthorProfileTarget(rep);
                              return (
                                <div key={rep.id || idx} className="p-3.5 rounded-2xl bg-[#F8F4EC] border border-[#D8C8B0]/70 space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <AuthorBadge
                                        item={rep}
                                        displayName={repAuthorDisplayName}
                                        profileTarget={repProfileTarget}
                                        avatarUrl={rep.avatar || rep.author_avatar}
                                        size="sm"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-[#2D1B0F]/50 font-medium">{rep.time_ago || 'Recently'}</span>
                                      {canDeleteThisReply && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteReply(rep.id, thread.id)}
                                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                          title="Delete reply"
                                          aria-label="Delete reply"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Telegram-style Quote Bubble if this reply was to another comment */}
                                  {rep.replying_to && (
                                    <div className="ml-8 border-l-2 border-[#A35C33] bg-[#EFE7DA]/70 px-3 py-1.5 rounded-r-xl text-xs space-y-0.5">
                                      <NavLink
                                        to={getAuthorProfileTarget(rep.replying_to)}
                                        className="font-semibold text-[#8B4C28] hover:underline text-[11px] flex items-center gap-1"
                                      >
                                        <Reply className="w-3 h-3 rotate-180" />
                                        <span>@{getAuthorDisplayName(rep.replying_to)}</span>
                                      </NavLink>
                                      <p className="text-[#2D1B0F]/75 text-[11px] truncate italic">
                                        "{rep.replying_to.excerpt}"
                                      </p>
                                    </div>
                                  )}

                                  <p className="text-xs text-[#2D1B0F]/85 leading-relaxed whitespace-pre-line pl-8">
                                    {rep.content}
                                  </p>

                                  {/* Actions Row: Reply directly & Report */}
                                  <div className="flex items-center gap-3.5 pl-8 pt-1 text-xs text-[#2D1B0F]/60">
                                    <button
                                      type="button"
                                      onClick={() => setReplyingTo({ id: rep.id, author: repAuthorDisplayName, text: rep.content, threadId: thread.id })}
                                      className="hover:text-[#A35C33] font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                                      title={`Reply to ${repAuthorDisplayName}`}
                                    >
                                      <Reply className="w-3 h-3" />
                                      <span>Reply</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setReportModalData({
                                        targetType: 'reply',
                                        targetId: rep.id,
                                        targetTitle: rep.content,
                                        targetAuthor: rep.author
                                      })}
                                      className="hover:text-rose-600 font-medium text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                                      title="Report this reply"
                                      aria-label="Report reply"
                                    >
                                      <Flag className="w-3 h-3" />
                                      <span>Report</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl bg-[#F8F4EC] text-center text-xs text-[#2D1B0F]/60 border border-dashed border-[#D8C8B0]">
                            No replies on this topic yet. Be the first to share your thoughts!
                          </div>
                        )}

                        {/* Reply Composer */}
                        {user ? (
                          <form onSubmit={(e) => handleSubmitReply(e, thread.id)} className="space-y-2 pt-1">
                            {replyFeedback[thread.id] && (
                              <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                                replyFeedback[thread.id].type === 'success'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border border-rose-200'
                              }`}>
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span>{replyFeedback[thread.id].text}</span>
                              </div>
                            )}

                            {/* Telegram-style Quoted Reply Preview */}
                            {replyingTo && replyingTo.threadId === thread.id && (
                              <div className="flex items-center justify-between bg-[#EFE7DA] border-l-4 border-[#A35C33] px-3.5 py-1.5 rounded-r-xl text-xs shadow-2xs animate-fade-in">
                                <div className="truncate pr-2">
                                  <span className="font-bold text-[#2D1B0F]">Replying to @{replyingTo.author}: </span>
                                  <span className="text-[#2D1B0F]/70 italic">"{replyingTo.text.length > 55 ? replyingTo.text.slice(0, 55) + '...' : replyingTo.text}"</span>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => setReplyingTo(null)} 
                                  className="text-[#2D1B0F]/50 hover:text-[#2D1B0F] p-1 rounded-md hover:bg-[#D8C8B0]/40 transition-colors cursor-pointer"
                                  title="Cancel quote"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}

                            <div className="flex gap-2 items-start">
                              <CornerDownRight className="w-4 h-4 text-[#A35C33] mt-2.5 shrink-0" />
                              <div className="flex-1 space-y-2">
                                <textarea
                                  rows={2}
                                  required
                                  value={replyInputs[thread.id] || ''}
                                  onChange={(e) => setReplyInputs(prev => ({ ...prev, [thread.id]: e.target.value }))}
                                  placeholder="Write a constructive reply to this discussion (+5 XP)..."
                                  className="w-full px-3.5 py-2 bg-[#F8F4EC] border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#A35C33] focus:outline-none leading-relaxed"
                                />
                                <div className="flex justify-end">
                                  <button
                                    type="submit"
                                    disabled={submittingReplyIds[thread.id] || !replyInputs[thread.id]?.trim()}
                                    className="px-4 py-2 rounded-xl bg-[#A35C33] hover:bg-[#8B4C28] text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                  >
                                    {submittingReplyIds[thread.id] ? (
                                      <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Posting...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Send className="w-3.5 h-3.5" />
                                        <span>Post Reply (+5 XP)</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </form>
                        ) : (
                          <div className="p-3.5 rounded-2xl bg-[#EFE7DA] border border-[#D8C8B0] flex items-center justify-between text-xs">
                            <span className="text-[#2D1B0F]/80 font-medium">
                              Log in to join chapter discussions and earn member XP.
                            </span>
                            <NavLink
                              to="/login"
                              className="px-3.5 py-1.5 bg-[#A35C33] text-white font-bold rounded-lg hover:bg-[#8B4C28] flex items-center gap-1.5"
                            >
                              <LogIn className="w-3.5 h-3.5" />
                              <span>Log In</span>
                            </NavLink>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Interactive Community Book Voting Poll */}
      {activeTab === 'poll' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-[#D8C8B0] shadow-sm space-y-6">
          <div className="space-y-3 border-b border-[#D8C8B0]/60 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#C48B47] text-[#2D1B0F] px-3 py-1 rounded-full shadow-xs">
                  Bi-Monthly Community Poll
                </span>
                {pollState.closesAt && (
                  <span className="text-xs font-semibold text-[#2D1B0F]/70 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#A35C33]" />
                    Closes: {pollState.closesAt}
                  </span>
                )}
              </div>

              {/* Executive Poll Creation Trigger */}
              {isExecutive && (
                <button
                  type="button"
                  onClick={() => setIsCreatePollOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#2D1B0F] text-[#F8F4EC] border border-[#C48B47] font-bold text-xs hover:bg-[#1A0E06] transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5 text-[#C48B47]" />
                  <span>Create New Voting Poll</span>
                </button>
              )}
            </div>

            <h3 className="font-serif font-bold text-2xl sm:text-3xl text-[#2D1B0F]">
              {pollState.title}
            </h3>
            <p className="text-xs sm:text-sm text-[#2D1B0F]/80">
              {pollState.description}
            </p>
          </div>

          {/* Feedback message */}
          {pollFeedback && (
            <div className={`p-4 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-fade-in ${
              pollFeedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}>
              {pollFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{pollFeedback.message}</span>
            </div>
          )}

          {/* Candidate Options or Empty State */}
          {isLoadingPoll ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div key={n} className="p-5 rounded-2xl border border-[#D8C8B0] animate-pulse space-y-2">
                  <div className="h-4 bg-[#D8C8B0]/60 rounded w-1/4" />
                  <div className="h-5 bg-[#D8C8B0]/40 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : pollState.options.length > 0 ? (
            <div className="space-y-4">
              {pollState.options.map((option) => {
                const isMyVote = pollState.hasVoted && pollState.voted_option_id === option.id;
                return (
                  <div 
                    key={option.id}
                    className={`p-5 sm:p-6 rounded-2xl border-2 transition-all duration-300 space-y-3 ${
                      isMyVote
                        ? 'bg-amber-50/70 border-[#C48B47] shadow-sm ring-1 ring-[#C48B47]'
                        : pollState.hasVoted
                          ? 'bg-[#F8F4EC] border-[#D8C8B0]'
                          : 'bg-white border-[#D8C8B0] hover:border-[#A35C33]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase text-[#A35C33] bg-[#EFE7DA] px-2.5 py-0.5 rounded">
                            {option.genre}
                          </span>
                          {isMyVote && (
                            <span className="text-[10px] font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-amber-900" />
                              Your Selected Choice
                            </span>
                          )}
                        </div>
                        <h4 className="font-serif font-bold text-lg sm:text-xl text-[#2D1B0F]">
                          {option.title}
                        </h4>
                        <p className="text-xs text-[#2D1B0F]/70 font-medium">
                          by <strong className="text-[#2D1B0F]">{option.author}</strong>
                        </p>
                        {option.pitch && (
                          <p className="text-xs text-[#2D1B0F]/80 italic pt-1">
                            "{option.pitch}"
                          </p>
                        )}
                      </div>

                      {!pollState.hasVoted ? (
                        <button
                          onClick={() => handleVote(option.id)}
                          disabled={isVoting}
                          className="px-5 py-2.5 rounded-xl bg-[#A35C33] text-white font-bold text-xs hover:bg-[#8B4C28] transition-all duration-200 shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                        >
                          <Vote className="w-3.5 h-3.5 text-white" />
                          <span>Cast Vote</span>
                        </button>
                      ) : (
                        <div className="text-right shrink-0">
                          <span className="font-serif font-bold text-xl sm:text-2xl text-[#A35C33] block">
                            {option.percentage}%
                          </span>
                          <span className="text-[11px] text-[#2D1B0F]/60 font-semibold">
                            {option.votes} votes
                          </span>
                        </div>
                      )}
                    </div>

                    {pollState.hasVoted && (
                      <div className="w-full bg-[#D8C8B0]/40 h-3 rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isMyVote ? 'bg-[#C48B47]' : 'bg-[#A35C33]'
                          }`}
                          style={{ width: `${Math.max(4, option.percentage)}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#F8F4EC] p-10 rounded-2xl border-2 border-dashed border-[#D8C8B0] text-center space-y-3">
              <BarChart2 className="w-8 h-8 text-[#A35C33]/60 mx-auto" />
              <h4 className="font-serif font-bold text-base text-[#2D1B0F]">No active book selection poll at this time.</h4>
              <p className="text-xs text-[#2D1B0F]/70 max-w-md mx-auto">
                Polls open towards the conclusion of each 3-week reading cycle. Check back soon or propose a book below!
              </p>
              {isExecutive && (
                <button
                  onClick={() => setIsCreatePollOpen(true)}
                  className="px-4 py-2 bg-[#A35C33] text-white font-bold text-xs rounded-xl hover:bg-[#8B4C28] shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Launch New Poll</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Propose Book Suggestion Form & Live Member Proposals Feed */}
      {activeTab === 'proposals' && (
        <div className="space-y-8">
          {/* Global Proposal Feedback Alert */}
          {proposalFeedback && (
            <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold animate-fade-in ${
              proposalFeedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center gap-2">
                {proposalFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{proposalFeedback.text}</span>
              </div>
              <button onClick={() => setProposalFeedback(null)} className="text-[#2D1B0F]/50 hover:text-[#2D1B0F] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Submission Form Container */}
          <div ref={proposalFormRef} className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-[#D8C8B0] shadow-sm space-y-6">
            <div className="space-y-1 border-b border-[#D8C8B0]/60 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#EFE7DA] flex items-center justify-center text-[#A35C33] font-bold">
                  <BookMarked className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-2xl text-[#2D1B0F]">
                  Propose a Book for Next Cycle
                </h3>
              </div>
              <p className="text-xs text-[#2D1B0F]/70 pt-1">
                Submit your recommendation (Title, Author, Genre, Pitch). Approved submissions feed directly into the bi-monthly community poll.
              </p>
            </div>

            {suggestionSubmitted && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Your proposal has been submitted to club executives for poll curation! (+10 XP)</span>
                </div>
                <button 
                  onClick={() => setSuggestionSubmitted(false)}
                  className="text-emerald-700 underline text-xs font-bold cursor-pointer"
                >
                  Submit another
                </button>
              </div>
            )}

            <form onSubmit={handleSuggestionSubmit} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-[#2D1B0F] mb-1">Book Title *</label>
                <input
                  type="text"
                  required
                  value={suggestion.title}
                  onChange={e => setSuggestion({...suggestion, title: e.target.value})}
                  placeholder="e.g. Fikir Eske Mekabir"
                  className="w-full px-4 py-3 bg-[#F8F4EC] border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#A35C33] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D1B0F] mb-1">Author Name *</label>
                <input
                  type="text"
                  required
                  value={suggestion.author}
                  onChange={e => setSuggestion({...suggestion, author: e.target.value})}
                  placeholder="e.g. Haddis Alemayehu"
                  className="w-full px-4 py-3 bg-[#F8F4EC] border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#A35C33] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D1B0F] mb-1">Genre Category</label>
                <select
                  value={suggestion.genre}
                  onChange={e => setSuggestion({...suggestion, genre: e.target.value})}
                  className="w-full px-4 py-3 bg-[#F8F4EC] border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#A35C33] focus:outline-none cursor-pointer"
                >
                  <option value="Ethiopian Literature">Ethiopian Literature</option>
                  <option value="Philosophy & Ethics">Philosophy &amp; Ethics</option>
                  <option value="World Classics">World Classics</option>
                  <option value="African Literature">African Literature</option>
                  <option value="Fiction & Satire">Fiction &amp; Satire</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D1B0F] mb-1">Pitch / Why should we read this? *</label>
                <textarea
                  rows={4}
                  required
                  value={suggestion.pitch}
                  onChange={e => setSuggestion({...suggestion, pitch: e.target.value})}
                  placeholder="Explain the themes, questions, and why this book will generate rich Tuesday discussions..."
                  className="w-full px-4 py-3 bg-[#F8F4EC] border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#A35C33] focus:outline-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingSuggestion}
                className="px-6 py-3.5 rounded-xl bg-[#A35C33] hover:bg-[#8B4C28] text-white font-bold text-xs transition-all duration-200 shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmittingSuggestion ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting Pitch...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-white" />
                    <span>Submit Pitch to Club Executives</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Member Book Proposals Feed */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-2xl text-[#2D1B0F]">
                  Community Book Proposals
                </h3>
                <p className="text-xs text-[#2D1B0F]/70">
                  Member nominations for upcoming reading cycles. Upvote recommendations you want to read!
                </p>
              </div>
              <span className="text-xs font-bold bg-[#EFE7DA] text-[#A35C33] px-3 py-1 rounded-full border border-[#D8C8B0]">
                {proposals.length} Proposals
              </span>
            </div>

            {isLoadingProposals ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((n) => (
                  <div key={n} className="bg-white p-6 rounded-3xl border border-[#D8C8B0] animate-pulse space-y-3">
                    <div className="h-4 bg-[#D8C8B0]/60 rounded w-1/3" />
                    <div className="h-5 bg-[#D8C8B0]/40 rounded w-2/3" />
                    <div className="h-12 bg-[#D8C8B0]/30 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : proposals.length === 0 ? (
              <div className="bg-[#F8F4EC] p-10 rounded-3xl border-2 border-dashed border-[#D8C8B0] text-center space-y-2">
                <BookMarked className="w-8 h-8 text-[#A35C33]/60 mx-auto" />
                <h4 className="font-serif font-bold text-base text-[#2D1B0F]">No member proposals submitted yet.</h4>
                <p className="text-xs text-[#2D1B0F]/70">
                  Be the first to pitch a book recommendation using the form above!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {proposals.map((proposal) => {
                  const canDeleteThisProposal = canModerate || (user && (user.username === proposal.proposerUsername || user.username === proposal.proposer || user.id === proposal.proposerId));

                  return (
                    <div
                      key={proposal.id}
                      className="bg-white p-6 rounded-3xl border-2 border-[#D8C8B0] shadow-xs space-y-4 flex flex-col justify-between hover:border-[#A35C33] transition-all duration-200"
                    >
                      <div className="space-y-3">
                        {/* Proposal Card Top Meta */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <AuthorBadge
                              item={proposal.rawItem || proposal}
                              displayName={proposal.proposer}
                              profileTarget={proposal.profileTarget}
                              avatarUrl={proposal.avatar}
                              subtitle={proposal.time_ago}
                              size="md"
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A35C33] bg-[#EFE7DA] px-2.5 py-0.5 rounded-full border border-[#D8C8B0]">
                              {proposal.genre}
                            </span>
                            {canDeleteThisProposal && (
                              <button
                                type="button"
                                onClick={() => handleDeleteProposal(proposal.id, proposal.title)}
                                className="p-1.5 text-[#2D1B0F]/40 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                title="Delete proposal"
                                aria-label="Delete proposal"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Title & Author */}
                        <div>
                          <h4 className="font-serif font-bold text-lg text-[#2D1B0F] leading-snug">
                            {proposal.title}
                          </h4>
                          <p className="text-xs text-[#2D1B0F]/70 font-medium">
                            by <strong className="text-[#2D1B0F]">{proposal.author}</strong>
                          </p>
                        </div>

                        {/* Pitch Excerpt */}
                        <p className="text-xs sm:text-sm text-[#2D1B0F]/85 italic bg-[#F8F4EC] p-3.5 rounded-2xl border border-[#D8C8B0]/70 whitespace-pre-line leading-relaxed">
                          "{proposal.pitch}"
                        </p>
                      </div>

                      {/* Actions Footer */}
                      <div className="pt-3 border-t border-[#D8C8B0]/60 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-[#2D1B0F]/60 font-medium">
                          Suggested Book
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setReportModalData({
                              targetType: 'proposal',
                              targetId: proposal.id,
                              targetTitle: proposal.title,
                              targetAuthor: proposal.author
                            })}
                            className="p-1.5 rounded-xl border border-[#D8C8B0] text-[#8C6D53] hover:text-rose-700 hover:border-rose-300 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Report this proposal"
                            aria-label="Report proposal"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleProposalLike(proposal.id)}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all duration-200 cursor-pointer ${
                              proposal.has_liked
                                ? 'bg-[#C48B47] text-[#2D1B0F] shadow-xs'
                                : 'bg-[#F8F4EC] border border-[#D8C8B0] text-[#2D1B0F] hover:bg-[#EFE7DA]'
                            }`}
                            title="Endorse proposal (+1 XP)"
                          >
                            <ThumbsUp className={`w-3.5 h-3.5 ${proposal.has_liked ? 'text-[#2D1B0F] fill-[#2D1B0F]' : 'text-[#A35C33]'}`} />
                            <span>{proposal.likes} Endorsements</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Start New Discussion Thread Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1E110A]/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#F8F4EC] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border-2 border-[#D8C8B0] space-y-5 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D8C8B0] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#A35C33] flex items-center justify-center text-white">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl text-[#2D1B0F]">Start a New Discussion</h3>
                  <p className="text-[11px] text-[#2D1B0F]/70">Share an inquiry, chapter analysis, or reading reflection (+10 XP)</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[#2D1B0F]/50 hover:text-[#2D1B0F] hover:bg-[#EFE7DA] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewThread} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                  Topic Title *
                </label>
                <input
                  type="text"
                  required
                  value={newThread.title}
                  onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                  placeholder="e.g. Chapter 4 Reflection: The Ethical Dilemma of Silence"
                  className="w-full px-4 py-2.5 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#A35C33] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                  Chapter / Category Tag
                </label>
                <select
                  value={newThread.chapter_tag}
                  onChange={(e) => setNewThread({ ...newThread, chapter_tag: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#A35C33] focus:outline-none cursor-pointer"
                >
                  {CHAPTER_TAG_PRESETS.map((tag) => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                  Discussion Content *
                </label>
                <textarea
                  rows={4}
                  required
                  value={newThread.content}
                  onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
                  placeholder="Elaborate on your question, quote, or argument..."
                  className="w-full px-4 py-2.5 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#A35C33] focus:outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D1B0F] mb-1 flex items-center justify-between">
                  <span>Spoiler Content (Optional)</span>
                  <span className="text-[10px] text-[#2D1B0F]/50 font-normal">Hidden behind blur tag</span>
                </label>
                <textarea
                  rows={2}
                  value={newThread.spoiler_text}
                  onChange={(e) => setNewThread({ ...newThread, spoiler_text: e.target.value })}
                  placeholder="Add any major plot revelations or upcoming twists here..."
                  className="w-full px-4 py-2 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#A35C33] focus:outline-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#D8C8B0] text-[#2D1B0F] font-bold text-xs hover:bg-[#EFE7DA] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingThread}
                  className="px-6 py-2.5 rounded-xl bg-[#A35C33] hover:bg-[#8B4C28] text-white font-bold text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingThread ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-white" />
                      <span>Post Discussion</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Executive Create Book Poll Modal */}
      {isCreatePollOpen && (
        <div className="fixed inset-0 z-50 bg-[#1E110A]/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#F8F4EC] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border-2 border-[#D8C8B0] space-y-5 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D8C8B0] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#2D1B0F] flex items-center justify-center text-[#C48B47]">
                  <BarChart2 className="w-4 h-4 text-[#C48B47]" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl text-[#2D1B0F]">Launch Community Book Poll</h3>
                  <p className="text-[11px] text-[#2D1B0F]/70">Curate candidate books for the next 3-week reading cycle</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreatePollOpen(false)}
                className="p-1.5 rounded-lg text-[#2D1B0F]/50 hover:text-[#2D1B0F] hover:bg-[#EFE7DA] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePollSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2D1B0F] mb-1">Poll Title *</label>
                <input
                  type="text"
                  required
                  value={newPollForm.title}
                  onChange={e => setNewPollForm({ ...newPollForm, title: e.target.value })}
                  placeholder="e.g. Vote for Next 3-Week Cycle Book"
                  className="w-full px-4 py-2.5 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#A35C33] focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">Description / Instructions</label>
                  <input
                    type="text"
                    value={newPollForm.description}
                    onChange={e => setNewPollForm({ ...newPollForm, description: e.target.value })}
                    placeholder="e.g. Vote for the book you'd like to read next..."
                    className="w-full px-4 py-2.5 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#A35C33] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">Closes At (Optional)</label>
                  <input
                    type="date"
                    value={newPollForm.closes_at}
                    onChange={e => setNewPollForm({ ...newPollForm, closes_at: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#A35C33] focus:outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Candidate Books Options */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#2D1B0F] flex items-center gap-1.5">
                    <BookMarked className="w-3.5 h-3.5 text-[#A35C33]" />
                    <span>Candidate Book Choices (Minimum 2)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPollOption}
                    className="text-xs text-[#A35C33] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Book Option</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {newPollForm.options.map((opt, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-white border border-[#D8C8B0] space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-[#A35C33]">
                        <span>Option #{idx + 1}</span>
                        {newPollForm.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePollOption(idx)}
                            className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="sm:col-span-1">
                          <label className="block text-[11px] font-semibold text-[#2D1B0F]/70 mb-0.5">Title *</label>
                          <input
                            type="text"
                            required
                            value={opt.book_title}
                            onChange={e => handlePollOptionChange(idx, 'book_title', e.target.value)}
                            placeholder="e.g. Oromay"
                            className="w-full px-3 py-2 bg-[#F8F4EC] border border-[#D8C8B0] rounded-lg text-xs text-[#2D1B0F] focus:outline-none focus:ring-1 focus:ring-[#A35C33]"
                          />
                        </div>

                        <div className="sm:col-span-1">
                          <label className="block text-[11px] font-semibold text-[#2D1B0F]/70 mb-0.5">Author *</label>
                          <input
                            type="text"
                            required
                            value={opt.author}
                            onChange={e => handlePollOptionChange(idx, 'author', e.target.value)}
                            placeholder="e.g. Baalu Girma"
                            className="w-full px-3 py-2 bg-[#F8F4EC] border border-[#D8C8B0] rounded-lg text-xs text-[#2D1B0F] focus:outline-none focus:ring-1 focus:ring-[#A35C33]"
                          />
                        </div>

                        <div className="sm:col-span-1">
                          <label className="block text-[11px] font-semibold text-[#2D1B0F]/70 mb-0.5">Genre</label>
                          <select
                            value={opt.genre}
                            onChange={e => handlePollOptionChange(idx, 'genre', e.target.value)}
                            className="w-full px-3 py-2 bg-[#F8F4EC] border border-[#D8C8B0] rounded-lg text-xs text-[#2D1B0F] focus:outline-none focus:ring-1 focus:ring-[#A35C33] cursor-pointer"
                          >
                            <option value="Ethiopian Literature">Ethiopian Literature</option>
                            <option value="Philosophy & Ethics">Philosophy &amp; Ethics</option>
                            <option value="World Classics">World Classics</option>
                            <option value="African Literature">African Literature</option>
                            <option value="Fiction & Satire">Fiction &amp; Satire</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#2D1B0F]/70 mb-0.5">Pitch / Hook (Optional)</label>
                        <input
                          type="text"
                          value={opt.pitch}
                          onChange={e => handlePollOptionChange(idx, 'pitch', e.target.value)}
                          placeholder="Why this candidate makes a compelling read..."
                          className="w-full px-3 py-1.5 bg-[#F8F4EC] border border-[#D8C8B0] rounded-lg text-xs text-[#2D1B0F] focus:outline-none focus:ring-1 focus:ring-[#A35C33]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#D8C8B0]">
                <button
                  type="button"
                  onClick={() => setIsCreatePollOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#D8C8B0] text-[#2D1B0F] font-bold text-xs hover:bg-[#EFE7DA] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPoll}
                  className="px-6 py-2.5 rounded-xl bg-[#2D1B0F] hover:bg-[#1A0E06] text-[#FFF8EE] border border-[#C48B47] font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingPoll ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C48B47]" />
                      <span>Publishing Poll...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-[#C48B47]" />
                      <span>Publish Community Poll</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Content Modal */}
      <ReportModal
        isOpen={Boolean(reportModalData)}
        onClose={() => setReportModalData(null)}
        targetType={reportModalData?.targetType || 'thread'}
        targetId={reportModalData?.targetId}
        targetTitle={reportModalData?.targetTitle}
        targetAuthor={reportModalData?.targetAuthor}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        title={
          deleteModalState.itemType === 'thread'
            ? 'Delete Discussion Topic'
            : deleteModalState.itemType === 'reply'
            ? 'Delete Reply'
            : 'Delete Book Proposal'
        }
        message={
          deleteModalState.itemType === 'thread'
            ? `Are you sure you want to delete "${deleteModalState.title}"? All replies in this discussion will also be permanently removed.`
            : deleteModalState.itemType === 'reply'
            ? 'Are you sure you want to delete this reply? This action cannot be undone.'
            : `Are you sure you want to delete proposal "${deleteModalState.title}"? Member votes and endorsements will be removed.`
        }
        isDeleting={isDeletingItem}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalState({ isOpen: false, itemType: null, id: null, title: '', threadId: null })}
      />
    </div>
  );
}

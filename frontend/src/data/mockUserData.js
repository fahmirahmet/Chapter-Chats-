// User Profile, Gamification Badges, Passcode & Discussion Poll mock dataset

export const mockUserData = {
  profile: {
    username: 'Amina Bekele',
    email: 'amina.bekele@university.edu',
    role: 'MEMBER', // 'MEMBER' | 'ADMIN'
    currentStreak: 4,
    totalXp: 450,
    currentPageRead: 185,
    totalPagesBook: 340,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    joinedDate: 'March 2026',
  },

  passcodeState: {
    activePasscode: '8419',
    windowStart: '12:30 PM',
    windowEnd: '3:30 PM',
    isWindowActive: true,
    meetingVenue: 'Student Center Library Hall B',
  },

  badges: [
    {
      id: 'badge-01',
      name: 'Consistent Scholar',
      tier: 'Gold Tier',
      tierColor: 'bg-amber-100 text-amber-900 border-amber-300',
      iconName: 'Award',
      criteria: 'Maintained an in-person attendance streak of 4 consecutive Tuesday meetings.',
      isUnlocked: true,
      unlockedAt: 'Aug 19, 2026',
    },
    {
      id: 'badge-02',
      name: 'Micro-Author',
      tier: 'Silver Tier',
      tierColor: 'bg-slate-100 text-slate-900 border-slate-300',
      iconName: 'PenTool',
      criteria: 'Authored the highest-voted Saturday Finish the Story challenge entry of the week.',
      isUnlocked: true,
      unlockedAt: 'Aug 22, 2026',
    },
    {
      id: 'badge-03',
      name: 'Quizmaster',
      tier: 'Bronze Tier',
      tierColor: 'bg-orange-100 text-orange-900 border-orange-300',
      iconName: 'HelpCircle',
      criteria: 'Achieved a perfect score on a Thursday Pre-Meetup Quiz within the time limit.',
      isUnlocked: true,
      unlockedAt: 'Aug 16, 2026',
    },
    {
      id: 'badge-04',
      name: 'Page Finisher',
      tier: 'Silver Tier',
      tierColor: 'bg-slate-100 text-slate-900 border-slate-300',
      iconName: 'BookCheck',
      criteria: 'Logged 100% reading completion on the active book prior to Tuesday review.',
      isUnlocked: false,
      unlockedAt: 'Locked (In Progress)',
    }
  ],

  communityPoll: {
    id: 'poll-cycle-05',
    title: 'Select Our Next 3-Week Cycle Book',
    description: 'Vote for the book you would like our club to read starting next month.',
    closesAt: 'Thursday at 23:59',
    totalVotes: 87,
    hasVoted: false,
    options: [
      {
        id: 'opt-1',
        title: 'Fiqir Eske Meqabir',
        author: 'Haddis Alemayehu',
        genre: 'Ethiopian Literature',
        votes: 42,
        percentage: 48,
      },
      {
        id: 'opt-2',
        title: 'Man\'s Search for Meaning',
        author: 'Viktor E. Frankl',
        genre: 'Philosophy & Psychology',
        votes: 28,
        percentage: 32,
      },
      {
        id: 'opt-3',
        title: 'Things Fall Apart',
        author: 'Chinua Achebe',
        genre: 'African Literature',
        votes: 17,
        percentage: 20,
      }
    ]
  },

  discussionThreads: [
    {
      id: 'thread-1',
      title: 'Chapter 5 Paradox: Moral Duty vs. Personal Ambition',
      author: 'Dr. Marcus Vance',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      replies: 16,
      upvotes: 24,
      timeAgo: '1 hour ago',
      spoilerText: 'The protagonist chooses to stay silent during the faculty investigation to protect his protégé.',
      content: 'In Chapter 5, Vance presents an ethical crossroad. Does loyalty to an institution supersede individual moral integrity?',
    },
    {
      id: 'thread-2',
      title: 'Week 2 Reading Target: Pages 113 to 224 Discussion',
      author: 'Amina Bekele',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      replies: 28,
      upvotes: 35,
      timeAgo: '3 hours ago',
      spoilerText: 'The second ledger reveals that the founder\'s manuscript was co-authored anonymously.',
      content: 'Share your favorite quotes from pages 113 to 224! Please use markdown spoiler tags for content beyond page 200.',
    },
    {
      id: 'thread-3',
      title: 'Preparation for Tuesday Meetup in Library Hall B',
      author: 'Tewodros Kassahun',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      replies: 11,
      upvotes: 18,
      timeAgo: '5 hours ago',
      spoilerText: 'Printed discussion sheets will be handed out at 12:30 PM sharp.',
      content: 'Remember that dynamic passcodes are active between 12:30 and 15:30. Let us compile our group questions here.',
    }
  ]
};

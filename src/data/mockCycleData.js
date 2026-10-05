// Mock data for 3-Week Reading Cycle Engine and Home Page Snapshots

// Helper to compute the upcoming Tuesday at 12:30 PM dynamically
export function getUpcomingTuesdayMeeting() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sun, 2 is Tue
  let daysUntilTuesday = (2 - dayOfWeek + 7) % 7;
  
  // If it's Tuesday after 15:30, jump to next Tuesday
  if (daysUntilTuesday === 0) {
    const meetingEndTime = new Date(now);
    meetingEndTime.setHours(15, 30, 0, 0);
    if (now > meetingEndTime) {
      daysUntilTuesday = 7;
    }
  }

  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + daysUntilTuesday);
  targetDate.setHours(12, 30, 0, 0);
  return targetDate;
}

export const mockCycleData = {
  activeCycle: {
    id: 'cycle-04',
    cycleNumber: 4,
    book: {
      title: 'The Crucible of Reflection',
      author: 'Dr. A. K. Vance',
      genre: 'Philosophy & Ethics',
      totalPages: 340,
      coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      synopsis: 'An engaging exploration into moral philosophy, identity, and the power of shared narrative inquiry in contemporary society.',
    },
    startDate: '2026-08-11',
    targetTuesdayMeeting: getUpcomingTuesdayMeeting().toISOString(),
    currentWeek: 2,
    milestones: {
      week1: { label: 'Week 1 Milestone', pages: '1 to 112 (33%)', percentage: 33, status: 'Completed' },
      week2: { label: 'Week 2 Target', pages: '113 to 224 (66%)', percentage: 66, status: 'Active Target' },
      week3: { label: 'Week 3 Final Sprint', pages: '225 to 340 (100%)', percentage: 100, status: 'Upcoming' },
    },
    userReadingProgressPages: 185, // Current logged reading page
  },

  winningStoryOfWeek: {
    id: 'story-99',
    prompt: 'An unread letter hidden inside an ancient book cover.',
    text: 'Dusty covers opened lost world memory.',
    author: 'Amina Bekele (Member #204)',
    upvotes: 42,
    badgeText: 'Micro-Author Award Winner',
    publishedDate: 'Saturday, Aug 22',
  },

  thursdayQuizStatus: {
    isOpen: true,
    title: 'Pre-Meetup Thursday Quiz #4',
    questionsCount: 5,
    timeLimitMinutes: 3,
    xpReward: 50,
    activeUntil: 'Thursday 23:59',
  },
  sundayQuizStatus: {
    isOpen: true,
    title: 'Pre-Meetup Thursday Quiz #4',
    questionsCount: 5,
    timeLimitMinutes: 3,
    xpReward: 50,
    activeUntil: 'Thursday 23:59',
  },

  announcements: [
    {
      id: 'ann-1',
      title: 'Tuesday Meetup Venue Confirmed: Library Hall B',
      category: '#Meetup',
      tagColor: 'bg-brand-accent/20 text-brand-dark border-brand-accent/40',
      timestamp: '2 hours ago',
      content: 'Our upcoming physical meetup will take place in Hall B. Refreshments and printed discussion guide sheets will be provided.',
    },
    {
      id: 'ann-2',
      title: 'Passcode Verification Window (12:30 - 15:30)',
      category: '#VenueUpdate',
      tagColor: 'bg-brand-secondary/20 text-brand-dark border-brand-secondary/40',
      timestamp: '1 day ago',
      content: 'Reminder: 4-digit check-in passcodes are generated live by admins during meeting hours to update your streak counter.',
    },
    {
      id: 'ann-3',
      title: 'Book Suggestion Poll Opens Next Thursday',
      category: '#General',
      tagColor: 'bg-brand-cream/60 text-brand-dark border-brand-cream',
      timestamp: '3 days ago',
      content: 'Members can pitch their favorite books on the Discussions tab. Approved pitches will enter the bi-monthly poll.',
    },
  ],

  topRecommendations: [
    {
      id: 'rec-1',
      title: 'Fiqir Eske Meqabir',
      author: 'Haddis Alemayehu',
      genre: 'Ethiopian Literature',
      rating: 5.0,
      pitchedBy: 'Tewodros M.',
      pitchSnippet: 'A monumental masterpiece of Ethiopian prose and timeless romance.',
    },
    {
      id: 'rec-2',
      title: 'Justice: What\'s the Right Thing to Do?',
      author: 'Michael J. Sandel',
      genre: 'Ethics & Politics',
      rating: 4.9,
      pitchedBy: 'Bethlehem K.',
      pitchSnippet: 'Challenging thought experiments that spark debate for our Tuesday sessions.',
    },
    {
      id: 'rec-3',
      title: 'The Shadow of the Wind',
      author: 'Carlos Ruiz Zafón',
      genre: 'World Fiction',
      rating: 4.8,
      pitchedBy: 'Marcus Vance',
      pitchSnippet: 'A haunting tale of secret libraries and forgotten authors.',
    },
  ],

  recentDiscussions: [
    {
      id: 'disc-1',
      title: 'Chapter 5 Moral Dilemma: Is total transparency always ethical?',
      author: 'Sora_R',
      replies: 18,
      timeAgo: '45 mins ago',
      snippet: 'I loved how Vance framed the paradox in chapter 5. Looking forward to discussing this in Hall B!',
    },
    {
      id: 'disc-2',
      title: 'Week 2 Reading Pace Check-In',
      author: 'Club Executive',
      replies: 29,
      timeAgo: '3 hours ago',
      snippet: 'Who else has hit page 180? Make sure to use markdown spoiler tags for chapters 7 and beyond!',
    },
  ]
};

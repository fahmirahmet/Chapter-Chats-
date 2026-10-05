// Mock dataset for Saturday Six-Word Story & Sunday Pre-Meetup Quiz

export const mockWeekendData = {
  activePrompt: {
    id: 'prompt-week-04',
    weekNumber: 4,
    title: 'The Unsent Manuscript',
    prompt_type: 'ORIGINAL_HOOK',
    story_opening: "The rain in Addis had turned the courtyard into a shallow lake by the time Henok pried open the rusted lock on his grandfather's cedar trunk. Nestled between yellowed tax ledgers was a hand-bound notebook wrapped in dried ensete fiber, its first page dated November 1974.\n\nAs he turned to the final chapter, three loose photographs slipped to the floor, each showing the same young woman standing outside the old National Theatre. Written in faded violet ink across the margin was a single sentence: 'If you are reading this, find her before Tuesday.'",
    closesAt: 'Tuesday at 12:30 PM',
    totalEntries: 28,
  },

  communitySubmissions: [
    {
      id: 'sub-01',
      author: 'Amina Bekele',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      content: "Henok clutched the rain-soaked photographs against his woolen coat as he sprinted through the cobblestone alleys of Piazza. Inside the stage door, an elderly archivist paused at the sight of the violet ink inscription, her eyes widening in disbelief. 'She never missed a Tuesday rehearsal,' the archivist whispered, unlocking the private gallery upstairs where the woman from the photograph was waiting.",
      wordCount: 65,
      upvotes: 42,
      isUpvotedByMe: false,
      createdAt: '2 hours ago',
      isWinner: true,
    },
    {
      id: 'sub-02',
      author: 'Tewodros Kassahun',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      content: "The ticking of the grandfather clock in the National Theatre lobby seemed to echo the race against the impending Tuesday deadline. Henok found her seated in row G, quietly reciting verses from an unpublished manuscript. When she looked up and saw the ensete fiber wrapping, tears filled her eyes. Together, they finally turned the missing final pages.",
      wordCount: 58,
      upvotes: 31,
      isUpvotedByMe: true,
      createdAt: '4 hours ago',
      isWinner: false,
    },
    {
      id: 'sub-03',
      author: 'Bethlehem Haile',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      content: "Armed only with the three photographs, Henok navigated the bustling tea stalls opposite the theatre. An elderly poet recognized the woman instantly—an accomplished dramatist who had safeguarded the theatre's archives through five turbulent decades. Finding her before Tuesday would uncover not just family secrets, but the true provenance of the manuscript.",
      wordCount: 52,
      upvotes: 24,
      isUpvotedByMe: false,
      createdAt: '6 hours ago',
      isWinner: false,
    },
    {
      id: 'sub-04',
      author: 'Dr. Marcus Vance',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      content: "The rain subsided as dusk settled over Churchill Avenue. In the quiet mezzanine of the archives, Henok discovered that the woman had spent half a century searching for the cedar trunk's key. Their meeting was not an end, but the prologue to an unspoken literary triumph.",
      wordCount: 47,
      upvotes: 19,
      isUpvotedByMe: false,
      createdAt: '8 hours ago',
      isWinner: false,
    }
  ],

  hallOfFame: [
    {
      id: 'hof-01',
      week: 'Week 3 Winner',
      prompt: 'A midnight shadow in the reading hall.',
      content: 'Shadows whispered stories books left unwritten.',
      author: 'Tewodros Kassahun',
      upvotes: 56,
    },
    {
      id: 'hof-02',
      week: 'Week 2 Winner',
      prompt: 'The final sentence that changed everything.',
      content: 'Last sentence ended journey, started life.',
      author: 'Bethlehem Haile',
      upvotes: 49,
    },
    {
      id: 'hof-03',
      week: 'Week 1 Winner',
      prompt: 'First glance across the reading table.',
      content: 'Shared coffee mug, unread philosophical chapter.',
      author: 'Amina Bekele',
      upvotes: 62,
    }
  ],

  thursdayQuiz: {
    title: 'Pre-Meetup Thursday Quiz #4',
    bookTitle: 'The Crucible of Reflection (Pages 113 - 224)',
    timeLimitSeconds: 180, // 3 minutes
    xpReward: 50,
    questions: [
      {
        id: 'q1',
        question: 'In Chapter 4 of "The Crucible of Reflection", how does Dr. Vance define moral responsibility in group settings?',
        options: [
          'A static set of legal codes inherited from tradition',
          'A dynamic collective commitment where silence implies consent',
          'An individual pursuit completely detached from community obligations',
          'An economic transaction governed strictly by utility'
        ],
        correctIndex: 1,
        explanation: 'Dr. Vance emphasizes that within academic and literary communities, silence regarding ethical breaches constitutes passive consent.'
      },
      {
        id: 'q2',
        question: 'What is the primary target milestone for Week 2 of our current reading cycle?',
        options: [
          'Pages 1 to 112 (33%)',
          'Pages 113 to 224 (66%)',
          'Pages 225 to 340 (100%)',
          'Full book completion including appendix'
        ],
        correctIndex: 1,
        explanation: 'Week 2 target spans pages 113 to 224, bringing reading completion to 66% prior to Tuesday review.'
      },
      {
        id: 'q3',
        question: 'Which literary device does Vance use to illustrate the concept of "Cognitive Dissonance"?',
        options: [
          'The metaphor of a cracked stained-glass window',
          'A fable about two rival scholars in a library tower',
          'An allegory of a ship navigating stormy seas',
          'The parable of the unread ledger'
        ],
        correctIndex: 0,
        explanation: 'Vance uses the cracked stained-glass window metaphor to show how conflicting beliefs refract perception.'
      },
      {
        id: 'q4',
        question: 'What is the required passcode check-in window for our Tuesday physical meetup in Hall B?',
        options: [
          '10:00 AM – 12:00 PM',
          '12:30 PM – 3:30 PM',
          '4:00 PM – 7:00 PM',
          'All day Tuesday'
        ],
        correctIndex: 1,
        explanation: 'Per SRS Section 4.2, 4-digit attendance passcodes are active strictly between 12:30 and 15:30 on scheduled Tuesdays.'
      },
      {
        id: 'q5',
        question: 'How many space-delimited words are strictly required for the Saturday Six-Word Story initiative?',
        options: [
          'Between 5 and 10 words',
          'Maximum of 6 words',
          'Exactly 6 space-delimited words',
          'Exactly 10 words'
        ],
        correctIndex: 2,
        explanation: 'FR-3.1 enforces a strict input validation constraint of exactly 6 space-delimited words.'
      }
    ]
  }
};

mockWeekendData.sundayQuiz = mockWeekendData.thursdayQuiz;


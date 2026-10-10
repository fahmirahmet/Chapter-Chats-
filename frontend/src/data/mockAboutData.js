// Mock dataset for About Us, Legacy & Leadership, Logistics, Photo Gallery & FAQs

export const mockAboutData = {
  missionStatement: 'To bridge in-person university literary reviews with continuous weekly digital engagement, empowering students through structured reading sprints, accessible book repositories, creative micro-writing, and interactive discussion.',

  meetingDetails: {
    frequency: 'Every 3 Weeks (Bi-Monthly Review Sprints)',
    dayTime: 'Tuesdays @ 12:30 PM – 3:30 PM (EAT)',
    venue: 'Student Center Library • Hall B',
    passcodeWindow: '12:30 PM – 3:30 PM (Active Verification)',
    format: 'Guided Group Discussions, Chapter Debates, PDF Worksheets & Refreshments',
  },

  founder: {
    name: 'Yukabed',
    title: 'Founder & 1st President',
    tenure: '2023 – 2025',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    quote: 'We founded Chapter & Chats on the conviction that books are catalysts for transformation. A single chapter read in isolation is knowledge, but a chapter explored in community becomes wisdom, empathy, and lifelong fellowship.',
    message: 'What began in 2023 as an informal circle of university students gathered over thermos coffee and dog-eared paperbacks has grown into an enduring literary home. Our mission has always been simple yet profound: build an inclusive sanctuary where curiosity is celebrated, literary discourse thrives, and every student discovers the transformative joy of deep reading.',
    initiatives: [
      'Architect of the 3-Week Reading Cycle Framework',
      'Established the Library Hall B Physical Review Gatherings',
      'Pioneered Student Book Donation Drives across Campus'
    ]
  },

  pastPresidents: [
    {
      id: 'past-01',
      name: 'Yukabed',
      tenure: '2023 – 2025 (Founding President)',
      role: 'Founding President',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      keyAchievement: 'Founded the club, established bi-monthly physical meetups in Hall B, and launched the initial digital reading tracker.',
      favoriteBook: 'Fiqir Eske Meqabir by Haddis Alemayehu'
    },
    {
      id: 'past-02',
      name: 'Dawit Mengistu',
      tenure: '2025 – 2026',
      role: '2nd Club President',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      keyAchievement: 'Expanded the Book House digital repository, formalized officer portfolios, and created the Saturday creative writing initiatives.',
      favoriteBook: 'Things Fall Apart by Chinua Achebe'
    }
  ],

  leadershipTeam: [
    {
      id: 'lead-01',
      name: 'Bethlehem Haile',
      role: 'Club President',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      favoriteGenre: 'Ethiopian Literature',
      currentlyReading: 'Fiqir Eske Meqabir',
      bio: 'Leading our community initiatives and hosting bi-monthly literary reviews in Library Hall B.',
    },
    {
      id: 'lead-02',
      name: 'Tewodros Kassahun',
      role: 'Lead Cycle Coordinator',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      favoriteGenre: 'Philosophy & Ethics',
      currentlyReading: 'The Crucible of Reflection',
      bio: 'Manages 3-week milestone targets, quiz questions, and passcode verification logic.',
    },
    {
      id: 'lead-03',
      name: 'Amina Bekele',
      role: 'Head of Book House & Repository',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
      favoriteGenre: 'World Classics',
      currentlyReading: 'The Shadow of the Wind',
      bio: 'Curates downloadable book PDFs, study guide worksheets, and author metadata.',
    },
    {
      id: 'lead-04',
      name: 'Dr. Marcus Vance',
      role: 'Academic Faculty Advisor',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
      favoriteGenre: 'Moral Theory & Criticism',
      currentlyReading: 'Principles of Literary Criticism',
      bio: 'Provides academic guidance and reviews student book recommendation pitches.',
    }
  ],

  galleryPhotos: [
    {
      id: 'gal-01',
      image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
      caption: 'Evening literary campfire review session discussing existential philosophy beneath the stars.',
      event_name: 'Campfire Review Night',
      category: 'Campfire Review Night',
      uploaded_at: '2026-08-20T18:30:00Z',
      uploaded_by_username: 'Yukabed'
    },
    {
      id: 'gal-02',
      image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
      caption: 'Annual book donation drive handing over 300+ collected volumes to the university community library.',
      event_name: 'Campus Book Donation Drive',
      category: 'Campus Book Donation Drive',
      uploaded_at: '2026-08-10T14:15:00Z',
      uploaded_by_username: 'Bethlehem'
    },
    {
      id: 'gal-03',
      image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80',
      caption: 'Passionate Tuesday literary debate in Library Hall B examining moral agency in literature.',
      event_name: 'Tuesday Review Meetup (Library Hall B)',
      category: 'Tuesday Review Meetup (Library Hall B)',
      uploaded_at: '2026-07-28T13:00:00Z',
      uploaded_by_username: 'Tewodros'
    },
    {
      id: 'gal-04',
      image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
      caption: 'Quiet collaborative reading sprint in the student center courtyard prior to Thursday quizzes.',
      event_name: 'Courtyard Reading Sprint',
      category: 'Courtyard Reading Sprint',
      uploaded_at: '2026-07-15T16:45:00Z',
      uploaded_by_username: 'Amina'
    },
    {
      id: 'gal-05',
      image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80',
      caption: 'Unboxing fresh hardcover acquisitions and worksheet study kits for the Book House.',
      event_name: 'Book House Acquisition',
      category: 'Book House Acquisition',
      uploaded_at: '2026-06-30T11:20:00Z',
      uploaded_by_username: 'Amina'
    },
    {
      id: 'gal-06',
      image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
      caption: 'End-of-semester literary gala honoring active readers, top quizmasters, and creative micro-authors.',
      event_name: 'Annual Literary Gala',
      category: 'Annual Literary Gala',
      uploaded_at: '2026-06-12T19:00:00Z',
      uploaded_by_username: 'Yukabed'
    }
  ],

  faqs: [
    {
      id: 'faq-1',
      question: 'How do the 3-Week Reading Cycles work?',
      answer: 'Each cycle is dedicated to a chosen book spanning 21 days. The engine subdivides the total page count into 3 weekly targets: Week 1 (1–33%), Week 2 (34–66%), and Week 3 (67–100%). Members meet every 3rd Tuesday at 12:30 PM for the physical review.',
    },
    {
      id: 'faq-2',
      question: 'Where do I find the 4-digit Tuesday Check-In Passcode?',
      answer: 'Passcodes are dynamically generated by club administrators during active meeting hours (12:30 PM to 3:30 PM) in Library Hall B. Entering the passcode during the window logs your attendance and increments your streak counter.',
    },
    {
      id: 'faq-3',
      question: 'How does the Saturday "Finish the Story" initiative work?',
      answer: 'Every Saturday at 00:01, executive curators publish a provocative narrative opening hook or classic alternate ending premise. Members submit their own creative conclusion (between 30 and 350 words). Community voting remains active through Tuesday at 12:30 PM, with the highest-voted author crowned "Micro-Author" and awarded the Story of the Week trophy!',
    },
    {
      id: 'faq-4',
      question: 'How do I earn XP points and Gamification Badges?',
      answer: 'Members earn +50 XP for perfect Thursday Quiz scores, +15 XP for submitting creative story conclusions, +50 XP for verified Tuesday meeting check-ins, and milestone trophies (Consistent Scholar, Micro-Author, Quizmaster, Page Finisher) displayed on your Member Profile.',
    },
    {
      id: 'faq-5',
      question: 'Are PDF books in the Book House free for all members?',
      answer: 'Yes! All curated book PDFs and accompanying study guide worksheets are freely accessible for authenticated club members.',
    }
  ]
};

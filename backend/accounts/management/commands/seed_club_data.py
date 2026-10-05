from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, date, datetime
from accounts.models import User, Badge, UserBadge
from books.models import Book
from cycles.models import ReadingCycle, Meeting
from activities.models import (
    StoryPrompt, 
    StorySubmission, 
    QuizSet, 
    QuizQuestion, 
    DiscussionThread,
    ThreadUpvote,
    BookPoll,
    PollOption,
    PollVote,
    BookProposal
)

class Command(BaseCommand):
    help = 'Seeds initial database records for Chapters & Chats book club platform'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting club database seeding process...'))

        # 1. Seed Accounts & Users
        admin_user, _ = User.objects.get_or_create(
            username='president_bethlehem',
            defaults={
                'email': 'president@chapterchats.com',
                'role': User.Role.ADMIN,
                'current_streak': 8,
                'total_xp': 850,
                'current_page_read': 240,
                'avatar': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin_user.set_password('admin123')
        admin_user.save()

        demo_member, _ = User.objects.get_or_create(
            username='amina_bekele',
            defaults={
                'email': 'member@chapterchats.com',
                'role': User.Role.MEMBER,
                'current_streak': 4,
                'total_xp': 450,
                'current_page_read': 185,
                'avatar': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
            }
        )
        demo_member.set_password('password123')
        demo_member.save()

        # 2. Seed Badges
        badges_data = [
            {
                'name': 'Consistent Scholar',
                'description': 'Maintained an in-person attendance streak of 4 consecutive Tuesday meetings.',
                'tier': Badge.Tier.GOLD,
                'icon_slug': 'Award'
            },
            {
                'name': 'Micro-Author',
                'description': 'Authored the highest-voted Saturday Six-Word Story entry of the week.',
                'tier': Badge.Tier.SILVER,
                'icon_slug': 'PenTool'
            },
            {
                'name': 'Quizmaster',
                'description': 'Achieved a perfect 5/5 score on a Sunday Pre-Meetup Quiz within the time limit.',
                'tier': Badge.Tier.BRONZE,
                'icon_slug': 'HelpCircle'
            },
            {
                'name': 'Page Finisher',
                'description': 'Logged 100% reading completion on the active book prior to Tuesday review.',
                'tier': Badge.Tier.SILVER,
                'icon_slug': 'BookCheck'
            }
        ]

        badges_dict = {}
        for b_data in badges_data:
            badge, _ = Badge.objects.get_or_create(name=b_data['name'], defaults=b_data)
            badges_dict[badge.name] = badge

        UserBadge.objects.get_or_create(user=demo_member, badge=badges_dict['Consistent Scholar'])
        UserBadge.objects.get_or_create(user=demo_member, badge=badges_dict['Micro-Author'])

        # 3. Seed Books Repository
        books_data = [
            {
                'title': 'The Crucible of Reflection',
                'author': 'Dr. A. K. Vance',
                'genre': 'Philosophy & Ethics',
                'total_pages': 340,
                'synopsis': 'An engaging academic inquiry examining moral philosophy, identity, ethical crossroads, and the transformative power of dialogue within student communities.',
            },
            {
                'title': 'Fiqir Eske Meqabir (Love Unto Crypt)',
                'author': 'Haddis Alemayehu',
                'genre': 'Ethiopian Literature',
                'total_pages': 480,
                'synopsis': 'A monumental Ethiopian classic portraying feudal social structures, unconditional devotion, class conflict, and profound romantic tragedy.',
            },
            {
                'title': 'Yebirhan Felegot (In Pursuit of Light)',
                'author': 'Alex Abraham',
                'genre': 'Ethiopian Modern Stories',
                'total_pages': 245,
                'synopsis': 'A compelling collection of contemporary Ethiopian short prose examining urban life, university aspirations, and quiet emotional resilience.',
            },
            {
                'title': 'Justice: What\'s the Right Thing to Do?',
                'author': 'Michael J. Sandel',
                'genre': 'Ethics & Politics',
                'total_pages': 308,
                'synopsis': 'A masterclass in moral reasoning, exploring utilitarianism, libertarianism, Kantian duty, and Aristotle\'s virtue ethics.',
            },
            {
                'title': 'The Shadow of the Wind',
                'author': 'Carlos Ruiz Zafón',
                'genre': 'World Classics',
                'total_pages': 487,
                'synopsis': 'Set in post-civil war Barcelona, ten-year-old Daniel selects a novel in the Cemetery of Forgotten Books that leads him into a maze of secrets.',
            },
            {
                'title': 'Crime and Punishment',
                'author': 'Fyodor Dostoevsky',
                'genre': 'World Classics',
                'total_pages': 545,
                'synopsis': 'A psychological masterpiece dissecting Raskolnikov\'s rationalization of murder, guilt, spiritual torment, and eventual redemption.',
            },
            {
                'title': 'Man\'s Search for Meaning',
                'author': 'Viktor E. Frankl',
                'genre': 'Philosophy & Psychology',
                'total_pages': 165,
                'synopsis': 'Psychiatrist Viktor Frankl chronicles his experiences in Auschwitz, outlining Logotherapy and the fundamental human drive to find purpose.',
            },
            {
                'title': 'Things Fall Apart',
                'author': 'Chinua Achebe',
                'genre': 'African Literature',
                'total_pages': 209,
                'synopsis': 'A landmark African novel telling the story of Okonkwo, a respected Igbo leader, and the devastating impact of European colonialism.',
            },
            {
                'title': 'The Master and Margarita',
                'author': 'Mikhail Bulgakov',
                'genre': 'Fiction & Satire',
                'total_pages': 384,
                'synopsis': 'A wild satirical fantasy where the Devil visits 1930s Moscow accompanied by a giant talking cat.',
            }
        ]

        active_book = None
        for b_info in books_data:
            book_obj, _ = Book.objects.get_or_create(title=b_info['title'], defaults=b_info)
            if book_obj.title == 'The Crucible of Reflection':
                active_book = book_obj

        # 4. Seed Reading Cycle & Active Meeting Passcode
        today = date.today()
        # Compute next Tuesday
        days_ahead = (1 - today.weekday() + 7) % 7
        if days_ahead == 0:
            days_ahead = 7
        target_tuesday = today + timedelta(days=days_ahead)

        cycle, _ = ReadingCycle.objects.get_or_create(
            book=active_book,
            is_active=True,
            defaults={
                'start_date': today - timedelta(days=14),
                'meeting_date': target_tuesday,
            }
        )

        meeting_dt = timezone.now().replace(hour=12, minute=30, second=0, microsecond=0) + timedelta(days=days_ahead)
        expires_dt = meeting_dt.replace(hour=15, minute=30)

        Meeting.objects.get_or_create(
            cycle=cycle,
            is_active=True,
            defaults={
                'meeting_datetime': meeting_dt,
                'passcode': '8419', # SRS Dynamic Passcode Token
                'expires_at': expires_dt,
            }
        )

        # 5. Seed Saturday Story Prompt & Submissions ("Finish the Story" Challenge)
        story_opening = (
            "The rain in Addis had turned the courtyard into a shallow lake by the time Henok pried open the rusted "
            "lock on his grandfather's cedar trunk. Nestled between yellowed tax ledgers was a hand-bound notebook "
            "wrapped in dried ensete fiber, its first page dated November 1974.\n\n"
            "As he turned to the final chapter, three loose photographs slipped to the floor, each showing the same young woman "
            "standing outside the old National Theatre. Written in faded violet ink across the margin was a single sentence: "
            "'If you are reading this, find her before Tuesday.'"
        )

        prompt_obj = StoryPrompt.objects.filter(title='The Unsent Manuscript').first()
        if not prompt_obj:
            prompt_obj = StoryPrompt.objects.create(
                title='The Unsent Manuscript',
                prompt_type=StoryPrompt.PromptType.ORIGINAL_HOOK,
                story_opening=story_opening,
                opens_at=timezone.now() - timedelta(days=2),
                closes_at=meeting_dt,
                is_active=True,
            )

        sub1_text = (
            "Henok clutched the rain-soaked photographs against his woolen coat as he sprinted through the cobblestone alleys of Piazza. "
            "The National Theatre's marquee glowed faintly under the dusk sky, casting long amber shadows across the wet pavement. "
            "Inside the stage door, an elderly archivist paused at the sight of the violet ink inscription, her eyes widening in disbelief. "
            "'She never missed a Tuesday rehearsal,' the archivist whispered, unlocking the private gallery upstairs. "
            "There, standing before the restored 1974 set of Fikir Eske Mekabir, was the woman from the photograph, holding an identical leather notebook with missing final pages."
        )

        StorySubmission.objects.get_or_create(
            prompt=prompt_obj,
            user=demo_member,
            defaults={
                'content': sub1_text,
                'upvote_count': 42,
                'is_winner': True,
            }
        )

        sub2_text = (
            "The ticking of the grandfather clock in the National Theatre lobby seemed to echo the race against the impending Tuesday deadline. "
            "Henok found her seated in row G, quietly reciting verses from an unpublished manuscript. "
            "When she looked up and saw the ensete fiber wrapping, tears filled her eyes. 'Fifty years,' she said softly. "
            "'I thought he had burned the only copy before leaving for Harar.' Together, they turned the final blank page."
        )

        StorySubmission.objects.get_or_create(
            prompt=prompt_obj,
            user=admin_user,
            defaults={
                'content': sub2_text,
                'upvote_count': 28,
                'is_winner': False,
            }
        )

        # 6. Seed Sunday Mini-Quiz
        quiz_set, _ = QuizSet.objects.get_or_create(
            cycle=cycle,
            title='Pre-Meetup Sunday Quiz #4',
            defaults={'active_at': timezone.now()}
        )

        questions = [
            {
                'prompt': 'In Chapter 4 of "The Crucible of Reflection", how does Dr. Vance define moral responsibility in group settings?',
                'option_a': 'A static set of legal codes inherited from tradition',
                'option_b': 'A dynamic collective commitment where silence implies consent',
                'option_c': 'An individual pursuit completely detached from community obligations',
                'option_d': 'An economic transaction governed strictly by utility',
                'correct_option': 'B',
                'explanation': 'Dr. Vance emphasizes that silence regarding ethical breaches constitutes passive consent.'
            },
            {
                'prompt': 'What is the required passcode check-in window for our Tuesday physical meetup in Hall B?',
                'option_a': '10:00 AM – 12:00 PM',
                'option_b': '12:30 PM – 3:30 PM',
                'option_c': '4:00 PM – 7:00 PM',
                'option_d': 'All day Tuesday',
                'correct_option': 'B',
                'explanation': 'Per SRS Section 4.2, 4-digit attendance passcodes are active strictly between 12:30 and 15:30 on scheduled Tuesdays.'
            },
            {
                'prompt': 'What is the allowed word count range for the Saturday "Finish the Story" challenge?',
                'option_a': 'Strictly 6 words',
                'option_b': 'Between 30 and 350 words',
                'option_c': 'Exactly 500 words',
                'option_d': 'No word limit',
                'correct_option': 'B',
                'explanation': 'The Saturday Finish the Story challenge requires creative endings between 30 and 350 words.'
            }
        ]

        for q_data in questions:
            QuizQuestion.objects.get_or_create(quiz=quiz_set, prompt=q_data['prompt'], defaults=q_data)

        # 7. Seed Discussion Threads
        threads_data = [
            {
                'user': admin_user,
                'title': 'Chapter 5 Paradox: Moral Duty vs. Personal Ambition',
                'chapter_tag': 'Chapter 4-6',
                'content': 'In Chapter 5, Vance presents an ethical crossroad. Does loyalty to an institution supersede individual moral integrity?',
                'spoiler_text': 'The protagonist chooses to stay silent during the faculty investigation to protect his protégé.',
                'upvotes_count': 24,
            },
            {
                'user': demo_member,
                'title': 'Week 2 Reading Target: Pages 113 to 224 Discussion',
                'chapter_tag': 'Pages 113-224',
                'content': 'Share your favorite quotes from pages 113 to 224! Please use markdown spoiler tags for content beyond page 200.',
                'spoiler_text': "The second ledger reveals that the founder's manuscript was co-authored anonymously.",
                'upvotes_count': 35,
            },
            {
                'user': admin_user,
                'title': 'Preparation for Tuesday Meetup in Library Hall B',
                'chapter_tag': 'General Discussion',
                'content': 'Remember that dynamic passcodes are active between 12:30 and 15:30. Let us compile our group questions here.',
                'spoiler_text': 'Printed discussion sheets will be handed out at 12:30 PM sharp.',
                'upvotes_count': 18,
            }
        ]

        for t_data in threads_data:
            DiscussionThread.objects.get_or_create(
                cycle=cycle,
                user=t_data['user'],
                title=t_data['title'],
                defaults=t_data
            )

        # 8. Seed Bi-Monthly Community Book Poll & Options
        book_poll, _ = BookPoll.objects.get_or_create(
            title='Select Our Next 3-Week Cycle Book',
            defaults={
                'description': 'Vote for the book you would like our club to read starting next month. Every member gets 1 vote per cycle.',
                'closes_at': timezone.now() + timedelta(days=4),
                'is_active': True,
            }
        )

        poll_options_data = [
            {
                'book_title': 'Fiqir Eske Meqabir',
                'author': 'Haddis Alemayehu',
                'genre': 'Ethiopian Literature',
                'pitch': 'A monumental Ethiopian classic portraying feudal social structures, unconditional devotion, class conflict, and profound romantic tragedy.',
                'votes_count': 42,
            },
            {
                'book_title': "Man's Search for Meaning",
                'author': 'Viktor E. Frankl',
                'genre': 'Philosophy & Psychology',
                'pitch': 'A profound exploration of purpose, resilience, and inner freedom drawn from the author\'s experiences in concentration camps.',
                'votes_count': 28,
            },
            {
                'book_title': 'Things Fall Apart',
                'author': 'Chinua Achebe',
                'genre': 'African Literature',
                'pitch': 'A masterpiece of African post-colonial literature examining cultural crossroads, traditional Igbo society, and the impact of British colonialism.',
                'votes_count': 17,
            }
        ]

        for opt_data in poll_options_data:
            PollOption.objects.get_or_create(
                poll=book_poll,
                book_title=opt_data['book_title'],
                defaults=opt_data
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded Chapters & Chats database with 9 Books, 4 Badges, 1 Active Cycle (Passcode 8419), Saturday Stories, Sunday Quiz, Community Discussion Threads, Active Book Poll, & Demo Users!'))

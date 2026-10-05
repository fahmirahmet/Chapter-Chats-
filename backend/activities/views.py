from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status, generics
from django.utils import timezone
from datetime import timedelta
from .models import (
    StoryPrompt, 
    StorySubmission, 
    StoryUpvote, 
    QuizSet, 
    QuizQuestion, 
    QuizAttempt, 
    DiscussionThread,
    DiscussionReply,
    ThreadUpvote,
    BookPoll,
    PollOption,
    PollVote,
    BookProposal,
    ContentReport,
    ClubGalleryPhoto
)
from .serializers import (
    StoryPromptSerializer, 
    StorySubmissionSerializer, 
    QuizSetSerializer, 
    DiscussionThreadSerializer,
    DiscussionReplySerializer,
    PollOptionSerializer,
    BookPollSerializer,
    BookProposalSerializer,
    ContentReportSerializer,
    ClubGalleryPhotoSerializer
)
from accounts.models import Badge, UserBadge
from accounts.permissions import is_executive_or_staff, IsExecutiveOrStaff
from cycles.models import ReadingCycle


class FinishTheStoryActivePromptView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        prompt = StoryPrompt.objects.filter(is_active=True).first()
        if not prompt:
            prompt = StoryPrompt.objects.order_by('-id').first()
            if prompt:
                prompt.is_active = True
                prompt.save()

        if not prompt:
            now = timezone.now()
            prompt = StoryPrompt.objects.create(
                title='Weekly Story Challenge: The Unopened Letter',
                prompt_type='ORIGINAL_HOOK',
                story_opening="The envelope had arrived in Tuesday's mail with no stamp and no return address—just my name inked in calligraphy that felt hauntingly familiar. When I broke the wax seal, three pressed clover petals fell onto the mahogany desk, along with a train ticket dated for tonight.",
                opens_at=now,
                closes_at=now + timedelta(days=7),
                is_active=True
            )

        serializer = StoryPromptSerializer(prompt, context={'request': request})
        user_submitted = False
        user_submission = None
        if request.user.is_authenticated:
            existing_sub = StorySubmission.objects.filter(prompt=prompt, user=request.user).first()
            if existing_sub:
                user_submitted = True
                user_submission = StorySubmissionSerializer(existing_sub, context={'request': request}).data

        return Response({
            'activePrompt': serializer.data,
            'userSubmitted': user_submitted,
            'userSubmission': user_submission,
        })


class FinishTheStorySubmissionsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        prompt_id = request.query_params.get('prompt') or request.query_params.get('prompt_id')
        if prompt_id:
            submissions = StorySubmission.objects.filter(prompt_id=prompt_id)
        else:
            active_prompt = StoryPrompt.objects.filter(is_active=True).first()
            if active_prompt:
                submissions = StorySubmission.objects.filter(prompt=active_prompt)
            else:
                submissions = StorySubmission.objects.all()

        submissions = submissions.select_related('user', 'prompt').order_by('-upvote_count', '-created_at')
        serializer = StorySubmissionSerializer(submissions, many=True, context={'request': request})
        return Response(serializer.data)


class FinishTheStorySubmitView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        prompt_id = request.data.get('prompt') or request.data.get('prompt_id')
        if prompt_id:
            prompt = StoryPrompt.objects.filter(pk=prompt_id).first()
        else:
            prompt = StoryPrompt.objects.filter(is_active=True).first()

        if not prompt:
            prompt = StoryPrompt.objects.order_by('-id').first()

        if not prompt:
            now = timezone.now()
            prompt = StoryPrompt.objects.create(
                title='Weekly Story Challenge: The Unopened Letter',
                prompt_type='ORIGINAL_HOOK',
                story_opening="The envelope had arrived in Tuesday's mail with no stamp and no return address—just my name inked in calligraphy that felt hauntingly familiar. When I broke the wax seal, three pressed clover petals fell onto the mahogany desk, along with a train ticket dated for tonight.",
                opens_at=now,
                closes_at=now + timedelta(days=7),
                is_active=True
            )

        if StorySubmission.objects.filter(prompt=prompt, user=request.user).exists():
            return Response(
                {'error': 'You have already submitted an ending for this active prompt. Only one submission is permitted per member.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        content = request.data.get('content') or request.data.get('ending_text') or ''
        data = {'content': content}

        serializer = StorySubmissionSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            submission = serializer.save(user=request.user, prompt=prompt)

            # Award +15 XP for creative writing initiative
            request.user.total_xp += 15
            request.user.save()

            return Response(StorySubmissionSerializer(submission, context={'request': request}).data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FinishTheStoryUpvoteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            submission = StorySubmission.objects.get(pk=pk)
        except StorySubmission.DoesNotExist:
            return Response({'error': 'Story submission not found.'}, status=status.HTTP_404_NOT_FOUND)

        upvote, created = StoryUpvote.objects.get_or_create(submission=submission, user=request.user)
        if not created:
            # Toggle remove upvote
            upvote.delete()
            submission.upvote_count = max(0, submission.upvote_count - 1)
            submission.save()

            # Adjust XP
            request.user.total_xp = max(0, request.user.total_xp - 1)
            request.user.save()
            if submission.user_id != request.user.id:
                submission.user.total_xp = max(0, submission.user.total_xp - 5)
                submission.user.save()

            return Response({
                'message': 'Upvote removed', 
                'upvotes': submission.upvote_count,
                'upvote_count': submission.upvote_count,
                'is_upvoted': False
            })

        submission.upvote_count += 1
        submission.save()

        # +1 XP to voter, +5 XP to author
        request.user.total_xp += 1
        request.user.save()
        if submission.user_id != request.user.id:
            submission.user.total_xp += 5
            submission.user.save()

        return Response({
            'message': 'Upvote recorded (+1 XP to you, +5 XP to author)', 
            'upvotes': submission.upvote_count,
            'upvote_count': submission.upvote_count,
            'is_upvoted': True
        })


class FinishTheStoryWinnerView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        winning_submissions = StorySubmission.objects.filter(is_winner=True).select_related('user', 'prompt').order_by('-created_at')
        hof_data = []
        for idx, w in enumerate(winning_submissions):
            avatar_val = None
            if w.user and w.user.avatar:
                avatar_val = request.build_absolute_uri(w.user.avatar.url) if hasattr(w.user.avatar, 'url') else str(w.user.avatar)
            hof_data.append({
                'id': w.id,
                'week': f"Week {idx + 1}",
                'prompt': w.prompt.title,
                'content': w.content,
                'author': w.user.full_name or w.user.username,
                'author_name': w.user.full_name,
                'author_username': w.user.username,
                'author_id': w.user.id,
                'avatar': avatar_val,
                'upvotes': w.upvote_count
            })

        winner = winning_submissions.first()
        if not winner:
            winner = StorySubmission.objects.select_related('user', 'prompt').order_by('-upvote_count').first()

        winner_data = None
        if winner:
            winner_data = StorySubmissionSerializer(winner, context={'request': request}).data
            winner_data['prompt_title'] = winner.prompt.title
            winner_data['story_opening'] = winner.prompt.story_opening

        return Response({
            'winner': winner_data,
            'hallOfFame': hof_data
        })


# Legacy / Compatibility Views
class SixWordStoryView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get(self, request):
        prompt = StoryPrompt.objects.filter(is_active=True).first()
        if not prompt:
            prompt = StoryPrompt.objects.order_by('-id').first()
        submissions = StorySubmission.objects.select_related('user', 'prompt').order_by('-upvote_count', '-created_at')
        prompt_data = StoryPromptSerializer(prompt, context={'request': request}).data if prompt else None
        submissions_data = StorySubmissionSerializer(submissions, many=True, context={'request': request}).data

        winners = StorySubmission.objects.filter(is_winner=True).select_related('user', 'prompt').order_by('-created_at')
        hof_data = []
        for idx, w in enumerate(winners):
            avatar_val = None
            if w.user and w.user.avatar:
                avatar_val = request.build_absolute_uri(w.user.avatar.url) if hasattr(w.user.avatar, 'url') else str(w.user.avatar)
            hof_data.append({
                'id': w.id,
                'week': f"Week {idx + 1}",
                'prompt': w.prompt.title,
                'content': w.content,
                'author': w.user.full_name or w.user.username,
                'author_name': w.user.full_name,
                'author_username': w.user.username,
                'author_id': w.user.id,
                'avatar': avatar_val,
                'upvotes': w.upvote_count
            })

        return Response({
            'activePrompt': prompt_data,
            'prompt': prompt_data,
            'submissions': submissions_data,
            'hallOfFame': hof_data
        })

    def post(self, request):
        view = FinishTheStorySubmitView()
        view.request = request
        return view.post(request)


class UpvoteStoryView(FinishTheStoryUpvoteView):
    pass


class ThursdayQuizView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get(self, request):
        active_cycle = ReadingCycle.objects.filter(is_active=True).first()
        quiz = None
        if active_cycle:
            quiz = QuizSet.objects.filter(cycle=active_cycle, is_active=True).order_by('-active_at', '-id').first()
        if not quiz:
            quiz = QuizSet.objects.filter(is_active=True).order_by('-active_at', '-id').first()
        if not quiz:
            quiz = QuizSet.objects.order_by('-id').first()

        if not quiz:
            return Response({'error': 'No active Thursday quiz set found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = QuizSetSerializer(quiz, context={'request': request})
        data = serializer.data
        if active_cycle and active_cycle.book:
            data['book_title'] = active_cycle.book.title
        elif quiz.cycle and quiz.cycle.book:
            data['book_title'] = quiz.cycle.book.title

        if request.user and request.user.is_authenticated:
            attempt = QuizAttempt.objects.filter(quiz=quiz, user=request.user).order_by('-completed_at').first()
            data['has_completed'] = attempt is not None
            data['user_has_completed'] = attempt is not None
            data['user_score'] = attempt.score if attempt else None
        else:
            data['has_completed'] = False
            data['user_has_completed'] = False
            data['user_score'] = None
        return Response(data)

    def post(self, request, quiz_id=None):
        view = ThursdayQuizSubmitView()
        view.request = request
        return view.post(request, quiz_id=quiz_id)


class ThursdayQuizSubmitView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, quiz_id=None):
        quiz = None
        if quiz_id:
            quiz = QuizSet.objects.filter(pk=quiz_id).first()
            if not quiz:
                return Response({'detail': 'Quiz set not found.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            active_cycle = ReadingCycle.objects.filter(is_active=True).first()
            if active_cycle:
                quiz = QuizSet.objects.filter(cycle=active_cycle, is_active=True).order_by('-active_at', '-id').first()
            if not quiz:
                quiz = QuizSet.objects.filter(is_active=True).order_by('-active_at', '-id').first()
            if not quiz:
                quiz = QuizSet.objects.order_by('-id').first()

        if not quiz:
            return Response({'detail': 'No active quiz found.'}, status=status.HTTP_404_NOT_FOUND)

        # Single Quiz Attempt & Single XP Reward Enforcement
        existing_attempt = QuizAttempt.objects.filter(quiz=quiz, user=request.user).first()
        if existing_attempt:
            return Response(
                {"detail": "You have already completed this quiz. Retakes are not permitted."},
                status=status.HTTP_400_BAD_REQUEST
            )

        answers = request.data.get('answers', {})
        score = 0
        questions = list(quiz.questions.all())

        for idx, q in enumerate(questions):
            selected_val = answers.get(str(idx), answers.get(idx, answers.get(str(q.id), answers.get(q.id, ''))))
            selected_str = str(selected_val).strip()
            if selected_str.isdigit() and int(selected_str) < 4:
                choice_letter = ['A', 'B', 'C', 'D'][int(selected_str)]
            else:
                choice_letter = selected_str.upper()
            if choice_letter == q.correct_option.upper():
                score += 1

        QuizAttempt.objects.create(quiz=quiz, user=request.user, score=score)

        is_perfect = len(questions) > 0 and score == len(questions)
        xp_earned = 50 if is_perfect else max(20, score * 10)
        request.user.total_xp += xp_earned
        request.user.save()

        badge_awarded = False
        if is_perfect:
            badge = Badge.objects.filter(name='Quizmaster').first()
            if badge:
                _, created = UserBadge.objects.get_or_create(user=request.user, badge=badge)
                badge_awarded = True

        return Response({
            'score': score,
            'total_questions': len(questions),
            'xp_earned': xp_earned,
            'is_perfect_score': is_perfect,
            'badge_awarded': badge_awarded,
            'message': 'Quiz completed and points credited to your reader profile!'
        })


class ThursdayQuizDetailDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        if not is_executive_or_staff(request.user):
            return Response(
                {'detail': 'Access restricted to executive officers and staff.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            quiz = QuizSet.objects.get(pk=pk)
        except QuizSet.DoesNotExist:
            return Response({'detail': 'Quiz set not found.'}, status=status.HTTP_404_NOT_FOUND)

        quiz_title = quiz.title
        quiz.delete()
        return Response({'message': f'Quiz "{quiz_title}" deleted successfully.'}, status=status.HTTP_200_OK)


class SundayQuizView(ThursdayQuizView):
    pass


class ActiveQuizView(APIView):
    """
    GET /api/activities/quizzes/active/
    Returns the currently active quiz set in a normalised format:
      - has_taken / user_completed: True if the authenticated user already attempted
      - Returns 404 (not error object) when no active quiz exists so frontend
        can cleanly set activeQuiz = null.
    """
    def get_permissions(self):
        return [permissions.AllowAny()]

    def get(self, request):
        active_cycle = ReadingCycle.objects.filter(is_active=True).first()
        quiz = None
        if active_cycle:
            quiz = QuizSet.objects.filter(cycle=active_cycle, is_active=True).order_by('-active_at', '-id').first()
        if not quiz:
            quiz = QuizSet.objects.filter(is_active=True).order_by('-active_at', '-id').first()

        if not quiz:
            return Response({'detail': 'No active quiz.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = QuizSetSerializer(quiz, context={'request': request})
        data = dict(serializer.data)

        # Completion status
        if request.user and request.user.is_authenticated:
            attempt = QuizAttempt.objects.filter(quiz=quiz, user=request.user).order_by('-completed_at').first()
            completed = attempt is not None
            data['has_completed'] = completed
            data['user_has_completed'] = completed
            data['has_taken'] = completed
            data['user_completed'] = completed
            data['user_score'] = attempt.score if attempt else None
        else:
            data['has_completed'] = False
            data['user_has_completed'] = False
            data['has_taken'] = False
            data['user_completed'] = False
            data['user_score'] = None

        # Book context
        if active_cycle and active_cycle.book:
            data['book_title'] = active_cycle.book.title
        elif quiz.cycle and quiz.cycle.book:
            data['book_title'] = quiz.cycle.book.title

        return Response(data)



class ThursdayQuizCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get(self, request):
        quizzes = QuizSet.objects.all().order_by('-active_at', '-id')
        serializer = QuizSetSerializer(quizzes, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        user = request.user
        is_officer_allowed = (
            user.is_staff or 
            user.is_superuser or 
            user.role in ['ADMIN', 'OWNER'] or 
            user.officer_title in ['PRESIDENT', 'VICE_PRESIDENT', 'SOCIAL_MEDIA_LEAD', 'RESEARCH_LEAD']
        )
        if not is_officer_allowed:
            return Response(
                {'detail': 'Access restricted to President, Vice President, Social Media Lead, and Research Lead.'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        title = request.data.get('title', '').strip()
        if not title:
            return Response({'error': 'Quiz title is required.'}, status=status.HTTP_400_BAD_REQUEST)

        cycle_id = request.data.get('cycle_id') or request.data.get('cycle')
        active_cycle = None
        if cycle_id:
            active_cycle = ReadingCycle.objects.filter(pk=cycle_id).first()
        if not active_cycle:
            active_cycle = ReadingCycle.objects.filter(is_active=True).first()
        if not active_cycle:
            active_cycle = ReadingCycle.objects.order_by('-id').first()

        if not active_cycle:
            return Response({'error': 'No reading cycle found to attach quiz to. Please launch a reading cycle first.'}, status=status.HTTP_400_BAD_REQUEST)

        active_at_str = request.data.get('active_at') or request.data.get('scheduled_date')
        if active_at_str:
            try:
                active_at = timezone.datetime.fromisoformat(active_at_str.replace('Z', '+00:00'))
                if timezone.is_naive(active_at):
                    active_at = timezone.make_aware(active_at)
            except Exception:
                active_at = timezone.now()
        else:
            active_at = timezone.now()

        expires_at_str = request.data.get('expires_at')
        expires_at = None
        if expires_at_str:
            try:
                expires_at = timezone.datetime.fromisoformat(expires_at_str.replace('Z', '+00:00'))
                if timezone.is_naive(expires_at):
                    expires_at = timezone.make_aware(expires_at)
            except Exception:
                expires_at = None

        questions_data = request.data.get('questions', [])
        if not questions_data or not isinstance(questions_data, list):
            return Response({'error': 'At least one quiz question is required.'}, status=status.HTTP_400_BAD_REQUEST)

        quiz = QuizSet.objects.create(
            cycle=active_cycle,
            title=title,
            active_at=active_at,
            expires_at=expires_at,
            is_active=True
        )

        for q in questions_data:
            prompt = q.get('prompt') or q.get('question', '')
            opt_a = q.get('option_a') or (q.get('options', [''])[0] if len(q.get('options', [])) > 0 else '')
            opt_b = q.get('option_b') or (q.get('options', ['', ''])[1] if len(q.get('options', [])) > 1 else '')
            opt_c = q.get('option_c') or (q.get('options', ['', '', ''])[2] if len(q.get('options', [])) > 2 else '')
            opt_d = q.get('option_d') or (q.get('options', ['', '', '', ''])[3] if len(q.get('options', [])) > 3 else '')
            correct = str(q.get('correct_option', 'A')).upper()
            if correct not in ['A', 'B', 'C', 'D']:
                correct_idx = q.get('correctIndex')
                if correct_idx is not None and str(correct_idx).isdigit() and int(correct_idx) < 4:
                    correct = ['A', 'B', 'C', 'D'][int(correct_idx)]
                else:
                    correct = 'A'

            explanation = q.get('explanation', '')

            QuizQuestion.objects.create(
                quiz=quiz,
                prompt=prompt,
                option_a=opt_a,
                option_b=opt_b,
                option_c=opt_c,
                option_d=opt_d,
                correct_option=correct,
                explanation=explanation
            )

        serializer = QuizSetSerializer(quiz, context={'request': request})
        return Response({
            'message': 'Thursday Quiz published and activated successfully!',
            'quiz': serializer.data
        }, status=status.HTTP_201_CREATED)


class DiscussionThreadView(generics.ListCreateAPIView):
    serializer_class = DiscussionThreadSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return DiscussionThread.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        from cycles.models import ReadingCycle
        active_cycle = ReadingCycle.objects.filter(is_active=True).first()
        serializer.save(user=self.request.user, cycle=active_cycle)

        # Award +10 XP for creating a new community discussion thread
        self.request.user.total_xp += 10
        self.request.user.save()


class DiscussionThreadUpvoteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            thread = DiscussionThread.objects.get(pk=pk)
        except DiscussionThread.DoesNotExist:
            return Response({'error': 'Discussion thread not found.'}, status=status.HTTP_404_NOT_FOUND)

        upvote, created = ThreadUpvote.objects.get_or_create(thread=thread, user=request.user)
        if not created:
            # Toggle remove upvote
            upvote.delete()
            thread.upvotes_count = max(0, thread.upvotes_count - 1)
            thread.save()

            # Revert XP
            request.user.total_xp = max(0, request.user.total_xp - 1)
            request.user.save()
            if thread.user_id != request.user.id:
                thread.user.total_xp = max(0, thread.user.total_xp - 2)
                thread.user.save()

            return Response({
                'message': 'Upvote removed',
                'upvotes': thread.upvotes_count,
                'upvotes_count': thread.upvotes_count,
                'is_upvoted': False
            })

        thread.upvotes_count += 1
        thread.save()

        # +1 XP to voter, +2 XP to author
        request.user.total_xp += 1
        request.user.save()
        if thread.user_id != request.user.id:
            thread.user.total_xp += 2
            thread.user.save()

        return Response({
            'message': 'Upvote recorded (+1 XP)',
            'upvotes': thread.upvotes_count,
            'upvotes_count': thread.upvotes_count,
            'is_upvoted': True
        })


class DiscussionReplyCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk=None, thread_id=None):
        target_id = thread_id or pk
        try:
            thread = DiscussionThread.objects.get(pk=target_id)
        except DiscussionThread.DoesNotExist:
            return Response({'detail': 'Discussion thread not found.'}, status=status.HTTP_404_NOT_FOUND)

        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Reply content cannot be blank.'}, status=status.HTTP_400_BAD_REQUEST)

        parent_reply_id = request.data.get('parent_reply_id') or request.data.get('parent_reply')
        parent_reply = None
        if parent_reply_id:
            parent_reply = DiscussionReply.objects.filter(pk=parent_reply_id, thread=thread).first()

        reply = DiscussionReply.objects.create(
            thread=thread,
            author=request.user,
            content=content,
            parent_reply=parent_reply
        )

        # Award +5 XP for active discussion participation
        request.user.total_xp += 5
        request.user.save()

        # Re-fetch the updated thread or return reply data
        serializer = DiscussionReplySerializer(reply, context={'request': request})
        return Response({
            'message': 'Reply posted successfully! (+5 XP)',
            'reply': serializer.data,
            'reply_count': thread.replies.count()
        }, status=status.HTTP_201_CREATED)


class ActiveBookPollView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        poll = BookPoll.objects.filter(is_active=True).first()
        if not poll:
            return Response({
                'poll': None,
                'message': 'No active community book poll found.'
            })

        serializer = BookPollSerializer(poll, context={'request': request})
        data = serializer.data
        return Response({
            'poll': data,
            **data
        })


class AdminBookPollCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get(self, request):
        polls = BookPoll.objects.all().order_by('-created_at')
        serializer = BookPollSerializer(polls, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        user = request.user
        is_officer = (
            user.is_staff or 
            user.is_superuser or 
            user.role in ['ADMIN', 'OWNER', 'OFFICER'] or 
            (user.officer_title and user.officer_title != 'NONE')
        )
        if not is_officer:
            return Response({'detail': 'Access restricted to club officers and admins.'}, status=status.HTTP_403_FORBIDDEN)

        title = request.data.get('title', '').strip()
        description = request.data.get('description', '').strip()
        if not title:
            return Response({'error': 'Poll title is required.'}, status=status.HTTP_400_BAD_REQUEST)

        closes_at_str = request.data.get('closes_at') or request.data.get('expires_at')
        closes_at = None
        if closes_at_str:
            try:
                closes_at = timezone.datetime.fromisoformat(closes_at_str.replace('Z', '+00:00'))
                if timezone.is_naive(closes_at):
                    closes_at = timezone.make_aware(closes_at)
            except Exception:
                closes_at = timezone.now() + timedelta(days=14)
        else:
            closes_at = timezone.now() + timedelta(days=14)

        # Deactivate previous active polls
        BookPoll.objects.filter(is_active=True).update(is_active=False)

        poll = BookPoll.objects.create(
            title=title,
            description=description,
            closes_at=closes_at,
            is_active=True
        )

        options_data = request.data.get('options', [])
        if not options_data or not isinstance(options_data, list):
            return Response({'error': 'At least one poll option is required.'}, status=status.HTTP_400_BAD_REQUEST)

        for opt in options_data:
            if isinstance(opt, str):
                b_title = opt.strip()
                b_author = 'Featured Author'
                b_genre = 'Ethiopian Literature'
                b_pitch = ''
            elif isinstance(opt, dict):
                b_title = opt.get('title') or opt.get('book_title', '').strip()
                b_author = opt.get('author', 'Featured Author').strip()
                b_genre = opt.get('genre', 'Ethiopian Literature').strip()
                b_pitch = opt.get('pitch', '').strip()
            else:
                continue

            if b_title:
                PollOption.objects.create(
                    poll=poll,
                    book_title=b_title,
                    author=b_author,
                    genre=b_genre,
                    pitch=b_pitch
                )

        serializer = BookPollSerializer(poll, context={'request': request})
        return Response({
            'message': 'Community book voting poll created and activated successfully!',
            'poll': serializer.data
        }, status=status.HTTP_201_CREATED)


class BookPollDeleteView(APIView):
    """
    DELETE /api/activities/polls/<int:pk>/
    Hard-deletes the poll (and cascades to options + votes).
    Restricted to executives and staff.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        if not is_executive_or_staff(request.user):
            return Response(
                {'detail': 'Access restricted to executive officers and staff.'},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            poll = BookPoll.objects.get(pk=pk)
        except BookPoll.DoesNotExist:
            return Response({'detail': 'Poll not found.'}, status=status.HTTP_404_NOT_FOUND)

        poll_title = poll.title
        poll.delete()
        return Response(
            {'detail': f'Poll "{poll_title}" deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )


class BookPollVoteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        option_id = request.data.get('option_id') or request.data.get('optionId') or request.data.get('option')
        if not option_id:
            return Response({'error': 'Poll option ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            option = PollOption.objects.select_related('poll').get(pk=option_id)
        except (PollOption.DoesNotExist, ValueError):
            return Response({'error': 'Poll option not found.'}, status=status.HTTP_404_NOT_FOUND)

        poll = option.poll
        if not poll.is_active:
            return Response({'error': 'This book poll is closed.'}, status=status.HTTP_400_BAD_REQUEST)

        if PollVote.objects.filter(poll=poll, user=request.user).exists():
            return Response(
                {'error': 'You have already voted in this poll. Only 1 vote per member is permitted.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        PollVote.objects.create(user=request.user, poll=poll, option=option)
        option.votes_count += 1
        option.save()

        # Award +5 XP for civic engagement in book selection
        request.user.total_xp += 5
        request.user.save()

        poll_data = BookPollSerializer(poll, context={'request': request}).data
        return Response({
            'message': f'Vote cast successfully for "{option.book_title}"! (+5 XP)',
            'poll': poll_data,
            **poll_data
        }, status=status.HTTP_200_OK)


def is_executive_or_staff(user):
    return user and user.is_authenticated and (
        user.is_staff 
        or user.is_superuser 
        or getattr(user, 'role', '') in ['OWNER', 'ADMIN', 'OFFICER']
        or (getattr(user, 'officer_title', '') and getattr(user, 'officer_title', '') != 'NONE')
    )


class BookProposalCreateView(generics.ListCreateAPIView):
    serializer_class = BookProposalSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = BookProposal.objects.all().order_by('-created_at')
        limit = self.request.query_params.get('limit')
        if limit:
            try:
                qs = qs[:int(limit)]
            except (ValueError, TypeError):
                pass
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        # Award +10 XP for submitting a book proposal
        self.request.user.total_xp += 10
        self.request.user.save()


class BookProposalLikeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            proposal = BookProposal.objects.get(pk=pk)
        except BookProposal.DoesNotExist:
            return Response({'detail': 'Proposal not found.'}, status=status.HTTP_404_NOT_FOUND)

        if proposal.likes.filter(id=request.user.id).exists():
            proposal.likes.remove(request.user)
            has_liked = False
            msg = 'Endorsement removed.'
        else:
            proposal.likes.add(request.user)
            has_liked = True
            msg = 'Proposal endorsed! (+1 XP)'
            request.user.total_xp += 1
            request.user.save()

        return Response({
            'message': msg,
            'has_liked': has_liked,
            'is_liked': has_liked,
            'like_count': proposal.likes.count(),
            'likes_count': proposal.likes.count()
        }, status=status.HTTP_200_OK)


class BookProposalDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            proposal = BookProposal.objects.get(pk=pk)
        except BookProposal.DoesNotExist:
            return Response({'detail': 'Proposal not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not (is_executive_or_staff(request.user) or proposal.user_id == request.user.id):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        ContentReport.objects.filter(proposal=proposal).update(is_resolved=True, resolved_by=request.user)
        proposal_title = proposal.title
        proposal.delete()
        return Response({'message': f'Proposal "{proposal_title}" deleted successfully.'}, status=status.HTTP_200_OK)


class AdminStoryPromptCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not (request.user.is_staff or request.user.is_superuser or request.user.role == 'ADMIN'):
            return Response({'detail': 'Access restricted to executive officers.'}, status=status.HTTP_403_FORBIDDEN)

        title = request.data.get('title', '').strip()
        prompt_type = request.data.get('prompt_type', 'ORIGINAL_HOOK')
        story_opening = request.data.get('story_opening', '').strip()

        if not title:
            return Response({'detail': 'Prompt title is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not story_opening:
            return Response({'detail': 'Hook story opening paragraphs are required.'}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        opens_at = request.data.get('opens_at') or now
        closes_at = request.data.get('closes_at') or (now + timedelta(days=7))

        # Deactivate previous active prompts
        StoryPrompt.objects.filter(is_active=True).update(is_active=False)

        new_prompt = StoryPrompt.objects.create(
            title=title,
            prompt_type=prompt_type,
            story_opening=story_opening,
            opens_at=opens_at,
            closes_at=closes_at,
            is_active=True
        )

        return Response({
            'message': 'Saturday story prompt published successfully!',
            'prompt': StoryPromptSerializer(new_prompt, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)


class AdminCrownWinnerView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if not (request.user.is_staff or request.user.is_superuser or request.user.role == 'ADMIN'):
            return Response({'detail': 'Access restricted to executive officers.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            submission = StorySubmission.objects.select_related('prompt', 'user').get(pk=pk)
        except StorySubmission.DoesNotExist:
            return Response({'detail': 'Submission not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Unset previous winners for this prompt
        StorySubmission.objects.filter(prompt=submission.prompt, is_winner=True).update(is_winner=False)

        submission.is_winner = True
        submission.save()

        # Award Micro-Author badge if exists
        badge = Badge.objects.filter(name='Micro-Author').first()
        if not badge:
            badge = Badge.objects.create(
                name='Micro-Author',
                description='Wrote the highest-voted Finish the Story conclusion',
                tier=Badge.Tier.SILVER,
                icon_slug='award'
            )
        UserBadge.objects.get_or_create(user=submission.user, badge=badge)

        # Bonus XP for winning
        submission.user.total_xp += 30
        submission.user.save()

        return Response({
            'message': f'"{submission.user.username}" crowned Story of the Week! Micro-Author badge awarded.',
            'submission': StorySubmissionSerializer(submission, context={'request': request}).data
        }, status=status.HTTP_200_OK)


class ContentReportCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        target_type = str(request.data.get('target_type') or '').lower()
        target_id = request.data.get('target_id')

        thread_id = request.data.get('thread_id') or request.data.get('thread')
        reply_id = request.data.get('reply_id') or request.data.get('reply')
        submission_id = request.data.get('submission_id') or request.data.get('submission')
        proposal_id = request.data.get('proposal_id') or request.data.get('proposal')

        if target_type == 'thread' and target_id:
            thread_id = target_id
        elif target_type == 'reply' and target_id:
            reply_id = target_id
        elif target_type in ['submission', 'story'] and target_id:
            submission_id = target_id
        elif target_type == 'proposal' and target_id:
            proposal_id = target_id

        reason = request.data.get('reason', 'OTHER')
        details = request.data.get('details', '').strip()

        if not thread_id and not reply_id and not submission_id and not proposal_id:
            return Response(
                {'detail': 'A valid thread_id, reply_id, submission_id, or proposal_id is required to report content.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        thread = DiscussionThread.objects.filter(pk=thread_id).first() if thread_id else None
        reply = DiscussionReply.objects.filter(pk=reply_id).first() if reply_id else None
        submission = StorySubmission.objects.filter(pk=submission_id).first() if submission_id else None
        proposal = BookProposal.objects.filter(pk=proposal_id).first() if proposal_id else None

        if thread_id and not thread:
            return Response({'detail': 'Reported discussion thread not found.'}, status=status.HTTP_404_NOT_FOUND)
        if reply_id and not reply:
            return Response({'detail': 'Reported discussion reply not found.'}, status=status.HTTP_404_NOT_FOUND)
        if submission_id and not submission:
            return Response({'detail': 'Reported story submission not found.'}, status=status.HTTP_404_NOT_FOUND)
        if proposal_id and not proposal:
            return Response({'detail': 'Reported book proposal not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Create report
        report = ContentReport.objects.create(
            reporter=request.user,
            thread=thread,
            reply=reply,
            submission=submission,
            proposal=proposal,
            reason=reason,
            details=details
        )

        return Response({
            'message': 'Thank you. Content flagged for executive moderator review.',
            'report': ContentReportSerializer(report).data
        }, status=status.HTTP_201_CREATED)


class AdminContentReportListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not is_executive_or_staff(request.user):
            return Response({'detail': 'Access restricted to executive officers.'}, status=status.HTTP_403_FORBIDDEN)

        status_param = request.query_params.get('resolved', 'false').lower()
        reports = ContentReport.objects.select_related(
            'reporter', 
            'thread', 
            'thread__user', 
            'reply',
            'reply__author',
            'submission', 
            'submission__user', 
            'submission__prompt', 
            'proposal',
            'proposal__user',
            'resolved_by'
        ).order_by('-created_at')

        if status_param == 'false':
            reports = reports.filter(is_resolved=False)
        elif status_param == 'true':
            reports = reports.filter(is_resolved=True)

        serializer = ContentReportSerializer(reports, many=True)
        return Response(serializer.data)


class AdminContentReportResolveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if not is_executive_or_staff(request.user):
            return Response({'detail': 'Access restricted to executive officers.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            report = ContentReport.objects.get(pk=pk)
        except ContentReport.DoesNotExist:
            return Response({'detail': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)

        report.is_resolved = True
        report.resolved_by = request.user
        report.save()

        return Response({
            'message': 'Report marked as resolved.',
            'report': ContentReportSerializer(report).data
        })

    def delete(self, request, pk):
        if not is_executive_or_staff(request.user):
            return Response({'detail': 'Access restricted to executive officers.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            report = ContentReport.objects.get(pk=pk)
        except ContentReport.DoesNotExist:
            return Response({'detail': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)

        # If query param delete_target is true, delete the offending content too
        delete_target = request.query_params.get('delete_content') == 'true' or request.data.get('delete_content') is True
        if delete_target:
            if report.thread:
                report.thread.delete()
            elif report.reply:
                report.reply.delete()
            elif report.submission:
                report.submission.delete()
            elif report.proposal:
                report.proposal.delete()

        report.delete()
        return Response({'message': 'Report and associated action completed successfully.'})


class DiscussionThreadDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            thread = DiscussionThread.objects.get(pk=pk)
        except DiscussionThread.DoesNotExist:
            return Response({'detail': 'Discussion thread not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Allow staff/executives or original author
        if not (is_executive_or_staff(request.user) or thread.user_id == request.user.id):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        # Resolve associated reports if any
        ContentReport.objects.filter(thread=thread).update(is_resolved=True, resolved_by=request.user)

        thread.delete()
        return Response({'message': 'Discussion topic deleted successfully.'})


class DiscussionReplyDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            reply = DiscussionReply.objects.get(pk=pk)
        except DiscussionReply.DoesNotExist:
            return Response({'detail': 'Discussion reply not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not (is_executive_or_staff(request.user) or reply.author_id == request.user.id):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        # Resolve associated reports if any
        ContentReport.objects.filter(reply=reply).update(is_resolved=True, resolved_by=request.user)

        thread_id = reply.thread_id
        reply.delete()
        thread = DiscussionThread.objects.filter(pk=thread_id).first()
        remaining_count = thread.replies.count() if thread else 0

        return Response({
            'message': 'Discussion reply deleted successfully.',
            'reply_count': remaining_count
        }, status=status.HTTP_200_OK)


class StorySubmissionDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            submission = StorySubmission.objects.get(pk=pk)
        except StorySubmission.DoesNotExist:
            return Response({'detail': 'Story submission not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not (is_executive_or_staff(request.user) or submission.user_id == request.user.id):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        # Resolve associated reports if any
        ContentReport.objects.filter(submission=submission).update(is_resolved=True, resolved_by=request.user)

        submission.delete()
        return Response({'message': 'Story conclusion deleted successfully.'})


class ClubGalleryPhotoListView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get(self, request):
        photos = ClubGalleryPhoto.objects.all().order_by('-uploaded_at')
        serializer = ClubGalleryPhotoSerializer(photos, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        user = request.user
        if not (user.is_staff or user.is_superuser or user.role in ['ADMIN', 'OWNER', 'OFFICER'] or (user.officer_title and user.officer_title != 'NONE')):
            return Response({'detail': 'Access restricted to executive officers.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ClubGalleryPhotoSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(uploaded_by=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ClubGalleryPhotoDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        user = request.user
        if not is_executive_or_staff(user):
            return Response({'detail': 'Access restricted to executive officers and staff.'}, status=status.HTTP_403_FORBIDDEN)


        try:
            photo = ClubGalleryPhoto.objects.get(pk=pk)
            photo.delete()
            return Response({'message': 'Gallery photo deleted successfully.'})
        except ClubGalleryPhoto.DoesNotExist:
            return Response({'detail': 'Photo not found.'}, status=status.HTTP_404_NOT_FOUND)





from rest_framework import serializers
from django.utils.timesince import timesince
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

def resolve_avatar_url(user, request=None):
    if not user or not user.avatar:
        return None
    try:
        if request and hasattr(user.avatar, 'url'):
            return request.build_absolute_uri(user.avatar.url)
        url = user.avatar.url if hasattr(user.avatar, 'url') else str(user.avatar)
        if url.startswith('/media/') or url.startswith('media/'):
            clean_path = url if url.startswith('/') else f"/{url}"
            return f"http://localhost:8000{clean_path}"
        return url
    except Exception:
        return str(user.avatar)


class StoryPromptSerializer(serializers.ModelSerializer):
    total_entries = serializers.SerializerMethodField()

    class Meta:
        model = StoryPrompt
        fields = ('id', 'title', 'prompt_type', 'story_opening', 'opens_at', 'closes_at', 'is_active', 'total_entries')

    def get_total_entries(self, obj):
        return obj.submissions.count()


class StorySubmissionSerializer(serializers.ModelSerializer):
    author = serializers.CharField(source='user.username', read_only=True)
    author_name = serializers.CharField(source='user.full_name', read_only=True)
    author_username = serializers.CharField(source='user.username', read_only=True)
    author_id = serializers.IntegerField(source='user.id', read_only=True)
    author_avatar = serializers.SerializerMethodField()
    word_count = serializers.IntegerField(read_only=True)
    is_upvoted = serializers.SerializerMethodField()
    prompt_title = serializers.CharField(source='prompt.title', read_only=True)
    prompt_story_opening = serializers.CharField(source='prompt.story_opening', read_only=True)

    class Meta:
        model = StorySubmission
        fields = (
            'id', 
            'prompt', 
            'prompt_title', 
            'prompt_story_opening', 
            'user', 
            'author', 
            'author_name', 
            'author_username', 
            'author_id', 
            'author_avatar', 
            'content', 
            'upvote_count', 
            'word_count', 
            'is_winner', 
            'is_upvoted', 
            'created_at'
        )
        read_only_fields = (
            'user', 
            'author', 
            'author_name', 
            'author_username', 
            'author_id', 
            'author_avatar', 
            'prompt', 
            'upvote_count', 
            'is_winner', 
            'created_at', 
            'word_count', 
            'is_upvoted', 
            'prompt_title', 
            'prompt_story_opening'
        )

    def get_author_avatar(self, obj):
        request = self.context.get('request')
        return resolve_avatar_url(obj.user, request)

    def get_is_upvoted(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.upvotes.filter(user=request.user).exists()
        return False

    def validate_content(self, value):
        words = value.strip().split()
        if len(words) < 30:
            raise serializers.ValidationError("Your ending must contain at least 30 words.")
        if len(words) > 350:
            raise serializers.ValidationError(
                f"Ending exceeds 350 words (current count: {len(words)})."
            )
        return value.strip()


class QuizQuestionSerializer(serializers.ModelSerializer):
    options = serializers.SerializerMethodField()

    class Meta:
        model = QuizQuestion
        fields = ('id', 'prompt', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option', 'explanation', 'options')

    def get_options(self, obj):
        return [obj.option_a, obj.option_b, obj.option_c, obj.option_d]


class QuizSetSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(many=True, read_only=True)
    book_title = serializers.SerializerMethodField()
    user_has_completed = serializers.SerializerMethodField()
    user_score = serializers.SerializerMethodField()

    class Meta:
        model = QuizSet
        fields = ('id', 'title', 'cycle', 'book_title', 'active_at', 'expires_at', 'is_active', 'questions', 'user_has_completed', 'user_score')

    def get_book_title(self, obj):
        if obj.cycle and obj.cycle.book:
            return obj.cycle.book.title
        return None

    def get_user_has_completed(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return QuizAttempt.objects.filter(quiz=obj, user=request.user).exists()
        return False

    def get_user_score(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            attempt = QuizAttempt.objects.filter(quiz=obj, user=request.user).order_by('-completed_at').first()
            if attempt:
                return attempt.score
        return None



class ClubGalleryPhotoSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)
    uploaded_by_id = serializers.IntegerField(source='uploaded_by.id', read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ClubGalleryPhoto
        fields = ('id', 'image', 'image_url', 'caption', 'event_name', 'uploaded_by', 'uploaded_by_username', 'uploaded_by_name', 'uploaded_by_id', 'uploaded_at')
        read_only_fields = ('uploaded_by', 'uploaded_by_username', 'uploaded_by_name', 'uploaded_by_id', 'uploaded_at', 'image_url')

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class DiscussionReplySerializer(serializers.ModelSerializer):
    author = serializers.CharField(source='author.username', read_only=True)
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    author_username = serializers.CharField(source='author.username', read_only=True)
    author_id = serializers.IntegerField(source='author.id', read_only=True)
    author_avatar = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()
    parent_reply_id = serializers.PrimaryKeyRelatedField(
        queryset=DiscussionReply.objects.all(),
        source='parent_reply',
        required=False,
        allow_null=True
    )
    replying_to = serializers.SerializerMethodField()

    class Meta:
        model = DiscussionReply
        fields = (
            'id', 
            'thread', 
            'author', 
            'author_name',
            'author_username',
            'author_id',
            'author_avatar', 
            'content', 
            'parent_reply',
            'parent_reply_id',
            'replying_to',
            'created_at', 
            'time_ago'
        )
        read_only_fields = ('author', 'author_name', 'author_username', 'author_id', 'author_avatar', 'created_at', 'time_ago', 'replying_to')

    def get_author_avatar(self, obj):
        request = self.context.get('request')
        return resolve_avatar_url(obj.author, request)

    def get_time_ago(self, obj):
        return f"{timesince(obj.created_at).split(',')[0]} ago"

    def get_replying_to(self, obj):
        if obj.parent_reply:
            return {
                "id": obj.parent_reply.id,
                "author": obj.parent_reply.author.username,
                "author_name": obj.parent_reply.author.full_name,
                "author_username": obj.parent_reply.author.username,
                "author_id": obj.parent_reply.author.id,
                "excerpt": (obj.parent_reply.content[:60] + '...') if len(obj.parent_reply.content) > 60 else obj.parent_reply.content
            }
        return None


class DiscussionThreadSerializer(serializers.ModelSerializer):
    author = serializers.CharField(source='user.username', read_only=True)
    author_name = serializers.CharField(source='user.full_name', read_only=True)
    author_username = serializers.CharField(source='user.username', read_only=True)
    author_id = serializers.IntegerField(source='user.id', read_only=True)
    author_avatar = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    upvotes = serializers.IntegerField(source='upvotes_count', read_only=True)
    is_upvoted = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()
    timeAgo = serializers.SerializerMethodField()
    spoilerText = serializers.CharField(source='spoiler_text', read_only=True)
    chapterTag = serializers.CharField(source='chapter_tag', read_only=True)
    replies = DiscussionReplySerializer(many=True, read_only=True)
    reply_count = serializers.SerializerMethodField()

    class Meta:
        model = DiscussionThread
        fields = (
            'id', 
            'cycle', 
            'user', 
            'author', 
            'author_name',
            'author_username',
            'author_id',
            'author_avatar', 
            'avatar', 
            'title', 
            'content', 
            'chapter_tag', 
            'chapterTag',
            'spoiler_text', 
            'spoilerText',
            'upvotes_count', 
            'upvotes', 
            'is_upvoted', 
            'replies', 
            'reply_count',
            'time_ago', 
            'timeAgo',
            'created_at'
        )
        read_only_fields = ('user', 'author', 'author_name', 'author_username', 'author_id', 'author_avatar', 'avatar', 'upvotes_count', 'upvotes', 'created_at')

    def get_author_avatar(self, obj):
        request = self.context.get('request')
        return resolve_avatar_url(obj.user, request)

    def get_avatar(self, obj):
        return self.get_author_avatar(obj)

    def get_is_upvoted(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.upvotes.filter(user=request.user).exists()
        return False

    def get_time_ago(self, obj):
        return f"{timesince(obj.created_at).split(',')[0]} ago"

    def get_timeAgo(self, obj):
        return self.get_time_ago(obj)

    def get_reply_count(self, obj):
        return obj.replies.count()


class PollOptionSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='book_title', read_only=True)
    votes = serializers.IntegerField(source='votes_count', read_only=True)
    percentage = serializers.SerializerMethodField()

    class Meta:
        model = PollOption
        fields = ('id', 'poll', 'book_title', 'title', 'author', 'genre', 'pitch', 'votes_count', 'votes', 'percentage')

    def get_percentage(self, obj):
        total_votes = sum(opt.votes_count for opt in obj.poll.options.all())
        if total_votes == 0:
            return 0
        return round((obj.votes_count / total_votes) * 100)


class BookPollSerializer(serializers.ModelSerializer):
    options = PollOptionSerializer(many=True, read_only=True)
    total_votes = serializers.SerializerMethodField()
    totalVotes = serializers.SerializerMethodField()
    has_voted = serializers.SerializerMethodField()
    hasVoted = serializers.SerializerMethodField()
    voted_option_id = serializers.SerializerMethodField()
    closesAt = serializers.SerializerMethodField()

    class Meta:
        model = BookPoll
        fields = (
            'id', 
            'title', 
            'description', 
            'is_active', 
            'closes_at', 
            'closesAt', 
            'total_votes', 
            'totalVotes', 
            'has_voted', 
            'hasVoted', 
            'voted_option_id', 
            'options', 
            'created_at'
        )

    def get_total_votes(self, obj):
        return sum(opt.votes_count for opt in obj.options.all())

    def get_totalVotes(self, obj):
        return self.get_total_votes(obj)

    def get_has_voted(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return PollVote.objects.filter(poll=obj, user=request.user).exists()
        return False

    def get_hasVoted(self, obj):
        return self.get_has_voted(obj)

    def get_voted_option_id(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            vote = PollVote.objects.filter(poll=obj, user=request.user).first()
            return vote.option_id if vote else None
        return None

    def get_closesAt(self, obj):
        if obj.closes_at:
            return obj.closes_at.strftime('%A at %H:%M')
        return 'Thursday at 23:59'


class BookProposalSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='user.username', read_only=True)
    author_name = serializers.CharField(source='user.full_name', read_only=True)
    author_id = serializers.IntegerField(source='user.id', read_only=True)
    author_avatar = serializers.SerializerMethodField()
    proposer = serializers.CharField(source='user.username', read_only=True)
    proposer_name = serializers.CharField(source='user.full_name', read_only=True)
    proposer_id = serializers.IntegerField(source='user.id', read_only=True)
    user_avatar = serializers.SerializerMethodField()
    like_count = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    has_liked = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_reported = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()

    class Meta:
        model = BookProposal
        fields = (
            'id', 
            'user', 
            'author_username', 
            'author_name',
            'author_id',
            'author_avatar',
            'proposer',
            'proposer_name',
            'proposer_id',
            'user_avatar',
            'title', 
            'author', 
            'genre', 
            'pitch', 
            'like_count', 
            'likes_count',
            'has_liked', 
            'is_liked',
            'is_reported',
            'time_ago',
            'created_at'
        )
        read_only_fields = ('user', 'created_at')

    def get_user_avatar(self, obj):
        request = self.context.get('request')
        return resolve_avatar_url(obj.user, request)

    def get_author_avatar(self, obj):
        return self.get_user_avatar(obj)

    def get_like_count(self, obj):
        return obj.likes.count()

    def get_likes_count(self, obj):
        return self.get_like_count(obj)

    def get_has_liked(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False

    def get_is_liked(self, obj):
        return self.get_has_liked(obj)

    def get_is_reported(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.reports.filter(reporter=request.user).exists()
        return False

    def get_time_ago(self, obj):
        return f"{timesince(obj.created_at).split(',')[0]} ago"


class ContentReportSerializer(serializers.ModelSerializer):
    reporter_username = serializers.CharField(source='reporter.username', read_only=True)
    reporter_name = serializers.CharField(source='reporter.full_name', read_only=True)
    thread_title = serializers.CharField(source='thread.title', read_only=True)
    thread_author = serializers.CharField(source='thread.user.username', read_only=True)
    reply_author = serializers.CharField(source='reply.author.username', read_only=True)
    submission_author = serializers.CharField(source='submission.user.username', read_only=True)
    submission_prompt = serializers.CharField(source='submission.prompt.title', read_only=True)
    proposal_title = serializers.CharField(source='proposal.title', read_only=True)
    proposal_author = serializers.CharField(source='proposal.author', read_only=True)
    content_snippet = serializers.SerializerMethodField()
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)
    resolved_by_username = serializers.CharField(source='resolved_by.username', read_only=True)

    class Meta:
        model = ContentReport
        fields = (
            'id',
            'reporter',
            'reporter_username',
            'reporter_name',
            'thread',
            'thread_title',
            'thread_author',
            'reply',
            'reply_author',
            'submission',
            'submission_author',
            'submission_prompt',
            'proposal',
            'proposal_title',
            'proposal_author',
            'content_snippet',
            'reason',
            'reason_display',
            'details',
            'is_resolved',
            'resolved_by',
            'resolved_by_username',
            'created_at'
        )
        read_only_fields = ('reporter', 'is_resolved', 'resolved_by', 'created_at')

    def get_content_snippet(self, obj):
        if obj.thread:
            return obj.thread.content[:200]
        if obj.reply:
            return obj.reply.content[:200]
        if obj.submission:
            return obj.submission.content[:200]
        if obj.proposal:
            return f"{obj.proposal.title} by {obj.proposal.author}: {obj.proposal.pitch}"[:200]
        return ''



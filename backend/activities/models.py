from django.db import models
from django.conf import settings

class StoryPrompt(models.Model):
    class PromptType(models.TextChoices):
        ORIGINAL_HOOK = 'ORIGINAL_HOOK', 'Original Hook'
        ALTERNATE_ENDING = 'ALTERNATE_ENDING', 'Alternate Ending'

    title = models.CharField(max_length=200, default='Weekly Story Challenge')
    prompt_type = models.CharField(max_length=30, choices=PromptType.choices, default="ORIGINAL_HOOK")
    story_opening = models.TextField(help_text="The 1-2 paragraph premise or cliffhanger", default="")
    opens_at = models.DateTimeField()
    closes_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Prompt #{self.id}: \"{self.title}\" ({self.get_prompt_type_display()})"


class StorySubmission(models.Model):
    prompt = models.ForeignKey(StoryPrompt, on_delete=models.CASCADE, related_name='submissions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='story_submissions')
    content = models.TextField(help_text="Member's creative conclusion (30-350 words)")
    upvote_count = models.IntegerField(default=0)
    is_winner = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('prompt', 'user')

    @property
    def word_count(self):
        return len(self.content.strip().split()) if self.content else 0

    def __str__(self):
        return f"Ending for \"{self.prompt.title}\" by {self.user.username} ({self.upvote_count} votes)"


class StoryUpvote(models.Model):
    submission = models.ForeignKey(StorySubmission, on_delete=models.CASCADE, related_name='upvotes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('submission', 'user')

    def __str__(self):
        return f"{self.user.username} upvoted Submission #{self.submission.id}"


class QuizSet(models.Model):
    cycle = models.ForeignKey('cycles.ReadingCycle', on_delete=models.CASCADE, related_name='quizzes')
    title = models.CharField(max_length=255)
    active_at = models.DateTimeField()
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Quiz: {self.title}"


class QuizQuestion(models.Model):
    class CorrectOption(models.TextChoices):
        A = 'A', 'Option A'
        B = 'B', 'Option B'
        C = 'C', 'Option C'
        D = 'D', 'Option D'

    quiz = models.ForeignKey(QuizSet, on_delete=models.CASCADE, related_name='questions')
    prompt = models.TextField()
    option_a = models.CharField(max_length=255)
    option_b = models.CharField(max_length=255)
    option_c = models.CharField(max_length=255)
    option_d = models.CharField(max_length=255)
    correct_option = models.CharField(max_length=1, choices=CorrectOption.choices, default=CorrectOption.A)
    explanation = models.TextField()

    def __str__(self):
        return f"Q #{self.id} for {self.quiz.title}"


class QuizAttempt(models.Model):
    quiz = models.ForeignKey(QuizSet, on_delete=models.CASCADE, related_name='attempts')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quiz_attempts')
    score = models.IntegerField(default=0)
    completed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} scored {self.score}/5 on {self.quiz.title}"


class DiscussionThread(models.Model):
    cycle = models.ForeignKey('cycles.ReadingCycle', on_delete=models.SET_NULL, null=True, blank=True, related_name='threads')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='discussion_threads')
    title = models.CharField(max_length=255)
    content = models.TextField()
    chapter_tag = models.CharField(max_length=100, blank=True, default="General Discussion")
    spoiler_text = models.TextField(blank=True, null=True, help_text="Markdown spoiler text (>!spoiler!<)")
    upvotes_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Thread: \"{self.title}\" by {self.user.username}"


class DiscussionReply(models.Model):
    thread = models.ForeignKey(DiscussionThread, on_delete=models.CASCADE, related_name='replies')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='discussion_replies')
    parent_reply = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='child_replies'
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Reply by {self.author.username} on Thread #{self.thread.id}"


class ThreadUpvote(models.Model):
    thread = models.ForeignKey(DiscussionThread, on_delete=models.CASCADE, related_name='upvotes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('thread', 'user')

    def __str__(self):
        return f"{self.user.username} upvoted Thread #{self.thread.id}"


class BookPoll(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    closes_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Poll: {self.title} (Active: {self.is_active})"


class PollOption(models.Model):
    poll = models.ForeignKey(BookPoll, related_name='options', on_delete=models.CASCADE)
    book_title = models.CharField(max_length=200)
    author = models.CharField(max_length=200)
    genre = models.CharField(max_length=100, default='Ethiopian Literature')
    pitch = models.TextField(blank=True)
    votes_count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.book_title} by {self.author} ({self.votes_count} votes)"


class PollVote(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    poll = models.ForeignKey(BookPoll, on_delete=models.CASCADE, related_name='votes')
    option = models.ForeignKey(PollOption, on_delete=models.CASCADE, related_name='votes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'poll')

    def __str__(self):
        return f"{self.user.username} voted for {self.option.book_title}"


class BookProposal(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='book_proposals')
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=200)
    genre = models.CharField(max_length=100, default='Ethiopian Literature')
    pitch = models.TextField()
    likes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='liked_proposals', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Pitch: {self.title} by {self.author} (suggested by {self.user.username})"


class ContentReport(models.Model):
    class Reason(models.TextChoices):
        HARASSMENT = 'HARASSMENT', 'Harassment or Inappropriate Tone'
        SPOILER = 'SPOILER', 'Unmarked Critical Spoilers'
        IRRELEVANT = 'IRRELEVANT', 'Spam or Inappropriate Pitch'
        OTHER = 'OTHER', 'Other Policy Violation'

    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reports_filed')
    thread = models.ForeignKey(DiscussionThread, null=True, blank=True, on_delete=models.CASCADE, related_name='reports')
    reply = models.ForeignKey(DiscussionReply, null=True, blank=True, on_delete=models.CASCADE, related_name='reports')
    submission = models.ForeignKey(StorySubmission, null=True, blank=True, on_delete=models.CASCADE, related_name='reports')
    proposal = models.ForeignKey(BookProposal, null=True, blank=True, on_delete=models.CASCADE, related_name='reports')
    reason = models.CharField(max_length=30, choices=Reason.choices, default=Reason.OTHER)
    details = models.TextField(blank=True, default='')
    is_resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='reports_resolved')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if self.thread_id:
            target = f"Thread #{self.thread_id}"
        elif self.reply_id:
            target = f"Reply #{self.reply_id}"
        elif self.submission_id:
            target = f"Submission #{self.submission_id}"
        elif self.proposal_id:
            target = f"Proposal #{self.proposal_id}"
        else:
            target = "General Content"
        return f"Report #{self.id} on {target} by {self.reporter.username} [{self.get_reason_display()}]"


class ClubGalleryPhoto(models.Model):
    image = models.ImageField(upload_to='gallery/')
    caption = models.CharField(max_length=255, blank=True, default='')
    event_name = models.CharField(max_length=150, default='Club Meetup')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='gallery_photos')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.event_name}: {self.caption[:30]} ({self.uploaded_at.strftime('%Y-%m-%d')})"




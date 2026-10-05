from django.contrib import admin
from .models import (
    StoryPrompt, 
    StorySubmission, 
    StoryUpvote, 
    QuizSet, 
    QuizQuestion, 
    QuizAttempt, 
    DiscussionThread
)

@admin.register(StoryPrompt)
class StoryPromptAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'prompt_type', 'opens_at', 'closes_at', 'is_active')
    list_filter = ('prompt_type', 'is_active')
    search_fields = ('title', 'story_opening')


@admin.register(StorySubmission)
class StorySubmissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'prompt', 'user', 'upvote_count', 'is_winner', 'created_at')
    list_filter = ('is_winner', 'created_at')
    search_fields = ('content', 'user__username')


@admin.register(StoryUpvote)
class StoryUpvoteAdmin(admin.ModelAdmin):
    list_display = ('submission', 'user', 'created_at')


class QuizQuestionInline(admin.TabularInline):
    model = QuizQuestion
    extra = 1


@admin.register(QuizSet)
class QuizSetAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'cycle', 'active_at')
    inlines = [QuizQuestionInline]


@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'quiz', 'prompt', 'correct_option')


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'quiz', 'score', 'completed_at')


@admin.register(DiscussionThread)
class DiscussionThreadAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'cycle', 'created_at')
    search_fields = ('title', 'content')

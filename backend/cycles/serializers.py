from rest_framework import serializers
from .models import ReadingCycle, Meeting, AttendanceRecord, Announcement
from books.serializers import BookSerializer

class ReadingCycleSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)
    milestones = serializers.SerializerMethodField()
    meeting_weekday = serializers.SerializerMethodField()
    display_title = serializers.SerializerMethodField()

    class Meta:
        model = ReadingCycle
        fields = ('id', 'book', 'start_date', 'meeting_date', 'meeting_title', 'meeting_weekday', 'display_title', 'is_active', 'milestones')

    def get_meeting_weekday(self, obj):
        if obj.meeting_date:
            return obj.meeting_date.strftime('%A')
        return 'Review'

    def get_display_title(self, obj):
        if obj.meeting_title:
            return obj.meeting_title
        if obj.meeting_date:
            return f"{obj.meeting_date.strftime('%A')} Review"
        return "Club Review Gathering"

    def get_milestones(self, obj):
        total = obj.book.total_pages if obj.book else 340
        return {
            'week1': {'label': 'Week 1 Milestone', 'pages': f'1 to {int(total * 0.33)} (33%)', 'percentage': 33},
            'week2': {'label': 'Week 2 Target', 'pages': f'{int(total * 0.33) + 1} to {int(total * 0.66)} (66%)', 'percentage': 66},
            'week3': {'label': 'Week 3 Final Sprint', 'pages': f'{int(total * 0.66) + 1} to {total} (100%)', 'percentage': 100},
        }


class MeetingSerializer(serializers.ModelSerializer):
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = Meeting
        fields = ('id', 'cycle', 'meeting_datetime', 'passcode_generated_at', 'expires_at', 'is_active', 'is_expired')

    def get_is_expired(self, obj):
        if not obj.passcode_generated_at or not obj.expires_at:
            return True
        from django.utils import timezone
        return timezone.now() > obj.expires_at


class AttendanceRecordSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    avatar = serializers.CharField(source='user.avatar', read_only=True)
    streak = serializers.IntegerField(source='user.current_streak', read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = ('id', 'user', 'username', 'user_email', 'avatar', 'streak', 'meeting', 'checked_in_at')


class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ('id', 'title', 'content', 'category', 'is_banner', 'is_active', 'created_at')


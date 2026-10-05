from django.db import models
from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password

class ReadingCycle(models.Model):
    book = models.ForeignKey('books.Book', on_delete=models.CASCADE, related_name='reading_cycles')
    start_date = models.DateField()
    meeting_date = models.DateField()
    meeting_title = models.CharField(max_length=255, blank=True, default='', help_text="Optional gathering label e.g. Saturday Review")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Cycle #{self.id} - {self.book.title} ({self.meeting_date})"


class Meeting(models.Model):
    cycle = models.ForeignKey(ReadingCycle, on_delete=models.CASCADE, related_name='meetings')
    meeting_datetime = models.DateTimeField(help_text="Meeting start time")
    passcode = models.CharField(max_length=255, blank=True, default='', help_text="Raw 4-digit passcode (kept for admin desk display only)")
    passcode_hash = models.CharField(max_length=255, blank=True, default='', help_text="Hashed passcode for secure check-in verification")
    passcode_generated_at = models.DateTimeField(null=True, blank=True, help_text="Timestamp when passcode was generated")
    expires_at = models.DateTimeField(null=True, blank=True, help_text="Passcode expiration timestamp (4-hour limit)")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Meeting #{self.id} for Cycle #{self.cycle.id} ({self.meeting_datetime.strftime('%Y-%m-%d %H:%M')})"


class AttendanceRecord(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attendance_records')
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='attendances')
    checked_in_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'meeting')

    def __str__(self):
        return f"{self.user.username} checked in for Meeting #{self.meeting.id} at {self.checked_in_at}"


class Announcement(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    category = models.CharField(max_length=50, default='#Meetup')
    is_banner = models.BooleanField(default=False, help_text="Pinned top banner across Home")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{'[BANNER] ' if self.is_banner else ''}[{self.category}] {self.title}"


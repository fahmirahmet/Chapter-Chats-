from django.contrib import admin
from .models import ReadingCycle, Meeting, AttendanceRecord

@admin.register(ReadingCycle)
class ReadingCycleAdmin(admin.ModelAdmin):
    list_display = ('id', 'book', 'start_date', 'meeting_date', 'is_active')
    list_filter = ('is_active', 'meeting_date')
    search_fields = ('book__title',)


@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ('id', 'cycle', 'meeting_datetime', 'passcode', 'expires_at', 'is_active')
    list_filter = ('is_active', 'meeting_datetime')
    search_fields = ('passcode', 'cycle__book__title')


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ('user', 'meeting', 'checked_in_at')
    list_filter = ('checked_in_at',)
    search_fields = ('user__username', 'meeting__passcode')

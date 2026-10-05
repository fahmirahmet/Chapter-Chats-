from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Badge, UserBadge

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'role', 'current_streak', 'total_xp', 'current_page_read', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Community Stats & Role', {'fields': ('role', 'current_streak', 'total_xp', 'current_page_read', 'avatar')}),
    )


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ('name', 'tier', 'icon_slug', 'description')
    list_filter = ('tier',)
    search_fields = ('name', 'description')


@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ('user', 'badge', 'awarded_at')
    list_filter = ('badge__tier', 'awarded_at')
    search_fields = ('user__username', 'badge__name')

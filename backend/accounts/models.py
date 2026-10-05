from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager


class CustomUserManager(UserManager):
    def create_user(self, phone_number=None, password=None, **extra_fields):
        if not phone_number:
            phone_number = extra_fields.get('username')
        if not phone_number:
            raise ValueError('The phone_number must be set.')
        
        username = extra_fields.pop('username', None)
        phone_str = str(phone_number).replace('+', '').strip()
        if not username or username.isdigit() or username == phone_number or username == phone_str or username.startswith('251') or username.startswith('+251'):
            import re
            full_name = extra_fields.get('full_name') or extra_fields.get('first_name', '')
            base = re.sub(r'[^a-zA-Z0-9_]', '', full_name.strip().lower().replace(' ', '_')) if full_name else 'reader'
            if not base:
                base = 'reader'
            username = base
            counter = 1
            while self.model.objects.filter(username__iexact=username).exists():
                username = f"{base}_{counter}"
                counter += 1

        return super().create_user(username=username, password=password, phone_number=phone_number, **extra_fields)

    def create_superuser(self, phone_number=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')
        if not phone_number:
            phone_number = extra_fields.get('username') or '+251900000000'
        return self.create_user(phone_number=phone_number, password=password, **extra_fields)


class User(AbstractUser):
    class Role(models.TextChoices):
        OWNER = 'OWNER', 'Club President (Owner)'
        OFFICER = 'OFFICER', 'Executive Officer'
        MEMBER = 'MEMBER', 'Club Member'
        ADMIN = 'ADMIN', 'Club Executive / Admin'
        GUEST = 'GUEST', 'Guest / Visitor'

    class OfficerTitle(models.TextChoices):
        PRESIDENT = 'PRESIDENT', 'Club President'
        VICE_PRESIDENT = 'VICE_PRESIDENT', 'Vice President'
        SOCIAL_MEDIA_LEAD = 'SOCIAL_MEDIA_LEAD', 'Social Media Lead'
        RESEARCH_LEAD = 'RESEARCH_LEAD', 'Research & Editorial Lead'
        EVENT_LEAD = 'EVENT_LEAD', 'Event Organizing Lead'
        FINANCE_LEAD = 'FINANCE_LEAD', 'Finance Lead'
        NONE = 'NONE', 'General Member'

    phone_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    full_name = models.CharField(max_length=150, blank=True, default='')
    year_of_study = models.CharField(max_length=50, blank=True, default='')
    department = models.CharField(max_length=100, blank=True, default='')
    telegram_chat_id = models.CharField(max_length=50, blank=True, null=True)
    verification_code = models.CharField(max_length=10, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    email = models.EmailField(blank=True, null=True, default='')
    username = models.CharField(max_length=150, unique=True, blank=True, null=True)

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = ['full_name']

    objects = CustomUserManager()

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MEMBER)
    officer_title = models.CharField(max_length=30, choices=OfficerTitle.choices, default=OfficerTitle.NONE)
    current_streak = models.IntegerField(default=0)
    total_xp = models.IntegerField(default=0)
    current_page_read = models.IntegerField(default=0)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    top_book_1 = models.CharField(max_length=150, blank=True, default='')
    top_book_2 = models.CharField(max_length=150, blank=True, default='')
    top_book_3 = models.CharField(max_length=150, blank=True, default='')
    bio = models.TextField(blank=True, default='')

    @property
    def is_president_or_owner(self):
        return self.is_superuser or self.role == self.Role.OWNER or self.officer_title == self.OfficerTitle.PRESIDENT

    @property
    def is_executive_officer(self):
        return (
            self.is_staff or 
            self.is_superuser or 
            self.role in [self.Role.OWNER, self.Role.OFFICER, self.Role.ADMIN] or 
            self.officer_title not in [self.OfficerTitle.NONE, '']
        )

    @property
    def is_banned(self):
        return not self.is_active

    def __str__(self):
        title = self.get_officer_title_display() if self.officer_title != self.OfficerTitle.NONE else self.get_role_display()
        display_name = self.full_name or self.username or self.phone_number or f"User #{self.id}"
        return f"{display_name} [{title}]"


class Badge(models.Model):
    class Tier(models.TextChoices):
        GOLD = 'GOLD', 'Gold Tier'
        SILVER = 'SILVER', 'Silver Tier'
        BRONZE = 'BRONZE', 'Bronze Tier'

    name = models.CharField(max_length=100)
    description = models.TextField()
    tier = models.CharField(max_length=20, choices=Tier.choices, default=Tier.SILVER)
    icon_slug = models.CharField(max_length=50, help_text="Lucide icon identifier")

    def __str__(self):
        return f"{self.name} [{self.get_tier_display()}]"


class UserBadge(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE, related_name='awarded_users')
    awarded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'badge')

    def __str__(self):
        return f"{self.user.username} -> {self.badge.name}"


from django.conf import settings

class MembershipApplication(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Review'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    full_name = models.CharField(max_length=150)
    email = models.EmailField(blank=True, null=True, default='')
    password = models.CharField(max_length=128, blank=True, default='')
    phone_number = models.CharField(max_length=20, blank=True, default='')
    year_of_study = models.CharField(max_length=50, blank=True, default='')
    department = models.CharField(max_length=100, blank=True, default='')
    favorite_book = models.CharField(max_length=200, blank=True, default='')
    policy_agreed = models.BooleanField(default=False)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='reviewed_applications')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        ident = self.phone_number or self.full_name or self.email or str(self.id)
        return f"Application #{self.id}: {self.full_name} ({ident}) - [{self.get_status_display()}]"


class FinanceRecord(models.Model):
    class RecordType(models.TextChoices):
        CONTRIBUTION = 'CONTRIBUTION', 'Member Contribution / Dues'
        SPONSORSHIP = 'SPONSORSHIP', 'Corporate / University Sponsorship'
        DONATION = 'DONATION', 'Patron / Alumni Donation'
        EXPENSE = 'EXPENSE', 'Book Acquisition & Event Expense'

    title = models.CharField(max_length=200)
    record_type = models.CharField(max_length=30, choices=RecordType.choices, default=RecordType.CONTRIBUTION)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='ETB')
    contributor_name = models.CharField(max_length=150, blank=True, default='')
    member = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='financial_records')
    notes = models.TextField(blank=True, default='')
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='records_logged')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.get_record_type_display()}] {self.title}: {self.amount} {self.currency}"


class PresidentialLineage(models.Model):
    name = models.CharField(max_length=150)
    tenure = models.CharField(max_length=100) # e.g., "2023–2025 (Founding President)"
    bio = models.TextField()
    favorite_book = models.CharField(max_length=200, blank=True, default='')
    image = models.ImageField(upload_to='lineage/', null=True, blank=True)
    avatar_url = models.CharField(max_length=500, blank=True, default='')
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.name} ({self.tenure})"


class ExecutiveLeader(models.Model):
    name = models.CharField(max_length=150)
    role = models.CharField(max_length=100) # e.g. "Club President", "Lead Cycle Coordinator"
    bio = models.TextField(blank=True, default='')
    favorite_genre = models.CharField(max_length=150, blank=True, default='')
    currently_reading = models.CharField(max_length=200, blank=True, default='')
    image = models.ImageField(upload_to='leadership/', null=True, blank=True)
    avatar_url = models.CharField(max_length=500, blank=True, default='')
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.name} - {self.role}"




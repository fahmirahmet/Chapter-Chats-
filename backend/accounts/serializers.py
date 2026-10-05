from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.hashers import make_password, identify_hasher
from django.db.models import Q
from .models import User, Badge, UserBadge, MembershipApplication, FinanceRecord, PresidentialLineage, ExecutiveLeader
from .validators import validate_phone_number, validate_optional_email


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Phone-based JWT Token Obtain serializer for Chapter & Chats.
    Enforces phone_number as primary credential alongside password.
    Supports phone_number, phone, or username aliases.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['phone_number'] = serializers.CharField(required=False)
        if 'phone' in self.fields:
            self.fields['phone'].required = False
        if 'username' in self.fields:
            self.fields['username'].required = False
        if 'email' in self.fields:
            self.fields['email'].required = False

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = user.role
        token['is_superuser'] = user.is_superuser
        token['is_staff'] = user.is_staff
        return token

    def validate(self, attrs):
        raw_phone = attrs.get('phone_number') or attrs.get('phone') or attrs.get('username')
        password = attrs.get('password')
        if not raw_phone or not password:
            raise serializers.ValidationError({'detail': 'Please provide your phone number and password.'})

        phone_str = str(raw_phone).strip().replace(" ", "").replace("-", "")
        norm_phone = None
        try:
            norm_phone = validate_phone_number(phone_str)
        except Exception:
            norm_phone = phone_str

        import re
        filters = Q(phone_number=norm_phone) | Q(phone_number=phone_str) | Q(username__iexact=phone_str)
        digits = re.sub(r'\D', '', phone_str)
        if len(digits) >= 9:
            filters |= Q(phone_number__endswith=digits[-9:])

        matched_user = User.objects.filter(filters).first()

        if not matched_user:
            raise serializers.ValidationError({'detail': 'No active account found with the given phone number.'})

        # Set username field for SimpleJWT's internal authenticate()
        attrs['username'] = matched_user.phone_number or matched_user.username
        attrs['phone_number'] = matched_user.phone_number
        data = super().validate(attrs)
        
        # Explicit user payload with superuser state
        avatar_url = None
        if self.user.avatar:
            try:
                avatar_url = self.user.avatar.url
            except Exception:
                avatar_url = str(self.user.avatar)

        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'full_name': getattr(self.user, 'full_name', '') or self.user.get_full_name(),
            'phone_number': self.user.phone_number,
            'role': self.user.role,
            'is_superuser': self.user.is_superuser,
            'is_staff': self.user.is_staff,
            'current_streak': getattr(self.user, 'current_streak', 0),
            'total_xp': getattr(self.user, 'total_xp', 0),
            'avatar': avatar_url,
        }
        return data


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    full_name = serializers.CharField(required=True)
    phone_number = serializers.CharField(required=True)
    email = serializers.EmailField(required=False, allow_blank=True, default='')

    class Meta:
        model = User
        fields = (
            'id', 
            'phone_number', 
            'full_name', 
            'year_of_study', 
            'department', 
            'email', 
            'password', 
            'role'
        )

    def validate_phone_number(self, value):
        norm = validate_phone_number(value)
        if User.objects.filter(phone_number=norm).exists():
            raise serializers.ValidationError("An account with this phone number already exists.")
        return norm

    def validate_email(self, value):
        if not value:
            return ""
        return validate_optional_email(value)

    def create(self, validated_data):
        from .telegram_utils import generate_verification_code, send_telegram_verification

        phone_number = validated_data['phone_number']
        full_name = validated_data.get('full_name', '')
        
        import re
        base_user = re.sub(r'[^a-zA-Z0-9_]', '', full_name.strip().lower().replace(' ', '_')) if full_name else 'reader'
        if not base_user:
            base_user = 'reader'
        username = base_user
        counter = 1
        while User.objects.filter(username__iexact=username).exists():
            username = f"{base_user}_{counter}"
            counter += 1

        name_parts = full_name.split(None, 1)
        first_name = name_parts[0] if name_parts else ''
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        code = generate_verification_code()
        user = User.objects.create_user(
            phone_number=phone_number,
            username=username,
            password=validated_data['password'],
            full_name=full_name,
            first_name=first_name,
            last_name=last_name,
            year_of_study=validated_data.get('year_of_study', ''),
            department=validated_data.get('department', ''),
            email=validated_data.get('email', '') or '',
            role=validated_data.get('role', User.Role.MEMBER),
            verification_code=code,
            is_verified=False,
            is_active=True
        )

        # Dispatch verification code via Telegram
        send_telegram_verification(phone_number, code)
        return user


class AdminQuickAddMemberSerializer(serializers.Serializer):
    """
    Serializer for admin quick-add member onboarding endpoint.
    Accepts full_name, phone_number, year_of_study, and department.
    """
    full_name = serializers.CharField(max_length=150)
    phone_number = serializers.CharField(max_length=20)
    year_of_study = serializers.CharField(max_length=50, required=False, allow_blank=True, default='2nd Year (Sophomore)')
    department = serializers.CharField(max_length=100, required=False, allow_blank=True, default='Software Engineering')

    def validate_phone_number(self, value):
        norm = validate_phone_number(value)
        if User.objects.filter(phone_number=norm).exists():
            raise serializers.ValidationError(f"A member with phone number {norm} already exists.")
        return norm


class BadgeSerializer(serializers.ModelSerializer):
    tier_display = serializers.CharField(source='get_tier_display', read_only=True)
    icon_name = serializers.CharField(source='icon_slug', read_only=True)
    tierColor = serializers.SerializerMethodField()

    class Meta:
        model = Badge
        fields = ('id', 'name', 'description', 'tier', 'tier_display', 'tierColor', 'icon_slug', 'icon_name')

    def get_tierColor(self, obj):
        colors = {
            'GOLD': 'bg-amber-100 text-amber-900 border-amber-300',
            'SILVER': 'bg-slate-100 text-slate-900 border-slate-300',
            'BRONZE': 'bg-orange-100 text-orange-900 border-orange-300',
        }
        return colors.get(obj.tier, 'bg-amber-100 text-amber-900 border-amber-300')


class UserBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer(read_only=True)

    class Meta:
        model = UserBadge
        fields = ('badge', 'awarded_at')


class UserProfileSerializer(serializers.ModelSerializer):
    user_badges = UserBadgeSerializer(many=True, read_only=True)
    badges = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    officer_title_display = serializers.CharField(source='get_officer_title_display', read_only=True)
    is_president = serializers.BooleanField(source='is_president_or_owner', read_only=True)
    is_executive = serializers.BooleanField(source='is_executive_officer', read_only=True)
    meeting_streak = serializers.IntegerField(source='current_streak', read_only=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 
            'phone_number',
            'full_name',
            'year_of_study',
            'department',
            'telegram_chat_id',
            'is_verified',
            'username', 
            'email', 
            'first_name',
            'last_name',
            'role', 
            'role_display', 
            'officer_title',
            'officer_title_display',
            'is_president',
            'is_executive',
            'is_staff',
            'is_superuser',
            'current_streak', 
            'meeting_streak',
            'total_xp', 
            'current_page_read', 
            'avatar', 
            'avatar_url',
            'top_book_1',
            'top_book_2',
            'top_book_3',
            'bio',
            'date_joined',
            'user_badges',
            'badges'
        )
        read_only_fields = (
            'id', 
            'phone_number',
            'role', 
            'role_display', 
            'officer_title', 
            'officer_title_display', 
            'is_president', 
            'is_executive', 
            'is_staff', 
            'is_superuser', 
            'current_streak', 
            'meeting_streak', 
            'total_xp', 
            'date_joined', 
            'user_badges', 
            'badges'
        )

    def get_avatar_url(self, obj):
        if obj.avatar:
            try:
                request = self.context.get('request')
                if request and hasattr(obj.avatar, 'url'):
                    return request.build_absolute_uri(obj.avatar.url)
                url = obj.avatar.url if hasattr(obj.avatar, 'url') else str(obj.avatar)
                if url.startswith('/media/') or url.startswith('media/'):
                    clean_path = url if url.startswith('/') else f"/{url}"
                    return f"http://localhost:8000{clean_path}"
                return url
            except Exception:
                return str(obj.avatar)
        return None

    def get_badges(self, obj):
        user_badges = obj.user_badges.select_related('badge').all()
        result = []
        tier_colors = {
            'GOLD': 'bg-amber-100 text-amber-900 border-amber-300',
            'SILVER': 'bg-slate-100 text-slate-900 border-slate-300',
            'BRONZE': 'bg-orange-100 text-orange-900 border-orange-300',
        }
        for ub in user_badges:
            b = ub.badge
            result.append({
                'id': b.id,
                'name': b.name,
                'description': b.description,
                'criteria': b.description,
                'tier': b.get_tier_display(),
                'tierColor': tier_colors.get(b.tier, 'bg-amber-100 text-amber-900 border-amber-300'),
                'iconName': b.icon_slug,
                'icon_slug': b.icon_slug,
                'isUnlocked': True,
                'is_unlocked': True,
                'unlockedAt': ub.awarded_at.strftime('%b %d, %Y') if ub.awarded_at else 'Recently',
                'earned_at': ub.awarded_at.isoformat() if ub.awarded_at else None,
            })
        return result


class PublicUserProfileSerializer(serializers.ModelSerializer):
    user_badges = UserBadgeSerializer(many=True, read_only=True)
    badges = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    officer_title_display = serializers.CharField(source='get_officer_title_display', read_only=True)
    is_president = serializers.BooleanField(source='is_president_or_owner', read_only=True)
    is_executive = serializers.BooleanField(source='is_executive_officer', read_only=True)
    meeting_streak = serializers.IntegerField(source='current_streak', read_only=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'full_name',
            'year_of_study',
            'department',
            'role',
            'role_display',
            'officer_title',
            'officer_title_display',
            'is_president',
            'is_executive',
            'current_streak',
            'meeting_streak',
            'total_xp',
            'current_page_read',
            'avatar',
            'avatar_url',
            'top_book_1',
            'top_book_2',
            'top_book_3',
            'bio',
            'date_joined',
            'user_badges',
            'badges'
        )

    def get_avatar_url(self, obj):
        if obj.avatar:
            try:
                request = self.context.get('request')
                if request and hasattr(obj.avatar, 'url'):
                    return request.build_absolute_uri(obj.avatar.url)
                url = obj.avatar.url if hasattr(obj.avatar, 'url') else str(obj.avatar)
                if url.startswith('/media/') or url.startswith('media/'):
                    clean_path = url if url.startswith('/') else f"/{url}"
                    return f"http://localhost:8000{clean_path}"
                return url
            except Exception:
                return str(obj.avatar)
        return None

    def get_badges(self, obj):
        user_badges = obj.user_badges.select_related('badge').all()
        result = []
        tier_colors = {
            'GOLD': 'bg-amber-100 text-amber-900 border-amber-300',
            'SILVER': 'bg-slate-100 text-slate-900 border-slate-300',
            'BRONZE': 'bg-orange-100 text-orange-900 border-orange-300',
        }
        for ub in user_badges:
            b = ub.badge
            result.append({
                'id': b.id,
                'name': b.name,
                'description': b.description,
                'criteria': b.description,
                'tier': b.get_tier_display(),
                'tierColor': tier_colors.get(b.tier, 'bg-amber-100 text-amber-900 border-amber-300'),
                'iconName': b.icon_slug,
                'icon_slug': b.icon_slug,
                'isUnlocked': True,
                'is_unlocked': True,
                'unlockedAt': ub.awarded_at.strftime('%b %d, %Y') if ub.awarded_at else 'Recently',
                'earned_at': ub.awarded_at.isoformat() if ub.awarded_at else None,
            })
        return result


class MembershipApplicationSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(required=True)
    name = serializers.CharField(source='full_name', required=False)
    phone_number = serializers.CharField(required=True)
    phone = serializers.CharField(source='phone_number', required=False)
    email = serializers.EmailField(required=False, allow_blank=True, default='')
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True, default='')
    year_of_study = serializers.CharField(required=False, allow_blank=True, default='')
    favorite_book = serializers.CharField(required=False, allow_blank=True, default='')
    genre = serializers.CharField(source='favorite_book', required=False, allow_blank=True)
    policy_agreed = serializers.BooleanField(required=False, default=False)
    reviewed_by_username = serializers.CharField(source='reviewed_by.username', read_only=True)
    username = serializers.SerializerMethodField()

    def get_username(self, obj):
        user = User.objects.filter(phone_number=obj.phone_number).first()
        if user:
            return user.username
        return obj.phone_number or (obj.email.split('@')[0] if obj.email else '')

    class Meta:
        model = MembershipApplication
        fields = (
            'id',
            'full_name',
            'name',
            'username',
            'phone_number',
            'phone',
            'email',
            'password',
            'department',
            'year_of_study',
            'favorite_book',
            'genre',
            'policy_agreed',
            'reviewed_by',
            'reviewed_by_username',
            'status',
            'created_at'
        )
        read_only_fields = ('id', 'status', 'reviewed_by', 'created_at')

    def to_internal_value(self, data):
        data_dict = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'name' in data_dict and not data_dict.get('full_name'):
            data_dict['full_name'] = data_dict['name']
        if 'phone' in data_dict and not data_dict.get('phone_number'):
            data_dict['phone_number'] = data_dict['phone']
        if 'genre' in data_dict and not data_dict.get('favorite_book'):
            data_dict['favorite_book'] = data_dict['genre']
        return super().to_internal_value(data_dict)

    def validate_phone_number(self, value):
        return validate_phone_number(value)

    def validate_email(self, value):
        if not value:
            return ""
        return validate_optional_email(value)

    def validate(self, data):
        if not data.get('full_name'):
            raise serializers.ValidationError({'full_name': 'Full name is required.'})
        if not data.get('phone_number'):
            raise serializers.ValidationError({'phone_number': 'Phone number is required.'})
        return data

    def create(self, validated_data):
        password = validated_data.get('password')
        if password:
            is_hashed = False
            try:
                identify_hasher(password)
                is_hashed = True
            except ValueError:
                is_hashed = False

            known_prefixes = ('pbkdf2_sha256$', 'pbkdf2_sha1$', 'argon2', 'bcrypt$', 'scrypt$')
            if any(password.startswith(p) for p in known_prefixes):
                is_hashed = True

            if not is_hashed:
                validated_data['password'] = make_password(password)

        return super().create(validated_data)


class UserRosterSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    officer_title_display = serializers.CharField(source='get_officer_title_display', read_only=True)
    is_president = serializers.BooleanField(source='is_president_or_owner', read_only=True)
    is_executive = serializers.BooleanField(source='is_executive_officer', read_only=True)
    meeting_streak = serializers.IntegerField(source='current_streak', read_only=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'phone_number',
            'full_name',
            'year_of_study',
            'department',
            'telegram_chat_id',
            'is_verified',
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'role_display',
            'officer_title',
            'officer_title_display',
            'is_president',
            'is_executive',
            'total_xp',
            'current_streak',
            'meeting_streak',
            'is_active',
            'is_staff',
            'is_superuser',
            'avatar',
            'avatar_url',
            'date_joined'
        )

    def get_avatar_url(self, obj):
        if obj.avatar:
            try:
                request = self.context.get('request')
                if request and hasattr(obj.avatar, 'url'):
                    return request.build_absolute_uri(obj.avatar.url)
                url = obj.avatar.url if hasattr(obj.avatar, 'url') else str(obj.avatar)
                if url.startswith('/media/') or url.startswith('media/'):
                    clean_path = url if url.startswith('/') else f"/{url}"
                    return f"http://localhost:8000{clean_path}"
                return url
            except Exception:
                return str(obj.avatar)
        return None


class FinanceRecordSerializer(serializers.ModelSerializer):
    record_type_display = serializers.CharField(source='get_record_type_display', read_only=True)
    recorded_by_username = serializers.CharField(source='recorded_by.username', read_only=True)
    member_username = serializers.CharField(source='member.username', read_only=True)

    class Meta:
        model = FinanceRecord
        fields = (
            'id',
            'title',
            'record_type',
            'record_type_display',
            'amount',
            'currency',
            'contributor_name',
            'member',
            'member_username',
            'notes',
            'recorded_by',
            'recorded_by_username',
            'created_at'
        )
        read_only_fields = ('id', 'recorded_by', 'created_at')


class PresidentialLineageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = PresidentialLineage
        fields = (
            'id',
            'name',
            'tenure',
            'bio',
            'favorite_book',
            'image',
            'avatar_url',
            'image_url',
            'order',
            'created_at'
        )

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return obj.avatar_url or None


class ExecutiveLeaderSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ExecutiveLeader
        fields = (
            'id',
            'name',
            'role',
            'bio',
            'favorite_genre',
            'currently_reading',
            'image',
            'avatar_url',
            'image_url',
            'order',
            'created_at'
        )

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return obj.avatar_url or None

from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q
from .validators import validate_phone_number

User = get_user_model()


class PhoneModelBackend(ModelBackend):
    """
    Primary Phone-based authentication backend for Chapter & Chats.
    Enforces phone_number (unique) as primary credential alongside password.
    Supports local Ethiopian and international E.164 formats, with fallback to username.
    """
    def authenticate(self, request, username=None, password=None, phone_number=None, **kwargs):
        lookup = phone_number or kwargs.get('phone_number') or kwargs.get('phone') or username or kwargs.get(User.USERNAME_FIELD)
        if not lookup or not password:
            return None

        raw_str = str(lookup).strip().replace(" ", "").replace("-", "")
        normalized_phone = None
        try:
            normalized_phone = validate_phone_number(raw_str)
        except Exception:
            normalized_phone = raw_str

        import re
        filters = Q(phone_number=normalized_phone) | Q(phone_number=raw_str) | Q(username__iexact=raw_str)
        digits = re.sub(r'\D', '', raw_str)
        if len(digits) >= 9:
            filters |= Q(phone_number__endswith=digits[-9:])

        user = User.objects.filter(filters).first()

        if not user:
            # Constant time check against timing attacks
            User().set_password(password)
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user

        return None


class EmailOnlyModelBackend(ModelBackend):
    """
    Secondary fallback backend matching users by email or username.
    """
    def authenticate(self, request, username=None, password=None, email=None, **kwargs):
        lookup = email or kwargs.get('email') or username
        if not lookup or not password:
            return None

        lookup_str = str(lookup).strip().lower()
        user = User.objects.filter(
            Q(email__iexact=lookup_str) |
            Q(username__iexact=lookup_str)
        ).first()

        if not user:
            User().set_password(password)
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None


# Backward-compatible alias
EmailOrUsernameModelBackend = PhoneModelBackend

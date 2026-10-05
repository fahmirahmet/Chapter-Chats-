from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.db.models import Q
from django.contrib.auth.hashers import identify_hasher
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from rest_framework_simplejwt.tokens import RefreshToken
import logging

from .permissions import IsPresidentOrVicePresident
from .models import User, MembershipApplication, FinanceRecord, PresidentialLineage, ExecutiveLeader
from .validators import validate_phone_number
from .telegram_utils import (
    generate_verification_code, 
    send_telegram_verification, 
    send_telegram_password_reset,
    link_telegram_chat, 
    get_telegram_config
)
from .serializers import (
    UserRegistrationSerializer, 
    UserProfileSerializer,
    PublicUserProfileSerializer,
    MembershipApplicationSerializer,
    UserRosterSerializer,
    FinanceRecordSerializer,
    CustomTokenObtainPairSerializer,
    PresidentialLineageSerializer,
    ExecutiveLeaderSerializer,
    AdminQuickAddMemberSerializer
)

logger = logging.getLogger(__name__)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Phone-based JWT obtain endpoint.
    Accepts phone_number (or username/phone) and password.
    Protected with scoped rate limiting (5 attempts/min).
    """
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'


def _apply_user_password(user, raw_or_hashed_password):
    """
    Assigns password to user account without double-hashing if already hashed.
    """
    if not raw_or_hashed_password:
        user.set_password('ReadingPass2026!')
        return

    is_hashed = False
    try:
        identify_hasher(raw_or_hashed_password)
        is_hashed = True
    except ValueError:
        is_hashed = False

    known_prefixes = ('pbkdf2_sha256$', 'pbkdf2_sha1$', 'argon2', 'bcrypt$', 'scrypt$')
    if any(str(raw_or_hashed_password).startswith(p) for p in known_prefixes):
        is_hashed = True

    if is_hashed:
        user.password = raw_or_hashed_password
    else:
        user.set_password(raw_or_hashed_password)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get(self, request):
        serializer = UserProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        user = request.user
        data = request.data

        # 1. Full name updates
        if 'full_name' in data and data['full_name']:
            user.full_name = str(data['full_name']).strip()
            parts = user.full_name.split(None, 1)
            user.first_name = parts[0] if parts else ''
            user.last_name = parts[1] if len(parts) > 1 else ''

        # 2. Username edit with uniqueness validation
        new_username = data.get('username')
        if new_username:
            new_username = str(new_username).strip()
            if new_username.lower() != (user.username or '').lower():
                if User.objects.filter(username__iexact=new_username).exclude(pk=user.pk).exists():
                    return Response(
                        {'error': f'Username "{new_username}" is already taken by another member.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                user.username = new_username

        # 3. Reading progress
        if 'current_page_read' in data:
            try:
                user.current_page_read = max(0, int(data['current_page_read']))
            except (ValueError, TypeError):
                pass

        # 4. Top Books & Bio
        if 'top_book_1' in data:
            user.top_book_1 = str(data['top_book_1']).strip()[:150]
        if 'top_book_2' in data:
            user.top_book_2 = str(data['top_book_2']).strip()[:150]
        if 'top_book_3' in data:
            user.top_book_3 = str(data['top_book_3']).strip()[:150]
        if 'bio' in data:
            user.bio = str(data['bio']).strip()

        # 5. Avatar Upload
        if 'avatar' in request.FILES:
            user.avatar = request.FILES['avatar']

        user.save()
        serializer = UserProfileSerializer(user, context={'request': request})
        return Response(serializer.data)


class PublicUserProfileView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, username=None, pk=None):
        target_user = None
        if pk is not None:
            target_user = User.objects.filter(pk=pk, is_active=True).first()
        elif username:
            clean_username = username.strip().lstrip('@')
            target_user = User.objects.filter(
                Q(username__iexact=clean_username) | 
                Q(phone_number=clean_username),
                is_active=True
            ).first()

        if not target_user:
            return Response({'detail': f'Member profile "{username or pk}" not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = PublicUserProfileSerializer(target_user, context={'request': request})
        return Response(serializer.data)


class MembershipApplicationView(generics.CreateAPIView):
    """
    Direct Registration Intake Endpoint.
    Accepts full_name, phone_number, password, department, year_of_study.
    Immediately creates member profile and dispatches 6-digit Telegram verification code.
    """
    queryset = MembershipApplication.objects.all()
    serializer_class = MembershipApplicationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = serializer.save()

        phone_number = application.phone_number
        full_name = application.full_name.strip()
        name_parts = full_name.split(None, 1)
        first_name = name_parts[0] if name_parts else ''
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        import re
        base_user = re.sub(r'[^a-zA-Z0-9_]', '', full_name.lower().replace(' ', '_')) if full_name else 'reader'
        if not base_user:
            base_user = 'reader'
        username = base_user
        counter = 1
        while User.objects.filter(username__iexact=username).exists():
            username = f"{base_user}_{counter}"
            counter += 1

        raw_password = request.data.get('password') or 'ReaderPassport@2026'
        code = generate_verification_code()

        user = User.objects.filter(phone_number=phone_number).first()
        if not user:
            user = User.objects.create_user(
                phone_number=phone_number,
                username=username,
                password=raw_password,
                full_name=full_name,
                first_name=first_name,
                last_name=last_name,
                year_of_study=application.year_of_study or '',
                department=application.department or '',
                email=application.email or '',
                role=User.Role.MEMBER,
                is_active=True,
                is_verified=False,
                verification_code=code,
                top_book_1=application.favorite_book or ''
            )
        else:
            user.is_active = True
            user.role = User.Role.MEMBER
            user.verification_code = code
            user.set_password(raw_password)
            user.save()

        # Mark application APPROVED for audit log
        application.status = MembershipApplication.Status.APPROVED
        application.save()

        # Dispatch verification code via Telegram
        telegram_result = send_telegram_verification(phone_number, code)

        refresh = RefreshToken.for_user(user)
        tokens = {
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }

        user_data = UserProfileSerializer(user, context={'request': request}).data

        return Response({
            'message': 'Registration created! Please verify your phone number via Telegram.',
            'access': tokens['access'],
            'refresh': tokens['refresh'],
            'tokens': tokens,
            'user': user_data,
            'application': serializer.data,
            'telegram': telegram_result
        }, status=status.HTTP_201_CREATED)


class AdminQuickAddMemberView(APIView):
    """
    Admin Quick-Add Member Onboarding Endpoint (/api/accounts/admin/add-member/).
    Restricted to authenticated administrators and executive officers.
    Accepts: full_name, phone_number, year_of_study, and department.
    Creates an active, verified member profile with secure default temporary password 'ChapterChats2026!'.
    Logs an approved entry in MembershipApplication intake audit desk.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not (request.user.is_staff or request.user.is_superuser or request.user.role in [User.Role.ADMIN, User.Role.OFFICER, User.Role.OWNER]):
            return Response({'detail': 'Access restricted to executive officers and administrators.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = AdminQuickAddMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        full_name = data['full_name'].strip()
        phone_number = data['phone_number']
        year_of_study = data.get('year_of_study', '2nd Year (Sophomore)')
        department = data.get('department', 'Software Engineering')

        name_parts = full_name.split(None, 1)
        first_name = name_parts[0] if name_parts else ''
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        import re
        base_user = re.sub(r'[^a-zA-Z0-9_]', '', full_name.lower().replace(' ', '_')) if full_name else 'reader'
        if not base_user:
            base_user = 'reader'
        username = base_user
        counter = 1
        while User.objects.filter(username__iexact=username).exists():
            username = f"{base_user}_{counter}"
            counter += 1

        default_password = 'ChapterChats2026!'

        user = User.objects.create_user(
            phone_number=phone_number,
            username=username,
            password=default_password,
            full_name=full_name,
            first_name=first_name,
            last_name=last_name,
            year_of_study=year_of_study,
            department=department,
            role=User.Role.MEMBER,
            is_active=True,
            is_verified=True
        )

        # Log approved entry in MembershipApplication audit desk
        application = MembershipApplication.objects.create(
            full_name=full_name,
            phone_number=phone_number,
            year_of_study=year_of_study,
            department=department,
            status=MembershipApplication.Status.APPROVED,
            reviewed_by=request.user,
            policy_agreed=True
        )

        return Response({
            'message': f'Member "{full_name}" onboarded successfully with temporary password "{default_password}".',
            'user': UserProfileSerializer(user, context={'request': request}).data,
            'default_password': default_password,
            'application_id': application.id
        }, status=status.HTTP_201_CREATED)


class SendTelegramVerificationView(APIView):
    """
    Endpoint to request / re-send a 6-digit Telegram verification code.
    Accepts phone_number.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        raw_phone = request.data.get('phone_number') or request.data.get('phone')
        if not raw_phone:
            return Response({'error': 'Phone number is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            phone = validate_phone_number(raw_phone)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        code = generate_verification_code()
        user = User.objects.filter(phone_number=phone).first()
        if user:
            user.verification_code = code
            user.save(update_fields=['verification_code'])

        result = send_telegram_verification(phone, code)
        return Response(result, status=status.HTTP_200_OK)


class VerifyTelegramCodeView(APIView):
    """
    Verifies 6-digit code received via Telegram and activates account / returns JWT tokens.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        raw_phone = request.data.get('phone_number') or request.data.get('phone')
        code = str(request.data.get('code') or request.data.get('verification_code') or '').strip()

        if not raw_phone or not code:
            return Response({'error': 'Phone number and 6-digit verification code are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            phone = validate_phone_number(raw_phone)
        except Exception:
            phone = str(raw_phone).strip()

        user = User.objects.filter(
            Q(phone_number=phone) | Q(username=phone)
        ).first()

        if not user:
            return Response({'error': 'No account found with this phone number.'}, status=status.HTTP_404_NOT_FOUND)

        if not user.verification_code or user.verification_code != code:
            return Response({'error': 'Invalid or expired verification code. Please check your Telegram message.'}, status=status.HTTP_400_BAD_REQUEST)

        user.is_verified = True
        user.verification_code = None
        user.save(update_fields=['is_verified', 'verification_code'])

        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Phone number verified successfully! Welcome to Chapter & Chats.',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserProfileSerializer(user, context={'request': request}).data
        }, status=status.HTTP_200_OK)


class PasswordResetRequestView(APIView):
    """
    Request a secure 6-digit password reset code dispatched via Telegram.
    Accepts phone_number.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request):
        raw_phone = request.data.get('phone_number') or request.data.get('phone') or request.data.get('email')
        if not raw_phone:
            return Response(
                {"phone_number": ["Please provide your registered phone number."]},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            phone = validate_phone_number(raw_phone)
        except Exception:
            phone = str(raw_phone).strip()

        user = User.objects.filter(
            Q(phone_number=phone) | Q(username=phone) | Q(email__iexact=phone),
            is_active=True
        ).first()

        telegram_info = None
        if user:
            code = generate_verification_code()
            user.verification_code = code
            user.save(update_fields=['verification_code'])
            telegram_info = send_telegram_password_reset(user, code)

        return Response({
            "message": "If an active account exists for this phone number, a 6-digit reset code has been sent via Telegram.",
            "phone_number": phone,
            "telegram": telegram_info
        }, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    """
    Validate Telegram reset code and update user password.
    Accepts phone_number, code, and new_password.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request):
        raw_phone = request.data.get('phone_number') or request.data.get('phone')
        code = str(request.data.get('code') or request.data.get('verification_code') or '').strip()
        new_password = request.data.get('new_password') or request.data.get('password')

        # Fallback for email-based legacy tokens if passed
        uidb64 = request.data.get('uidb64')
        token = request.data.get('token')
        if uidb64 and token:
            try:
                uid = force_str(urlsafe_base64_decode(uidb64))
                user = User.objects.get(pk=uid, is_active=True)
                if default_token_generator.check_token(user, token):
                    user.set_password(str(new_password).strip())
                    user.save()
                    return Response({
                        "message": "Password has been reset successfully. You can now log in."
                    }, status=status.HTTP_200_OK)
            except Exception:
                pass

        if not raw_phone or not code:
            return Response(
                {"error": "Please provide your phone number and the 6-digit verification code."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not new_password or len(str(new_password).strip()) < 6:
            return Response(
                {"error": "Password must be at least 6 characters long."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            phone = validate_phone_number(raw_phone)
        except Exception:
            phone = str(raw_phone).strip()

        user = User.objects.filter(
            Q(phone_number=phone) | Q(username=phone),
            is_active=True
        ).first()

        if not user:
            return Response(
                {"error": "No account found matching this phone number."},
                status=status.HTTP_404_NOT_FOUND
            )

        if not user.verification_code or user.verification_code != code:
            return Response(
                {"error": "Invalid or expired reset code. Please check your Telegram message."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(str(new_password).strip())
        user.verification_code = None
        user.save()

        return Response({
            "message": "Password has been reset successfully. You can now log in."
        }, status=status.HTTP_200_OK)


class TelegramWebhookView(APIView):
    """
    Webhook receiver for Telegram Bot updates.
    Handles /start <phone> commands or contact cards to link chat_id to member.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data
        message = data.get('message', {})
        text = str(message.get('text', '')).strip()
        chat = message.get('chat', {})
        chat_id = chat.get('id')
        contact = message.get('contact', {})

        if not chat_id:
            return Response({'ok': True})

        phone_to_link = None
        if contact and contact.get('phone_number'):
            phone_to_link = contact.get('phone_number')
        elif text.startswith('/start'):
            parts = text.split()
            if len(parts) > 1:
                phone_to_link = parts[1]

        if phone_to_link:
            user = link_telegram_chat(phone_to_link, chat_id)
            if user:
                code = user.verification_code or generate_verification_code()
                user.verification_code = code
                user.save(update_fields=['verification_code'])
                send_telegram_verification(user.phone_number, code)

        return Response({'ok': True})


class AdminMembershipApplicationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.is_superuser or request.user.role == 'ADMIN'):
            return Response({'detail': 'Access restricted to executive officers.'}, status=status.HTTP_403_FORBIDDEN)

        status_filter = request.query_params.get('status')
        queryset = MembershipApplication.objects.all().order_by('-created_at')
        if status_filter and status_filter.upper() != 'ALL':
            queryset = queryset.filter(status=status_filter.upper())

        serializer = MembershipApplicationSerializer(queryset, many=True)
        return Response(serializer.data)


class AdminMembershipApplicationStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if not (request.user.is_staff or request.user.is_superuser or request.user.role == 'ADMIN'):
            return Response({'detail': 'Access restricted to executive officers.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            application = MembershipApplication.objects.get(pk=pk)
        except MembershipApplication.DoesNotExist:
            return Response({'detail': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status', '').upper()
        if new_status not in [MembershipApplication.Status.PENDING, MembershipApplication.Status.APPROVED, MembershipApplication.Status.REJECTED]:
            return Response({
                'detail': f'Invalid status "{new_status}". Allowed: PENDING, APPROVED, REJECTED.'
            }, status=status.HTTP_400_BAD_REQUEST)

        application.status = new_status
        application.reviewed_by = request.user
        application.save()

        # If approved, activate/create real User
        created_user = None
        if new_status == MembershipApplication.Status.APPROVED:
            base_username = application.phone_number or "".join(c for c in application.full_name if c.isalnum()) or 'member'
            clean_username = "".join(c for c in base_username if c.isalnum() or c in ['_', '-']).strip() or 'member'

            # Check if user already exists
            user_by_phone = User.objects.filter(phone_number=application.phone_number).first()
            if user_by_phone:
                created_user = user_by_phone
                created_user.is_active = True
                created_user.is_verified = True
                created_user.role = User.Role.MEMBER
                if application.password:
                    _apply_user_password(created_user, application.password)
                created_user.save()
            else:
                final_username = clean_username
                counter = 1
                while User.objects.filter(username=final_username).exists():
                    final_username = f"{clean_username}_{counter}"
                    counter += 1

                created_user = User.objects.create(
                    phone_number=application.phone_number,
                    username=final_username,
                    full_name=application.full_name,
                    first_name=application.full_name,
                    year_of_study=application.year_of_study,
                    department=application.department,
                    email=application.email or '',
                    role=User.Role.MEMBER,
                    is_active=True,
                    is_verified=True
                )
                _apply_user_password(created_user, application.password)
                created_user.save()

        return Response({
            'message': f'Application status updated to {new_status}.' + (' User account activated.' if new_status == 'APPROVED' else ''),
            'application': MembershipApplicationSerializer(application).data,
            'user_created': created_user.username if created_user else None
        })


class AdminUserListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.is_superuser or request.user.role == 'ADMIN'):
            return Response({'detail': 'Access restricted to executive officers.'}, status=status.HTTP_403_FORBIDDEN)

        search_query = request.query_params.get('search', '').strip()
        role_filter = request.query_params.get('role', '').strip().upper()

        users = User.objects.all().order_by('-date_joined')

        if search_query:
            users = users.filter(
                Q(username__icontains=search_query) |
                Q(phone_number__icontains=search_query) |
                Q(full_name__icontains=search_query) |
                Q(email__icontains=search_query) |
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query)
            )

        if role_filter and role_filter != 'ALL':
            users = users.filter(role=role_filter)

        serializer = UserRosterSerializer(users, many=True)
        return Response(serializer.data)


class AdminToggleUserBanView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if not (request.user.is_staff or request.user.is_superuser or request.user.role == 'ADMIN'):
            return Response({'detail': 'Access restricted to executive officers.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if target_user.id == request.user.id:
            return Response({'detail': 'You cannot ban your own account.'}, status=status.HTTP_400_BAD_REQUEST)

        if target_user.is_superuser:
            return Response({'detail': 'Superuser accounts cannot be banned.'}, status=status.HTTP_400_BAD_REQUEST)

        target_user.is_active = not target_user.is_active
        target_user.save()

        status_text = "reinstated as active" if target_user.is_active else "banned from platform access"

        return Response({
            'message': f"Member {target_user.username} has been {status_text}.",
            'user': UserRosterSerializer(target_user).data
        })


class AdminAssignOfficerRoleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if not (request.user.is_president_or_owner or request.user.is_superuser):
            return Response({
                'detail': 'Only the Club President (Owner) can appoint or relieve executive officers.'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        officer_title = request.data.get('officer_title', '').upper()
        if officer_title not in User.OfficerTitle.values:
            return Response({
                'detail': f'Invalid officer title "{officer_title}". Valid options: {", ".join(User.OfficerTitle.values)}'
            }, status=status.HTTP_400_BAD_REQUEST)

        if target_user.is_president_or_owner and officer_title != User.OfficerTitle.PRESIDENT:
            if target_user.id != request.user.id and not request.user.is_superuser:
                return Response({
                    'detail': 'Protected title: You cannot demote the active Club President.'
                }, status=status.HTTP_403_FORBIDDEN)

        target_user.officer_title = officer_title
        if officer_title == User.OfficerTitle.PRESIDENT:
            target_user.role = User.Role.OWNER
            target_user.is_staff = True

            previous_presidents = User.objects.filter(
                Q(officer_title=User.OfficerTitle.PRESIDENT) | Q(role=User.Role.OWNER)
            ).exclude(id=target_user.id)
            for prev_pres in previous_presidents:
                if not prev_pres.is_superuser:
                    prev_pres.role = User.Role.OFFICER
                    prev_pres.officer_title = User.OfficerTitle.VICE_PRESIDENT
                    prev_pres.save()
        elif officer_title in [
            User.OfficerTitle.VICE_PRESIDENT,
            User.OfficerTitle.SOCIAL_MEDIA_LEAD,
            User.OfficerTitle.RESEARCH_LEAD,
            User.OfficerTitle.EVENT_LEAD,
            User.OfficerTitle.FINANCE_LEAD,
        ]:
            target_user.role = User.Role.OFFICER
            target_user.is_staff = True
        else:
            target_user.role = User.Role.MEMBER
            if not target_user.is_superuser:
                target_user.is_staff = False

        target_user.save()

        return Response({
            'message': f"Assigned role {target_user.get_officer_title_display()} to {target_user.username}.",
            'user': UserRosterSerializer(target_user).data
        })


class FinanceRecordListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.is_executive_officer:
            return Response({'detail': 'Access restricted to executive officers.'}, status=status.HTTP_403_FORBIDDEN)

        type_filter = request.query_params.get('type')
        queryset = FinanceRecord.objects.all().order_by('-created_at')
        if type_filter and type_filter.upper() != 'ALL':
            queryset = queryset.filter(record_type=type_filter.upper())

        serializer = FinanceRecordSerializer(queryset, many=True)
        
        all_records = FinanceRecord.objects.all()
        total_contributions = sum(r.amount for r in all_records if r.record_type == FinanceRecord.RecordType.CONTRIBUTION)
        total_sponsorships = sum(r.amount for r in all_records if r.record_type == FinanceRecord.RecordType.SPONSORSHIP)
        total_donations = sum(r.amount for r in all_records if r.record_type == FinanceRecord.RecordType.DONATION)
        total_expenses = sum(r.amount for r in all_records if r.record_type == FinanceRecord.RecordType.EXPENSE)
        net_balance = (total_contributions + total_sponsorships + total_donations) - total_expenses

        return Response({
            'records': serializer.data,
            'summary': {
                'total_contributions': float(total_contributions),
                'total_sponsorships': float(total_sponsorships),
                'total_donations': float(total_donations),
                'total_expenses': float(total_expenses),
                'net_balance': float(net_balance),
                'currency': 'ETB'
            }
        })

    def post(self, request):
        if not request.user.is_executive_officer:
            return Response({'detail': 'Access restricted to executive officers.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = FinanceRecordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        record = serializer.save(recorded_by=request.user)

        return Response({
            'message': 'Finance ledger entry recorded successfully.',
            'record': FinanceRecordSerializer(record).data
        }, status=status.HTTP_201_CREATED)


class FinanceRecordDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        if not (request.user.is_president_or_owner or request.user.officer_title == User.OfficerTitle.FINANCE_LEAD or request.user.is_superuser):
            return Response({'detail': 'Only the President or Finance Lead can delete treasury records.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            record = FinanceRecord.objects.get(pk=pk)
        except FinanceRecord.DoesNotExist:
            return Response({'detail': 'Record not found.'}, status=status.HTTP_404_NOT_FOUND)

        record.delete()
        return Response({'message': 'Finance record removed successfully.'})


class AdminPurgeBannedUserView(APIView):
    """
    Presidential Member Purge:
    Permanently deletes a member account.
    Guardrail: Target member must already be banned (is_active is False or is_banned is True).
    Restricted to President, Vice President, or Superusers.
    """
    permission_classes = [IsPresidentOrVicePresident]

    def delete(self, request, pk):
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if target_user.id == request.user.id:
            return Response({'detail': 'You cannot purge your own account.'}, status=status.HTTP_400_BAD_REQUEST)

        if target_user.is_superuser:
            return Response({'detail': 'Superuser accounts cannot be permanently deleted.'}, status=status.HTTP_400_BAD_REQUEST)

        if target_user.role == 'OWNER' or target_user.officer_title == 'PRESIDENT':
            return Response({'detail': 'Club President accounts cannot be permanently deleted.'}, status=status.HTTP_400_BAD_REQUEST)

        is_banned = (target_user.is_active is False) or getattr(target_user, 'is_banned', False)
        if not is_banned:
            return Response(
                {"detail": "Member must be banned before permanent deletion is permitted."},
                status=status.HTTP_400_BAD_REQUEST
            )

        username = target_user.username

        try:
            from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
            OutstandingToken.objects.filter(user=target_user).delete()
        except Exception:
            pass

        try:
            MembershipApplication.objects.filter(
                phone_number=target_user.phone_number
            ).delete()
        except Exception:
            pass

        target_user.delete()

        return Response({
            'message': f'Member "{username}" has been permanently removed.'
        }, status=status.HTTP_200_OK)


DEFAULT_LINEAGE = [
    {
        'name': 'Yukabed',
        'tenure': '2023 – 2025 (Founding President)',
        'bio': 'Founded the club, established bi-monthly physical meetups in Hall B, and launched the initial digital reading tracker.',
        'favorite_book': 'Fiqir Eske Meqabir by Haddis Alemayehu',
        'avatar_url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        'order': 1
    },
    {
        'name': 'Dawit Mengistu',
        'tenure': '2025 – 2026',
        'bio': 'Expanded the Book House digital repository, formalized officer portfolios, and created the Saturday creative writing initiatives.',
        'favorite_book': 'Things Fall Apart by Chinua Achebe',
        'avatar_url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        'order': 2
    }
]

DEFAULT_LEADERSHIP = [
    {
        'name': 'Bethlehem Haile',
        'role': 'Club President',
        'bio': 'Leading our community initiatives and hosting bi-monthly literary reviews in Library Hall B.',
        'favorite_genre': 'Ethiopian Literature',
        'currently_reading': 'Fiqir Eske Meqabir',
        'avatar_url': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
        'order': 1
    },
    {
        'name': 'Tewodros Kassahun',
        'role': 'Lead Cycle Coordinator',
        'bio': 'Manages 3-week milestone targets, quiz questions, and passcode verification logic.',
        'favorite_genre': 'Philosophy & Ethics',
        'currently_reading': 'The Crucible of Reflection',
        'avatar_url': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        'order': 2
    },
    {
        'name': 'Amina Bekele',
        'role': 'Head of Book House & Repository',
        'bio': 'Curates downloadable book PDFs, study guide worksheets, and author metadata.',
        'favorite_genre': 'World Classics',
        'currently_reading': 'The Shadow of the Wind',
        'avatar_url': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
        'order': 3
    },
    {
        'name': 'Dr. Marcus Vance',
        'role': 'Academic Faculty Advisor',
        'bio': 'Provides academic guidance and reviews student book recommendation pitches.',
        'favorite_genre': 'Moral Theory & Criticism',
        'currently_reading': 'Principles of Literary Criticism',
        'avatar_url': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
        'order': 4
    }
]


class PresidentialLineageListView(APIView):
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsPresidentOrVicePresident()]

    def get(self, request):
        if PresidentialLineage.objects.count() == 0:
            for item in DEFAULT_LINEAGE:
                PresidentialLineage.objects.create(**item)

        lineages = PresidentialLineage.objects.all().order_by('order', 'created_at')
        serializer = PresidentialLineageSerializer(lineages, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = PresidentialLineageSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PresidentialLineageDetailView(APIView):
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    permission_classes = [IsPresidentOrVicePresident]

    def get_object(self, pk):
        return get_object_or_404(PresidentialLineage, pk=pk)

    def put(self, request, pk):
        item = self.get_object(pk)
        serializer = PresidentialLineageSerializer(item, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        item = self.get_object(pk)
        item.delete()
        return Response({'message': 'Lineage record deleted successfully.'}, status=status.HTTP_200_OK)


class ExecutiveLeaderListView(APIView):
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsPresidentOrVicePresident()]

    def get(self, request):
        if ExecutiveLeader.objects.count() == 0:
            for item in DEFAULT_LEADERSHIP:
                ExecutiveLeader.objects.create(**item)

        leaders = ExecutiveLeader.objects.all().order_by('order', 'created_at')
        serializer = ExecutiveLeaderSerializer(leaders, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = ExecutiveLeaderSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ExecutiveLeaderDetailView(APIView):
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    permission_classes = [IsPresidentOrVicePresident]

    def get_object(self, pk):
        return get_object_or_404(ExecutiveLeader, pk=pk)

    def put(self, request, pk):
        item = self.get_object(pk)
        serializer = ExecutiveLeaderSerializer(item, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        item = self.get_object(pk)
        item.delete()
        return Response({'message': 'Executive leader removed successfully.'}, status=status.HTTP_200_OK)

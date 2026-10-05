from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password
from datetime import datetime, time, timedelta
from books.views import is_pdf_file
import random
from .models import ReadingCycle, Meeting, AttendanceRecord, Announcement
from .serializers import (
    ReadingCycleSerializer, 
    MeetingSerializer, 
    AttendanceRecordSerializer, 
    AnnouncementSerializer
)
from accounts.models import Badge, UserBadge

class ActiveCycleView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        active_cycle = ReadingCycle.objects.filter(is_active=True).first()
        announcements = Announcement.objects.filter(is_active=True).order_by('-created_at')[:6]
        announcements_data = AnnouncementSerializer(announcements, many=True).data

        banner = Announcement.objects.filter(is_active=True, is_banner=True).order_by('-created_at').first()
        banner_data = AnnouncementSerializer(banner).data if banner else None

        if not active_cycle:
            return Response({
                'message': 'No active cycle found',
                'activeCycle': None,
                'activeMeeting': None,
                'announcements': announcements_data,
                'alertBanner': banner_data,
            }, status=status.HTTP_200_OK)

        serializer = ReadingCycleSerializer(active_cycle)
        meeting = Meeting.objects.filter(cycle=active_cycle, is_active=True).first()
        meeting_data = MeetingSerializer(meeting).data if meeting else None

        return Response({
            'activeCycle': serializer.data,
            'activeMeeting': meeting_data,
            'announcements': announcements_data,
            'alertBanner': banner_data,
        })


class MeetingCheckInView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        meeting = Meeting.objects.filter(is_active=True).first()
        if not meeting:
            return Response({'error': 'No active meeting found for check-in.'}, status=status.HTTP_404_NOT_FOUND)

        # 4-hour sliding expiration check
        if not meeting.passcode_generated_at:
            return Response({"detail": "No active attendance session found."}, status=status.HTTP_400_BAD_REQUEST)

        if timezone.now() > meeting.passcode_generated_at + timedelta(hours=4):
            return Response(
                {"detail": "This attendance passcode has expired (4-hour limit exceeded). Ask an officer to refresh it."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user
        passcode_input = request.data.get('passcode', '').strip()

        # Secure passcode verification via hash comparison
        passcode_valid = False
        if meeting.passcode_hash:
            passcode_valid = check_password(passcode_input, meeting.passcode_hash)
        elif meeting.passcode:
            # Fallback for legacy unhashed passcodes (pre-migration meetings)
            passcode_valid = (passcode_input == meeting.passcode)

        if not passcode_valid:
            return Response({'error': f'Invalid passcode "{passcode_input}". Please verify the passcode announced by officers.'}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce uniqueness constraint
        existing = AttendanceRecord.objects.filter(user=user, meeting=meeting).first()
        if existing:
            return Response({'error': 'You have already checked in for this meeting!'}, status=status.HTTP_400_BAD_REQUEST)

        # Record attendance
        AttendanceRecord.objects.create(user=user, meeting=meeting)

        # Increment streak and total XP
        user.current_streak += 1
        user.total_xp += 50
        user.save()

        # Check if Consistent Scholar badge should be awarded (streak >= 4)
        if user.current_streak >= 4:
            badge = Badge.objects.filter(name='Consistent Scholar').first()
            if badge:
                UserBadge.objects.get_or_create(user=user, badge=badge)

        return Response({
            'message': 'Check-in verified successfully!',
            'current_streak': user.current_streak,
            'total_xp': user.total_xp,
            'xp_awarded': 50,
        }, status=status.HTTP_200_OK)


class AdminPasscodeGeneratorView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not (request.user.is_staff or request.user.is_superuser or request.user.role == 'ADMIN'):
            return Response({'detail': 'Access restricted to executive officers.'}, status=status.HTTP_403_FORBIDDEN)

        new_passcode = f"{random.randint(1000, 9999)}"
        active_cycle = ReadingCycle.objects.filter(is_active=True).first()
        if not active_cycle:
            return Response({'error': 'No active reading cycle found.'}, status=status.HTTP_400_BAD_REQUEST)

        meeting = Meeting.objects.filter(cycle=active_cycle, is_active=True).first()
        now = timezone.now()
        expires = now + timedelta(hours=4)

        hashed = make_password(new_passcode)

        if not meeting:
            meeting = Meeting.objects.create(
                cycle=active_cycle,
                meeting_datetime=now,
                passcode=new_passcode,
                passcode_hash=hashed,
                passcode_generated_at=now,
                expires_at=expires,
                is_active=True
            )
        else:
            meeting.passcode = new_passcode
            meeting.passcode_hash = hashed
            meeting.passcode_generated_at = now
            meeting.expires_at = expires
            meeting.save()

        return Response({
            'message': 'Passcode active for 4 hours.',
            'passcode': new_passcode,
            'expires_at': meeting.expires_at.isoformat() if hasattr(meeting.expires_at, 'isoformat') else str(meeting.expires_at),
        })


class AdminMeetingDeskView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.is_superuser or request.user.role == 'ADMIN'):
            return Response({'detail': 'Access restricted to executive officers.'}, status=status.HTTP_403_FORBIDDEN)

        meeting = Meeting.objects.filter(is_active=True).first()
        now = timezone.now()
        is_passcode_active = bool(
            meeting and 
            meeting.passcode_generated_at and 
            (now <= meeting.passcode_generated_at + timedelta(hours=4))
        )

        attendances = []
        if meeting:
            records = AttendanceRecord.objects.filter(meeting=meeting).select_related('user').order_by('-checked_in_at')
            attendances = AttendanceRecordSerializer(records, many=True).data

        local_now = timezone.localtime(now)
        return Response({
            'meeting': {
                'id': meeting.id if meeting else None,
                'passcode': meeting.passcode if meeting else '8419',
                'meeting_datetime': meeting.meeting_datetime if meeting else None,
                'passcode_generated_at': meeting.passcode_generated_at if meeting else None,
                'expires_at': meeting.expires_at if meeting else None,
                'is_active': meeting.is_active if meeting else True,
                'is_passcode_active': is_passcode_active,
            },
            'windowStatus': {
                'is_tuesday': True,
                'is_within_time': is_passcode_active,
                'current_time': local_now.strftime('%I:%M %p'),
                'window_label': '4-Hour Active Window'
            },
            'attendances': attendances,
            'total_checked_in': len(attendances)
        })


class AnnouncementListView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get(self, request):
        announcements = Announcement.objects.filter(is_active=True).order_by('-created_at')
        serializer = AnnouncementSerializer(announcements, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not (request.user.is_staff or request.user.is_superuser or request.user.role == 'ADMIN'):
            return Response({'detail': 'Access restricted to executive officers.'}, status=status.HTTP_403_FORBIDDEN)

        title = request.data.get('title', '').strip()
        content = request.data.get('content', '').strip()
        category = request.data.get('category', '#Meetup')
        is_banner = bool(request.data.get('is_banner', False))

        if not title or not content:
            return Response({'detail': 'Title and content are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if is_banner:
            Announcement.objects.filter(is_banner=True).update(is_banner=False)

        ann = Announcement.objects.create(
            title=title,
            content=content,
            category=category,
            is_banner=is_banner,
            is_active=True
        )

        return Response({
            'message': 'Announcement published successfully!',
            'announcement': AnnouncementSerializer(ann).data
        }, status=status.HTTP_201_CREATED)


class AnnouncementDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        if not (request.user.is_staff or request.user.is_superuser or request.user.role == 'ADMIN'):
            return Response({'detail': 'Access restricted to executive officers.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            ann = Announcement.objects.get(pk=pk)
            ann.is_active = False
            ann.save()
            return Response({'message': 'Announcement removed.'})
        except Announcement.DoesNotExist:
            return Response({'detail': 'Announcement not found.'}, status=status.HTTP_404_NOT_FOUND)


class CycleCreateView(APIView):
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get(self, request):
        cycles = ReadingCycle.objects.all().order_by('-start_date', '-id')
        serializer = ReadingCycleSerializer(cycles, many=True)
        return Response(serializer.data)

    def post(self, request):
        user = request.user
        is_officer = (
            user.is_staff or 
            user.is_superuser or 
            user.role in ['ADMIN', 'OWNER', 'OFFICER'] or 
            user.officer_title in ['PRESIDENT', 'VICE_PRESIDENT', 'EVENT_LEAD', 'RESEARCH_LEAD']
        )
        if not is_officer:
            return Response({'detail': 'Access restricted to executive officers.'}, status=status.HTTP_403_FORBIDDEN)

        title = request.data.get('title', '').strip()
        author = request.data.get('author', '').strip()
        if not title or not author:
            return Response({'error': 'Book title and author are required.'}, status=status.HTTP_400_BAD_REQUEST)

        genre = request.data.get('genre', 'Ethiopian Literature').strip() or 'Ethiopian Literature'
        total_pages_raw = request.data.get('total_pages', 300)
        try:
            total_pages = int(total_pages_raw)
        except (ValueError, TypeError):
            total_pages = 300

        synopsis = request.data.get('synopsis', '').strip()

        meeting_date_raw = request.data.get('meeting_date') or request.data.get('target_tuesday')
        if not meeting_date_raw:
            return Response({'error': 'Target Discussion Tuesday date is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if isinstance(meeting_date_raw, str):
                meeting_date = datetime.strptime(meeting_date_raw[:10], '%Y-%m-%d').date()
            else:
                meeting_date = meeting_date_raw
        except Exception:
            return Response({'error': 'Invalid meeting date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        start_date_raw = request.data.get('start_date')
        if start_date_raw:
            try:
                start_date = datetime.strptime(start_date_raw[:10], '%Y-%m-%d').date()
            except Exception:
                start_date = timezone.now().date()
        else:
            start_date = timezone.now().date()

        pdf_file = (
            request.FILES.get('pdf_file') or 
            request.FILES.get('pdf') or 
            request.FILES.get('book_file') or 
            request.FILES.get('file') or
            request.data.get('pdf_file') or
            request.data.get('pdf') or
            request.data.get('book_file') or
            request.data.get('file')
        )
        if isinstance(pdf_file, str):
            pdf_file = None

        guide_file = (
            request.FILES.get('guide_file') or 
            request.FILES.get('discussion_guide') or 
            request.FILES.get('guide') or
            request.data.get('guide_file') or
            request.data.get('discussion_guide') or
            request.data.get('guide')
        )
        if isinstance(guide_file, str):
            guide_file = None

        cover_image = (
            request.FILES.get('cover_image') or 
            request.FILES.get('cover') or 
            request.FILES.get('image') or
            request.data.get('cover_image') or
            request.data.get('cover') or
            request.data.get('image')
        )
        if isinstance(cover_image, str):
            cover_image = None

        # 1. Create Book
        from books.models import Book
        book = Book.objects.create(
            title=title,
            author=author,
            total_pages=total_pages,
            genre=genre,
            synopsis=synopsis,
            pdf_file=pdf_file,
            guide_file=guide_file,
            cover_image=cover_image
        )

        # 2. Deactivate previous cycles
        ReadingCycle.objects.filter(is_active=True).update(is_active=False)

        # 3. Create ReadingCycle
        meeting_title = request.data.get('meeting_title', '').strip()
        cycle = ReadingCycle.objects.create(
            book=book,
            start_date=start_date,
            meeting_date=meeting_date,
            meeting_title=meeting_title,
            is_active=True
        )

        # 4. Create initial meeting at 12:30 PM EAT
        meeting_datetime = timezone.make_aware(datetime.combine(meeting_date, time(12, 30)))
        now = timezone.now()
        expires_at = now + timedelta(hours=4)
        passcode = str(random.randint(1000, 9999))
        passcode_hashed = make_password(passcode)

        Meeting.objects.create(
            cycle=cycle,
            meeting_datetime=meeting_datetime,
            passcode=passcode,
            passcode_hash=passcode_hashed,
            passcode_generated_at=now,
            expires_at=expires_at,
            is_active=True
        )

        serializer = ReadingCycleSerializer(cycle)
        return Response({
            'message': f'Reading Cycle #{cycle.id} launched successfully with {book.title}!',
            'cycle': serializer.data
        }, status=status.HTTP_201_CREATED)


class CycleEndView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _is_officer(self, user):
        return (
            user.is_staff or 
            user.is_superuser or 
            user.role in ['ADMIN', 'OWNER', 'OFFICER'] or 
            user.officer_title in ['PRESIDENT', 'VICE_PRESIDENT', 'EVENT_LEAD', 'RESEARCH_LEAD']
        )

    def patch(self, request, pk):
        if not self._is_officer(request.user):
            return Response({'detail': 'Access restricted to executive officers.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            cycle = ReadingCycle.objects.get(pk=pk)
            cycle.is_active = False
            cycle.save()
            Meeting.objects.filter(cycle=cycle).update(is_active=False)

            # ── Streak Reset: reset current_streak for members who missed this cycle ──
            from accounts.models import User
            attended_user_ids = AttendanceRecord.objects.filter(
                meeting__cycle=cycle
            ).values_list('user_id', flat=True).distinct()

            reset_count = User.objects.filter(
                role='MEMBER'
            ).exclude(
                id__in=attended_user_ids
            ).update(current_streak=0)

            return Response({
                'message': f'Reading Cycle #{pk} ended successfully. {reset_count} member streak(s) reset.',
                'is_active': False,
                'cycle_id': pk,
                'streaks_reset': reset_count
            }, status=status.HTTP_200_OK)
        except ReadingCycle.DoesNotExist:
            return Response({'error': 'Reading cycle not found.'}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, pk):
        return self.patch(request, pk)

    def delete(self, request, pk):
        return self.patch(request, pk)



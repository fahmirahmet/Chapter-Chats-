from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Only superusers (President) can access the native Django admin console
admin.site.has_permission = lambda request: request.user.is_active and request.user.is_superuser

from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from accounts.views import (
    CustomTokenObtainPairView,
    RegisterView, 
    UserProfileView, 
    PublicUserProfileView,
    MembershipApplicationView,
    AdminMembershipApplicationsView,
    AdminMembershipApplicationStatusView,
    AdminUserListView,
    AdminToggleUserBanView,
    AdminAssignOfficerRoleView,
    AdminPurgeBannedUserView,
    FinanceRecordListView,
    FinanceRecordDetailView,
    PresidentialLineageListView,
    PresidentialLineageDetailView,
    ExecutiveLeaderListView,
    ExecutiveLeaderDetailView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    AdminQuickAddMemberView,
    SendTelegramVerificationView,
    VerifyTelegramCodeView,
    TelegramWebhookView
)
from books.views import BookListView, BookDetailView, BookDownloadView
from cycles.views import (
    ActiveCycleView, 
    MeetingCheckInView, 
    AdminPasscodeGeneratorView,
    AdminMeetingDeskView,
    AnnouncementListView,
    AnnouncementDeleteView,
    CycleCreateView,
    CycleEndView
)
from activities.views import (
    FinishTheStoryActivePromptView,
    FinishTheStorySubmissionsView,
    FinishTheStorySubmitView,
    FinishTheStoryUpvoteView,
    FinishTheStoryWinnerView,
    AdminStoryPromptCreateView,
    AdminCrownWinnerView,
    SixWordStoryView, 
    UpvoteStoryView, 
    SundayQuizView, 
    ThursdayQuizView,
    ThursdayQuizSubmitView,
    ActiveQuizView,
    ThursdayQuizCreateView,
    ThursdayQuizDetailDeleteView,
    ClubGalleryPhotoListView,
    ClubGalleryPhotoDeleteView,
    DiscussionThreadView,
    DiscussionThreadUpvoteView,
    DiscussionThreadDeleteView,
    DiscussionReplyCreateView,
    DiscussionReplyDeleteView,
    StorySubmissionDeleteView,
    ActiveBookPollView,
    AdminBookPollCreateView,
    BookPollDeleteView,
    BookPollVoteView,
    BookProposalCreateView,
    BookProposalLikeView,
    BookProposalDeleteView,
    ContentReportCreateView,
    AdminContentReportListView,
    AdminContentReportResolveView
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # JWT Authentication Endpoints
    path('api/auth/register/', RegisterView.as_view(), name='auth_register'),
    path('api/auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('api/accounts/login/', CustomTokenObtainPairView.as_view(), name='account_login'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Self-Service Password Reset Endpoints
    path('api/accounts/password-reset/request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('api/accounts/password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('accounts/password-reset/request/', PasswordResetRequestView.as_view(), name='password_reset_request_alt'),
    path('accounts/password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm_alt'),

    # Telegram Verification & Bot Webhook Endpoints
    path('api/accounts/send-verification/', SendTelegramVerificationView.as_view(), name='send_telegram_verification'),
    path('api/accounts/verify-code/', VerifyTelegramCodeView.as_view(), name='verify_telegram_code'),
    path('api/telegram-webhook/', TelegramWebhookView.as_view(), name='telegram_webhook'),

    # User Profile & Membership Intake Endpoints
    path('api/users/me/', UserProfileView.as_view(), name='user_profile'),
    path('api/users/me/progress/', UserProfileView.as_view(), name='user_progress'),
    path('api/accounts/profile/me/', UserProfileView.as_view(), name='account_profile_me'),
    path('api/accounts/profile/', UserProfileView.as_view(), name='account_profile'),
    path('api/accounts/users/<str:username>/profile/', PublicUserProfileView.as_view(), name='public_user_profile'),
    path('api/accounts/users/<str:username>/', PublicUserProfileView.as_view(), name='public_user_profile_short'),
    path('api/accounts/users/<int:pk>/profile/', PublicUserProfileView.as_view(), name='public_user_profile_pk'),
    path('api/accounts/apply/', MembershipApplicationView.as_view(), name='membership_apply'),
    path('api/applications/', MembershipApplicationView.as_view(), name='applications'),
    
    # Executive Admin Membership Desk & User Roster
    path('api/accounts/admin/add-member/', AdminQuickAddMemberView.as_view(), name='admin_quick_add_member'),
    path('accounts/admin/add-member/', AdminQuickAddMemberView.as_view(), name='admin_quick_add_member_alt'),
    path('api/accounts/applications/', AdminMembershipApplicationsView.as_view(), name='admin_membership_applications'),
    path('api/accounts/applications/<int:pk>/status/', AdminMembershipApplicationStatusView.as_view(), name='admin_membership_status'),
    path('api/accounts/users/', AdminUserListView.as_view(), name='admin_user_list'),
    path('api/accounts/users/<int:pk>/toggle-ban/', AdminToggleUserBanView.as_view(), name='admin_user_toggle_ban'),
    path('api/accounts/users/<int:pk>/assign-role/', AdminAssignOfficerRoleView.as_view(), name='admin_user_assign_role'),
    path('api/accounts/users/<int:pk>/purge/', AdminPurgeBannedUserView.as_view(), name='admin_user_purge'),

    # Presidential Lineage & Dynamic Executive Leadership
    path('api/accounts/lineage/', PresidentialLineageListView.as_view(), name='presidential_lineage_list'),
    path('api/accounts/lineage/<int:pk>/', PresidentialLineageDetailView.as_view(), name='presidential_lineage_detail'),
    path('api/accounts/leadership/', ExecutiveLeaderListView.as_view(), name='executive_leadership_list'),
    path('api/accounts/leadership/<int:pk>/', ExecutiveLeaderDetailView.as_view(), name='executive_leadership_detail'),

    # Treasury & Finance Desk Endpoints
    path('api/finance/records/', FinanceRecordListView.as_view(), name='finance_records'),
    path('api/finance/records/<int:pk>/', FinanceRecordDetailView.as_view(), name='finance_record_detail'),

    # Book House Repository Endpoints
    path('api/books/', BookListView.as_view(), name='book_list'),
    path('api/books/<int:pk>/', BookDetailView.as_view(), name='book_detail_delete'),
    path('api/cycles/books/', BookListView.as_view(), name='cycle_books_list_create'),
    path('api/cycles/books/<int:pk>/', BookDetailView.as_view(), name='cycle_book_detail_delete'),
    path('api/cycles/book-house/', BookListView.as_view(), name='cycle_book_house_list_create'),
    path('api/books/<int:pk>/download/<str:file_type>/', BookDownloadView.as_view(), name='book_download'),

    # 3-Week Cycle & Attendance Check-In Endpoints
    path('api/cycles/active/', ActiveCycleView.as_view(), name='active_cycle'),
    path('api/cycles/cycles/active/', ActiveCycleView.as_view(), name='cycles_active_cycle'),
    path('api/cycles/cycles/<int:pk>/end-cycle/', CycleEndView.as_view(), name='cycle_end'),
    path('api/cycles/<int:pk>/end-cycle/', CycleEndView.as_view(), name='cycle_end_alt'),
    path('api/cycles/cycles/<int:pk>/', CycleEndView.as_view(), name='cycle_detail_end_delete'),
    path('api/cycles/cycles/', CycleCreateView.as_view(), name='cycle_create_list'),
    path('api/cycles/', CycleCreateView.as_view(), name='cycle_root_create_list'),
    path('api/meetings/check-in/', MeetingCheckInView.as_view(), name='meeting_checkin'),
    path('api/meetings/generate-code/', AdminPasscodeGeneratorView.as_view(), name='admin_passcode_generator'),
    path('api/meetings/active/', AdminMeetingDeskView.as_view(), name='admin_meeting_desk'),
    path('api/meetings/desk/', AdminMeetingDeskView.as_view(), name='admin_meeting_desk_alt'),

    # Saturday Creative Initiative & Executive Curator Endpoints
    path('api/activities/finish-the-story/active/', FinishTheStoryActivePromptView.as_view(), name='finish_the_story_active'),
    path('api/activities/finish-the-story/submissions/', FinishTheStorySubmissionsView.as_view(), name='finish_the_story_submissions'),
    path('api/activities/finish-the-story/submit/', FinishTheStorySubmitView.as_view(), name='finish_the_story_submit'),
    path('api/activities/finish-the-story/<int:pk>/upvote/', FinishTheStoryUpvoteView.as_view(), name='finish_the_story_upvote'),
    path('api/activities/finish-the-story/winner/', FinishTheStoryWinnerView.as_view(), name='finish_the_story_winner'),
    path('api/activities/prompts/create/', AdminStoryPromptCreateView.as_view(), name='admin_prompt_create'),
    path('api/activities/prompts/', AdminStoryPromptCreateView.as_view(), name='admin_prompts'),
    path('api/activities/submissions/', FinishTheStorySubmissionsView.as_view(), name='admin_submissions_list'),
    path('api/activities/submissions/<int:pk>/crown-winner/', AdminCrownWinnerView.as_view(), name='admin_crown_winner'),
    path('api/activities/submissions/<int:pk>/delete/', StorySubmissionDeleteView.as_view(), name='admin_story_submission_delete'),
    path('api/activities/submissions/<int:pk>/', StorySubmissionDeleteView.as_view(), name='admin_story_submission_detail'),
    path('api/activities/finish-the-story/<int:pk>/crown-winner/', AdminCrownWinnerView.as_view(), name='admin_finish_story_crown'),

    # Thursday Reading Quiz & Executive Authoring Endpoints
    path('api/activities/quizzes/active/', ActiveQuizView.as_view(), name='active_quiz'),
    path('api/activities/quizzes/', ThursdayQuizCreateView.as_view(), name='admin_quiz_create_list'),
    path('api/activities/quizzes/<int:pk>/', ThursdayQuizDetailDeleteView.as_view(), name='admin_quiz_detail_delete'),
    path('api/activities/quizzes/<int:quiz_id>/submit/', ThursdayQuizSubmitView.as_view(), name='quiz_submit_by_id'),
    path('api/activities/thursday-quiz/', ThursdayQuizView.as_view(), name='thursday_quiz'),
    path('api/activities/thursday-quiz/submit/', ThursdayQuizSubmitView.as_view(), name='thursday_quiz_submit'),
    path('api/activities/sunday-quiz/', SundayQuizView.as_view(), name='sunday_quiz'),
    path('api/activities/sunday-quiz/submit/', ThursdayQuizSubmitView.as_view(), name='sunday_quiz_submit'),
    path('api/activities/six-word-stories/', SixWordStoryView.as_view(), name='six_word_stories'),
    path('api/activities/six-word-stories/<int:pk>/upvote/', UpvoteStoryView.as_view(), name='six_word_story_upvote'),


    # Interactive Club Photo Gallery Endpoints
    path('api/activities/gallery/', ClubGalleryPhotoListView.as_view(), name='club_gallery_list'),
    path('api/activities/gallery/<int:pk>/', ClubGalleryPhotoDeleteView.as_view(), name='club_gallery_delete'),

    # Community Discussions & Voting Hub Endpoints
    path('api/activities/discussions/', DiscussionThreadView.as_view(), name='discussion_threads'),
    path('api/activities/discussions/<int:pk>/upvote/', DiscussionThreadUpvoteView.as_view(), name='discussion_thread_upvote'),
    path('api/activities/discussions/<int:thread_id>/replies/', DiscussionReplyCreateView.as_view(), name='discussion_reply_create'),
    path('api/activities/discussions/<int:pk>/reply/', DiscussionReplyCreateView.as_view(), name='discussion_reply_create_alt'),
    path('api/activities/discussions/replies/<int:pk>/', DiscussionReplyDeleteView.as_view(), name='discussion_reply_delete'),
    path('api/activities/replies/<int:pk>/', DiscussionReplyDeleteView.as_view(), name='reply_delete_alt'),
    path('api/activities/discussions/<int:pk>/delete/', DiscussionThreadDeleteView.as_view(), name='discussion_thread_delete'),
    path('api/activities/discussions/<int:pk>/', DiscussionThreadDeleteView.as_view(), name='discussion_thread_detail'),
    path('api/activities/polls/active/', ActiveBookPollView.as_view(), name='active_book_poll'),
    path('api/activities/polls/create/', AdminBookPollCreateView.as_view(), name='admin_book_poll_create'),
    path('api/activities/polls/', AdminBookPollCreateView.as_view(), name='admin_book_poll_list_create'),
    path('api/activities/polls/vote/', BookPollVoteView.as_view(), name='book_poll_vote'),
    path('api/activities/polls/<int:pk>/', BookPollDeleteView.as_view(), name='book_poll_delete'),
    path('api/activities/proposals/', BookProposalCreateView.as_view(), name='book_proposals'),
    path('api/activities/proposals/<int:pk>/like/', BookProposalLikeView.as_view(), name='book_proposal_like'),
    path('api/activities/proposals/<int:pk>/', BookProposalDeleteView.as_view(), name='book_proposal_delete'),
    path('api/activities/suggestions/', BookProposalCreateView.as_view(), name='book_suggestions'),
    path('api/activities/suggestions/<int:pk>/', BookProposalDeleteView.as_view(), name='book_suggestion_delete'),

    # Content Reporting & Moderation Desk Endpoints
    path('api/activities/reports/', ContentReportCreateView.as_view(), name='content_report_create'),
    path('api/activities/admin/reports/', AdminContentReportListView.as_view(), name='admin_content_reports_list'),
    path('api/activities/reports/<int:pk>/resolve/', AdminContentReportResolveView.as_view(), name='admin_report_resolve'),
    path('api/activities/reports/<int:pk>/', AdminContentReportResolveView.as_view(), name='admin_report_detail'),

    # Broadcast Alerts & Announcements
    path('api/announcements/', AnnouncementListView.as_view(), name='announcements_list_create'),
    path('api/announcements/<int:pk>/', AnnouncementDeleteView.as_view(), name='announcement_delete'),
    path('api/cycles/announcements/', AnnouncementListView.as_view(), name='cycles_announcements'),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

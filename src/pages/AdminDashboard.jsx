import React, { useState, useEffect } from 'react';
import { useSearchParams, NavLink } from 'react-router-dom';
import { 
  Shield, 
  Calendar, 
  Clock, 
  Users, 
  PenTool, 
  Crown, 
  CheckCircle2, 
  XCircle, 
  X,
  Sparkles, 
  RefreshCw, 
  Plus, 
  Send, 
  BookOpen, 
  Key, 
  Copy, 
  Check, 
  Flame, 
  Megaphone, 
  AlertCircle, 
  Loader2, 
  Filter, 
  Trash2, 
  Mail, 
  Phone, 
  GraduationCap, 
  Building2, 
  Bookmark,
  UserX,
  UserCheck,
  Search,
  Flag,
  AlertTriangle,
  MessageSquare,
  DollarSign,
  Wallet,
  Coins,
  TrendingUp,
  UserCog,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Upload,
  FileText,
  Camera,
  HelpCircle,
  FileUp,
  Layers,
  CheckSquare
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { cleanPhoneDigits, formatDisplayPhone } from '../utils/phone';

export default function AdminDashboard() {

  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(paramTab || 'attendance');
  const [toastMessage, setToastMessage] = useState(null);

  // Tab 1: Attendance Desk State
  const [meetingData, setMeetingData] = useState(null);
  const [isGeneratingPasscode, setIsGeneratingPasscode] = useState(false);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  // Tab 2: Story Curator State
  const [promptForm, setPromptForm] = useState({
    title: '',
    prompt_type: 'ORIGINAL_HOOK',
    story_opening: ''
  });
  const [activePrompt, setActivePrompt] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [isPublishingPrompt, setIsPublishingPrompt] = useState(false);
  const [isStoriesLoading, setIsStoriesLoading] = useState(true);
  const [crowningId, setCrowningId] = useState(null);

  // Tab 3: Membership Intake Desk & Audit Log State
  const [applications, setApplications] = useState([]);
  const [appFilter, setAppFilter] = useState('ALL'); // 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'
  const [intakeSearch, setIntakeSearch] = useState('');
  const [isAppsLoading, setIsAppsLoading] = useState(true);
  const [processingAppId, setProcessingAppId] = useState(null);

  // Quick-Add Member Modal State
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberForm, setAddMemberForm] = useState({
    full_name: '',
    phone_number: '',
    year_of_study: '2nd Year (Sophomore)',
    department: 'Software Engineering'
  });
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState(null);
  const [addMemberSuccess, setAddMemberSuccess] = useState(null);

  const handleQuickAddMember = async (e) => {
    e.preventDefault();
    setAddMemberError(null);
    setAddMemberSuccess(null);

    const cleanDigits = cleanPhoneDigits(addMemberForm.phone_number);
    if (!addMemberForm.full_name.trim() || !cleanDigits) {
      setAddMemberError('Full name and phone number are required.');
      return;
    }
    if (cleanDigits.length !== 9) {
      setAddMemberError('Please enter a valid 9-digit Ethiopian phone number (e.g., 9XXXXXXXX).');
      return;
    }

    setIsAddingMember(true);
    try {
      const formattedPhone = `+251${cleanDigits}`;
      const payload = {
        ...addMemberForm,
        full_name: addMemberForm.full_name.trim(),
        phone_number: formattedPhone
      };
      const res = await apiClient.post('/accounts/admin/add-member/', payload);
      setAddMemberSuccess({
        message: res.data?.message || 'Member successfully onboarded!',
        password: res.data?.default_password || 'ChapterChats2026!'
      });
      fetchApplications(appFilter);
      fetchRoster();
      setAddMemberForm({
        full_name: '',
        phone_number: '',
        year_of_study: '2nd Year (Sophomore)',
        department: 'Software Engineering'
      });
    } catch (err) {
      const msg = err.response?.data?.phone_number?.[0] || 
                  err.response?.data?.detail || 
                  err.response?.data?.error || 
                  'Failed to add member.';
      setAddMemberError(msg);
    } finally {
      setIsAddingMember(false);
    }
  };

  // Tab 4: Announcements State
  const [announcements, setAnnouncements] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    category: '#Meetup',
    is_banner: false
  });
  const [isPublishingAnnouncement, setIsPublishingAnnouncement] = useState(false);
  const [isAnnouncementsLoading, setIsAnnouncementsLoading] = useState(true);

  // Officer Personas & Scoped Workspace Permissions
  const isPresident = Boolean(
    user?.is_superuser || 
    user?.is_president || 
    user?.role === 'OWNER' || 
    user?.officer_title === 'PRESIDENT'
  );
  const isVicePresident = user?.officer_title === 'VICE_PRESIDENT';
  const isSocialMediaLead = user?.officer_title === 'SOCIAL_MEDIA_LEAD';
  const isResearchLead = user?.officer_title === 'RESEARCH_LEAD';
  const isEventLead = user?.officer_title === 'EVENT_LEAD';
  const isFinanceLead = user?.officer_title === 'FINANCE_LEAD';
  const hasFullAccess = isPresident || isVicePresident || user?.is_superuser || user?.role === 'ADMIN';

  // Allowed tabs per role
  const allowedTabs = React.useMemo(() => {
    if (hasFullAccess) {
      return ['cycle-launcher', 'quiz-builder', 'gallery', 'attendance', 'stories', 'membership', 'announcements', 'roster', 'reports', 'finance'];
    }
    if (isSocialMediaLead) {
      return ['quiz-builder', 'gallery', 'announcements', 'stories', 'reports'];
    }
    if (isResearchLead) {
      return ['quiz-builder', 'gallery', 'stories', 'reports'];
    }
    if (isEventLead) {
      return ['cycle-launcher', 'gallery', 'attendance', 'announcements'];
    }
    if (isFinanceLead) {
      return ['finance', 'membership', 'gallery'];
    }
    return ['cycle-launcher', 'quiz-builder', 'gallery', 'attendance', 'stories', 'membership', 'announcements', 'roster', 'reports', 'finance'];
  }, [user, hasFullAccess, isSocialMediaLead, isResearchLead, isEventLead, isFinanceLead]);

  // Tab: Cycle Launcher State
  const [cycleForm, setCycleForm] = useState({
    title: '',
    author: '',
    genre: 'Ethiopian Literature',
    total_pages: 320,
    synopsis: '',
    meeting_title: '',
    target_tuesday: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  });
  const [cyclePdfFile, setCyclePdfFile] = useState(null);
  const [cycleGuideFile, setCycleGuideFile] = useState(null);
  const [cycleCoverImage, setCycleCoverImage] = useState(null);
  const [isLaunchingCycle, setIsLaunchingCycle] = useState(false);
  const [isEndingCycle, setIsEndingCycle] = useState(false);
  const [activeCycleData, setActiveCycleData] = useState(null);
  const [isCycleLoading, setIsCycleLoading] = useState(true);

  // Tab: Officer Quiz Builder State
  const [quizForm, setQuizForm] = useState({
    title: '',
    cycle_id: '',
    scheduled_date: '',
    expires_at: '',
    questions: [
      {
        prompt: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_option: 'A',
        explanation: ''
      }
    ]
  });
  const [availableCycles, setAvailableCycles] = useState([]);
  const [isPublishingQuiz, setIsPublishingQuiz] = useState(false);
  const [quizzesList, setQuizzesList] = useState([]);
  const [isQuizzesLoading, setIsQuizzesLoading] = useState(true);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [isDeletingQuiz, setIsDeletingQuiz] = useState(false);

  // Tab: Gallery Upload Desk State
  const [galleryForm, setGalleryForm] = useState({
    event_name: 'Tuesday Review Meetup',
    caption: ''
  });
  const [galleryPhotoFile, setGalleryPhotoFile] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(true);
  const [adminPhotoToDelete, setAdminPhotoToDelete] = useState(null);
  const [isAdminDeletingPhoto, setIsAdminDeletingPhoto] = useState(false);


  // Tab 5: Members & Roster State
  const [rosterUsers, setRosterUsers] = useState([]);
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterRoleFilter, setRosterRoleFilter] = useState('ALL'); // 'ALL' | 'MEMBER' | 'OFFICER' | 'ADMIN'
  const [isRosterLoading, setIsRosterLoading] = useState(true);
  const [togglingUserId, setTogglingUserId] = useState(null);
  const [purgingUserId, setPurgingUserId] = useState(null);
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [selectedOfficerTitle, setSelectedOfficerTitle] = useState('NONE');
  const [isAssigningRole, setIsAssigningRole] = useState(false);

  // Tab 6: Moderation & Content Reports State
  const [reports, setReports] = useState([]);
  const [reportFilter, setReportFilter] = useState('unresolved'); // 'unresolved' | 'resolved' | 'all'
  const [isReportsLoading, setIsReportsLoading] = useState(true);
  const [processingReportId, setProcessingReportId] = useState(null);

  // Tab 7: Finance & Treasury Desk State
  const [financeData, setFinanceData] = useState({ records: [], summary: null });
  const [financeFilter, setFinanceFilter] = useState('ALL'); // 'ALL' | 'CONTRIBUTION' | 'SPONSORSHIP' | 'DONATION' | 'EXPENSE'
  const [isFinanceLoading, setIsFinanceLoading] = useState(true);
  const [isLoggingFinance, setIsLoggingFinance] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [financeForm, setFinanceForm] = useState({
    title: '',
    record_type: 'CONTRIBUTION',
    amount: '',
    currency: 'ETB',
    contributor_name: '',
    notes: ''
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch Attendance Desk Data
  const fetchAttendanceDesk = async () => {
    setIsAttendanceLoading(true);
    try {
      const res = await apiClient.get('/meetings/active/');
      if (res.data) {
        setMeetingData(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch meeting desk data:', err);
    } finally {
      setIsAttendanceLoading(false);
    }
  };

  // Generate New Passcode
  const handleGeneratePasscode = async () => {
    setIsGeneratingPasscode(true);
    try {
      const res = await apiClient.post('/meetings/generate-code/');
      if (res.data && res.data.passcode) {
        setMeetingData(prev => ({
          ...prev,
          meeting: {
            ...prev?.meeting,
            passcode: res.data.passcode,
            expires_at: res.data.expires_at,
            is_passcode_active: true
          },
          windowStatus: {
            ...prev?.windowStatus,
            is_within_time: true
          }
        }));
        showToast(res.data.message || `New meeting passcode "${res.data.passcode}" active for 4 hours!`);
      }
    } catch (err) {
      console.error('Failed to generate passcode:', err);
      showToast('Failed to generate new passcode.');
    } finally {
      setIsGeneratingPasscode(false);
    }
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    showToast('Passcode copied to clipboard!');
  };

  // 2. Fetch Story Curator Data
  const fetchStoryData = async () => {
    setIsStoriesLoading(true);
    try {
      const [promptRes, subsRes] = await Promise.all([
        apiClient.get('/activities/finish-the-story/active/'),
        apiClient.get('/activities/finish-the-story/submissions/')
      ]);
      if (promptRes.data?.activePrompt) {
        setActivePrompt(promptRes.data.activePrompt);
      }
      if (subsRes.data) {
        setSubmissions(subsRes.data);
      }
    } catch (err) {
      console.warn('Could not fetch story data:', err);
    } finally {
      setIsStoriesLoading(false);
    }
  };

  // Publish New Saturday Prompt
  const handlePublishPrompt = async (e) => {
    e.preventDefault();
    if (!promptForm.title || !promptForm.story_opening) return;

    setIsPublishingPrompt(true);
    try {
      const res = await apiClient.post('/activities/prompts/create/', promptForm);
      if (res.data && res.data.prompt) {
        setActivePrompt(res.data.prompt);
        setPromptForm({
          title: '',
          prompt_type: 'ORIGINAL_HOOK',
          story_opening: ''
        });
        showToast('Saturday Story Prompt published successfully!');
        fetchStoryData();
      }
    } catch (err) {
      console.error('Failed to publish prompt:', err);
      showToast(err.response?.data?.detail || 'Failed to publish prompt.');
    } finally {
      setIsPublishingPrompt(false);
    }
  };

  // Crown Winner of the Week
  const handleCrownWinner = async (subId) => {
    setCrowningId(subId);
    try {
      const res = await apiClient.post(`/activities/submissions/${subId}/crown-winner/`);
      if (res.data) {
        showToast(res.data.message || 'Story crowned as Winner of the Week!');
        // Update local submissions list
        setSubmissions(prev => prev.map(s => ({
          ...s,
          is_winner: s.id === subId
        })));
      }
    } catch (err) {
      console.error('Failed to crown winner:', err);
      showToast(err.response?.data?.detail || 'Failed to crown story winner.');
    } finally {
      setCrowningId(null);
    }
  };

  // 3. Fetch Membership Applications
  const fetchApplications = async (statusFilter = appFilter) => {
    setIsAppsLoading(true);
    try {
      const url = statusFilter && statusFilter !== 'ALL' 
        ? `/accounts/applications/?status=${statusFilter}` 
        : '/accounts/applications/';
      const res = await apiClient.get(url);
      if (res.data) {
        setApplications(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch applications:', err);
    } finally {
      setIsAppsLoading(false);
    }
  };

  // Approve / Decline Application
  const handleUpdateAppStatus = async (appId, newStatus) => {
    setProcessingAppId(appId);
    try {
      const res = await apiClient.patch(`/accounts/applications/${appId}/status/`, {
        status: newStatus
      });
      if (res.data) {
        showToast(`Application marked as ${newStatus}!`);
        setApplications(prev => prev.map(app => 
          app.id === appId ? { ...app, status: newStatus } : app
        ));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast(err.response?.data?.detail || 'Failed to update application.');
    } finally {
      setProcessingAppId(null);
    }
  };

  // 4. Fetch Announcements
  const fetchAnnouncements = async () => {
    setIsAnnouncementsLoading(true);
    try {
      const res = await apiClient.get('/announcements/');
      if (res.data) {
        setAnnouncements(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch announcements:', err);
    } finally {
      setIsAnnouncementsLoading(false);
    }
  };

  // Publish Announcement
  const handlePublishAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.content) return;

    setIsPublishingAnnouncement(true);
    try {
      const res = await apiClient.post('/announcements/', announcementForm);
      if (res.data) {
        showToast('Announcement broadcasted successfully!');
        setAnnouncementForm({
          title: '',
          content: '',
          category: '#Meetup',
          is_banner: false
        });
        fetchAnnouncements();
      }
    } catch (err) {
      console.error('Failed to publish announcement:', err);
      showToast(err.response?.data?.detail || 'Failed to broadcast announcement.');
    } finally {
      setIsPublishingAnnouncement(false);
    }
  };

  // Deactivate Announcement
  const handleDeleteAnnouncement = async (annId) => {
    try {
      await apiClient.delete(`/announcements/${annId}/`);
      showToast('Announcement removed.');
      setAnnouncements(prev => prev.filter(a => a.id !== annId));
    } catch (err) {
      console.error('Failed to delete announcement:', err);
      showToast('Failed to remove announcement.');
    }
  };

  // 5. Fetch Members & Roster
  const fetchRoster = async (search = rosterSearch, role = rosterRoleFilter) => {
    setIsRosterLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (role && role !== 'ALL') params.append('role', role);
      const res = await apiClient.get(`/accounts/users/?${params.toString()}`);
      if (res.data) {
        setRosterUsers(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch member roster:', err);
    } finally {
      setIsRosterLoading(false);
    }
  };

  // Toggle Member Ban Status
  const handleToggleBan = async (targetUser) => {
    if (targetUser.is_superuser || targetUser.id === user?.id) {
      showToast('Action restricted: Cannot ban superusers or your own account.');
      return;
    }
    const willBeBanned = targetUser.is_active;
    const confirmMsg = willBeBanned 
      ? `Are you sure you want to ban ${targetUser.first_name || targetUser.username}? They will be blocked from logging in.`
      : `Reinstate ${targetUser.first_name || targetUser.username}?`;
    
    if (!window.confirm(confirmMsg)) return;

    setTogglingUserId(targetUser.id);
    try {
      const res = await apiClient.patch(`/accounts/users/${targetUser.id}/toggle-ban/`);
      if (res.data) {
        showToast(res.data.message || 'Member status updated successfully.');
        setRosterUsers(prev => prev.map(u => 
          u.id === targetUser.id ? { ...u, is_active: res.data.is_active } : u
        ));
      }
    } catch (err) {
      console.error('Failed to toggle ban:', err);
      showToast(err.response?.data?.error || 'Failed to update member status.');
    } finally {
      setTogglingUserId(null);
    }
  };

  const canPurgeMembers = Boolean(
    user?.is_superuser || 
    user?.role === 'OWNER' || 
    ['PRESIDENT', 'VICE_PRESIDENT'].includes(user?.officer_title)
  );

  const handlePurgeMember = async (targetUser) => {
    if (!canPurgeMembers) {
      showToast('Action restricted: Only the President and Vice President can permanently purge members.');
      return;
    }
    if (targetUser.is_active) {
      showToast('Guardrail enforced: Member must be banned before permanent deletion is permitted.');
      return;
    }
    const confirmMsg = `WARNING: Are you sure you want to PERMANENTLY PURGE banned member "${targetUser.first_name || targetUser.username}"?\n\nThis will completely delete all of their submitted stories, quiz records, attendance, and account data from the database. This action is irreversible.`;
    if (!window.confirm(confirmMsg)) return;

    setPurgingUserId(targetUser.id);
    try {
      const res = await apiClient.delete(`/accounts/users/${targetUser.id}/purge/`);
      showToast(res.data?.message || 'Member permanently removed.');
      setRosterUsers(prev => prev.filter(u => u.id !== targetUser.id));
    } catch (err) {
      console.error('Failed to purge member:', err);
      showToast(err.response?.data?.detail || err.response?.data?.error || 'Failed to permanently remove member.');
    } finally {
      setPurgingUserId(null);
    }
  };

  // 6. Fetch Moderation Reports
  const fetchReports = async (filterKey = reportFilter) => {
    setIsReportsLoading(true);
    try {
      let url = '/activities/admin/reports/';
      if (filterKey === 'unresolved') url += '?resolved=false';
      else if (filterKey === 'resolved') url += '?resolved=true';
      const res = await apiClient.get(url);
      if (res.data) {
        setReports(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch reports:', err);
    } finally {
      setIsReportsLoading(false);
    }
  };

  // Dismiss / Mark Report Resolved
  const handleResolveReport = async (reportId) => {
    setProcessingReportId(reportId);
    try {
      const res = await apiClient.patch(`/activities/reports/${reportId}/resolve/`);
      if (res.data) {
        showToast('Report marked as dismissed/resolved.');
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, is_resolved: true } : r));
      }
    } catch (err) {
      console.error('Failed to resolve report:', err);
      showToast(err.response?.data?.error || 'Failed to dismiss report.');
    } finally {
      setProcessingReportId(null);
    }
  };

  // Delete Offending Content & Resolve Report
  const handleDeleteOffendingContent = async (report) => {
    const confirmMsg = `Are you sure you want to permanently delete this reported ${report.target_type === 'THREAD' ? 'discussion thread' : 'story submission'}? This cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    setProcessingReportId(report.id);
    try {
      const res = await apiClient.delete(`/activities/reports/${report.id}/?delete_content=true`);
      if (res.data) {
        showToast(res.data.message || 'Offending content deleted and report resolved.');
        setReports(prev => prev.map(r => r.id === report.id ? { ...r, is_resolved: true } : r));
      }
    } catch (err) {
      console.error('Failed to delete content:', err);
      showToast(err.response?.data?.error || 'Failed to delete offending content.');
    } finally {
      setProcessingReportId(null);
    }
  };

  // Open Assign Role Modal
  const handleOpenAssignRole = (targetUser) => {
    setRoleModalUser(targetUser);
    setSelectedOfficerTitle(targetUser.officer_title || 'NONE');
  };

  // Save Appointed Role
  const handleSaveOfficerRole = async () => {
    if (!roleModalUser) return;
    setIsAssigningRole(true);
    try {
      const res = await apiClient.patch(`/accounts/users/${roleModalUser.id}/assign-role/`, {
        officer_title: selectedOfficerTitle
      });
      if (res.data) {
        showToast(res.data.message || 'Executive role updated successfully!');
        setRosterUsers(prev => prev.map(u => 
          u.id === roleModalUser.id ? { ...u, ...res.data.user } : u
        ));
        setRoleModalUser(null);
      }
    } catch (err) {
      console.error('Failed to assign officer role:', err);
      showToast(err.response?.data?.detail || 'Failed to update executive role.');
    } finally {
      setIsAssigningRole(false);
    }
  };

  // 7. Fetch Finance Records
  const fetchFinanceRecords = async (typeFilter = financeFilter) => {
    setIsFinanceLoading(true);
    try {
      const url = typeFilter && typeFilter !== 'ALL'
        ? `/finance/records/?type=${typeFilter}`
        : '/finance/records/';
      const res = await apiClient.get(url);
      if (res.data) {
        setFinanceData(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch finance records:', err);
    } finally {
      setIsFinanceLoading(false);
    }
  };

  // Create Finance Ledger Entry
  const handleCreateFinanceRecord = async (e) => {
    e.preventDefault();
    if (!financeForm.title || !financeForm.amount) return;

    setIsLoggingFinance(true);
    try {
      const res = await apiClient.post('/finance/records/', financeForm);
      if (res.data) {
        showToast('Treasury ledger entry recorded successfully!');
        setFinanceForm({
          title: '',
          record_type: 'CONTRIBUTION',
          amount: '',
          currency: 'ETB',
          contributor_name: '',
          notes: ''
        });
        setIsFinanceModalOpen(false);
        fetchFinanceRecords(financeFilter);
      }
    } catch (err) {
      console.error('Failed to log finance record:', err);
      showToast(err.response?.data?.detail || 'Failed to record entry.');
    } finally {
      setIsLoggingFinance(false);
    }
  };

  // Delete Finance Record
  const handleDeleteFinanceRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this financial ledger entry?')) return;
    try {
      await apiClient.delete(`/finance/records/${recordId}/`);
      showToast('Ledger entry removed.');
      fetchFinanceRecords(financeFilter);
    } catch (err) {
      console.error('Failed to delete finance record:', err);
      showToast(err.response?.data?.detail || 'Failed to remove entry.');
    }
  };

  // 8. Cycle Launcher: Fetch Active Cycle & History
  const fetchCycleData = async () => {
    setIsCycleLoading(true);
    try {
      const res = await apiClient.get('/cycles/active/');
      if (res.data?.activeCycle) {
        setActiveCycleData(res.data.activeCycle);
      }
      const cyclesRes = await apiClient.get('/cycles/cycles/');
      if (cyclesRes.data && Array.isArray(cyclesRes.data)) {
        setAvailableCycles(cyclesRes.data);
      }
    } catch (err) {
      console.warn('Could not fetch cycle data:', err);
    } finally {
      setIsCycleLoading(false);
    }
  };

  // Launch New Reading Cycle
  const handleLaunchCycle = async (e) => {
    e.preventDefault();
    if (!cycleForm.title || !cycleForm.author || !cycleForm.target_tuesday) {
      showToast('Please fill in Book Title, Author, and Target Meeting Date.');
      return;
    }

    setIsLaunchingCycle(true);
    try {
      const formData = new FormData();
      formData.append('title', cycleForm.title.trim());
      formData.append('author', cycleForm.author.trim());
      formData.append('genre', cycleForm.genre);
      formData.append('total_pages', cycleForm.total_pages);
      formData.append('synopsis', cycleForm.synopsis.trim());
      if (cycleForm.meeting_title) formData.append('meeting_title', cycleForm.meeting_title.trim());
      formData.append('meeting_date', cycleForm.target_tuesday);
      formData.append('target_tuesday', cycleForm.target_tuesday);
      if (cycleForm.start_date) formData.append('start_date', cycleForm.start_date);
      if (cycleForm.end_date) formData.append('end_date', cycleForm.end_date);

      if (cyclePdfFile) formData.append('pdf_file', cyclePdfFile);
      if (cycleGuideFile) formData.append('guide_file', cycleGuideFile);
      if (cycleCoverImage) formData.append('cover_image', cycleCoverImage);

      const res = await apiClient.post('/cycles/cycles/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data) {
        showToast(res.data.message || '🚀 New Reading Cycle launched successfully!');
        if (res.data.cycle) {
          setActiveCycleData(res.data.cycle);
        }
        setCycleForm({
          title: '',
          author: '',
          genre: 'Ethiopian Literature',
          total_pages: 320,
          synopsis: '',
          meeting_title: '',
          target_tuesday: '',
          start_date: new Date().toISOString().split('T')[0],
          end_date: ''
        });
        setCyclePdfFile(null);
        setCycleGuideFile(null);
        setCycleCoverImage(null);
        fetchCycleData();
      }
    } catch (err) {
      console.error('Failed to launch reading cycle:', err);
      showToast(err.response?.data?.error || err.response?.data?.detail || 'Failed to launch cycle.');
    } finally {
      setIsLaunchingCycle(false);
    }
  };

  // End / Reset Active Reading Cycle
  const handleEndCycle = async () => {
    if (!activeCycleData) return;
    const confirmed = window.confirm(
      'End current reading cycle? This will stop the live countdown and return the club to the idle sprint state.'
    );
    if (!confirmed) return;

    setIsEndingCycle(true);
    try {
      await apiClient.patch(`/cycles/cycles/${activeCycleData.id}/end-cycle/`);
      showToast('Active reading cycle ended. The club is now in an idle sprint state.');
      setActiveCycleData(null);
      fetchCycleData();
    } catch (err) {
      console.error('Failed to end reading cycle:', err);
      showToast(err.response?.data?.error || err.response?.data?.detail || 'Failed to end cycle.');
    } finally {
      setIsEndingCycle(false);
    }
  };

  // 9. Thursday Quiz Builder: Fetch Quizzes & Cycles
  const fetchQuizData = async () => {
    setIsQuizzesLoading(true);
    try {
      const [quizRes, cycleRes] = await Promise.all([
        apiClient.get('/activities/quizzes/'),
        apiClient.get('/cycles/cycles/')
      ]);
      if (quizRes.data && Array.isArray(quizRes.data)) {
        setQuizzesList(quizRes.data);
      }
      if (cycleRes.data && Array.isArray(cycleRes.data)) {
        setAvailableCycles(cycleRes.data);
        if (cycleRes.data.length > 0 && !quizForm.cycle_id) {
          const active = cycleRes.data.find(c => c.is_active) || cycleRes.data[0];
          setQuizForm(prev => ({ ...prev, cycle_id: active.id }));
        }
      }
    } catch (err) {
      console.warn('Could not fetch quiz data:', err);
    } finally {
      setIsQuizzesLoading(false);
    }
  };

  const handleAddQuizQuestion = () => {
    setQuizForm(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          prompt: '',
          option_a: '',
          option_b: '',
          option_c: '',
          option_d: '',
          correct_option: 'A',
          explanation: ''
        }
      ]
    }));
  };

  const handleRemoveQuizQuestion = (qIdx) => {
    if (quizForm.questions.length <= 1) {
      showToast('A quiz must contain at least 1 question.');
      return;
    }
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== qIdx)
    }));
  };

  const handleQuizQuestionChange = (qIdx, field, val) => {
    setQuizForm(prev => {
      const nextQs = [...prev.questions];
      nextQs[qIdx] = { ...nextQs[qIdx], [field]: val };
      return { ...prev, questions: nextQs };
    });
  };

  const handlePublishQuiz = async (e) => {
    e.preventDefault();
    if (!quizForm.title.trim()) {
      showToast('Please specify a Quiz Title.');
      return;
    }
    for (let i = 0; i < quizForm.questions.length; i++) {
      const q = quizForm.questions[i];
      if (!q.prompt.trim() || !q.option_a.trim() || !q.option_b.trim() || !q.option_c.trim() || !q.option_d.trim()) {
        showToast(`Question ${i + 1} is missing a prompt or options.`);
        return;
      }
    }

    setIsPublishingQuiz(true);
    try {
      const payload = {
        title: quizForm.title.trim(),
        cycle_id: quizForm.cycle_id || undefined,
        scheduled_date: quizForm.scheduled_date || undefined,
        expires_at: quizForm.expires_at || undefined,
        questions: quizForm.questions
      };

      const res = await apiClient.post('/activities/quizzes/', payload);
      if (res.data) {
        showToast(res.data.message || '🎉 Thursday Quiz published and activated successfully!');
        setQuizForm({
          title: '',
          cycle_id: availableCycles[0]?.id || '',
          scheduled_date: '',
          expires_at: '',
          questions: [
            {
              prompt: '',
              option_a: '',
              option_b: '',
              option_c: '',
              option_d: '',
              correct_option: 'A',
              explanation: ''
            }
          ]
        });
        fetchQuizData();
      }
    } catch (err) {
      console.error('Failed to publish quiz:', err);
      showToast(err.response?.data?.error || err.response?.data?.detail || 'Failed to publish quiz.');
    } finally {
      setIsPublishingQuiz(false);
    }
  };

  // 10. Photo Gallery: Fetch & Upload
  const fetchGalleryPhotos = async () => {
    setIsGalleryLoading(true);
    try {
      const res = await apiClient.get('/activities/gallery/');
      if (res.data && Array.isArray(res.data)) {
        setGalleryPhotos(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch gallery photos:', err);
    } finally {
      setIsGalleryLoading(false);
    }
  };

  const handleUploadPhoto = async (e) => {
    e.preventDefault();
    if (!galleryPhotoFile) {
      showToast('Please select a photo file to upload.');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('image', galleryPhotoFile);
      formData.append('event_name', galleryForm.event_name.trim());
      formData.append('caption', galleryForm.caption.trim());

      const res = await apiClient.post('/activities/gallery/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data) {
        showToast('📸 Photo uploaded to Moments & Memories gallery!');
        setGalleryForm({ event_name: 'Tuesday Review Meetup', caption: '' });
        setGalleryPhotoFile(null);
        fetchGalleryPhotos();
      }
    } catch (err) {
      console.error('Failed to upload gallery photo:', err);
      showToast(err.response?.data?.detail || 'Failed to upload photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleConfirmDeleteQuiz = async () => {
    if (!quizToDelete) return;
    setIsDeletingQuiz(true);
    try {
      await apiClient.delete(`/activities/quizzes/${quizToDelete.id}/`);
      setQuizzesList(prev => prev.filter(q => q.id !== quizToDelete.id));
      showToast(`Quiz #${quizToDelete.id} removed successfully.`);
      setQuizToDelete(null);
    } catch (err) {
      console.error('Failed to delete quiz:', err);
      showToast(err.response?.data?.detail || 'Failed to delete quiz.', 'error');
    } finally {
      setIsDeletingQuiz(false);
    }
  };

  const handleConfirmDeleteGalleryPhoto = async () => {
    if (!adminPhotoToDelete) return;
    setIsAdminDeletingPhoto(true);
    try {
      await apiClient.delete(`/activities/gallery/${adminPhotoToDelete.id}/`);
      showToast('Photo removed from gallery.');
      fetchGalleryPhotos();
      setAdminPhotoToDelete(null);
    } catch (err) {
      console.error('Failed to delete gallery photo:', err);
      showToast(err.response?.data?.detail || 'Failed to delete photo.', 'error');
    } finally {
      setIsAdminDeletingPhoto(false);
    }
  };

  const handleDeletePhoto = (photo) => {
    setAdminPhotoToDelete(photo);
  };


  const switchTab = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  // Auto-switch to first available tab if current activeTab is unauthorized
  useEffect(() => {
    if (paramTab && allowedTabs.includes(paramTab)) {
      setActiveTab(paramTab);
    } else if (allowedTabs.length > 0 && !allowedTabs.includes(activeTab)) {
      setActiveTab(allowedTabs[0]);
    }
  }, [allowedTabs, paramTab]);

  // Load initial data on tab switch
  useEffect(() => {
    if (activeTab === 'cycle-launcher') fetchCycleData();
    if (activeTab === 'quiz-builder') fetchQuizData();
    if (activeTab === 'gallery') fetchGalleryPhotos();
    if (activeTab === 'attendance') fetchAttendanceDesk();
    if (activeTab === 'stories') fetchStoryData();
    if (activeTab === 'membership') fetchApplications(appFilter);
    if (activeTab === 'announcements') fetchAnnouncements();
    if (activeTab === 'roster') fetchRoster(rosterSearch, rosterRoleFilter);
    if (activeTab === 'reports') fetchReports(reportFilter);
    if (activeTab === 'finance') fetchFinanceRecords(financeFilter);
  }, [activeTab]);

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2D1B0F] text-[#F8F4EC] px-5 py-3 rounded-2xl border-2 border-[#C48B47] shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-slide-down">
          <Sparkles className="w-4 h-4 text-[#C48B47]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner: Executive Command Hub */}
      <div className="relative overflow-hidden rounded-3xl bg-[#2D1B0F] text-[#F8F4EC] p-6 sm:p-8 md:p-10 border-2 border-[#C48B47]/40 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-[#C48B47]/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-sm ${
                isPresident 
                  ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300' 
                  : 'bg-[#C48B47] text-[#2D1B0F]'
              }`}>
                {isPresident ? <Crown className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                <span>
                  {isPresident 
                    ? '👑 Club President (Owner)' 
                    : isVicePresident 
                    ? '🛡️ Vice President' 
                    : isSocialMediaLead 
                    ? '📣 Social Media Lead' 
                    : isResearchLead 
                    ? '📚 Research & Editorial Lead' 
                    : isEventLead 
                    ? '🎟️ Event Organizing Lead' 
                    : isFinanceLead 
                    ? '💰 Finance Lead' 
                    : '🛡️ Executive Officer'}
                </span>
              </span>
              <span className="text-xs font-semibold text-[#EFE7DA]/80 bg-[#422817] px-3 py-1 rounded-full border border-[#C48B47]/30">
                Logged in as @{user?.username} ({user?.officer_title_display || user?.role_display || 'Admin'})
              </span>
            </div>

            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-white tracking-tight">
              Chapters <span className="text-[#C48B47]">&amp;</span> Chats Operations Hub
            </h1>
            <p className="text-xs sm:text-sm text-[#EFE7DA]/80 max-w-2xl leading-relaxed">
              {isPresident
                ? 'Complete executive platform oversight: appoint officers, monitor cycles, supervise treasury, and oversee moderation.'
                : isFinanceLead
                ? 'Treasury & finance workspace: track member dues, sponsor contributions, donation ledgers, and club expenditures.'
                : isEventLead
                ? 'Event & attendance workspace: manage Tuesday meeting passcodes, attendance verification, and streak tracking.'
                : isSocialMediaLead
                ? 'Broadcasts & creative workspace: publish noticeboard alerts, curate Saturday stories, and manage Sunday quizzes.'
                : isResearchLead
                ? 'Editorial workspace: curate literature selections, craft Saturday narrative hooks, and review member proposals.'
                : 'Executive operations desk: coordinate weekly meetups, creative initiatives, and member intake.'}
            </p>
          </div>

          {/* Show Django Admin access ONLY for the President / Superuser */}
          {user?.is_superuser && (
            <div className="flex items-center gap-3">
              <a
                href="http://localhost:8000/admin/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-stone-800 text-stone-100 rounded-lg text-xs font-semibold hover:bg-stone-900 transition-colors flex items-center gap-1.5"
              >
                <span>Django Admin</span>
                <ExternalLink size={13} />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Scoped Executive Tab Selectors */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#EFE7DA] rounded-2xl border-2 border-[#D8C8B0] shadow-xs">
        
        {/* Tab 0A: Reading Cycle Launcher */}
        {allowedTabs.includes('cycle-launcher') && (
          <button
            type="button"
            onClick={() => switchTab('cycle-launcher')}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'cycle-launcher'
                ? 'bg-[#A35C33] text-white shadow-md'
                : 'text-[#2D1B0F]/80 hover:text-[#2D1B0F] hover:bg-[#E5DBCB]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>Cycle Launcher</span>
          </button>
        )}

        {/* Tab 0B: Thursday Quiz Builder */}
        {allowedTabs.includes('quiz-builder') && (
          <button
            type="button"
            onClick={() => switchTab('quiz-builder')}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'quiz-builder'
                ? 'bg-[#A35C33] text-white shadow-md'
                : 'text-[#2D1B0F]/80 hover:text-[#2D1B0F] hover:bg-[#E5DBCB]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Thursday Quiz</span>
          </button>
        )}

        {/* Tab 0C: Moments & Memories Photo Gallery */}
        {allowedTabs.includes('gallery') && (
          <button
            type="button"
            onClick={() => switchTab('gallery')}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'gallery'
                ? 'bg-[#A35C33] text-white shadow-md'
                : 'text-[#2D1B0F]/80 hover:text-[#2D1B0F] hover:bg-[#E5DBCB]'
            }`}
          >
            <Camera className="w-3.5 h-3.5 shrink-0" />
            <span>Moments Gallery</span>
          </button>
        )}

        {/* Tab 1: Tuesday Attendance Desk */}
        {allowedTabs.includes('attendance') && (
          <button
            type="button"
            onClick={() => switchTab('attendance')}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-[#A35C33] text-white shadow-md'
                : 'text-[#2D1B0F]/80 hover:text-[#2D1B0F] hover:bg-[#E5DBCB]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>Attendance</span>
          </button>
        )}

        {/* Tab 2: Saturday Story Curator */}
        {allowedTabs.includes('stories') && (
          <button
            type="button"
            onClick={() => switchTab('stories')}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'stories'
                ? 'bg-[#A35C33] text-white shadow-md'
                : 'text-[#2D1B0F]/80 hover:text-[#2D1B0F] hover:bg-[#E5DBCB]'
            }`}
          >
            <PenTool className="w-3.5 h-3.5 shrink-0" />
            <span>Story Curator</span>
          </button>
        )}

        {/* Tab 3: Membership Desk */}
        {allowedTabs.includes('membership') && (
          <button
            type="button"
            onClick={() => switchTab('membership')}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'membership'
                ? 'bg-[#A35C33] text-white shadow-md'
                : 'text-[#2D1B0F]/80 hover:text-[#2D1B0F] hover:bg-[#E5DBCB]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 shrink-0" />
            <span>Intake Desk</span>
          </button>
        )}

        {/* Tab 4: Announcements & Alerts */}
        {allowedTabs.includes('announcements') && (
          <button
            type="button"
            onClick={() => switchTab('announcements')}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'announcements'
                ? 'bg-[#A35C33] text-white shadow-md'
                : 'text-[#2D1B0F]/80 hover:text-[#2D1B0F] hover:bg-[#E5DBCB]'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5 shrink-0" />
            <span>Broadcasts</span>
          </button>
        )}

        {/* Tab 5: Members & Roster */}
        {allowedTabs.includes('roster') && (
          <button
            type="button"
            onClick={() => switchTab('roster')}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'roster'
                ? 'bg-[#A35C33] text-white shadow-md'
                : 'text-[#2D1B0F]/80 hover:text-[#2D1B0F] hover:bg-[#E5DBCB]'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>Member Roster</span>
          </button>
        )}

        {/* Tab 6: Moderation & Reports */}
        {allowedTabs.includes('reports') && (
          <button
            type="button"
            onClick={() => switchTab('reports')}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-[#A35C33] text-white shadow-md'
                : 'text-[#2D1B0F]/80 hover:text-[#2D1B0F] hover:bg-[#E5DBCB]'
            }`}
          >
            <Flag className="w-3.5 h-3.5 shrink-0" />
            <span>Moderation</span>
          </button>
        )}

        {/* Tab 7: Treasury & Finance Desk */}
        {allowedTabs.includes('finance') && (
          <button
            type="button"
            onClick={() => switchTab('finance')}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'finance'
                ? 'bg-[#A35C33] text-white shadow-md'
                : 'text-[#2D1B0F]/80 hover:text-[#2D1B0F] hover:bg-[#E5DBCB]'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 shrink-0" />
            <span>Treasury &amp; Dues</span>
          </button>
        )}
      </div>

      {/* TAB 0A: READING CYCLE LAUNCHER DESK */}
      {activeTab === 'cycle-launcher' && (
        <div className="space-y-8 animate-fade-in">
          {/* Active Cycle Status Overview */}
          {activeCycleData && (
            <div className="bg-[#EDE2CF] border-2 border-[#CBB79B] rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xs">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#2D1B0F] text-[#C48B47] flex items-center justify-center font-serif text-lg font-bold shrink-0 border border-[#C48B47]/40 shadow-sm">
                  #{activeCycleData.id || 1}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[#A35C33] text-white px-2.5 py-0.5 rounded-full shadow-xs">
                      Currently Active Cycle
                    </span>
                    <span className="text-xs text-[#2D1B0F]/70 font-semibold">
                      Target Tuesday: {activeCycleData.meeting_date || activeCycleData.start_date} @ 12:30 PM EAT
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-xl text-[#2D1B0F]">
                    {activeCycleData.book?.title || 'Active Cycle Book'} <span className="text-xs font-normal text-[#A35C33] italic">by {activeCycleData.book?.author || 'Author'}</span>
                  </h3>
                  <p className="text-xs text-[#2D1B0F]/75 line-clamp-1">
                    {activeCycleData.book?.genre} • {activeCycleData.book?.total_pages || 300} Pages Total
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={handleEndCycle}
                  disabled={isEndingCycle}
                  className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  title="End current reading cycle and reset countdown"
                >
                  <X className="w-3.5 h-3.5 text-red-600" />
                  <span>{isEndingCycle ? 'Ending Cycle...' : 'End / Reset Active Cycle'}</span>
                </button>
                <NavLink
                  to="/"
                  className="px-4 py-2 rounded-xl bg-[#2D1B0F] text-[#C48B47] hover:bg-[#1A0E06] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5 text-[#C48B47]" />
                  <span>Preview Home Countdown</span>
                </NavLink>
                <button
                  type="button"
                  onClick={() => switchTab('quiz-builder')}
                  className="px-4 py-2 rounded-xl bg-[#A35C33] hover:bg-[#8B4C28] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Build Cycle Quiz</span>
                </button>
              </div>
            </div>
          )}

          {/* Cycle Launch Form */}
          <div className="bg-[#F6EFE2] rounded-3xl border-2 border-[#D8C8B0] p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#D8C8B0] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#A35C33] text-white flex items-center justify-center shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#2D1B0F]">
                    Launch New 3-Week Reading Cycle
                  </h2>
                  <p className="text-xs text-[#2D1B0F]/70">
                    Creates the curated Book record, deactivates older cycles, and sets the live countdown to Tuesday at 12:30 PM EAT.
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-[#A35C33] bg-[#E5D6BF] px-3 py-1 rounded-full border border-[#BAA587]">
                Executive Desk
              </span>
            </div>

            <form onSubmit={handleLaunchCycle} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Book Metadata & Schedule */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                        Book Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={cycleForm.title}
                        onChange={e => setCycleForm({ ...cycleForm, title: e.target.value })}
                        placeholder="e.g. Fiqir Eske Meqabir"
                        className="w-full px-4 py-3 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:border-[#A35C33] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                        Author *
                      </label>
                      <input
                        type="text"
                        required
                        value={cycleForm.author}
                        onChange={e => setCycleForm({ ...cycleForm, author: e.target.value })}
                        placeholder="e.g. Haddis Alemayehu"
                        className="w-full px-4 py-3 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:border-[#A35C33] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                        Genre Category
                      </label>
                      <select
                        value={cycleForm.genre}
                        onChange={e => setCycleForm({ ...cycleForm, genre: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:border-[#A35C33] focus:outline-none cursor-pointer"
                      >
                        <option value="Ethiopian Literature">Ethiopian Literature</option>
                        <option value="Philosophy & Ethics">Philosophy &amp; Ethics</option>
                        <option value="World Classics">World Classics</option>
                        <option value="African Literature">African Literature</option>
                        <option value="Fiction & Satire">Fiction &amp; Satire</option>
                        <option value="Poetry & Anthologies">Poetry &amp; Anthologies</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                        Total Page Count
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="2000"
                        value={cycleForm.total_pages}
                        onChange={e => setCycleForm({ ...cycleForm, total_pages: parseInt(e.target.value) || 300 })}
                        className="w-full px-4 py-3 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:border-[#A35C33] focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                        Target Review / Meeting Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={cycleForm.target_tuesday}
                        onChange={e => setCycleForm({ ...cycleForm, target_tuesday: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:border-[#A35C33] focus:outline-none cursor-pointer font-mono"
                      />
                      <span className="text-[10px] text-[#A35C33] font-medium mt-0.5 block">
                        {cycleForm.target_tuesday
                          ? `Selected: ${new Date(cycleForm.target_tuesday + 'T12:30:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} at 12:30 PM EAT`
                          : 'Select any weekday (Saturday, Tuesday, etc.). Session starts at 12:30 PM EAT.'}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                        Optional Gathering Title
                      </label>
                      <input
                        type="text"
                        value={cycleForm.meeting_title || ''}
                        onChange={e => setCycleForm({ ...cycleForm, meeting_title: e.target.value })}
                        placeholder="e.g. Saturday Grand Review, Year-End Gathering"
                        className="w-full px-4 py-3 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:border-[#A35C33] focus:outline-none"
                      />
                      <span className="text-[10px] text-[#2D1B0F]/60 font-medium mt-0.5 block">
                        Defaults to &ldquo;[Weekday] Review&rdquo; on the homepage countdown.
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                      Cycle Start Date
                    </label>
                    <input
                      type="date"
                      value={cycleForm.start_date}
                      onChange={e => setCycleForm({ ...cycleForm, start_date: e.target.value })}
                      className="w-full px-4 py-3 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:border-[#A35C33] focus:outline-none cursor-pointer font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                      Book Synopsis &amp; Curatorial Review Notes
                    </label>
                    <textarea
                      rows={4}
                      value={cycleForm.synopsis}
                      onChange={e => setCycleForm({ ...cycleForm, synopsis: e.target.value })}
                      placeholder="Write an engaging overview of why this book was chosen for the 3-week sprint and what themes will be reviewed..."
                      className="w-full px-4 py-3 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:border-[#A35C33] focus:outline-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Right Column: File Uploads & Launch CTA */}
                <div className="lg:col-span-5 space-y-4">
                  {/* PDF Reading Copy Upload */}
                  <div className="p-4 rounded-2xl bg-white border-2 border-[#D8C8B0] space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#2D1B0F] flex items-center gap-1.5">
                        <FileUp className="w-4 h-4 text-[#A35C33]" />
                        <span>PDF Reading Copy</span>
                      </label>
                      <span className="text-[10px] uppercase font-bold text-[#A35C33]">
                        Book House Download
                      </span>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={e => setCyclePdfFile(e.target.files[0] || null)}
                      className="w-full text-xs text-[#2D1B0F] file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#EFE7DA] file:text-[#A35C33] hover:file:bg-[#E5DBCB] cursor-pointer"
                    />
                    {cyclePdfFile && (
                      <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>{cyclePdfFile.name} ({(cyclePdfFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </p>
                    )}
                  </div>

                  {/* Discussion Guide Worksheet Upload */}
                  <div className="p-4 rounded-2xl bg-white border-2 border-[#D8C8B0] space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#2D1B0F] flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[#A35C33]" />
                        <span>Discussion Guide Worksheet</span>
                      </label>
                      <span className="text-[10px] uppercase font-bold text-[#A35C33]">
                        Review Handout
                      </span>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={e => setCycleGuideFile(e.target.files[0] || null)}
                      className="w-full text-xs text-[#2D1B0F] file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#EFE7DA] file:text-[#A35C33] hover:file:bg-[#E5DBCB] cursor-pointer"
                    />
                    {cycleGuideFile && (
                      <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>{cycleGuideFile.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Book Cover Image Upload */}
                  <div className="p-4 rounded-2xl bg-white border-2 border-[#D8C8B0] space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#2D1B0F] flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-[#A35C33]" />
                        <span>Book Cover Artwork</span>
                      </label>
                      <span className="text-[10px] uppercase font-bold text-[#A35C33]">
                        Optional
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => setCycleCoverImage(e.target.files[0] || null)}
                      className="w-full text-xs text-[#2D1B0F] file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#EFE7DA] file:text-[#A35C33] hover:file:bg-[#E5DBCB] cursor-pointer"
                    />
                    {cycleCoverImage && (
                      <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>{cycleCoverImage.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Primary Launch Action Card */}
                  <div className="p-5 rounded-2xl bg-[#2D1B0F] text-[#F8F4EC] space-y-3 shadow-md border-2 border-[#C48B47]/40">
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-[#C48B47] animate-pulse" />
                      <h4 className="font-serif font-bold text-sm text-white">
                        Cycle Engine Activation
                      </h4>
                    </div>
                    <p className="text-[11px] text-[#EFE7DA]/80 leading-relaxed">
                      Launching will update the Home Hero display, compute 3 weekly milestones (33%, 66%, 100%), and schedule the Tuesday 12:30 PM meeting window.
                    </p>
                    <button
                      type="submit"
                      disabled={isLaunchingCycle}
                      className="w-full py-3.5 rounded-xl bg-[#A35C33] hover:bg-[#8B4C28] text-white font-bold text-xs shadow-md border border-[#6E3618] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isLaunchingCycle ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#C48B47]" />
                          <span>Activating 3-Week Cycle...</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-4 h-4 text-white" />
                          <span>🚀 Launch Cycle &amp; Activate Countdown</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 0B: THURSDAY QUIZ BUILDER DESK */}
      {activeTab === 'quiz-builder' && (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-[#F6EFE2] rounded-3xl border-2 border-[#D8C8B0] p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#D8C8B0] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#A35C33] text-white flex items-center justify-center shadow-xs">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#2D1B0F]">
                    Thursday Quiz Authoring Desk
                  </h2>
                  <p className="text-xs text-[#2D1B0F]/70">
                    Draft and activate weekly Thursday mini-quizzes (+50 XP) to validate member reading progress before Tuesday.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#C48B47] text-[#2D1B0F] px-2.5 py-1 rounded-full shadow-xs">
                  Officer Exclusive
                </span>
              </div>
            </div>

            <form onSubmit={handlePublishQuiz} className="space-y-6">
              {/* Quiz Header & Cycle Association */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#EDE2CF] border border-[#CBB79B]">
                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                    Quiz Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={quizForm.title}
                    onChange={e => setQuizForm({ ...quizForm, title: e.target.value })}
                    placeholder="e.g. Week 2 Reading Milestone Quiz"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:border-[#A35C33] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                    Associate with Reading Cycle
                  </label>
                  <select
                    value={quizForm.cycle_id}
                    onChange={e => setQuizForm({ ...quizForm, cycle_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:border-[#A35C33] focus:outline-none cursor-pointer"
                  >
                    {availableCycles.length === 0 ? (
                      <option value="">Active Reading Cycle</option>
                    ) : (
                      availableCycles.map(c => (
                        <option key={c.id} value={c.id}>
                          Cycle #{c.id}: {c.book?.title || 'Cycle Book'} ({c.is_active ? 'Active' : 'Archived'})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                    Scheduled Thursday Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={quizForm.scheduled_date}
                    onChange={e => setQuizForm({ ...quizForm, scheduled_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:border-[#A35C33] focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Dynamic Question Builder */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-lg text-[#2D1B0F] flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-[#A35C33]" />
                    <span>Questions ({quizForm.questions.length})</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddQuizQuestion}
                    className="px-3.5 py-1.5 rounded-xl bg-[#2D1B0F] text-[#C48B47] hover:bg-[#1A0E06] text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {quizForm.questions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="p-5 rounded-2xl bg-white border-2 border-[#D8C8B0] shadow-xs space-y-4 relative"
                    >
                      <div className="flex items-center justify-between border-b border-[#D8C8B0]/60 pb-2">
                        <span className="font-serif font-bold text-sm text-[#A35C33]">
                          Question #{qIdx + 1}
                        </span>
                        {quizForm.questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuizQuestion(qIdx)}
                            className="text-rose-600 hover:text-rose-800 p-1 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                          Question Prompt *
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={q.prompt}
                          onChange={e => handleQuizQuestionChange(qIdx, 'prompt', e.target.value)}
                          placeholder="e.g. In Chapter 4, how does the protagonist confront the moral dilemma in the courtyard?"
                          className="w-full px-3.5 py-2 bg-[#F8F4EC] border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:border-[#A35C33] focus:outline-none leading-relaxed"
                        />
                      </div>

                      {/* 4 Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(['option_a', 'option_b', 'option_c', 'option_d']).map((optKey, optIdx) => {
                          const letter = ['A', 'B', 'C', 'D'][optIdx];
                          const isCorrect = q.correct_option === letter;
                          return (
                            <div key={optKey} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-[#2D1B0F]">
                                  Option {letter} *
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleQuizQuestionChange(qIdx, 'correct_option', letter)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                                    isCorrect 
                                      ? 'bg-emerald-600 text-white shadow-xs' 
                                      : 'bg-[#EFE7DA] text-[#2D1B0F]/60 hover:text-[#2D1B0F]'
                                  }`}
                                >
                                  {isCorrect ? '✓ Correct Choice' : 'Mark as Correct'}
                                </button>
                              </div>
                              <input
                                type="text"
                                required
                                value={q[optKey]}
                                onChange={e => handleQuizQuestionChange(qIdx, optKey, e.target.value)}
                                placeholder={`Choice ${letter} answer text`}
                                className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                                  isCorrect 
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold' 
                                    : 'bg-white border-[#D8C8B0] text-[#2D1B0F]'
                                }`}
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                          Explanation Note (Revealed upon quiz submission)
                        </label>
                        <input
                          type="text"
                          value={q.explanation}
                          onChange={e => handleQuizQuestionChange(qIdx, 'explanation', e.target.value)}
                          placeholder="e.g. Refer to Chapter 4, Page 128 where the dialogue with the elder is described."
                          className="w-full px-3.5 py-2 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:border-[#A35C33] focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#D8C8B0]">
                  <button
                    type="button"
                    onClick={handleAddQuizQuestion}
                    className="px-4 py-2.5 rounded-xl border-2 border-[#D8C8B0] bg-white text-[#2D1B0F] hover:bg-[#EFE7DA] text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Another Question</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isPublishingQuiz}
                    className="px-6 py-3 rounded-xl bg-[#A35C33] hover:bg-[#8B4C28] text-white font-bold text-xs shadow-md border border-[#6E3618] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isPublishingQuiz ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#C48B47]" />
                        <span>Publishing Quiz Set...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-white" />
                        <span>Publish &amp; Activate Thursday Quiz</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Published Quizzes History */}
          {quizzesList.length > 0 && (
            <div className="bg-white rounded-3xl border border-[#D8C8B0] p-6 space-y-4 shadow-xs">
              <h3 className="font-serif font-bold text-lg text-[#2D1B0F] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#A35C33]" />
                <span>Existing Quiz Sets</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {quizzesList.map(q => (
                  <div key={q.id} className="p-4 rounded-2xl bg-[#F6EFE2] border border-[#D8C8B0] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase bg-[#A35C33] text-white px-2 py-0.5 rounded">
                        Quiz #{q.id}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#2D1B0F]/60">
                          {q.questions?.length || 5} Questions
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuizToDelete(q)}
                          className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                          title="Delete Quiz Set"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-serif font-bold text-sm text-[#2D1B0F]">{q.title}</h4>
                    <p className="text-xs text-[#2D1B0F]/70">
                      Book: {q.book_title || 'Active Cycle'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DeleteConfirmModal
            isOpen={Boolean(quizToDelete)}
            title="Delete Quiz Set"
            message={`Are you sure you want to delete "${quizToDelete?.title || `Quiz #${quizToDelete?.id}`}"? All member attempts and recorded XP for this quiz will be permanently removed.`}
            isDeleting={isDeletingQuiz}
            onConfirm={handleConfirmDeleteQuiz}
            onClose={() => setQuizToDelete(null)}
          />
        </div>
      )}

      {/* TAB 0C: MOMENTS & MEMORIES PHOTO GALLERY DESK */}
      {activeTab === 'gallery' && (
        <div className="space-y-8 animate-fade-in">
          {/* Photo Upload Form */}
          <div className="bg-[#F6EFE2] rounded-3xl border-2 border-[#D8C8B0] p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#D8C8B0] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#A35C33] text-white flex items-center justify-center shadow-xs">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#2D1B0F]">
                    Club Photo Archive Desk
                  </h2>
                  <p className="text-xs text-[#2D1B0F]/70">
                    Upload snapshots of Tuesday reviews, campfire book discussions, campus donation drives, and gala honors.
                  </p>
                </div>
              </div>

              <NavLink
                to="/about"
                className="px-4 py-2 rounded-xl bg-[#2D1B0F] text-[#C48B47] hover:bg-[#1A0E06] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#C48B47]" />
                <span>View About Gallery</span>
              </NavLink>
            </div>

            <form onSubmit={handleUploadPhoto} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                    Event / Category *
                  </label>
                  <select
                    value={galleryForm.event_name}
                    onChange={e => setGalleryForm({ ...galleryForm, event_name: e.target.value })}
                    className="w-full px-4 py-3 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:border-[#A35C33] focus:outline-none cursor-pointer"
                  >
                    <option value="Tuesday Review Meetup">Tuesday Review Meetup (Library Hall B)</option>
                    <option value="Campfire Review Night">Campfire Review Night</option>
                    <option value="Campus Book Drive">Campus Book Donation Drive</option>
                    <option value="Courtyard Reading Sprint">Courtyard Reading Sprint</option>
                    <option value="Annual Literary Honors Gala">Annual Literary Gala</option>
                    <option value="Executive Council Workshop">Executive Council Workshop</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                    Select Photo File *
                  </label>
                  <input
                    type="file"
                    required
                    accept="image/*"
                    onChange={e => setGalleryPhotoFile(e.target.files[0] || null)}
                    className="w-full text-xs text-[#2D1B0F] file:mr-3 file:py-2.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#EFE7DA] file:text-[#A35C33] hover:file:bg-[#E5DBCB] cursor-pointer"
                  />
                  {galleryPhotoFile && (
                    <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                      Selected: {galleryPhotoFile.name}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                  Photo Caption &amp; Memory Story
                </label>
                <textarea
                  rows={2}
                  value={galleryForm.caption}
                  onChange={e => setGalleryForm({ ...galleryForm, caption: e.target.value })}
                  placeholder="Describe the moment, the literary debate, or the community initiative..."
                  className="w-full px-4 py-3 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:border-[#A35C33] focus:outline-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isUploadingPhoto}
                className="px-6 py-3 rounded-xl bg-[#A35C33] hover:bg-[#8B4C28] text-white font-bold text-xs shadow-md border border-[#6E3618] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isUploadingPhoto ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#C48B47]" />
                    <span>Uploading Photo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-white" />
                    <span>Upload to Moments &amp; Memories Gallery</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Uploaded Gallery Grid Management */}
          <div className="bg-white rounded-3xl border border-[#D8C8B0] p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#D8C8B0]/60 pb-3">
              <h3 className="font-serif font-bold text-lg text-[#2D1B0F] flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#A35C33]" />
                <span>Uploaded Photo Gallery ({galleryPhotos.length})</span>
              </h3>
              <button
                type="button"
                onClick={fetchGalleryPhotos}
                className="p-1.5 text-xs text-[#A35C33] hover:text-[#2D1B0F] flex items-center gap-1 font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {isGalleryLoading ? (
              <div className="py-12 text-center text-xs text-[#A35C33] font-semibold">
                Loading gallery items...
              </div>
            ) : galleryPhotos.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Camera className="w-10 h-10 text-[#A35C33] mx-auto opacity-50" />
                <h4 className="font-serif font-bold text-base text-[#2D1B0F]">No custom photos uploaded yet</h4>
                <p className="text-xs text-[#2D1B0F]/70">Use the form above to upload snapshots from club events.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {galleryPhotos.map(photo => (
                  <div key={photo.id} className="rounded-2xl border border-[#D8C8B0] overflow-hidden bg-[#F8F4EC] flex flex-col justify-between shadow-xs">
                    <div className="relative h-44 bg-black overflow-hidden">
                      <img
                        src={photo.image_url || photo.image}
                        alt={photo.event_name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <span className="text-[10px] font-bold uppercase bg-[#2D1B0F]/80 text-[#C48B47] px-2 py-0.5 rounded">
                          {photo.event_name}
                        </span>
                      </div>
                    </div>
                    <div className="p-3.5 space-y-2">
                      <p className="text-xs text-[#2D1B0F]/80 line-clamp-2">
                        {photo.caption || 'No caption provided.'}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-[#D8C8B0]/60 text-[10px] text-[#2D1B0F]/60">
                        <span>By {photo.uploaded_by_username || 'Officer'}</span>
                        <button
                          type="button"
                          disabled={isAdminDeletingPhoto}
                          onClick={() => handleDeletePhoto(photo)}
                          className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DeleteConfirmModal
            isOpen={Boolean(adminPhotoToDelete)}
            title="Delete Gallery Photo"
            message={`Are you sure you want to delete this photo from "${adminPhotoToDelete?.event_name || 'Moments & Memories'}"? This cannot be undone.`}
            isDeleting={isAdminDeletingPhoto}
            onConfirm={handleConfirmDeleteGalleryPhoto}
            onClose={() => setAdminPhotoToDelete(null)}
          />
        </div>
      )}

      {/* TAB 1: TUESDAY ATTENDANCE DESK */}
      {activeTab === 'attendance' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Big Visual Passcode Card */}
            <div className="lg:col-span-5 bg-[#F6EFE2] rounded-3xl border-2 border-[#D8C8B0] p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#A35C33] text-white flex items-center justify-center">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif font-bold text-lg text-[#2D1B0F]">Meeting Passcode</h2>
                    <p className="text-[11px] text-[#2D1B0F]/70">Tuesday Attendance Verification</p>
                  </div>
                </div>

                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-[#E5D6BF] text-[#5C3B1E] border border-[#BAA587]">
                  Active Window
                </span>
              </div>

              {/* Big Display Area */}
              <div className="bg-[#2D1B0F] rounded-2xl p-6 text-center text-[#F8F4EC] space-y-2 border-2 border-[#C48B47]/40 shadow-inner">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#C48B47]">
                  Projector / Whiteboard Token
                </span>
                <div className="font-mono font-black text-5xl sm:text-6xl tracking-widest text-white py-1">
                  {meetingData?.meeting?.passcode || '8419'}
                </div>
                <p className="text-[11px] text-[#EFE7DA]/70 font-medium">
                  {meetingData?.meeting?.expires_at 
                    ? `Active for 4 hours until ${new Date(meetingData.meeting.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Valid for 4 hours from generation'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleGeneratePasscode}
                  disabled={isGeneratingPasscode}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#A35C33] hover:bg-[#8B4C28] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isGeneratingPasscode ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span>Generate New Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyCode(meetingData?.meeting?.passcode || '8419')}
                  className="p-3 rounded-xl border-2 border-[#D8C8B0] bg-white text-[#2D1B0F] hover:bg-[#EFE7DA] transition-colors cursor-pointer"
                  title="Copy Passcode"
                >
                  {copiedCode ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5 text-[#A35C33]" />}
                </button>
              </div>

              {/* Time Window Status Badge */}
              <div className="p-4 rounded-2xl bg-[#EFE7DA] border border-[#D8C8B0] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#2D1B0F] flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#A35C33]" />
                    Passcode Validity:
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    meetingData?.meeting?.is_passcode_active !== false && meetingData?.windowStatus?.is_within_time
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}>
                    {meetingData?.meeting?.is_passcode_active !== false && meetingData?.windowStatus?.is_within_time
                      ? 'ACTIVE (4-HOUR WINDOW)'
                      : 'EXPIRED (REFRESH CODE)'}
                  </span>
                </div>
                <p className="text-[11px] text-[#2D1B0F]/70">
                  Current time: <strong>{meetingData?.windowStatus?.current_time || 'Now'}</strong> • Attendance Window: <strong>4-Hour Rolling Expiry</strong>.
                </p>
              </div>
            </div>

            {/* Live Checked-in Members Table */}
            <div className="lg:col-span-7 bg-[#F6EFE2] rounded-3xl border-2 border-[#D8C8B0] p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif font-bold text-xl text-[#2D1B0F]">
                    Checked-In Members List
                  </h2>
                  <p className="text-xs text-[#2D1B0F]/70">
                    Live verify records recorded for active cycle
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#2D1B0F] text-[#C48B47] font-bold text-xs">
                    {meetingData?.total_checked_in || meetingData?.attendances?.length || 0} Verified
                  </span>
                  <button
                    type="button"
                    onClick={fetchAttendanceDesk}
                    className="p-2 rounded-xl border border-[#D8C8B0] hover:bg-[#EFE7DA] text-[#2D1B0F] transition-colors"
                    title="Refresh List"
                  >
                    <RefreshCw className={`w-4 h-4 ${isAttendanceLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Attendance Table */}
              <div className="overflow-x-auto">
                {meetingData?.attendances && meetingData.attendances.length > 0 ? (
                  <div className="space-y-2">
                    {meetingData.attendances.map((rec, idx) => (
                      <div
                        key={rec.id || idx}
                        className="p-3 sm:p-3.5 rounded-2xl bg-white border border-[#D8C8B0] flex items-center justify-between gap-3 shadow-xs hover:border-[#A35C33] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={rec.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(rec.username)}&background=A35C33&color=fff`}
                            alt={rec.username}
                            className="w-9 h-9 rounded-full object-cover border border-[#C48B47] shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-[#2D1B0F] truncate">
                              {rec.username}
                            </h4>
                            <p className="text-[10px] text-[#2D1B0F]/60 truncate">{rec.user_email || 'Member'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-right">
                          <span className="text-[11px] font-bold bg-[#EFE7DA] text-[#A35C33] px-2 py-0.5 rounded-md flex items-center gap-0.5 border border-[#D8C8B0]">
                            <Flame className="w-3 h-3 text-[#A35C33]" />
                            {rec.streak || 1}
                          </span>
                          <span className="text-[10px] text-[#2D1B0F]/60 font-medium">
                            {rec.checked_in_at ? new Date(rec.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 text-center rounded-2xl bg-[#EFE7DA]/50 border-2 border-dashed border-[#D8C8B0] text-[#2D1B0F]/60 space-y-2">
                    <Users className="w-8 h-8 text-[#A35C33]/60 mx-auto" />
                    <p className="text-xs font-semibold">No attendance check-ins recorded yet for this session.</p>
                    <p className="text-[11px]">When members enter the passcode, they will appear here live with timestamp and streak records.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SATURDAY STORY CURATOR */}
      {activeTab === 'stories' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Publish Saturday Challenge Form */}
            <div className="lg:col-span-5 bg-[#F6EFE2] rounded-3xl border-2 border-[#D8C8B0] p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#A35C33] text-white flex items-center justify-center">
                    <PenTool className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif font-bold text-lg text-[#2D1B0F]">Saturday Prompt Publisher</h2>
                    <p className="text-[11px] text-[#2D1B0F]/70">Finish the Story Initiative</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handlePublishPrompt} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                    Prompt Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={promptForm.title}
                    onChange={e => setPromptForm({ ...promptForm, title: e.target.value })}
                    placeholder="e.g. The Midnight Manuscript in Hall B"
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:border-[#A35C33] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                    Prompt Type
                  </label>
                  <select
                    value={promptForm.prompt_type}
                    onChange={e => setPromptForm({ ...promptForm, prompt_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:border-[#A35C33] focus:outline-none cursor-pointer"
                  >
                    <option value="ORIGINAL_HOOK">Original Hook Premise</option>
                    <option value="ALTERNATE_ENDING">Alternate Classic Book Ending</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                    Hook Story Opening Paragraphs *
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={promptForm.story_opening}
                    onChange={e => setPromptForm({ ...promptForm, story_opening: e.target.value })}
                    placeholder="Write the opening narrative cliffhanger for members to complete..."
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:border-[#A35C33] focus:outline-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPublishingPrompt}
                  className="w-full py-3 rounded-xl bg-[#A35C33] hover:bg-[#8B4C28] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isPublishingPrompt ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Publishing Prompt...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Publish Saturday Prompt</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Submissions Leaderboard & Crowning Desk */}
            <div className="lg:col-span-7 bg-[#F6EFE2] rounded-3xl border-2 border-[#D8C8B0] p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif font-bold text-xl text-[#2D1B0F]">
                    Member Submissions Leaderboard
                  </h2>
                  <p className="text-xs text-[#2D1B0F]/70">
                    Active prompt: <strong className="text-[#A35C33]">{activePrompt?.title || 'Weekly Story Challenge'}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchStoryData}
                  className="p-2 rounded-xl border border-[#D8C8B0] hover:bg-[#EFE7DA] text-[#2D1B0F] transition-colors"
                  title="Refresh Submissions"
                >
                  <RefreshCw className={`w-4 h-4 ${isStoriesLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {submissions.length > 0 ? (
                <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                  {submissions.map((sub, idx) => (
                    <div
                      key={sub.id}
                      className={`p-4 rounded-2xl bg-white border-2 transition-all space-y-3 ${
                        sub.is_winner 
                          ? 'border-[#C48B47] bg-[#FFF8EE] shadow-md ring-2 ring-[#C48B47]/30' 
                          : 'border-[#D8C8B0] hover:border-[#A35C33]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={sub.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(sub.author || 'Author')}&background=A35C33&color=fff`}
                            alt={sub.author}
                            className="w-9 h-9 rounded-full object-cover border border-[#C48B47]"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-xs sm:text-sm text-[#2D1B0F]">{sub.author}</h4>
                              {sub.is_winner && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#C48B47] text-[#2D1B0F]">
                                  <Crown className="w-3 h-3" />
                                  Story of the Week
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#2D1B0F]/60">
                              {sub.word_count || 0} Words • {sub.upvote_count || 0} Member Upvotes
                            </span>
                          </div>
                        </div>

                        {/* Crown Winner Button */}
                        <button
                          type="button"
                          disabled={crowningId === sub.id || sub.is_winner}
                          onClick={() => handleCrownWinner(sub.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                            sub.is_winner
                              ? 'bg-[#C48B47]/20 text-[#7A4B1A] border border-[#C48B47]/40 cursor-default'
                              : 'bg-[#2D1B0F] text-[#C48B47] hover:bg-[#1A0E06] shadow-xs'
                          }`}
                        >
                          {crowningId === sub.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Crown className="w-3.5 h-3.5 text-[#C48B47]" />
                          )}
                          <span>{sub.is_winner ? 'Crowned' : 'Crown Winner'}</span>
                        </button>
                      </div>

                      <p className="text-xs text-[#2D1B0F]/90 leading-relaxed bg-[#F8F4EC] p-3 rounded-xl border border-[#D8C8B0]/60 italic font-serif">
                        "{sub.content}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center rounded-2xl bg-[#EFE7DA]/50 border-2 border-dashed border-[#D8C8B0] text-[#2D1B0F]/60 space-y-2">
                  <PenTool className="w-8 h-8 text-[#A35C33]/60 mx-auto" />
                  <p className="text-xs font-semibold">No submissions received yet for this active prompt.</p>
                  <p className="text-[11px]">Submissions entered by members on the Saturday Story tab will populate here for review and crowning.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INTAKE DESK AUDIT LOG */}
      {activeTab === 'membership' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-[#F6EFE2] rounded-3xl border-2 border-[#D8C8B0] p-6 sm:p-8 space-y-6 shadow-sm">
            
            {/* Header & Controls */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-[#D8C8B0]/60 pb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A35C33]/15 text-[#A35C33] text-[10px] font-extrabold uppercase tracking-wider border border-[#A35C33]/30 mb-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#A35C33]" />
                  Direct Registration • Intake Audit Log
                </div>
                <h2 className="font-serif font-bold text-2xl text-[#2D1B0F]">
                  Member Registration &amp; Intake Roster
                </h2>
                <p className="text-xs text-[#2D1B0F]/70">
                  Chronological, read-only audit log of registered student members, intake profiles, and student credentials.
                </p>
              </div>

              {/* Controls & Quick-Add Member */}
              <div className="flex flex-wrap items-center gap-3 self-stretch sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setAddMemberError(null);
                    setAddMemberSuccess(null);
                    setShowAddMemberModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#A35C33] hover:bg-[#8B4C28] text-white text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Member</span>
                </button>

                {/* Status Filter Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-[#EFE7DA] rounded-xl border border-[#D8C8B0] overflow-x-auto">
                  {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map((statusKey) => (
                    <button
                      key={statusKey}
                      type="button"
                      onClick={() => {
                        setAppFilter(statusKey);
                        fetchApplications(statusKey);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        appFilter === statusKey
                          ? 'bg-[#A35C33] text-white shadow-xs'
                          : 'text-[#2D1B0F]/70 hover:text-[#2D1B0F]'
                      }`}
                    >
                      {statusKey === 'ALL' ? 'All Registrations' : statusKey.charAt(0) + statusKey.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Search Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-md">
                <Search className="w-4 h-4 text-[#A35C33] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={intakeSearch}
                  onChange={(e) => setIntakeSearch(e.target.value)}
                  placeholder="Filter by name, @username, email, phone, department..."
                  className="w-full pl-10 pr-9 py-2.5 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:border-[#A35C33] focus:outline-none transition-colors"
                />
                {intakeSearch && (
                  <button
                    type="button"
                    onClick={() => setIntakeSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2D1B0F]/40 hover:text-[#2D1B0F] transition-colors p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="text-[11px] font-bold text-[#2D1B0F]/60 self-end sm:self-center">
                Showing {
                  applications.filter((app) => {
                    if (!intakeSearch.trim()) return true;
                    const q = intakeSearch.toLowerCase();
                    const name = (app.full_name || app.name || '').toLowerCase();
                    const username = (app.username || '').toLowerCase();
                    const phone = (app.phone_number || app.phone || '').toLowerCase();
                    const email = (app.email || '').toLowerCase();
                    const dept = (app.department || '').toLowerCase();
                    const book = (app.favorite_book || app.genre || '').toLowerCase();
                    return name.includes(q) || username.includes(q) || phone.includes(q) || email.includes(q) || dept.includes(q) || book.includes(q);
                  }).length
                } of {applications.length} intake records
              </div>
            </div>

            {/* Intake Cards Grid (Read-Only) */}
            {isAppsLoading ? (
              <div className="p-12 text-center text-xs font-bold text-[#2D1B0F]/60 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#A35C33]" />
                <span>Loading member registration audit log...</span>
              </div>
            ) : (() => {
              const filtered = applications.filter((app) => {
                if (!intakeSearch.trim()) return true;
                const q = intakeSearch.toLowerCase();
                const name = (app.full_name || app.name || '').toLowerCase();
                const username = (app.username || '').toLowerCase();
                const phone = (app.phone_number || app.phone || '').toLowerCase();
                const email = (app.email || '').toLowerCase();
                const dept = (app.department || '').toLowerCase();
                const book = (app.favorite_book || app.genre || '').toLowerCase();
                return name.includes(q) || username.includes(q) || phone.includes(q) || email.includes(q) || dept.includes(q) || book.includes(q);
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-10 text-center rounded-2xl bg-[#EFE7DA]/50 border-2 border-dashed border-[#D8C8B0] text-[#2D1B0F]/60 space-y-2">
                    <Users className="w-8 h-8 text-[#A35C33]/60 mx-auto" />
                    <p className="text-xs font-semibold">No member registration records match your filter criteria.</p>
                    <p className="text-[11px]">Direct registrations from the website will automatically populate in this audit log.</p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {filtered.map((app) => {
                    const eatJoinedDate = app.created_at
                      ? new Date(app.created_at).toLocaleString('en-US', {
                          timeZone: 'Africa/Addis_Ababa',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) + ' EAT'
                      : 'Date Recorded';

                    const resolvedUsername = app.username || (app.phone_number ? app.phone_number.replace('+', '') : 'member');

                    return (
                      <div
                        key={app.id}
                        className="p-5 rounded-2xl bg-white border-2 border-[#D8C8B0] shadow-xs space-y-4 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          {/* Card Header: Name, Username & Status */}
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-serif font-bold text-base sm:text-lg text-[#2D1B0F]">
                                  {app.full_name || app.name}
                                </h3>
                                <span className="px-2 py-0.5 rounded-md bg-[#A35C33]/10 text-[#A35C33] text-[11px] font-mono font-bold">
                                  @{resolvedUsername}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#2D1B0F]/60 flex items-center gap-1.5 mt-0.5 font-medium">
                                <Clock className="w-3 h-3 text-[#A35C33]" />
                                <span>Joined: {eatJoinedDate}</span>
                              </p>
                            </div>

                            {/* Status Badge */}
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase shrink-0 border ${
                              app.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : app.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-900 border-rose-300'
                                : 'bg-amber-100 text-amber-900 border-amber-300'
                            }`}>
                              {app.status === 'APPROVED' ? 'Active Member' : (app.status || 'Registered')}
                            </span>
                          </div>

                          {/* Member Credentials Grid */}
                          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#F8F4EC] text-[11px] text-[#2D1B0F]/80 border border-[#D8C8B0]/40">
                            <p className="flex items-center gap-1.5 truncate">
                              <Phone className="w-3.5 h-3.5 text-[#A35C33] shrink-0" />
                              <span className="truncate font-medium">{app.phone_number || app.phone || 'N/A'}</span>
                            </p>
                            <p className="flex items-center gap-1.5 truncate">
                              <Building2 className="w-3.5 h-3.5 text-[#A35C33] shrink-0" />
                              <span className="truncate font-medium">
                                {app.department || 'General Study'}
                                {app.year_of_study ? ` (${app.year_of_study})` : ''}
                              </span>
                            </p>
                            {app.email && (
                              <p className="col-span-2 flex items-center gap-1.5 truncate">
                                <Mail className="w-3.5 h-3.5 text-[#A35C33] shrink-0" />
                                <span className="truncate font-medium" title={app.email}>{app.email}</span>
                              </p>
                            )}
                            <p className="col-span-2 flex items-center gap-1.5 truncate text-[#5C3B1E] font-semibold pt-1 border-t border-[#D8C8B0]/40">
                              <BookOpen className="w-3.5 h-3.5 text-[#A35C33] shrink-0" />
                              <span className="truncate">Favorite Book: {app.favorite_book || app.genre || 'Ethiopian Literature'}</span>
                            </p>
                          </div>
                        </div>

                        {/* Audit Verification Footer */}
                        <div className="pt-2.5 border-t border-[#D8C8B0]/60 flex items-center justify-between text-[11px] text-[#2D1B0F]/60">
                          <span className="font-mono text-[10px]">Audit Record #{app.id}</span>
                          <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Phone Verified &amp; Onboarded
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 4: ALERTS & ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Broadcast Form */}
            <div className="lg:col-span-5 bg-[#F6EFE2] rounded-3xl border-2 border-[#D8C8B0] p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#A35C33] text-white flex items-center justify-center">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-lg text-[#2D1B0F]">Broadcast Alert</h2>
                  <p className="text-[11px] text-[#2D1B0F]/70">Publish alerts to Home header banner</p>
                </div>
              </div>

              <form onSubmit={handlePublishAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                    Announcement Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={announcementForm.title}
                    onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                    placeholder="e.g. Tuesday Meetup Location Update: Hall B"
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:border-[#A35C33] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                    Category Tag
                  </label>
                  <select
                    value={announcementForm.category}
                    onChange={e => setAnnouncementForm({ ...announcementForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:border-[#A35C33] focus:outline-none cursor-pointer"
                  >
                    <option value="#Meetup">#Meetup</option>
                    <option value="#VenueUpdate">#VenueUpdate</option>
                    <option value="#QuizAlert">#QuizAlert</option>
                    <option value="#General">#General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                    Announcement Content *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={announcementForm.content}
                    onChange={e => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                    placeholder="Provide details about the update or notice..."
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:border-[#A35C33] focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <input
                    type="checkbox"
                    id="is_banner"
                    checked={announcementForm.is_banner}
                    onChange={e => setAnnouncementForm({ ...announcementForm, is_banner: e.target.checked })}
                    className="w-4 h-4 text-[#A35C33] rounded cursor-pointer"
                  />
                  <label htmlFor="is_banner" className="text-xs font-bold text-amber-900 cursor-pointer">
                    Pin as high-priority top alert banner on Home page
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isPublishingAnnouncement}
                  className="w-full py-3 rounded-xl bg-[#A35C33] hover:bg-[#8B4C28] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isPublishingAnnouncement ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Broadcasting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Broadcast Announcement</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Active Broadcasts List */}
            <div className="lg:col-span-7 bg-[#F6EFE2] rounded-3xl border-2 border-[#D8C8B0] p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif font-bold text-xl text-[#2D1B0F]">
                    Active Club Announcements
                  </h2>
                  <p className="text-xs text-[#2D1B0F]/70">
                    Live broadcasts rendered across Chapters &amp; Chats
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchAnnouncements}
                  className="p-2 rounded-xl border border-[#D8C8B0] hover:bg-[#EFE7DA] text-[#2D1B0F] transition-colors"
                  title="Refresh Announcements"
                >
                  <RefreshCw className={`w-4 h-4 ${isAnnouncementsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {announcements.length > 0 ? (
                <div className="space-y-3">
                  {announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-4 rounded-2xl bg-white border-2 border-[#D8C8B0] flex items-start justify-between gap-4 shadow-xs hover:border-[#A35C33] transition-colors"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#EFE7DA] text-[#A35C33] border border-[#D8C8B0]">
                            {ann.category || '#General'}
                          </span>
                          {ann.is_banner && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-400">
                              📌 Pinned Banner
                            </span>
                          )}
                          <span className="text-[10px] text-[#2D1B0F]/60">
                            {ann.created_at ? new Date(ann.created_at).toLocaleDateString() : 'Active'}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-[#2D1B0F]">{ann.title}</h4>
                        <p className="text-xs text-[#2D1B0F]/80 leading-relaxed">{ann.content}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="p-2 rounded-xl text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors shrink-0 cursor-pointer"
                        title="Delete Announcement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center rounded-2xl bg-[#EFE7DA]/50 border-2 border-dashed border-[#D8C8B0] text-[#2D1B0F]/60 space-y-2">
                  <Megaphone className="w-8 h-8 text-[#A35C33]/60 mx-auto" />
                  <p className="text-xs font-semibold">No active announcements currently published.</p>
                  <p className="text-[11px]">Use the broadcast form on the left to pin top alerts or notify members of schedule updates.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MEMBERS & ROSTER */}
      {activeTab === 'roster' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-[#F6EFE2] rounded-3xl border-2 border-[#D8C8B0] p-6 sm:p-8 space-y-6 shadow-sm">
            
            {/* Header & Search Controls */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif font-bold text-2xl text-[#2D1B0F]">
                  Members &amp; Reader Roster
                </h2>
                <p className="text-xs text-[#2D1B0F]/70">
                  Search registered club members, monitor meeting streaks and XP, and manage account authorization.
                </p>
              </div>

              {/* Search & Filter Controls */}
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-[#A35C33] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={rosterSearch}
                    onChange={(e) => {
                      setRosterSearch(e.target.value);
                      fetchRoster(e.target.value, rosterRoleFilter);
                    }}
                    placeholder="Search by name, username..."
                    className="w-full pl-9 pr-3.5 py-2 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:border-[#A35C33] focus:outline-none"
                  />
                </div>

                {/* Role Filter Selector */}
                <div className="flex items-center gap-1 p-1 bg-[#EFE7DA] rounded-xl border border-[#D8C8B0]">
                  {['ALL', 'MEMBER', 'OFFICER', 'ADMIN'].map((roleKey) => (
                    <button
                      key={roleKey}
                      type="button"
                      onClick={() => {
                        setRosterRoleFilter(roleKey);
                        fetchRoster(rosterSearch, roleKey);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        rosterRoleFilter === roleKey
                          ? 'bg-[#A35C33] text-white shadow-xs'
                          : 'text-[#2D1B0F]/70 hover:text-[#2D1B0F]'
                      }`}
                    >
                      {roleKey === 'ALL' ? 'All Roles' : roleKey.charAt(0) + roleKey.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => fetchRoster(rosterSearch, rosterRoleFilter)}
                  className="p-2 rounded-xl border border-[#D8C8B0] hover:bg-[#EFE7DA] text-[#2D1B0F] transition-colors"
                  title="Refresh Member Roster"
                >
                  <RefreshCw className={`w-4 h-4 ${isRosterLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Members Table */}
            {isRosterLoading ? (
              <div className="p-12 text-center text-xs font-bold text-[#2D1B0F]/60 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#A35C33]" />
                <span>Loading member roster...</span>
              </div>
            ) : rosterUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="min-w-[760px] space-y-2.5">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-3 px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wider text-[#2D1B0F]/60 border-b border-[#D8C8B0]">
                    <div className="col-span-4">Member</div>
                    <div className="col-span-3">Phone Number</div>
                    <div className="col-span-2 text-center">XP &amp; Streak</div>
                    <div className="col-span-1 text-center">Status</div>
                    <div className="col-span-2 text-right">Moderation</div>
                  </div>

                  {/* Member Rows */}
                  {rosterUsers.map((m) => (
                    <div
                      key={m.id}
                      className={`grid grid-cols-12 gap-3 items-center p-3.5 rounded-2xl bg-white border-2 transition-colors ${
                        !m.is_active 
                          ? 'border-rose-300 bg-rose-50/40' 
                          : 'border-[#D8C8B0] hover:border-[#A35C33]'
                      }`}
                    >
                      {/* Member Info */}
                      <div className="col-span-4 flex items-center gap-3 min-w-0">
                        <NavLink to={`/profile/${m.username}`} title={`View @${m.username}'s Profile`} className="shrink-0">
                          <img
                            src={m.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.first_name || m.username)}&background=A35C33&color=fff`}
                            alt={m.username}
                            className="w-10 h-10 rounded-full object-cover border border-[#C48B47] hover:opacity-85 transition-opacity"
                          />
                        </NavLink>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <NavLink to={`/profile/${m.username}`} className="font-bold text-xs sm:text-sm text-[#2D1B0F] hover:text-[#A35C33] hover:underline truncate">
                              {m.full_name || m.first_name || m.username}
                            </NavLink>
                            {m.officer_title && m.officer_title !== 'NONE' ? (
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border shadow-xs ${
                                m.officer_title === 'PRESIDENT' 
                                  ? 'bg-amber-300 text-amber-950 border-amber-500' 
                                  : m.officer_title === 'VICE_PRESIDENT'
                                  ? 'bg-purple-100 text-purple-900 border-purple-300'
                                  : m.officer_title === 'FINANCE_LEAD'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : 'bg-[#A35C33] text-white border-[#6E3618]'
                              }`}>
                                {m.officer_title_display || m.officer_title}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-[#EFE7DA] text-[#5C3B1E] border border-[#D8C8B0]">
                                {m.role_display || m.role}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#2D1B0F]/60 truncate">
                            <NavLink to={`/profile/${m.username}`} className="hover:underline">
                              @{m.username}
                            </NavLink>
                          </p>
                        </div>
                      </div>

                      {/* Phone Number */}
                      <div className="col-span-3 min-w-0 text-stone-700 font-mono text-sm truncate flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#A35C33] shrink-0" />
                        <span className="truncate">{formatDisplayPhone(m.phone_number)}</span>
                      </div>

                      {/* XP & Streak */}
                      <div className="col-span-2 flex items-center justify-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#A35C33] bg-[#EFE7DA] px-2 py-0.5 rounded-md border border-[#D8C8B0]">
                          <Flame className="w-3.5 h-3.5 text-[#A35C33]" />
                          {m.meeting_streak || 0}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#2D1B0F] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          {m.total_xp || 0}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="col-span-1 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                          m.is_active
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}>
                          {m.is_active ? 'Active' : 'Banned'}
                        </span>
                      </div>

                      {/* Action */}
                      <div className="col-span-2 flex items-center justify-end gap-1.5">
                        {/* President Appoint Role Action */}
                        {isPresident && !m.is_superuser && (
                          <button
                            type="button"
                            onClick={() => handleOpenAssignRole(m)}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#EFE7DA] hover:bg-[#D8C8B0] text-[#2D1B0F] border border-[#D8C8B0] transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Appoint or Relieve Executive Officer Role"
                          >
                            <UserCog className="w-3.5 h-3.5 text-[#A35C33]" />
                            <span className="hidden sm:inline">Role</span>
                          </button>
                        )}

                        {m.is_superuser || m.id === user?.id ? (
                          <span className="text-[11px] font-semibold text-[#2D1B0F]/40 italic">
                            Protected
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={togglingUserId === m.id}
                            onClick={() => handleToggleBan(m)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                              m.is_active
                                ? 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 hover:border-rose-400'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400'
                            }`}
                          >
                            {togglingUserId === m.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : m.is_active ? (
                              <UserX className="w-3.5 h-3.5 text-rose-600" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                            <span>{m.is_active ? 'Ban' : 'Reinstate'}</span>
                          </button>
                        )}

                        {canPurgeMembers && !m.is_active && !m.is_superuser && m.role !== 'OWNER' && m.officer_title !== 'PRESIDENT' && (
                          <button
                            type="button"
                            disabled={purgingUserId === m.id}
                            onClick={() => handlePurgeMember(m)}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-sm"
                            title="Permanently Purge Banned Member (President / VP)"
                          >
                            {purgingUserId === m.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            <span>Purge</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-10 text-center rounded-2xl bg-[#EFE7DA]/50 border-2 border-dashed border-[#D8C8B0] text-[#2D1B0F]/60 space-y-2">
                <Users className="w-8 h-8 text-[#A35C33]/60 mx-auto" />
                <p className="text-xs font-semibold">No registered members found matching your search.</p>
                <p className="text-[11px]">When candidates are approved from the intake desk, they will populate here in the active roster.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: MODERATION & REPORTS DESK */}
      {activeTab === 'reports' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-[#F6EFE2] rounded-3xl border-2 border-[#D8C8B0] p-6 sm:p-8 space-y-6 shadow-sm">
            
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif font-bold text-2xl text-[#2D1B0F]">
                  Reports &amp; Moderation Desk
                </h2>
                <p className="text-xs text-[#2D1B0F]/70">
                  Review reported discussions and story submissions flagged for harassment, spoilers, or policy violations.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 p-1 bg-[#EFE7DA] rounded-xl border border-[#D8C8B0]">
                  {[
                    { key: 'unresolved', label: 'Unresolved' },
                    { key: 'resolved', label: 'Resolved' },
                    { key: 'all', label: 'All Reports' }
                  ].map((filterItem) => (
                    <button
                      key={filterItem.key}
                      type="button"
                      onClick={() => {
                        setReportFilter(filterItem.key);
                        fetchReports(filterItem.key);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        reportFilter === filterItem.key
                          ? 'bg-[#A35C33] text-white shadow-xs'
                          : 'text-[#2D1B0F]/70 hover:text-[#2D1B0F]'
                      }`}
                    >
                      {filterItem.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => fetchReports(reportFilter)}
                  className="p-2 rounded-xl border border-[#D8C8B0] hover:bg-[#EFE7DA] text-[#2D1B0F] transition-colors"
                  title="Refresh Reports"
                >
                  <RefreshCw className={`w-4 h-4 ${isReportsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Reports List */}
            {isReportsLoading ? (
              <div className="p-12 text-center text-xs font-bold text-[#2D1B0F]/60 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#A35C33]" />
                <span>Loading content reports...</span>
              </div>
            ) : reports.length > 0 ? (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className={`p-5 rounded-2xl bg-white border-2 transition-all space-y-4 shadow-xs ${
                      report.is_resolved 
                        ? 'border-[#D8C8B0] opacity-80' 
                        : 'border-amber-300 ring-2 ring-amber-100'
                    }`}
                  >
                    {/* Top Row: Tags and Metadata */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#D8C8B0]/60">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Reason Badge */}
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                          report.reason === 'HARASSMENT'
                            ? 'bg-rose-100 text-rose-900 border-rose-300'
                            : report.reason === 'SPOILER'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : report.reason === 'IRRELEVANT'
                            ? 'bg-sky-100 text-sky-900 border-sky-300'
                            : 'bg-stone-100 text-stone-900 border-stone-300'
                        }`}>
                          {report.reason_display || report.reason}
                        </span>

                        {/* Content Type Badge */}
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-[#EFE7DA] text-[#5C3B1E] border border-[#D8C8B0]">
                          {report.target_type === 'THREAD' ? '💬 Discussion Thread' : '✍️ Saturday Story Submission'}
                        </span>

                        <span className="text-[11px] text-[#2D1B0F]/60">
                          Reported by <strong>@{report.reporter_username}</strong> on {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Resolution Status Pill */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                        report.is_resolved
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        {report.is_resolved 
                          ? `Resolved ${report.resolved_by_username ? `by @${report.resolved_by_username}` : ''}`
                          : 'Pending Action'}
                      </span>
                    </div>

                    {/* Member's report notes */}
                    {report.details && (
                      <div className="text-xs bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 text-amber-950 space-y-0.5">
                        <span className="text-[10px] font-bold uppercase text-amber-800">Reporter's Note:</span>
                        <p className="italic">"{report.details}"</p>
                      </div>
                    )}

                    {/* Target Content Snippet Box */}
                    <div className="p-4 rounded-xl bg-[#F8F4EC] border border-[#D8C8B0] space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-[#2D1B0F]/70">
                        <span className="font-bold text-[#A35C33]">
                          Offending Content Excerpt
                        </span>
                        <span>
                          Author: <strong>@{report.target_snippet?.author || 'Unknown'}</strong>
                        </span>
                      </div>

                      {report.target_type === 'THREAD' && report.target_snippet?.title && (
                        <h4 className="font-serif font-bold text-sm text-[#2D1B0F]">
                          {report.target_snippet.title}
                        </h4>
                      )}

                      <p className="text-xs text-[#2D1B0F]/90 font-serif leading-relaxed italic bg-white p-3 rounded-lg border border-[#D8C8B0]/60">
                        "{report.target_snippet?.content || 'Content not available or already removed.'}"
                      </p>
                    </div>

                    {/* Actions Toolbar */}
                    {!report.is_resolved && (
                      <div className="pt-2 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          disabled={processingReportId === report.id}
                          onClick={() => handleResolveReport(report.id)}
                          className="px-4 py-2 rounded-xl border-2 border-[#D8C8B0] bg-white hover:bg-[#EFE7DA] text-[#2D1B0F] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Dismiss Report</span>
                        </button>

                        <button
                          type="button"
                          disabled={processingReportId === report.id}
                          onClick={() => handleDeleteOffendingContent(report)}
                          className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          {processingReportId === report.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span>Delete Offending Content</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center rounded-2xl bg-[#EFE7DA]/50 border-2 border-dashed border-[#D8C8B0] text-[#2D1B0F]/60 space-y-2">
                <Flag className="w-8 h-8 text-emerald-600/60 mx-auto" />
                <p className="text-xs font-semibold">No reports currently in "{reportFilter}" status.</p>
                <p className="text-[11px]">Flagged discussion posts or Saturday story entries will appear here for executive moderation.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: TREASURY & FINANCE DESK */}
      {activeTab === 'finance' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-[#F6EFE2] rounded-3xl border-2 border-[#D8C8B0] p-6 sm:p-8 space-y-6 shadow-sm">
            
            {/* Header & Log Action Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif font-bold text-2xl text-[#2D1B0F]">
                  Treasury &amp; Finance Desk
                </h2>
                <p className="text-xs text-[#2D1B0F]/70">
                  Manage member contributions, semester dues, corporate sponsorships, and book acquisition expenses.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsFinanceModalOpen(true)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#2D1B0F] hover:bg-[#1A0E06] text-[#C48B47] text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border border-[#C48B47]/60"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Treasury Entry</span>
                </button>

                <button
                  type="button"
                  onClick={() => fetchFinanceRecords(financeFilter)}
                  className="p-2.5 rounded-xl border-2 border-[#D8C8B0] hover:bg-[#EFE7DA] text-[#2D1B0F] transition-colors"
                  title="Refresh Finance Ledger"
                >
                  <RefreshCw className={`w-4 h-4 ${isFinanceLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Treasury Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Net Balance */}
              <div className="p-5 rounded-2xl bg-[#2D1B0F] text-[#F8F4EC] border-2 border-[#C48B47]/50 shadow-md space-y-1">
                <div className="flex items-center justify-between text-[#C48B47]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Net Treasury Balance</span>
                  <Wallet className="w-4 h-4" />
                </div>
                <div className="font-serif font-bold text-2xl sm:text-3xl text-white">
                  ETB {financeData.summary?.net_balance !== undefined ? Number(financeData.summary.net_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                </div>
                <p className="text-[10px] text-[#EFE7DA]/60">Available Club Liquidity</p>
              </div>

              {/* Card 2: Member Dues */}
              <div className="p-5 rounded-2xl bg-white border-2 border-[#D8C8B0] shadow-xs space-y-1">
                <div className="flex items-center justify-between text-[#A35C33]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D1B0F]/70">Member Dues</span>
                  <Coins className="w-4 h-4 text-[#A35C33]" />
                </div>
                <div className="font-serif font-bold text-2xl text-[#2D1B0F]">
                  ETB {financeData.summary?.total_contributions !== undefined ? Number(financeData.summary.total_contributions).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                </div>
                <p className="text-[10px] text-[#2D1B0F]/60">Collected Active Cohort Dues</p>
              </div>

              {/* Card 3: Sponsorships & Donations */}
              <div className="p-5 rounded-2xl bg-white border-2 border-[#D8C8B0] shadow-xs space-y-1">
                <div className="flex items-center justify-between text-emerald-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D1B0F]/70">Sponsorships &amp; Grants</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="font-serif font-bold text-2xl text-[#2D1B0F]">
                  ETB {financeData.summary ? Number((financeData.summary.total_sponsorships || 0) + (financeData.summary.total_donations || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                </div>
                <p className="text-[10px] text-[#2D1B0F]/60">Alumni &amp; Institutional Patrons</p>
              </div>

              {/* Card 4: Expenses */}
              <div className="p-5 rounded-2xl bg-rose-50/70 border-2 border-rose-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-rose-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Book &amp; Event Costs</span>
                  <ArrowDownRight className="w-4 h-4 text-rose-600" />
                </div>
                <div className="font-serif font-bold text-2xl text-rose-900">
                  ETB {financeData.summary?.total_expenses !== undefined ? Number(financeData.summary.total_expenses).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                </div>
                <p className="text-[10px] text-rose-800/70">Acquisitions &amp; Operations</p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#EFE7DA] rounded-xl border border-[#D8C8B0]">
                {[
                  { key: 'ALL', label: 'All Entries' },
                  { key: 'CONTRIBUTION', label: 'Member Dues' },
                  { key: 'SPONSORSHIP', label: 'Sponsorships' },
                  { key: 'DONATION', label: 'Donations' },
                  { key: 'EXPENSE', label: 'Expenses' }
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => {
                      setFinanceFilter(f.key);
                      fetchFinanceRecords(f.key);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      financeFilter === f.key
                        ? 'bg-[#A35C33] text-white shadow-xs'
                        : 'text-[#2D1B0F]/70 hover:text-[#2D1B0F]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ledger Table */}
            {isFinanceLoading ? (
              <div className="p-12 text-center text-xs font-bold text-[#2D1B0F]/60 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#A35C33]" />
                <span>Loading treasury ledger...</span>
              </div>
            ) : financeData.records && financeData.records.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="min-w-[720px] space-y-2.5">
                  <div className="grid grid-cols-12 gap-3 px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wider text-[#2D1B0F]/60 border-b border-[#D8C8B0]">
                    <div className="col-span-4">Transaction / Title</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-3">Contributor / Beneficiary</div>
                    <div className="col-span-2 text-right">Amount</div>
                    <div className="col-span-1 text-right">Action</div>
                  </div>

                  {financeData.records.map((rec) => {
                    const isExpense = rec.record_type === 'EXPENSE';
                    return (
                      <div
                        key={rec.id}
                        className="grid grid-cols-12 gap-3 items-center p-3.5 rounded-2xl bg-white border-2 border-[#D8C8B0] hover:border-[#A35C33] transition-colors shadow-xs"
                      >
                        {/* Title & Notes */}
                        <div className="col-span-4 min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm text-[#2D1B0F] truncate">
                            {rec.title}
                          </h4>
                          {rec.notes && (
                            <p className="text-[11px] text-[#2D1B0F]/60 truncate italic">
                              "{rec.notes}"
                            </p>
                          )}
                          <span className="text-[10px] text-[#2D1B0F]/50">
                            Logged by @{rec.recorded_by_username || 'Staff'} • {new Date(rec.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Type Badge */}
                        <div className="col-span-2">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                            rec.record_type === 'CONTRIBUTION'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : rec.record_type === 'SPONSORSHIP'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : rec.record_type === 'DONATION'
                              ? 'bg-purple-100 text-purple-900 border-purple-300'
                              : 'bg-rose-100 text-rose-900 border-rose-300'
                          }`}>
                            {rec.record_type_display || rec.record_type}
                          </span>
                        </div>

                        {/* Contributor / Member */}
                        <div className="col-span-3 text-xs text-[#2D1B0F]/80 truncate">
                          {rec.contributor_name || (rec.member_username ? `@${rec.member_username}` : 'General / Club Treasury')}
                        </div>

                        {/* Amount */}
                        <div className={`col-span-2 text-right font-mono font-bold text-sm ${
                          isExpense ? 'text-rose-700' : 'text-emerald-800'
                        }`}>
                          {isExpense ? '-' : '+'} {Number(rec.amount).toFixed(2)} {rec.currency}
                        </div>

                        {/* Action (Delete) */}
                        <div className="col-span-1 text-right">
                          {(isPresident || isFinanceLead || user?.is_superuser) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteFinanceRecord(rec.id)}
                              className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-10 text-center rounded-2xl bg-[#EFE7DA]/50 border-2 border-dashed border-[#D8C8B0] text-[#2D1B0F]/60 space-y-2">
                <Wallet className="w-8 h-8 text-[#A35C33]/60 mx-auto" />
                <p className="text-xs font-semibold">No treasury records logged in this category.</p>
                <p className="text-[11px]">Click "Log Treasury Entry" to record semester dues, sponsorships, or book purchase costs.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUICK-ADD MEMBER MODAL */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setShowAddMemberModal(false)} 
            className="fixed inset-0 bg-[#2D1B0F]/60 backdrop-blur-sm animate-fade-in" 
          />
          <div className="relative w-full max-w-lg bg-[#F8F4EC] rounded-3xl border-2 border-[#D8C8B0] shadow-2xl p-6 sm:p-8 space-y-5 z-10 animate-slide-down text-[#2D1B0F]">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#D8C8B0]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#A35C33] text-white flex items-center justify-center font-bold shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#2D1B0F]">
                    Quick-Add Member Onboarding
                  </h3>
                  <p className="text-[11px] text-[#2D1B0F]/70">
                    Instantly provision an active club reader passport and audit log entry.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="p-1 rounded-lg text-[#2D1B0F]/60 hover:text-[#2D1B0F] hover:bg-[#EFE7DA] transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {addMemberSuccess ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Member Successfully Onboarded!</span>
                  </div>
                  <p className="text-xs text-emerald-800">
                    {addMemberSuccess.message}
                  </p>
                  <div className="p-3 bg-white/80 rounded-xl border border-emerald-200 mt-2">
                    <div className="text-[11px] font-bold uppercase text-emerald-800/80">Temporary Password</div>
                    <code className="text-sm font-mono font-bold text-[#A35C33] select-all">
                      {addMemberSuccess.password}
                    </code>
                    <p className="text-[11px] text-stone-500 mt-1">
                      The member can log in with their phone number and this temporary password.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAddMemberSuccess(null);
                      setAddMemberError(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-[#D8C8B0] text-xs font-bold text-[#2D1B0F] hover:bg-[#EFE7DA] transition-colors cursor-pointer"
                  >
                    Add Another Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(false)}
                    className="px-5 py-2 rounded-xl bg-[#A35C33] hover:bg-[#8B4C28] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleQuickAddMember} className="space-y-4">
                {addMemberError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{addMemberError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#2D1B0F]/70 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={addMemberForm.full_name}
                    onChange={(e) => setAddMemberForm(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="e.g. Alazar Tadesse"
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:border-[#A35C33] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#2D1B0F]/70 mb-1">
                    Phone Number *
                  </label>
                  <div className="flex rounded-xl border-2 border-[#D8C8B0] bg-white overflow-hidden focus-within:border-[#A35C33] transition-colors">
                    <span className="inline-flex items-center px-3 py-2 bg-[#EFE7DA] text-[#2D1B0F] font-bold text-xs border-r-2 border-[#D8C8B0] select-none tracking-wider">
                      +251
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={9}
                      required
                      value={addMemberForm.phone_number}
                      onChange={(e) => setAddMemberForm(prev => ({ ...prev, phone_number: cleanPhoneDigits(e.target.value) }))}
                      placeholder="9XXXXXXXX"
                      className="w-full px-3 py-2 bg-transparent text-xs text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:outline-none font-medium tracking-wide"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#2D1B0F]/70 mb-1">
                      Year of Study
                    </label>
                    <select
                      value={addMemberForm.year_of_study}
                      onChange={(e) => setAddMemberForm(prev => ({ ...prev, year_of_study: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:border-[#A35C33] focus:outline-none transition-colors"
                    >
                      <option value="1st Year (Freshman)">1st Year (Freshman)</option>
                      <option value="2nd Year (Sophomore)">2nd Year (Sophomore)</option>
                      <option value="3rd Year (Junior)">3rd Year (Junior)</option>
                      <option value="4th Year (Senior)">4th Year (Senior)</option>
                      <option value="5th Year+ / Post-Grad">5th Year+ / Post-Grad</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#2D1B0F]/70 mb-1">
                      Department
                    </label>
                    <select
                      value={addMemberForm.department}
                      onChange={(e) => setAddMemberForm(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:border-[#A35C33] focus:outline-none transition-colors"
                    >
                      <option value="Software Engineering">Software Engineering</option>
                      <option value="Electrical & Computer Engineering">Electrical & Computer Engineering</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Chemical Engineering">Chemical Engineering</option>
                      <option value="Biomedical Engineering">Biomedical Engineering</option>
                      <option value="Architecture">Architecture</option>
                      <option value="Literature & Humanities">Literature & Humanities</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-[#EFE7DA]/70 rounded-xl border border-[#D8C8B0] text-[11px] text-[#2D1B0F]/70">
                  💡 Will automatically create an active member profile with default temporary password <strong className="text-[#A35C33]">ChapterChats2026!</strong> and record an approved entry in the intake desk audit log.
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D8C8B0]">
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#D8C8B0] text-xs font-bold text-[#2D1B0F] hover:bg-[#EFE7DA] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingMember}
                    className="px-6 py-2.5 rounded-xl bg-[#A35C33] hover:bg-[#8B4C28] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isAddingMember ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Provisioning Member...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>Onboard Member</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: APPOINT EXECUTIVE OFFICER (President/Owner Desk) */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setRoleModalUser(null)} 
            className="fixed inset-0 bg-[#2D1B0F]/60 backdrop-blur-sm animate-fade-in" 
          />
          <div className="relative w-full max-w-lg bg-[#F8F4EC] rounded-3xl border-2 border-[#D8C8B0] shadow-2xl p-6 sm:p-8 space-y-5 z-10 animate-slide-down text-[#2D1B0F]">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#D8C8B0]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shadow-xs">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#2D1B0F]">
                    Appoint Executive Officer
                  </h3>
                  <p className="text-[11px] text-[#2D1B0F]/70">
                    Designate leadership responsibilities and scoped desk access.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="p-1 rounded-lg text-[#2D1B0F]/60 hover:text-[#2D1B0F] hover:bg-[#EFE7DA] transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Target Member Profile Box */}
            <div className="p-3.5 rounded-2xl bg-[#EFE7DA] border border-[#D8C8B0] flex items-center gap-3">
              <img
                src={roleModalUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(roleModalUser.first_name || roleModalUser.username)}&background=A35C33&color=fff`}
                alt={roleModalUser.username}
                className="w-10 h-10 rounded-full object-cover border border-[#C48B47]"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-[#2D1B0F] truncate">
                  {roleModalUser.first_name || roleModalUser.username} (@{roleModalUser.username})
                </h4>
                <p className="text-xs text-[#2D1B0F]/70 truncate">{roleModalUser.email}</p>
              </div>
            </div>

            {/* Officer Title Choices */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#2D1B0F]">
                Select Executive Title &amp; Scope:
              </label>
              
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {[
                  { value: 'PRESIDENT', label: '👑 Club President (Owner)', desc: 'Full platform oversight & officer appointments' },
                  { value: 'VICE_PRESIDENT', label: '🛡️ Vice President', desc: 'Second-in-command with full executive desk access' },
                  { value: 'SOCIAL_MEDIA_LEAD', label: '📣 Social Media Lead', desc: 'Broadcasts, noticeboard alerts, and Saturday story curation' },
                  { value: 'RESEARCH_LEAD', label: '📚 Research & Editorial Lead', desc: 'Book House curation, proposals, and story hooks' },
                  { value: 'EVENT_LEAD', label: '🎟️ Event Organizing Lead', desc: 'Tuesday attendance desk, passcodes, and meetups' },
                  { value: 'FINANCE_LEAD', label: '💰 Finance Lead', desc: 'Treasury desk, member dues, and sponsorship records' },
                  { value: 'NONE', label: '👤 General Member', desc: 'Relieve from executive board and return to member status' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    onClick={() => setSelectedOfficerTitle(opt.value)}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedOfficerTitle === opt.value
                        ? 'bg-[#EFE7DA] border-[#A35C33] shadow-xs'
                        : 'bg-white border-[#D8C8B0] hover:border-[#A35C33]/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="officer_title"
                      value={opt.value}
                      checked={selectedOfficerTitle === opt.value}
                      onChange={() => setSelectedOfficerTitle(opt.value)}
                      className="mt-0.5 text-[#A35C33] cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#2D1B0F]">{opt.label}</p>
                      <p className="text-[10px] text-[#2D1B0F]/70">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#D8C8B0]/60">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2.5 rounded-xl border-2 border-[#D8C8B0] text-xs font-bold text-[#2D1B0F] hover:bg-[#EFE7DA] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isAssigningRole}
                onClick={handleSaveOfficerRole}
                className="px-5 py-2.5 rounded-xl bg-[#A35C33] hover:bg-[#8B4C28] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAssigningRole ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Save Appointment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: LOG TREASURY TRANSACTION */}
      {isFinanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setIsFinanceModalOpen(false)} 
            className="fixed inset-0 bg-[#2D1B0F]/60 backdrop-blur-sm animate-fade-in" 
          />
          <div className="relative w-full max-w-lg bg-[#F8F4EC] rounded-3xl border-2 border-[#D8C8B0] shadow-2xl p-6 sm:p-8 space-y-5 z-10 animate-slide-down text-[#2D1B0F]">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#D8C8B0]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#A35C33] text-white flex items-center justify-center font-bold shadow-xs">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#2D1B0F]">
                    Log Treasury Transaction
                  </h3>
                  <p className="text-[11px] text-[#2D1B0F]/70">
                    Record membership dues, corporate sponsorships, or book expenses.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFinanceModalOpen(false)}
                className="p-1 rounded-lg text-[#2D1B0F]/60 hover:text-[#2D1B0F] hover:bg-[#EFE7DA] transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFinanceRecord} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                  Transaction Title *
                </label>
                <input
                  type="text"
                  required
                  value={financeForm.title}
                  onChange={e => setFinanceForm({ ...financeForm, title: e.target.value })}
                  placeholder="e.g. Cohort Semester Dues (Table 4) or Book Order: Alula"
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:border-[#A35C33] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                    Entry Type
                  </label>
                  <select
                    value={financeForm.record_type}
                    onChange={e => setFinanceForm({ ...financeForm, record_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:border-[#A35C33] focus:outline-none cursor-pointer"
                  >
                    <option value="CONTRIBUTION">Member Contribution / Dues</option>
                    <option value="SPONSORSHIP">Corporate / University Sponsorship</option>
                    <option value="DONATION">Patron / Alumni Donation</option>
                    <option value="EXPENSE">Book Acquisition &amp; Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                    Amount (ETB) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={financeForm.amount}
                    onChange={e => setFinanceForm({ ...financeForm, amount: e.target.value })}
                    placeholder="e.g. 500.00"
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:border-[#A35C33] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                  Contributor / Payee Name
                </label>
                <input
                  type="text"
                  value={financeForm.contributor_name}
                  onChange={e => setFinanceForm({ ...financeForm, contributor_name: e.target.value })}
                  placeholder="e.g. Abebe Bikila or Goethe-Institut Addis"
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:border-[#A35C33] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                  Notes &amp; Details
                </label>
                <textarea
                  rows={3}
                  value={financeForm.notes}
                  onChange={e => setFinanceForm({ ...financeForm, notes: e.target.value })}
                  placeholder="Additional context, receipt reference, or breakdown..."
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:border-[#A35C33] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#D8C8B0]/60">
                <button
                  type="button"
                  onClick={() => setIsFinanceModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border-2 border-[#D8C8B0] text-xs font-bold text-[#2D1B0F] hover:bg-[#EFE7DA] transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isLoggingFinance}
                  className="px-5 py-2.5 rounded-xl bg-[#2D1B0F] text-[#C48B47] hover:bg-[#1A0E06] text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer border border-[#C48B47] disabled:opacity-50"
                >
                  {isLoggingFinance ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>Save Entry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

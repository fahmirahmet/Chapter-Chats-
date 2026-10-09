import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { 
  Info, 
  Award, 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  Shield, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Send, 
  Sparkles,
  Heart,
  FileText,
  AlertCircle,
  Loader2,
  X,
  Camera,
  Crown,
  Quote,
  Flame,
  PenTool,
  Bookmark,
  Compass,
  Maximize2,
  Trash2,
  Plus,
  Edit3,
  Upload
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { mockAboutData } from '../data/mockAboutData';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

export default function About() {
  const { user } = useAuth();
  const canDelete = Boolean(user?.is_staff || user?.is_superuser || ['OWNER', 'ADMIN', 'OFFICER'].includes(user?.role));

  const { missionStatement, meetingDetails, founder, pastPresidents: defaultPresidents, leadershipTeam: defaultLeadership, galleryPhotos: mockGallery, faqs } = mockAboutData;

  const isPresidentOrVP = Boolean(
    user?.is_superuser || 
    user?.role === 'OWNER' || 
    ['PRESIDENT', 'VICE_PRESIDENT'].includes(user?.officer_title)
  );

  const [lineage, setLineage] = useState(defaultPresidents || []);
  const [isLineageLoading, setIsLineageLoading] = useState(false);
  const [leadership, setLeadership] = useState(defaultLeadership || []);
  const [isLeadershipLoading, setIsLeadershipLoading] = useState(false);

  // Lineage management state
  const [lineageModalOpen, setLineageModalOpen] = useState(false);
  const [editingLineage, setEditingLineage] = useState(null);
  const [lineageFormData, setLineageFormData] = useState({
    name: '',
    tenure: '',
    bio: '',
    favorite_book: '',
    avatar_url: '',
    order: 0,
    image_file: null,
  });
  const [isSavingLineage, setIsSavingLineage] = useState(false);

  // Leadership management state
  const [leadershipModalOpen, setLeadershipModalOpen] = useState(false);
  const [editingLeader, setEditingLeader] = useState(null);
  const [leadershipFormData, setLeadershipFormData] = useState({
    name: '',
    role: '',
    bio: '',
    favorite_genre: '',
    currently_reading: '',
    avatar_url: '',
    order: 0,
    image_file: null,
  });
  const [isSavingLeader, setIsSavingLeader] = useState(false);

  // Deletion modal state for lineage/leadership
  const [deleteItemState, setDeleteItemState] = useState(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  const [openFaqId, setOpenFaqId] = useState('faq-1');
  const [gallery, setGallery] = useState(mockGallery || []);
  const [galleryFilter, setGalleryFilter] = useState('ALL');
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoToDelete, setPhotoToDelete] = useState(null);

  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);

  const handleConfirmDeletePhoto = async () => {
    if (!photoToDelete) return;
    setIsDeletingPhoto(true);
    try {
      if (photoToDelete.id) {
        await apiClient.delete(`/activities/gallery/${photoToDelete.id}/`);
      }
      setGallery(prev => prev.filter(p => p.id !== photoToDelete.id));
      if (selectedPhoto && selectedPhoto.id === photoToDelete.id) {
        setSelectedPhoto(null);
      }
      setPhotoToDelete(null);
    } catch (err) {
      console.error('Failed to delete photo:', err);
      alert(err.response?.data?.detail || 'Failed to remove photo.');
    } finally {
      setIsDeletingPhoto(false);
    }
  };


  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone_number: '',
    department: '',
    year_of_study: '2nd Year (Sophomore)',
    genre: 'Ethiopian Literature'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Fetch dynamic lineage and executive leadership
  useEffect(() => {
    let isMounted = true;
    const fetchLineageAndLeadership = async () => {
      setIsLineageLoading(true);
      setIsLeadershipLoading(true);
      try {
        const [lineageRes, leadershipRes] = await Promise.allSettled([
          apiClient.get('/accounts/lineage/'),
          apiClient.get('/accounts/leadership/')
        ]);

        if (isMounted) {
          if (lineageRes.status === 'fulfilled' && Array.isArray(lineageRes.value?.data) && lineageRes.value.data.length > 0) {
            setLineage(lineageRes.value.data);
          }
          if (leadershipRes.status === 'fulfilled' && Array.isArray(leadershipRes.value?.data) && leadershipRes.value.data.length > 0) {
            setLeadership(leadershipRes.value.data);
          }
        }
      } catch (err) {
        console.warn('Could not load dynamic lineage/leadership:', err);
      } finally {
        if (isMounted) {
          setIsLineageLoading(false);
          setIsLeadershipLoading(false);
        }
      }
    };

    fetchLineageAndLeadership();
    return () => { isMounted = false; };
  }, []);

  const handleOpenAddLineage = () => {
    setEditingLineage(null);
    setLineageFormData({
      name: '',
      tenure: '',
      bio: '',
      favorite_book: '',
      avatar_url: '',
      order: lineage.length + 1,
      image_file: null,
    });
    setLineageModalOpen(true);
  };

  const handleOpenEditLineage = (pres) => {
    setEditingLineage(pres);
    setLineageFormData({
      name: pres.name || '',
      tenure: pres.tenure || '',
      bio: pres.bio || pres.keyAchievement || '',
      favorite_book: pres.favorite_book || pres.favoriteBook || '',
      avatar_url: pres.avatar_url || pres.image_url || pres.avatar || '',
      order: pres.order || 0,
      image_file: null,
    });
    setLineageModalOpen(true);
  };

  const handleSaveLineage = async (e) => {
    e.preventDefault();
    if (!lineageFormData.name.trim() || !lineageFormData.tenure.trim()) {
      alert('Name and tenure are required.');
      return;
    }
    setIsSavingLineage(true);
    try {
      const data = new FormData();
      data.append('name', lineageFormData.name.trim());
      data.append('tenure', lineageFormData.tenure.trim());
      data.append('bio', lineageFormData.bio.trim());
      data.append('favorite_book', lineageFormData.favorite_book.trim());
      data.append('order', Number(lineageFormData.order) || 0);
      if (lineageFormData.avatar_url) {
        data.append('avatar_url', lineageFormData.avatar_url.trim());
      }
      if (lineageFormData.image_file) {
        data.append('image', lineageFormData.image_file);
      }

      if (editingLineage && editingLineage.id && typeof editingLineage.id === 'number') {
        const res = await apiClient.put(`/accounts/lineage/${editingLineage.id}/`, data);
        setLineage(prev => prev.map(p => p.id === editingLineage.id ? res.data : p));
      } else {
        const res = await apiClient.post('/accounts/lineage/', data);
        setLineage(prev => [...prev, res.data].sort((a, b) => (a.order || 0) - (b.order || 0)));
      }
      setLineageModalOpen(false);
      setEditingLineage(null);
    } catch (err) {
      console.error('Failed to save lineage:', err);
      alert(err.response?.data?.detail || err.response?.data?.error || 'Failed to save presidential lineage record.');
    } finally {
      setIsSavingLineage(false);
    }
  };

  const handleOpenAddLeader = () => {
    setEditingLeader(null);
    setLeadershipFormData({
      name: '',
      role: '',
      bio: '',
      favorite_genre: '',
      currently_reading: '',
      avatar_url: '',
      order: leadership.length + 1,
      image_file: null,
    });
    setLeadershipModalOpen(true);
  };

  const handleOpenEditLeader = (exec) => {
    setEditingLeader(exec);
    setLeadershipFormData({
      name: exec.name || '',
      role: exec.role || '',
      bio: exec.bio || '',
      favorite_genre: exec.favorite_genre || exec.favoriteGenre || '',
      currently_reading: exec.currently_reading || exec.currentlyReading || '',
      avatar_url: exec.avatar_url || exec.image_url || exec.avatar || '',
      order: exec.order || 0,
      image_file: null,
    });
    setLeadershipModalOpen(true);
  };

  const handleSaveLeader = async (e) => {
    e.preventDefault();
    if (!leadershipFormData.name.trim() || !leadershipFormData.role.trim()) {
      alert('Name and executive role are required.');
      return;
    }
    setIsSavingLeader(true);
    try {
      const data = new FormData();
      data.append('name', leadershipFormData.name.trim());
      data.append('role', leadershipFormData.role.trim());
      data.append('bio', leadershipFormData.bio.trim());
      data.append('favorite_genre', leadershipFormData.favorite_genre.trim());
      data.append('currently_reading', leadershipFormData.currently_reading.trim());
      data.append('order', Number(leadershipFormData.order) || 0);
      if (leadershipFormData.avatar_url) {
        data.append('avatar_url', leadershipFormData.avatar_url.trim());
      }
      if (leadershipFormData.image_file) {
        data.append('image', leadershipFormData.image_file);
      }

      if (editingLeader && editingLeader.id && typeof editingLeader.id === 'number') {
        const res = await apiClient.put(`/accounts/leadership/${editingLeader.id}/`, data);
        setLeadership(prev => prev.map(l => l.id === editingLeader.id ? res.data : l));
      } else {
        const res = await apiClient.post('/accounts/leadership/', data);
        setLeadership(prev => [...prev, res.data].sort((a, b) => (a.order || 0) - (b.order || 0)));
      }
      setLeadershipModalOpen(false);
      setEditingLeader(null);
    } catch (err) {
      console.error('Failed to save leader:', err);
      alert(err.response?.data?.detail || err.response?.data?.error || 'Failed to save executive leader record.');
    } finally {
      setIsSavingLeader(false);
    }
  };

  const handleConfirmDeleteItem = async () => {
    if (!deleteItemState) return;
    setIsDeletingItem(true);
    try {
      const { type, item } = deleteItemState;
      if (typeof item.id === 'number') {
        if (type === 'lineage') {
          await apiClient.delete(`/accounts/lineage/${item.id}/`);
        } else {
          await apiClient.delete(`/accounts/leadership/${item.id}/`);
        }
      }
      if (type === 'lineage') {
        setLineage(prev => prev.filter(p => p.id !== item.id));
      } else {
        setLeadership(prev => prev.filter(l => l.id !== item.id));
      }
      setDeleteItemState(null);
    } catch (err) {
      console.error('Failed to remove entry:', err);
      alert(err.response?.data?.detail || 'Failed to remove entry.');
    } finally {
      setIsDeletingItem(false);
    }
  };

  // Fetch live club gallery photos from API
  useEffect(() => {
    let isMounted = true;
    const fetchGallery = async () => {
      setIsGalleryLoading(true);
      try {
        const res = await apiClient.get('/activities/gallery/');
        if (res.data && Array.isArray(res.data) && res.data.length > 0 && isMounted) {
          // Normalize photo format
          const formatted = res.data.map(p => ({
            id: p.id,
            image: p.image_url || p.image,
            caption: p.caption,
            event_name: p.event_name,
            uploaded_at: p.uploaded_at,
            uploaded_by_username: p.uploaded_by_username || 'Club Officer'
          }));
          setGallery(formatted);
        } else if (isMounted) {
          setGallery(mockGallery || []);
        }
      } catch (err) {
        if (isMounted) setGallery(mockGallery || []);
      } finally {
        if (isMounted) setIsGalleryLoading(false);
      }
    };

    fetchGallery();
    return () => { isMounted = false; };
  }, []);

  const toggleFaq = (id) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone_number) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        full_name: formData.name.trim(),
        email: formData.email ? formData.email.trim() : undefined,
        phone_number: formData.phone_number.trim(),
        department: formData.department ? formData.department.trim() : '',
        year_of_study: formData.year_of_study || '',
        favorite_book: formData.genre || 'Ethiopian Literature',
        policy_agreed: true
      };

      await apiClient.post('/accounts/apply/', payload);
      setIsSubmitted(true);
      setFormData({ 
        name: '', 
        email: '', 
        phone_number: '',
        department: '',
        year_of_study: '2nd Year (Sophomore)',
        genre: 'Ethiopian Literature'
      });
    } catch (err) {
      console.error('Error submitting application:', err);
      const errorMsg = err.response?.data?.detail || 
        (typeof err.response?.data === 'object' ? Object.values(err.response.data).flat().join(' ') : null) ||
        'Failed to submit your application. Please check your details and try again.';
      setSubmitError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredGallery = gallery.filter(photo => {
    if (galleryFilter === 'ALL') return true;
    if (galleryFilter === 'Meetup') return photo.event_name?.toLowerCase().includes('meetup') || photo.event_name?.toLowerCase().includes('tuesday');
    if (galleryFilter === 'Campfire') return photo.event_name?.toLowerCase().includes('campfire') || photo.event_name?.toLowerCase().includes('review');
    if (galleryFilter === 'Donation') return photo.event_name?.toLowerCase().includes('donation') || photo.event_name?.toLowerCase().includes('drive');
    return true;
  });

  return (
    <div className="space-y-12 animate-fade-in pb-12">
      {/* 1. Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-[#2D1B0F] text-[#F8F4EC] p-6 sm:p-10 lg:p-12 border-2 border-[#C48B47]/40 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 rounded-full bg-[#C48B47]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-80 h-80 rounded-full bg-[#A35C33]/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#A35C33] text-white text-xs font-bold uppercase tracking-wider border border-[#C48B47]/40 shadow-sm">
              <Award className="w-3.5 h-3.5 text-[#C48B47]" />
              IEEE Std 830 Literary Community Blueprint
            </span>
            <span className="text-xs font-semibold text-[#EFE7DA]/80 bg-[#1A0E06]/70 px-3 py-1 rounded-full border border-[#D8C8B0]/20">
              Est. 2023 • Addis Ababa University
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-2">
            <div className="p-3 bg-[#EFE7DA] rounded-2xl border-2 border-[#C48B47] shadow-xl shrink-0">
              <img src="/logo.png" alt="Chapters &amp; Chats Logo" className="h-16 sm:h-20 w-auto object-contain" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
                About Chapters <span className="text-[#C48B47]">&amp;</span> Chats
              </h1>
              <p className="text-sm sm:text-base text-[#EFE7DA]/90 leading-relaxed mt-2.5">
                {missionStatement}
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-[#EFE7DA]/80">
            <span className="flex items-center gap-1.5 text-[#C48B47] font-semibold">
              <CheckCircle2 className="w-4 h-4 text-[#C48B47]" />
              In-Person Hall B Reviews
            </span>
            <span className="flex items-center gap-1.5 text-[#C48B47] font-semibold">
              <CheckCircle2 className="w-4 h-4 text-[#C48B47]" />
              Digital PDF Book House
            </span>
            <span className="flex items-center gap-1.5 text-[#C48B47] font-semibold">
              <CheckCircle2 className="w-4 h-4 text-[#C48B47]" />
              Finish the Story Saturday Initiative
            </span>
          </div>
        </div>
      </div>

      {/* 2. Physical Review Schedule & Venue */}
      <div className="bg-[#2D1B0F] text-[#F8F4EC] p-6 sm:p-8 rounded-3xl border-2 border-[#C48B47]/40 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#D8C8B0]/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#A35C33] text-white flex items-center justify-center font-bold shadow-sm">
              <Calendar className="w-5 h-5 text-[#C48B47]" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-2xl text-white">
                Physical Review Schedule &amp; Venue
              </h2>
              <p className="text-xs text-[#EFE7DA]/70">
                3-Week Cycle Engine Meeting Logistics &amp; In-Person Check-In
              </p>
            </div>
          </div>

          <span className="text-xs font-bold bg-[#C48B47] text-[#2D1B0F] px-3.5 py-1 rounded-full shadow-sm">
            Passcode Check-In Window: 12:30 PM – 3:30 PM EAT
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-2xl bg-[#1A0E06]/70 border border-[#D8C8B0]/20 space-y-2">
            <div className="flex items-center gap-2 text-[#C48B47] font-bold text-xs uppercase tracking-wider">
              <Clock className="w-4 h-4 text-[#C48B47]" />
              <span>Meeting Frequency</span>
            </div>
            <p className="font-serif text-lg font-bold text-white">{meetingDetails.frequency}</p>
            <p className="text-xs text-[#EFE7DA]/70">{meetingDetails.dayTime}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#1A0E06]/70 border border-[#D8C8B0]/20 space-y-2">
            <div className="flex items-center gap-2 text-[#C48B47] font-bold text-xs uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-[#C48B47]" />
              <span>Campus Venue</span>
            </div>
            <p className="font-serif text-lg font-bold text-white">{meetingDetails.venue}</p>
            <p className="text-xs text-[#EFE7DA]/70">Main Reading Hall • Tables 4–8</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#1A0E06]/70 border border-[#D8C8B0]/20 space-y-2">
            <div className="flex items-center gap-2 text-[#C48B47] font-bold text-xs uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-[#C48B47]" />
              <span>Session Format</span>
            </div>
            <p className="font-serif text-lg font-bold text-white">Interactive Review</p>
            <p className="text-xs text-[#EFE7DA]/70">{meetingDetails.format}</p>
          </div>
        </div>
      </div>

      {/* 3. Legacy & Leadership: Founder Memorial & Past Presidents */}
      <section className="space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-[#A35C33] bg-[#E5D6BF] px-3.5 py-1 rounded-full border border-[#BAA587]">
            Legacy &amp; Leadership
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2D1B0F] tracking-tight">
            Honoring Our Founder &amp; Club Lineage
          </h2>
          <p className="text-xs sm:text-sm text-[#2D1B0F]/75 leading-relaxed">
            Chapter &amp; Chats stands upon the foundational vision of student literary leadership, dedicated to cultivating an enduring university reading culture.
          </p>
        </div>

        {/* Founder Tribute Showcase Card */}
        {founder && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2D1B0F] via-[#3D2313] to-[#1E110A] text-[#F8F4EC] border-2 border-[#C48B47]/60 shadow-2xl p-6 sm:p-8 lg:p-10">
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 rounded-full bg-[#C48B47]/15 blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Founder Photo & Emblem */}
              <div className="lg:col-span-4 flex flex-col items-center text-center space-y-3.5">
                <div className="relative">
                  <img
                    src={founder.avatar}
                    alt={founder.name}
                    className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl object-cover border-4 border-[#C48B47] shadow-xl"
                  />
                  <div className="absolute -bottom-3 -right-2 bg-[#A35C33] text-white p-2 rounded-2xl border-2 border-[#C48B47] shadow-md">
                    <Crown className="w-5 h-5 text-[#C48B47]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-2xl text-white">
                    {founder.name}
                  </h3>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider bg-[#C48B47] text-[#2D1B0F] px-2.5 py-0.5 rounded-full shadow-xs">
                      {founder.title}
                    </span>
                    <span className="text-xs text-[#EFE7DA]/75 font-semibold">
                      Tenure: {founder.tenure}
                    </span>
                  </div>
                </div>
              </div>

              {/* Founder Message & Initiatives */}
              <div className="lg:col-span-8 space-y-5">
                <div className="relative p-5 rounded-2xl bg-[#1A0E06]/80 border border-[#C48B47]/30 shadow-inner space-y-2">
                  <Quote className="w-7 h-7 text-[#C48B47]/40 mb-1" />
                  <p className="font-serif italic text-sm sm:text-base text-[#EFE7DA] leading-relaxed">
                    "{founder.quote}"
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-serif font-bold text-base text-[#C48B47] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C48B47]" />
                    <span>The Founding Vision</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-[#EFE7DA]/85 leading-relaxed">
                    {founder.message}
                  </p>
                </div>

                {founder.initiatives && (
                  <div className="space-y-2 pt-1 border-t border-[#D8C8B0]/15">
                    <span className="text-[10px] uppercase font-bold text-[#C48B47] tracking-wider block">
                      Foundational Milestones Established:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#EFE7DA]/80">
                      {founder.initiatives.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 bg-[#2D1B0F]/90 p-2 rounded-xl border border-[#D8C8B0]/20">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#C48B47] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Past Presidents Roster Grid */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D8C8B0] pb-2 gap-2">
            <h3 className="font-serif font-bold text-xl text-[#2D1B0F] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#A35C33]" />
              <span>Past Presidents &amp; Presidential Lineage</span>
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#A35C33] hidden sm:inline">
                Club Hall of Honor
              </span>
              {isPresidentOrVP && (
                <button
                  type="button"
                  onClick={handleOpenAddLineage}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#A35C33] hover:bg-[#8B4D2B] text-white shadow-sm inline-flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Lineage Entry</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lineage.map(pres => {
              const avatar = pres.image_url || pres.avatar || pres.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
              const achievement = pres.bio || pres.keyAchievement;
              const favBook = pres.favorite_book || pres.favoriteBook;
              return (
                <div
                  key={pres.id}
                  className="bg-[#F6EFE2] p-5 sm:p-6 rounded-3xl border-2 border-[#D8C8B0] shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center gap-4 relative group"
                >
                  <img
                    src={avatar}
                    alt={pres.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-[#A35C33] shadow-sm shrink-0"
                  />
                  <div className="space-y-1.5 flex-1 w-full">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-serif font-bold text-base text-[#2D1B0F]">
                        {pres.name}
                      </h4>
                      <span className="text-[10px] font-bold bg-[#E5D6BF] text-[#5C3B1E] px-2.5 py-0.5 rounded-full border border-[#BAA587]">
                        {pres.tenure}
                      </span>
                    </div>
                    {achievement && (
                      <p className="text-xs text-[#2D1B0F]/80 leading-relaxed">
                        {achievement}
                      </p>
                    )}
                    {favBook && (
                      <p className="text-[11px] text-[#A35C33] font-medium pt-1">
                        <strong>Favorite Literary Work:</strong> {favBook}
                      </p>
                    )}

                    {isPresidentOrVP && (
                      <div className="flex items-center gap-2 pt-2 border-t border-[#D8C8B0]/60 mt-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditLineage(pres)}
                          className="px-2 py-1 rounded-lg text-[11px] font-bold bg-[#EFE7DA] hover:bg-[#D8C8B0] text-[#2D1B0F] border border-[#D8C8B0] inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3 text-[#A35C33]" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteItemState({ type: 'lineage', item: pres })}
                          className="px-2 py-1 rounded-lg text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Executive Leadership Team */}
        <div className="space-y-5 pt-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-2xl text-[#2D1B0F] flex items-center justify-center sm:justify-start gap-2">
                <Users className="w-5 h-5 text-[#A35C33]" />
                <span>Current Executive Leadership</span>
              </h3>
              <p className="text-xs text-[#2D1B0F]/70">
                Active coordinators overseeing reading sprints, Thursday quizzes, and Tuesday review gatherings.
              </p>
            </div>
            {isPresidentOrVP && (
              <button
                type="button"
                onClick={handleOpenAddLeader}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#A35C33] hover:bg-[#8B4D2B] text-white shadow-sm inline-flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Executive Leader</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {leadership.map(exec => {
              const avatar = exec.image_url || exec.avatar || exec.image || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80';
              const favGenre = exec.favorite_genre || exec.favoriteGenre;
              const currentRead = exec.currently_reading || exec.currentlyReading;
              return (
                <div
                  key={exec.id}
                  className="bg-white p-5 rounded-3xl border border-[#D8C8B0] shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <img
                      src={avatar}
                      alt={exec.name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-[#C48B47] shadow-sm mx-auto"
                    />
                    <div className="text-center space-y-0.5">
                      <h4 className="font-serif font-bold text-base text-[#2D1B0F]">{exec.name}</h4>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#EFE7DA] text-[#A35C33] px-2.5 py-0.5 rounded-full inline-block border border-[#D8C8B0]">
                        {exec.role}
                      </span>
                    </div>
                    {exec.bio && (
                      <p className="text-xs text-[#2D1B0F]/75 text-center leading-relaxed">
                        {exec.bio}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    {(favGenre || currentRead) && (
                      <div className="pt-3 border-t border-[#D8C8B0]/60 text-[11px] space-y-1">
                        {favGenre && (
                          <p className="text-[#2D1B0F]/70">
                            <strong className="text-[#A35C33]">Fav Genre:</strong> {favGenre}
                          </p>
                        )}
                        {currentRead && (
                          <p className="text-[#2D1B0F]/70 line-clamp-1">
                            <strong className="text-[#A35C33]">Reading:</strong> {currentRead}
                          </p>
                        )}
                      </div>
                    )}

                    {isPresidentOrVP && (
                      <div className="flex items-center justify-center gap-2 pt-2 border-t border-[#D8C8B0]/60">
                        <button
                          type="button"
                          onClick={() => handleOpenEditLeader(exec)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#EFE7DA] hover:bg-[#D8C8B0] text-[#2D1B0F] border border-[#D8C8B0] inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3 text-[#A35C33]" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteItemState({ type: 'leadership', item: exec })}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Saturday "Finish the Story" Guidelines */}
      <section className="bg-[#EDE2CF] border-2 border-[#CBB79B] p-6 sm:p-8 lg:p-10 rounded-3xl space-y-6 shadow-sm">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#A35C33] bg-[#F6EFE2] px-3.5 py-1 rounded-full border border-[#BAA587]">
            Saturday Initiative Guidelines
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D1B0F]">
            How the "Finish the Story" Challenge Works
          </h2>
          <p className="text-xs sm:text-sm text-[#2D1B0F]/80 max-w-2xl leading-relaxed">
            Every weekend, Chapter &amp; Chats ignites member imagination through collaborative storytelling, moving beyond simple micro-prompts into rich creative conclusions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-[#D8C8B0] shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#2D1B0F] text-[#C48B47] flex items-center justify-center font-serif font-bold text-base shadow-xs">
              1
            </div>
            <h3 className="font-serif font-bold text-base text-[#2D1B0F]">
              Saturday 00:01 Opening Hook
            </h3>
            <p className="text-xs text-[#2D1B0F]/80 leading-relaxed">
              Curators unveil a narrative cliffhanger, historical dilemma, or classic alternate ending hook from literature.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#D8C8B0] shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#A35C33] text-white flex items-center justify-center font-serif font-bold text-base shadow-xs">
              2
            </div>
            <h3 className="font-serif font-bold text-base text-[#2D1B0F]">
              Craft 30–350 Word Ending (+15 XP)
            </h3>
            <p className="text-xs text-[#2D1B0F]/80 leading-relaxed">
              Members write their original resolution. Submit early to gain feedback and claim +15 XP for active creative writing.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#D8C8B0] shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#C48B47] text-[#2D1B0F] flex items-center justify-center font-serif font-bold text-base shadow-xs">
              3
            </div>
            <h3 className="font-serif font-bold text-base text-[#2D1B0F]">
              Community Voting till Tuesday
            </h3>
            <p className="text-xs text-[#2D1B0F]/80 leading-relaxed">
              Members upvote their favorite endings through Tuesday 12:30 PM. The winner is pinned on Home as "Story of the Week" and crowned Micro-Author.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Interactive Club Photo Gallery: "Moments & Memories" */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#D8C8B0] pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A35C33] bg-[#E5D6BF] px-3 py-0.5 rounded-full border border-[#BAA587]">
              Community Archive
            </span>
            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#2D1B0F] mt-1 flex items-center gap-2">
              <Camera className="w-6 h-6 text-[#A35C33]" />
              <span>Moments &amp; Memories</span>
            </h2>
            <p className="text-xs text-[#2D1B0F]/70">
              Snapshots of Tuesday reviews, campfire book discussions, campus donation drives, and gala honors.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#EFE7DA] p-1.5 rounded-2xl border border-[#D8C8B0]">
            {[
              { id: 'ALL', label: 'All Moments' },
              { id: 'Meetup', label: 'Tuesday Reviews' },
              { id: 'Campfire', label: 'Campfire Nights' },
              { id: 'Donation', label: 'Book Drives' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setGalleryFilter(tab.id)}
                type="button"
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  galleryFilter === tab.id
                    ? 'bg-[#2D1B0F] text-[#FFF8EE] shadow-xs'
                    : 'text-[#2D1B0F]/70 hover:text-[#2D1B0F] hover:bg-[#E5DBCB]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        {filteredGallery.length === 0 ? (
          <div className="py-12 bg-white rounded-3xl border border-[#D8C8B0] text-center space-y-2">
            <Camera className="w-10 h-10 text-[#A35C33] mx-auto opacity-60" />
            <h4 className="font-serif font-bold text-base text-[#2D1B0F]">No photos in this category yet</h4>
            <p className="text-xs text-[#2D1B0F]/70">Photos uploaded by executive officers will appear here automatically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGallery.map((photo, idx) => (
              <div
                key={photo.id || idx}
                onClick={() => setSelectedPhoto(photo)}
                className="group relative overflow-hidden rounded-3xl bg-[#2D1B0F] border-2 border-[#D8C8B0] shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div className="relative h-56 w-full overflow-hidden bg-[#1A0E06]">
                  <img
                    src={photo.image}
                    alt={photo.event_name || photo.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A0E06]/90 via-[#1A0E06]/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                  
                  {/* Event Pill */}
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[#2D1B0F]/85 text-[#C48B47] px-2.5 py-1 rounded-full border border-[#C48B47]/40 shadow-xs backdrop-blur-xs">
                      {photo.event_name || 'Club Moment'}
                    </span>
                  </div>

                  {/* Executive Delete Button */}
                  {canDelete && (
                    <button
                      type="button"
                      title="Delete Photo from Gallery"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPhotoToDelete(photo);
                      }}
                      className="absolute top-3 right-3 z-10 p-2 rounded-full bg-rose-900/80 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-400/40 backdrop-blur-xs transition-all shadow-md cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Zoom indicator */}
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-[#2D1B0F]/80 text-[#C48B47] border border-[#C48B47]/30">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-4 bg-white space-y-1.5 border-t border-[#D8C8B0]">
                  <h4 className="font-serif font-bold text-sm text-[#2D1B0F] leading-snug group-hover:text-[#A35C33] transition-colors line-clamp-1">
                    {photo.event_name || 'Event Snapshot'}
                  </h4>
                  <p className="text-xs text-[#2D1B0F]/75 leading-relaxed line-clamp-2">
                    {photo.caption}
                  </p>
                  <div className="pt-2 flex items-center justify-between text-[10px] text-[#2D1B0F]/50 font-semibold border-t border-[#D8C8B0]/40">
                    <span>Uploaded by: {photo.uploaded_by_username || 'Officer'}</span>
                    <span>{photo.uploaded_at ? new Date(photo.uploaded_at).toLocaleDateString() : 'Archive'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lightbox Zoom Modal */}
        {selectedPhoto && typeof document !== 'undefined' && createPortal(
          <div 
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl my-auto bg-[#F8F4EC] rounded-2xl border-2 border-[#C48B47] shadow-2xl overflow-hidden z-10 animate-slide-down"
            >
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-[#2D1B0F]/80 text-[#FFF8EE] hover:bg-[#2D1B0F] transition-colors cursor-pointer z-20"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative max-h-[60vh] bg-black overflow-hidden flex items-center justify-center">
                <img
                  src={selectedPhoto.image}
                  alt={selectedPhoto.event_name}
                  className="max-h-[60vh] w-auto object-contain mx-auto"
                />
              </div>

              <div className="p-6 bg-white space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[#A35C33] text-white px-2.5 py-0.5 rounded-full">
                      {selectedPhoto.event_name || 'Club Archive'}
                    </span>
                    <span className="text-xs text-[#2D1B0F]/60">
                      {selectedPhoto.uploaded_at ? new Date(selectedPhoto.uploaded_at).toLocaleDateString() : 'Club Event'}
                    </span>
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setPhotoToDelete(selectedPhoto)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 border border-rose-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Delete Photo</span>
                    </button>
                  )}
                </div>
                <h3 className="font-serif font-bold text-xl text-[#2D1B0F]">
                  {selectedPhoto.event_name}
                </h3>
                <p className="text-sm text-[#2D1B0F]/85 leading-relaxed">
                  {selectedPhoto.caption}
                </p>
                <div className="pt-2 text-xs text-[#2D1B0F]/60 border-t border-[#D8C8B0]/60">
                  Shared by <strong className="text-[#A35C33]">{selectedPhoto.uploaded_by_username || 'Executive Officer'}</strong>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={Boolean(photoToDelete)}
          title="Delete Gallery Photo"
          message="Are you sure you want to permanently remove this photo from the Club Gallery?"
          itemTitle={photoToDelete?.event_name || photoToDelete?.caption}
          dangerNote="This will permanently delete the photograph file from the club archives."
          confirmLabel="Delete Photo"
          isDeleting={isDeletingPhoto}
          onConfirm={handleConfirmDeletePhoto}
          onClose={() => setPhotoToDelete(null)}
        />
      </section>


      {/* 6. Interactive FAQ Accordion */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D8C8B0] shadow-sm space-y-6">
        <div className="space-y-1 border-b border-[#D8C8B0]/60 pb-4">
          <h2 className="font-serif font-bold text-2xl text-[#2D1B0F]">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-[#2D1B0F]/70">
            Everything you need to know about our reading community platform.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map(faq => {
            const isOpen = openFaqId === faq.id;
            return (
              <div 
                key={faq.id} 
                className="rounded-2xl border border-[#D8C8B0]/70 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-4 sm:p-5 bg-[#F6EFE2] text-left font-serif font-bold text-base text-[#2D1B0F] flex items-center justify-between gap-4 hover:bg-[#EFE7DA] transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-[#A35C33] shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#2D1B0F]/50 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-4 sm:p-5 bg-white text-xs sm:text-sm text-[#2D1B0F]/85 leading-relaxed border-t border-[#D8C8B0]/60 animate-fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Join Chapters & Chats Membership Application Form or Active Member Banner */}
      {user ? (
        <div className="bg-gradient-to-br from-[#EFE7DA] via-[#F6EFE2] to-[#E5D6BF] p-6 sm:p-8 lg:p-10 rounded-3xl border-2 border-[#C48B47]/50 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 animate-fade-in">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#2D1B0F] text-[#C48B47] px-3 py-1 rounded-full shadow-xs">
                Active Club Member
              </span>
              <span className="text-xs font-semibold text-[#2D1B0F]/70">
                Welcome back, {user.username}!
              </span>
            </div>
            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#2D1B0F]">
              You are an active member of Chapter &amp; Chats.
            </h2>
            <p className="text-xs sm:text-sm text-[#2D1B0F]/80 leading-relaxed">
              Visit your Member Profile to customize your reader passport, track your Tuesday meeting streak and XP, or join the ongoing literary discussions!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 w-full sm:w-auto">
            <NavLink
              to="/profile"
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#2D1B0F] text-[#C48B47] hover:bg-[#1A0E06] font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#C48B47]" />
              <span>Member Profile</span>
            </NavLink>
            <NavLink
              to="/discussions"
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#A35C33] text-white hover:bg-[#8B4C28] font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Join Discussions</span>
            </NavLink>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-[#EFE7DA] via-[#F6EFE2] to-[#E5D6BF] p-6 sm:p-8 lg:p-10 rounded-3xl border-2 border-[#C48B47]/50 shadow-md space-y-6">
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#C48B47] text-[#2D1B0F] px-3 py-1 rounded-full shadow-xs">
              Membership Application
            </span>
            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#2D1B0F]">
              Apply to Join Chapters &amp; Chats
            </h2>
            <p className="text-xs sm:text-sm text-[#2D1B0F]/80">
              Submit your application to become an authenticated club member and access downloadable PDFs, Thursday quizzes, and Tuesday review meetups.
            </p>
          </div>

          {isSubmitted && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2 animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Application submitted successfully! Our executive team will review your application within 24 hours.</span>
              </div>
              <button 
                onClick={() => setIsSubmitted(false)}
                className="text-emerald-700 underline text-xs font-bold cursor-pointer"
              >
                Submit another
              </button>
            </div>
          )}

          {submitError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between gap-2 animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{submitError}</span>
              </div>
              <button 
                onClick={() => setSubmitError(null)}
                className="text-rose-700 p-1 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#2D1B0F] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Amina Bekele"
                  className="w-full px-4 py-3 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#C48B47] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D1B0F] mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="e.g. amina@example.com"
                  className="w-full px-4 py-3 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#C48B47] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#2D1B0F] mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone_number}
                  onChange={e => setFormData({...formData, phone_number: e.target.value})}
                  placeholder="e.g. +251 91 234 5678"
                  className="w-full px-4 py-3 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#C48B47] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D1B0F] mb-1">Year of Study</label>
                <select
                  value={formData.year_of_study}
                  onChange={e => setFormData({...formData, year_of_study: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#C48B47] focus:outline-none"
                >
                  <option value="1st Year (Freshman)">1st Year (Freshman)</option>
                  <option value="2nd Year (Sophomore)">2nd Year (Sophomore)</option>
                  <option value="3rd Year (Junior)">3rd Year (Junior)</option>
                  <option value="4th Year (Senior)">4th Year (Senior)</option>
                  <option value="5th Year / Grad / Alumni">5th Year / Grad / Alumni</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#2D1B0F] mb-1">Academic Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={e => setFormData({...formData, department: e.target.value})}
                  placeholder="e.g. Computer Science &amp; IT"
                  className="w-full px-4 py-3 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#C48B47] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D1B0F] mb-1">Favorite Reading Genre</label>
                <select
                  value={formData.genre}
                  onChange={e => setFormData({...formData, genre: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#C48B47] focus:outline-none"
                >
                  <option>Ethiopian Literature</option>
                  <option>Philosophy &amp; Ethics</option>
                  <option>World Classics</option>
                  <option>African Literature</option>
                  <option>Fiction &amp; Satire</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3.5 rounded-xl bg-[#2D1B0F] text-[#FFF8EE] font-bold text-xs hover:bg-[#1A0E06] transition-all duration-200 shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#C48B47]" />
                  <span>Submitting Application...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-[#C48B47]" />
                  <span>Submit Membership Application</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Presidential Lineage Modal */}
      {lineageModalOpen && typeof document !== 'undefined' && createPortal(
        <div 
          onClick={() => setLineageModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative bg-[#FAF6F0] rounded-2xl border-2 border-[#D8C8B0] p-6 sm:p-8 max-w-lg w-full my-auto shadow-2xl space-y-5 z-10 animate-slide-down"
          >
            <div className="flex items-center justify-between border-b border-[#D8C8B0] pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#A35C33]" />
                <h3 className="font-serif font-bold text-xl text-[#2D1B0F]">
                  {editingLineage ? 'Edit Presidential Lineage' : 'Add Presidential Lineage'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLineageModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#EFE7DA] text-[#2D1B0F]/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLineage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={lineageFormData.name}
                  onChange={e => setLineageFormData({ ...lineageFormData, name: e.target.value })}
                  placeholder="e.g., Yukabed or Dawit Mengistu"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#C48B47] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                  Tenure &amp; Title *
                </label>
                <input
                  type="text"
                  required
                  value={lineageFormData.tenure}
                  onChange={e => setLineageFormData({ ...lineageFormData, tenure: e.target.value })}
                  placeholder="e.g., 2023 – 2025 (Founding President)"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#C48B47] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                  Key Achievement / Impact Bio
                </label>
                <textarea
                  rows={3}
                  value={lineageFormData.bio}
                  onChange={e => setLineageFormData({ ...lineageFormData, bio: e.target.value })}
                  placeholder="Describe presidential initiatives, milestones, and legacy impact..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#C48B47] focus:outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                    Favorite Literary Work
                  </label>
                  <input
                    type="text"
                    value={lineageFormData.favorite_book}
                    onChange={e => setLineageFormData({ ...lineageFormData, favorite_book: e.target.value })}
                    placeholder="e.g., Fiqir Eske Meqabir"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#C48B47] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={lineageFormData.order}
                    onChange={e => setLineageFormData({ ...lineageFormData, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#C48B47] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 border-t border-[#D8C8B0]/60 pt-3">
                <label className="block text-xs font-bold text-[#2D1B0F]">
                  Portrait Photo (Upload or URL)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setLineageFormData({ ...lineageFormData, image_file: e.target.files[0] })}
                  className="w-full text-xs text-[#2D1B0F]/80 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#A35C33] file:text-white hover:file:bg-[#8B4D2B]"
                />
                <input
                  type="url"
                  value={lineageFormData.avatar_url}
                  onChange={e => setLineageFormData({ ...lineageFormData, avatar_url: e.target.value })}
                  placeholder="Or paste an image URL (e.g. Unsplash URL)"
                  className="w-full px-3.5 py-2 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#C48B47] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D8C8B0]">
                <button
                  type="button"
                  onClick={() => setLineageModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#EFE7DA] text-[#2D1B0F] hover:bg-[#D8C8B0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingLineage}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#A35C33] hover:bg-[#8B4D2B] text-white shadow-sm inline-flex items-center gap-1.5 transition-all disabled:opacity-60"
                >
                  {isSavingLineage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{editingLineage ? 'Update Entry' : 'Create Entry'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Current Executive Leadership Modal */}
      {leadershipModalOpen && typeof document !== 'undefined' && createPortal(
        <div 
          onClick={() => setLeadershipModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative bg-[#FAF6F0] rounded-2xl border-2 border-[#D8C8B0] p-6 sm:p-8 max-w-lg w-full my-auto shadow-2xl space-y-5 z-10 animate-slide-down"
          >
            <div className="flex items-center justify-between border-b border-[#D8C8B0] pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#A35C33]" />
                <h3 className="font-serif font-bold text-xl text-[#2D1B0F]">
                  {editingLeader ? 'Edit Executive Leader' : 'Add Executive Leader'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLeadershipModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#EFE7DA] text-[#2D1B0F]/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLeader} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                    Leader Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={leadershipFormData.name}
                    onChange={e => setLeadershipFormData({ ...leadershipFormData, name: e.target.value })}
                    placeholder="e.g., Bethlehem Haile"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#C48B47] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                    Executive Role / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={leadershipFormData.role}
                    onChange={e => setLeadershipFormData({ ...leadershipFormData, role: e.target.value })}
                    placeholder="e.g., Club President"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#C48B47] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                  Responsibilities &amp; Bio
                </label>
                <textarea
                  rows={2}
                  value={leadershipFormData.bio}
                  onChange={e => setLeadershipFormData({ ...leadershipFormData, bio: e.target.value })}
                  placeholder="e.g., Leading our community initiatives and hosting bi-monthly reviews..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#C48B47] focus:outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                    Favorite Genre
                  </label>
                  <input
                    type="text"
                    value={leadershipFormData.favorite_genre}
                    onChange={e => setLeadershipFormData({ ...leadershipFormData, favorite_genre: e.target.value })}
                    placeholder="e.g., Ethiopian Literature"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#C48B47] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                    Currently Reading
                  </label>
                  <input
                    type="text"
                    value={leadershipFormData.currently_reading}
                    onChange={e => setLeadershipFormData({ ...leadershipFormData, currently_reading: e.target.value })}
                    placeholder="e.g., Fiqir Eske Meqabir"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#C48B47] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={leadershipFormData.order}
                    onChange={e => setLeadershipFormData({ ...leadershipFormData, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#C48B47] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 border-t border-[#D8C8B0]/60 pt-3">
                <label className="block text-xs font-bold text-[#2D1B0F]">
                  Portrait Photo (Upload or URL)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setLeadershipFormData({ ...leadershipFormData, image_file: e.target.files[0] })}
                  className="w-full text-xs text-[#2D1B0F]/80 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#A35C33] file:text-white hover:file:bg-[#8B4D2B]"
                />
                <input
                  type="url"
                  value={leadershipFormData.avatar_url}
                  onChange={e => setLeadershipFormData({ ...leadershipFormData, avatar_url: e.target.value })}
                  placeholder="Or paste an image URL"
                  className="w-full px-3.5 py-2 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#C48B47] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D8C8B0]">
                <button
                  type="button"
                  onClick={() => setLeadershipModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#EFE7DA] text-[#2D1B0F] hover:bg-[#D8C8B0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingLeader}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#A35C33] hover:bg-[#8B4D2B] text-white shadow-sm inline-flex items-center gap-1.5 transition-all disabled:opacity-60"
                >
                  {isSavingLeader ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{editingLeader ? 'Update Leader' : 'Add Leader'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Item Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteItemState)}
        title={deleteItemState?.type === 'lineage' ? 'Remove Lineage Entry' : 'Remove Executive Leader'}
        message={`Are you sure you want to remove ${deleteItemState?.item?.name || 'this entry'} from the public roster?`}
        itemTitle={deleteItemState?.item?.name}
        dangerNote="This entry will be permanently removed from the club records."
        confirmLabel="Remove Entry"
        isDeleting={isDeletingItem}
        onConfirm={handleConfirmDeleteItem}
        onClose={() => setDeleteItemState(null)}
      />
    </div>
  );
}


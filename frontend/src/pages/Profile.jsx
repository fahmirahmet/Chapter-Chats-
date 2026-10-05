import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { 
  User, 
  Flame, 
  Award, 
  Shield, 
  Sparkles, 
  BookOpen, 
  Mail, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Camera,
  Edit3,
  Save,
  X,
  Bookmark,
  BookMarked,
  ArrowLeft,
  Loader2,
  Crown,
  Share2,
  Sliders,
  ExternalLink,
  MessageSquare,
  Trophy,
  Trash2
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl, getAuthorDisplayName, isPhoneNumber } from '../utils/avatar';
import BadgeGrid from '../components/BadgeGrid';
import ReadingProgressBar from '../components/ReadingProgressBar';

export default function Profile() {
  const { username: paramUsername } = useParams();
  const navigate = useNavigate();
  const { user, refreshProfile, updateUser } = useAuth();

  const isOwnProfile = !paramUsername || (user && (user.username?.toLowerCase() === paramUsername?.toLowerCase() || String(user.id) === String(paramUsername)));

  // Own Profile Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    top_book_1: '',
    top_book_2: '',
    top_book_3: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const fileInputRef = useRef(null);

  // Public Profile State
  const [publicUser, setPublicUser] = useState(null);
  const [isLoadingPublic, setIsLoadingPublic] = useState(false);
  const [publicNotFound, setPublicNotFound] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Initialize Own Profile Data
  useEffect(() => {
    if (isOwnProfile && user) {
      setFormData({
        username: user.username || '',
        bio: user.bio || '',
        top_book_1: user.top_book_1 || '',
        top_book_2: user.top_book_2 || '',
        top_book_3: user.top_book_3 || '',
      });
      setAvatarPreview(user.avatar_url || user.avatar || null);
      setRemoveAvatar(false);
    }
  }, [isOwnProfile, user]);

  // Fetch Public Profile Data
  useEffect(() => {
    let isMounted = true;
    if (!isOwnProfile && paramUsername) {
      setIsLoadingPublic(true);
      setPublicNotFound(false);

      const fetchPublicData = async () => {
        try {
          let res;
          try {
            res = await apiClient.get(`/accounts/users/${paramUsername}/profile/`);
          } catch {
            res = await apiClient.get(`/accounts/users/${paramUsername}/`);
          }

          if (res.data && isMounted) {
            setPublicUser(res.data);
          }
        } catch (err) {
          if (isMounted) {
            console.warn('Could not fetch member profile:', err);
            setPublicNotFound(true);
          }
        } finally {
          if (isMounted) setIsLoadingPublic(false);
        }
      };

      fetchPublicData();
    }
    return () => { isMounted = false; };
  }, [isOwnProfile, paramUsername]);

  // Avatar Selection & Removal
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setRemoveAvatar(false);
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setRemoveAvatar(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit Profile Updates
  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const data = new FormData();
      data.append('username', formData.username.trim());
      data.append('bio', formData.bio.trim());
      data.append('top_book_1', formData.top_book_1.trim());
      data.append('top_book_2', formData.top_book_2.trim());
      data.append('top_book_3', formData.top_book_3.trim());

      if (removeAvatar) {
        data.append('remove_avatar', 'true');
      } else if (avatarFile) {
        data.append('avatar', avatarFile);
      }

      const res = await apiClient.patch('/accounts/profile/me/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data) {
        setSaveSuccess(true);
        setIsEditing(false);
        setAvatarFile(null);
        setRemoveAvatar(false);
        setAvatarPreview(res.data.avatar_url || res.data.avatar || null);
        if (updateUser) {
          updateUser(res.data);
        }
        if (refreshProfile) {
          await refreshProfile();
        }
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      const msg = err.response?.data?.error || err.response?.data?.detail || err.response?.data?.username?.[0] || 'Failed to save profile changes.';
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyProfileLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // -------------------------------------------------------------
  // RENDER: Loading or 404 for Public Profile
  // -------------------------------------------------------------
  if (!isOwnProfile && isLoadingPublic) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#A35C33]" />
        <p className="font-serif text-[#2D1B0F] font-bold text-lg">Retrieving Reader Passport...</p>
      </div>
    );
  }

  if (!isOwnProfile && publicNotFound) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 sm:p-12 bg-[#F6EFE2] border-2 border-[#D8C8B0] rounded-3xl text-center space-y-6 shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-[#E5D6BF] text-[#A35C33] flex items-center justify-center mx-auto shadow-inner">
          <User className="w-8 h-8 text-[#A35C33]" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif font-bold text-2xl text-[#2D1B0F]">Member Profile Not Found</h2>
          <p className="text-xs sm:text-sm text-[#2D1B0F]/75">
            The member passport for "<span className="font-semibold text-[#A35C33]">@{paramUsername}</span>" could not be located in our club directory.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <NavLink
            to="/"
            className="px-5 py-2.5 rounded-xl bg-[#2D1B0F] text-[#C48B47] hover:bg-[#1A0E06] text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4 text-[#C48B47]" />
            <span>Return to Home</span>
          </NavLink>
          <NavLink
            to="/discussions"
            className="px-5 py-2.5 rounded-xl bg-[#A35C33] text-white hover:bg-[#8B4C28] text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Explore Discussions</span>
          </NavLink>
        </div>
      </div>
    );
  }

  // Determine active profile object
  const activeProfile = isOwnProfile ? user : publicUser;
  if (!activeProfile && isOwnProfile) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 sm:p-12 bg-[#F6EFE2] border-2 border-[#D8C8B0] rounded-3xl text-center space-y-6 shadow-sm">
        <h2 className="font-serif font-bold text-2xl text-[#2D1B0F]">Authentication Required</h2>
        <p className="text-xs sm:text-sm text-[#2D1B0F]/75">
          Please log in to view and customize your Chapter &amp; Chats member passport.
        </p>
        <NavLink
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2D1B0F] text-[#C48B47] font-bold text-xs shadow-xs"
        >
          <span>Return Home to Sign In</span>
        </NavLink>
      </div>
    );
  }

  const displayName = getAuthorDisplayName(activeProfile) || activeProfile?.full_name || activeProfile?.username || paramUsername || 'Reader';
  const rawUserStr = activeProfile?.username || paramUsername || 'reader';
  const handleUsername = !isPhoneNumber(rawUserStr) ? rawUserStr : 'reader';
  const username = displayName;
  const roleDisplay = activeProfile?.officer_title_display || (activeProfile?.role === 'OWNER' ? 'Club President' : activeProfile?.role_display || 'Active Member');
  const streak = activeProfile?.current_streak ?? activeProfile?.meeting_streak ?? 0;
  const totalXp = activeProfile?.total_xp ?? 0;
  const bio = isOwnProfile && isEditing ? formData.bio : (activeProfile?.bio || 'This reader has not penned a bio yet.');
  const top1 = isOwnProfile && isEditing ? formData.top_book_1 : (activeProfile?.top_book_1 || '');
  const top2 = isOwnProfile && isEditing ? formData.top_book_2 : (activeProfile?.top_book_2 || '');
  const top3 = isOwnProfile && isEditing ? formData.top_book_3 : (activeProfile?.top_book_3 || '');
  const badges = activeProfile?.badges || activeProfile?.user_badges || [];
  const currentAvatar = isOwnProfile && removeAvatar
    ? getAvatarUrl(null, displayName)
    : isOwnProfile && avatarPreview
      ? getAvatarUrl(avatarPreview, displayName)
      : getAvatarUrl(activeProfile?.avatar_url || activeProfile?.avatar, displayName);
  const isOfficer = Boolean(
    activeProfile?.is_staff || 
    activeProfile?.is_superuser || 
    activeProfile?.role === 'OWNER' || 
    activeProfile?.role === 'ADMIN' || 
    activeProfile?.role === 'OFFICER' || 
    (activeProfile?.officer_title && activeProfile?.officer_title !== 'NONE')
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* Toast Notifications */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2 shadow-sm animate-slide-down">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Your Reader Passport profile has been updated successfully!</span>
          </div>
          <button onClick={() => setSaveSuccess(false)} className="text-emerald-700 hover:text-emerald-900 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between gap-2 shadow-sm animate-slide-down">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{saveError}</span>
          </div>
          <button onClick={() => setSaveError(null)} className="text-rose-700 hover:text-rose-900 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Reader Passport Card Showcase */}
      <div className="bg-[#EDE2CF] rounded-3xl border-2 border-[#CBB79B] overflow-hidden shadow-md">
        
        {/* Cover Ribbon Banner */}
        <div className="h-36 sm:h-44 pb-8 sm:pb-10 p-6 bg-gradient-to-r from-[#2D1B0F] via-[#4A2E1B] to-[#2D1B0F] flex items-start justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C48B47_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="relative z-10 flex items-center gap-2 text-[#C48B47]">
            <BookMarked className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#EFE7DA]/90">
              Chapter &amp; Chats • Official Reader Passport
            </span>
          </div>

          <div className="relative z-10 flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyProfileLink}
              className="px-3 py-1.5 rounded-xl bg-black/30 hover:bg-black/50 text-[#EFE7DA] border border-[#C48B47]/30 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Share profile link"
            >
              <Share2 className="w-3.5 h-3.5 text-[#C48B47]" />
              <span>{copiedLink ? 'Link Copied!' : 'Share Passport'}</span>
            </button>

            {isOwnProfile && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#C48B47] hover:bg-[#B37B37] text-[#2D1B0F] font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Passport</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Card Body */}
        <div className="px-6 sm:px-10 pb-8 pt-2 relative">
          
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 -mt-12 sm:-mt-16 mb-6">
            
            {/* Avatar & Identifiers */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
              <div className="relative group shrink-0">
                <img
                  src={currentAvatar}
                  alt={username}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-[#EDE2CF] bg-[#A35C33] shadow-xl ring-2 ring-[#C48B47]/20 transition-transform duration-300 group-hover:scale-[1.02]"
                />

                {isOwnProfile && (
                  <>
                    <div className="absolute inset-0 rounded-3xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2 backdrop-blur-[2px]">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-xl bg-[#C48B47] text-[#2D1B0F] hover:bg-[#B37B37] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                        title="Upload new photo"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Change</span>
                      </button>
                      {(activeProfile?.avatar || activeProfile?.avatar_url || avatarPreview) && !removeAvatar && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="px-2.5 py-1 rounded-xl bg-rose-600/90 text-white hover:bg-rose-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                          title="Remove profile photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </>
                )}
              </div>

              <div className="space-y-1.5 pt-2 sm:pt-4 mt-2 sm:mt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#2D1B0F] leading-tight">
                    {username}
                  </h1>

                  {isOfficer ? (
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#A35C33] text-white border border-[#C48B47]/40 shadow-xs flex items-center gap-1">
                      <Crown className="w-3 h-3 text-[#C48B47]" />
                      <span>{roleDisplay}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#2D1B0F] text-[#C48B47] shadow-xs flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{roleDisplay}</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#2D1B0F]/70 flex items-center gap-2 font-medium">
                  <span>@{handleUsername.toLowerCase()}</span>
                  <span>•</span>
                  <span>Active Member</span>
                </p>
              </div>
            </div>

            {/* Quick Stats: Streak & XP */}
            <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end">
              <div className="bg-[#FAF6EE] border-2 border-[#D8C8B0] p-3 sm:p-4 rounded-2xl text-center min-w-[95px] shadow-xs">
                <span className="flex items-center justify-center gap-1.5 font-serif font-bold text-[#A35C33] text-lg sm:text-xl">
                  <Flame className="w-5 h-5 text-[#A35C33] fill-[#A35C33]" />
                  {streak}
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2D1B0F]/70 block mt-0.5">
                  Meeting Streak
                </span>
              </div>

              <div className="bg-[#FAF6EE] border-2 border-[#D8C8B0] p-3 sm:p-4 rounded-2xl text-center min-w-[95px] shadow-xs">
                <span className="flex items-center justify-center gap-1.5 font-serif font-bold text-[#2D1B0F] text-lg sm:text-xl">
                  <Trophy className="w-5 h-5 text-[#C48B47]" />
                  {totalXp}
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2D1B0F]/70 block mt-0.5">
                  Reader XP
                </span>
              </div>
            </div>
          </div>

          {/* Edit Form Mode for Own Profile */}
          {isOwnProfile && isEditing ? (
            <form onSubmit={handleSaveProfile} className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-[#D8C8B0] space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#D8C8B0]/60 pb-3">
                <div className="flex items-center gap-2 text-[#2D1B0F]">
                  <Sliders className="w-4 h-4 text-[#A35C33]" />
                  <h3 className="font-serif font-bold text-lg text-[#2D1B0F]">Customize Your Reader Identity</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-[#2D1B0F]/60 hover:text-[#2D1B0F] flex items-center gap-1 cursor-pointer font-bold"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>

              <div className="space-y-4">
                {/* Photo Upload Section Inside Edit Form */}
                <div className="flex items-center gap-4 p-4 bg-[#FAF6EE] border-2 border-[#D8C8B0] rounded-2xl">
                  <img
                    src={currentAvatar}
                    alt="Current avatar preview"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#A35C33] shadow-xs bg-[#A35C33] shrink-0"
                  />
                  <div className="flex-1 space-y-1">
                    <span className="block text-xs font-bold text-[#2D1B0F]">Profile Photo</span>
                    <span className="block text-[11px] text-[#2D1B0F]/70">Recommended: Square PNG, JPG or WebP (max 5MB)</span>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-[#2D1B0F] text-[#C48B47] hover:bg-[#1A0E06] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#C48B47]" />
                        <span>Upload Photo</span>
                      </button>
                      {(activeProfile?.avatar || activeProfile?.avatar_url || avatarPreview) && !removeAvatar && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                    Display Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FAF6EE] border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:border-[#A35C33] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                    Reader Bio &amp; Literary Interests
                  </label>
                  <textarea
                    rows={3}
                    value={formData.bio}
                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Share your favorite genres, literary quotes, or what drives your passion for reading..."
                    className="w-full px-4 py-2.5 bg-[#FAF6EE] border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:border-[#A35C33] focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#A35C33]">
                    Top 3 Favorite Books Shelf
                  </label>
                  <p className="text-[11px] text-[#2D1B0F]/70">
                    Your 3 most cherished reads showcased on your public reader passport card.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] font-bold text-[#2D1B0F]/80 block mb-1">🥇 Book 1</span>
                      <input
                        type="text"
                        value={formData.top_book_1}
                        onChange={e => setFormData({ ...formData, top_book_1: e.target.value })}
                        placeholder="e.g. Fiqir Eske Meqabir"
                        className="w-full px-3 py-2 bg-[#FAF6EE] border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:border-[#A35C33] focus:outline-none"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-[#2D1B0F]/80 block mb-1">🥈 Book 2</span>
                      <input
                        type="text"
                        value={formData.top_book_2}
                        onChange={e => setFormData({ ...formData, top_book_2: e.target.value })}
                        placeholder="e.g. Oromay"
                        className="w-full px-3 py-2 bg-[#FAF6EE] border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:border-[#A35C33] focus:outline-none"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-[#2D1B0F]/80 block mb-1">🥉 Book 3</span>
                      <input
                        type="text"
                        value={formData.top_book_3}
                        onChange={e => setFormData({ ...formData, top_book_3: e.target.value })}
                        placeholder="e.g. The Crucible"
                        className="w-full px-3 py-2 bg-[#FAF6EE] border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:border-[#A35C33] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#D8C8B0] text-[#2D1B0F] text-xs font-bold hover:bg-[#FAF6EE] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-[#2D1B0F] hover:bg-[#1A0E06] text-[#C48B47] text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Passport</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Bio Statement */}
              <div className="bg-white/80 p-5 sm:p-6 rounded-2xl border border-[#D8C8B0] space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A35C33] block">
                  Reader Statement &amp; Bio
                </span>
                <p className="font-serif text-sm sm:text-base text-[#2D1B0F] italic leading-relaxed">
                  "{bio}"
                </p>
              </div>

              {/* Top 3 Favorite Books Shelf Showcase */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-base sm:text-lg text-[#2D1B0F] flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-[#A35C33]" />
                    <span>Top 3 Favorite Books Shelf</span>
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E5D6BF] text-[#2D1B0F] px-2.5 py-0.5 rounded-full border border-[#BAA587]">
                    Curated Shelf
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-2xl border-2 border-[#D8C8B0] flex items-start gap-3 shadow-xs">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                      1
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-extrabold uppercase text-[#A35C33] block">Top Choice</span>
                      <h4 className="font-serif font-bold text-xs text-[#2D1B0F] line-clamp-2">
                        {top1 || <span className="italic text-[#2D1B0F]/40">No title selected</span>}
                      </h4>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border-2 border-[#D8C8B0] flex items-start gap-3 shadow-xs">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-900 border border-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                      2
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-extrabold uppercase text-[#A35C33] block">Second Choice</span>
                      <h4 className="font-serif font-bold text-xs text-[#2D1B0F] line-clamp-2">
                        {top2 || <span className="italic text-[#2D1B0F]/40">No title selected</span>}
                      </h4>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border-2 border-[#D8C8B0] flex items-start gap-3 shadow-xs">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-900 border border-orange-300 flex items-center justify-center font-bold text-xs shrink-0">
                      3
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-extrabold uppercase text-[#A35C33] block">Third Choice</span>
                      <h4 className="font-serif font-bold text-xs text-[#2D1B0F] line-clamp-2">
                        {top3 || <span className="italic text-[#2D1B0F]/40">No title selected</span>}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Reading Progress Bar (For Own Profile) */}
      {isOwnProfile && (
        <ReadingProgressBar
          initialPages={user?.current_page_read || 0}
          totalPages={340}
        />
      )}

      {/* Badges & Gamification Showcase */}
      <div className="bg-[#F6EFE2] rounded-3xl border-2 border-[#D8C8B0] p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#D8C8B0]/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#A35C33] text-white flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#2D1B0F]">
                {isOwnProfile ? 'Your Unlocked Badges & Trophies' : `${username}'s Badges & Honors`}
              </h2>
              <p className="text-xs text-[#2D1B0F]/70">
                Milestones awarded through Tuesday attendance, Thursday quizzes, and Saturday stories.
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-[#A35C33] bg-[#E5D6BF] px-3 py-1 rounded-full border border-[#BAA587]">
            {badges.length} Badges
          </span>
        </div>

        <BadgeGrid badges={badges} />
      </div>

      {/* Bottom Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#D8C8B0]/60">
        <NavLink
          to="/"
          className="px-4 py-2 rounded-xl bg-white border border-[#D8C8B0] text-[#2D1B0F] text-xs font-bold hover:bg-[#FAF6EE] transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return Home</span>
        </NavLink>

        <div className="flex items-center gap-3">
          <NavLink
            to="/book-house"
            className="px-4 py-2 rounded-xl bg-[#2D1B0F] text-[#C48B47] hover:bg-[#1A0E06] text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#C48B47]" />
            <span>Visit Book House</span>
          </NavLink>
          <NavLink
            to="/discussions"
            className="px-4 py-2 rounded-xl bg-[#A35C33] text-white hover:bg-[#8B4C28] text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Community Discussions</span>
          </NavLink>
        </div>
      </div>

    </div>
  );
}

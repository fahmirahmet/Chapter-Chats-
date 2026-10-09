import React from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  User, 
  Flame, 
  Award, 
  Shield, 
  Sparkles, 
  BookOpen, 
  Mail, 
  Calendar, 
  CheckCircle2, 
  LogOut, 
  ExternalLink 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl, getAuthorDisplayName, isPhoneNumber } from '../utils/avatar';
import BadgeGrid from './BadgeGrid';
import ReadingProgressBar from './ReadingProgressBar';

export default function ProfileModal({ userData, isOpen, onClose }) {
  const { user, logout } = useAuth();
  if (!isOpen) return null;

  const profile = user || userData?.profile || userData || {};
  const badgesList = profile.badges || profile.user_badges || userData?.badges || [];
  const streak = profile.current_streak ?? profile.currentStreak ?? 0;
  const xp = profile.total_xp ?? profile.totalXp ?? 0;
  const displayName = getAuthorDisplayName(profile) || profile.full_name || profile.username || 'Reader';
  const rawUsername = profile.username || '';
  const cleanUsername = !isPhoneNumber(rawUsername) ? rawUsername : '';
  const username = displayName;
  const email = profile.email || 'member@chapterchats.com';
  const avatarUrl = getAvatarUrl(profile.avatar_url || profile.avatar, displayName);
  const isAdmin = profile.is_staff || profile.is_superuser || profile.role === 'ADMIN';

  const handleSignOut = () => {
    logout();
    onClose();
  };

  const modalContent = (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
    >
      {/* Modal Container */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[90vh] bg-[#F8F4EC] rounded-2xl shadow-2xl border-2 border-[#D8C8B0] overflow-hidden z-10 flex flex-col my-auto animate-slide-down"
      >
        {/* Profile Header */}
        <div className="bg-[#2D1B0F] text-[#F8F4EC] p-6 border-b-2 border-[#C48B47]/30 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-[#EFE7DA]/70 hover:text-white hover:bg-[#422817] transition-colors cursor-pointer"
            aria-label="Close profile modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pr-8 sm:pr-0">
            <div className="flex items-center gap-4">
              <img
                src={avatarUrl}
                alt={username}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#C48B47] shadow-md bg-[#A35C33]"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-2xl text-white">
                    {username}
                  </h3>
                  {isAdmin ? (
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#C48B47] text-[#2D1B0F] border border-[#EFE7DA] shadow-xs flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Executive Admin
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#A35C33] text-white border border-[#C48B47]/40 shadow-xs flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Active Member
                    </span>
                  )}
                </div>
                {cleanUsername && cleanUsername !== displayName && (
                  <p className="text-[11px] text-[#EFE7DA]/70 font-mono">
                    @{cleanUsername}
                  </p>
                )}
                <p className="text-xs text-[#EFE7DA]/80 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#C48B47]" />
                  {email}
                </p>
              </div>
            </div>

            {/* Gamification Stats Header Badges */}
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="bg-[#1A0E06]/80 p-3 rounded-2xl border border-[#D8C8B0]/20 text-center min-w-[70px]">
                <span className="flex items-center justify-center gap-1 font-bold text-[#C48B47] text-base">
                  <Flame className="w-4 h-4 text-[#A35C33] fill-[#A35C33]" />
                  {streak}
                </span>
                <span className="text-[10px] font-semibold uppercase text-[#EFE7DA]/70 block">
                  Streak
                </span>
              </div>

              <div className="bg-[#1A0E06]/80 p-3 rounded-2xl border border-[#D8C8B0]/20 text-center min-w-[80px]">
                <span className="flex items-center justify-center gap-1 font-bold text-white text-base">
                  <Sparkles className="w-4 h-4 text-[#C48B47]" />
                  {xp} XP
                </span>
                <span className="text-[10px] font-semibold uppercase text-[#EFE7DA]/70 block">
                  Total XP
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-[#2D1B0F]">
          {/* Interactive Reading Progress Log Slider */}
          <ReadingProgressBar
            initialPages={profile.current_page_read ?? profile.currentPageRead ?? 0}
            totalPages={profile.totalPagesBook || 340}
            onSavePages={(pg) => console.log('Saved page', pg)}
          />

          {/* Gamification Badge Grid */}
          <BadgeGrid badges={badgesList} />
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-white border-t-2 border-[#D8C8B0] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Show Django Admin access ONLY for the President / Superuser */}
            {(user?.is_superuser || profile?.is_superuser) && (
              <a
                href="http://localhost:8000/admin/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-[#A35C33] hover:underline flex items-center gap-1"
              >
                <span>Django Admin</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <span className="text-xs text-[#2D1B0F]/60">
              Chapters &amp; Chats Member Portal
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleSignOut}
              type="button"
              className="px-4 py-2.5 rounded-xl border-2 border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>

            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-[#2D1B0F] text-[#F8F4EC] font-bold text-xs hover:bg-[#1A0E06] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

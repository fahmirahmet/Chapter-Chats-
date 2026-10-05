import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, ShieldAlert, Lock, LogIn, ArrowLeft, BookOpen, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';

export default function AdminRoute({ children }) {
  const { user, isLoading } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-[#EFE7DA] border-2 border-[#D8C8B0] flex items-center justify-center animate-pulse">
          <Shield className="w-6 h-6 text-[#A35C33]" />
        </div>
        <p className="text-xs font-bold text-[#2D1B0F]/70">Verifying executive authorization...</p>
      </div>
    );
  }

  // Case 1: Unauthenticated Guest
  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 animate-fade-in">
        <div className="max-w-md w-full bg-[#F6EFE2] rounded-3xl border-2 border-[#D8C8B0] p-8 text-center space-y-5 shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-[#A35C33] text-white flex items-center justify-center mx-auto shadow-md border border-[#6E3618]">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-[#C48B47]/20 text-[#A35C33] border border-[#C48B47]/40">
              Executive Desk Guard
            </span>
            <h2 className="font-serif font-bold text-2xl text-[#2D1B0F]">
              Executive Sign In Required
            </h2>
            <p className="text-xs text-[#2D1B0F]/80 leading-relaxed">
              The Chapters &amp; Chats Executive Hub is reserved for club executives, curators, and desk managers.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#2D1B0F] hover:bg-[#1A0E06] text-[#C48B47] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#C48B47]"
            >
              <LogIn className="w-4 h-4" />
              <span>Officer Sign In</span>
            </button>

            <NavLink
              to="/"
              className="w-full sm:w-auto px-5 py-3 rounded-xl border-2 border-[#D8C8B0] text-[#2D1B0F] font-semibold text-xs hover:bg-[#EFE7DA] transition-all flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return Home</span>
            </NavLink>
          </div>
        </div>

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          initialTab="admin"
        />
      </div>
    );
  }

  // Case 2: Authenticated Regular Member (Not Staff/Admin/Officer)
  const isStaffOrAdmin = Boolean(
    user.is_staff || 
    user.is_superuser || 
    user.is_executive || 
    user.is_president || 
    user.role === 'ADMIN' || 
    user.role === 'OWNER' || 
    user.role === 'OFFICER' || 
    (user.officer_title && user.officer_title !== 'NONE')
  );
  if (!isStaffOrAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 animate-fade-in">
        <div className="max-w-md w-full bg-[#F6EFE2] rounded-3xl border-2 border-amber-300 p-8 text-center space-y-5 shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-amber-300 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-7 h-7 text-amber-700" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-200 text-amber-900 border border-amber-400">
              Access Restricted
            </span>
            <h2 className="font-serif font-bold text-2xl text-[#2D1B0F]">
              Executive Officers Only
            </h2>
            <p className="text-xs text-[#2D1B0F]/80 leading-relaxed">
              Hello <strong className="text-[#A35C33]">{user.username}</strong>. You are currently logged in as a <strong>Member</strong>. Executive tools (passcode generation, story curation, application approvals) require executive credentials.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#A35C33] text-white font-bold text-xs hover:bg-[#8B4C28] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>Switch to Admin Account</span>
            </button>

            <NavLink
              to="/"
              className="w-full sm:w-auto px-5 py-3 rounded-xl border-2 border-[#D8C8B0] text-[#2D1B0F] font-semibold text-xs hover:bg-[#EFE7DA] transition-all flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </NavLink>
          </div>
        </div>

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          initialTab="admin"
        />
      </div>
    );
  }

  // Case 3: Authorized Executive Officer
  return children;
}

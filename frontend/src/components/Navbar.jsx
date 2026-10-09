import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  MessageSquare, 
  PenTool, 
  Info, 
  Home as HomeIcon, 
  Menu, 
  X, 
  User, 
  Sparkles, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  ChevronRight, 
  ChevronDown,
  Flame, 
  LogIn, 
  UserPlus, 
  LogOut, 
  Shield, 
  ExternalLink,
  Sliders
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl } from '../utils/avatar';
import ProfileModal from './ProfileModal';
import AuthModal from './AuthModal';

export default function Navbar({ onOpenCheckIn }) {
  const { user, logout } = useAuth();
  const streak = user?.current_streak ?? 0;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('member'); // 'member' | 'admin' | 'register'
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = Boolean(
    user && (
      user.is_staff || 
      user.is_superuser || 
      user.is_executive || 
      user.is_president || 
      user.role === 'ADMIN' || 
      user.role === 'OWNER' || 
      user.role === 'OFFICER' || 
      (user.officer_title && user.officer_title !== 'NONE')
    )
  );
  const username = user?.username || '';
  const displayName = user?.full_name || user?.username || 'Reader';
  const avatarUrl = user ? getAvatarUrl(user.avatar_url || user.avatar, displayName) : '';
  const officerTitle = user?.officer_title_display || (user?.role === 'OWNER' ? 'President' : user?.role_display || 'Member');

  // Handle outside click for user dropdown
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Handle scroll shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserDropdownOpen(false);
  }, [location.pathname]);

  const openAuth = (tab) => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/book-house', label: 'Book House', icon: BookOpen },
    { path: '/six-word-story', label: 'Saturday Story', icon: PenTool, badge: 'Weekend' },
    { path: '/discussions', label: 'Discussions', icon: MessageSquare },
    { path: '/about', label: 'About', icon: Info },
  ];

  const mobileNavLinks = [
    ...navLinks,
    ...(isAdmin ? [{ path: '/admin-portal', label: 'Executive Hub', icon: Shield, badge: 'Admin' }] : [])
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-[#F6EFE2]/95 backdrop-blur-md shadow-md border-b-2 border-[#D8C8B0] py-2.5'
            : 'bg-[#F8F4EC]/90 backdrop-blur-md border-b-2 border-[#D8C8B0]/60 py-3'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center justify-between gap-4">
            
            {/* 1. Left: Brand Logo */}
            <div className="shrink-0">
              <NavLink 
                to="/" 
                className="flex items-center hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#A35C33] rounded-lg p-0.5"
              >
                <img 
                  src="/logo.png" 
                  alt="Chapters and Chats" 
                  className="h-10 sm:h-12 md:h-13 w-auto object-contain" 
                />
              </NavLink>
            </div>

            {/* 2. Center: Clean Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2 bg-[#EFE7DA]/95 backdrop-blur-md px-3.5 xl:px-5 py-1.5 rounded-full border-2 border-[#D4C4AE] text-[#2D1B0F] shadow-xs">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      `relative flex items-center gap-1.5 xl:gap-2 px-3 xl:px-4 py-1.5 xl:py-2 rounded-full text-xs xl:text-sm font-semibold transition-all duration-200 shrink-0 whitespace-nowrap ${
                        isActive
                          ? 'bg-[#2D1B0F] text-[#FFF8EE] shadow-inner font-bold'
                          : 'text-[#2D1B0F]/80 hover:text-[#2D1B0F] hover:bg-[#E5DBCB]/60'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#C48B47]' : 'text-[#A35C33]'}`} />
                        <span>{link.label}</span>
                        {link.badge && !isActive && (
                          <span className="ml-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border bg-[#A35C33]/15 text-[#A35C33] border-[#D8C8B0]">
                            {link.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* 3. Right: Check In + Auth CTAs + User Profile Dropdown */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              
              {/* Tuesday Meeting Check-In CTA — Desktop only (hidden on mobile; accessible in drawer) */}
              <button
                onClick={onOpenCheckIn}
                type="button"
                className="relative hidden lg:inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#A35C33] hover:bg-[#8B4C28] text-white border border-[#6E3618] font-bold text-xs sm:text-sm shadow-md transition-all duration-200 transform active:scale-95 group pulse-ring cursor-pointer shrink-0"
                title="Perform Tuesday Meeting Check-In"
              >
                <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-white"></span>
                </span>
                <ShieldCheck className="w-4 h-4 text-white transition-colors" />
                <span className="font-bold">Check In</span>
              </button>

              {/* Mobile-only Auth CTA — visible beside hamburger on small screens */}
              {!user ? (
                <button
                  type="button"
                  onClick={() => openAuth('member')}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-[#D8C8B0] bg-[#F6EFE2] text-[#2D1B0F] hover:bg-[#EFE7DA] text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs shrink-0"
                >
                  <LogIn className="w-4 h-4 text-[#A35C33]" />
                  <span>Sign In</span>
                </button>
              ) : null}

              {/* AUTH STATES: Guest vs Member vs Admin */}
              {!user ? (
                /* GUEST STATE: Hide avatars/usernames/streak; Render "Sign In" and "Join Club" CTAs */
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openAuth('member')}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-[#D8C8B0] bg-[#F6EFE2] text-[#2D1B0F] hover:bg-[#EFE7DA] text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer shadow-xs shrink-0"
                  >
                    <LogIn className="w-4 h-4 text-[#A35C33]" />
                    <span>Sign In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openAuth('register')}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2D1B0F] hover:bg-[#1A0E06] text-[#C48B47] border border-[#C48B47]/60 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer shadow-sm shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C48B47]" />
                    <span>Join Club</span>
                  </button>
                </div>
              ) : (
                /* LOGGED-IN STATE (Member or Admin) */
                <div className="relative hidden sm:block shrink-0" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 border-[#D8C8B0] bg-[#F6EFE2] text-[#2D1B0F] hover:bg-[#EFE7DA] text-sm font-semibold transition-all duration-200 cursor-pointer shadow-xs group shrink-0"
                  >
                    <div className="relative">
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-7 h-7 rounded-full object-cover border border-[#C48B47] bg-[#A35C33]"
                      />
                      {isAdmin && (
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-amber-300 text-amber-950 rounded-full flex items-center justify-center text-[8px] font-black border border-amber-600 shadow-xs" title={officerTitle}>
                          🛡️
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="max-w-[90px] md:max-w-[120px] truncate font-bold text-xs sm:text-sm">
                        {displayName}
                      </span>
                      {isAdmin && (
                        <Shield className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      )}
                    </div>

                    {/* Streak Badge */}
                    <span className="text-[10px] font-bold bg-[#EFE7DA] text-[#A35C33] group-hover:bg-[#422817] group-hover:text-[#C48B47] px-1.5 py-0.5 rounded-md flex items-center gap-0.5 border border-[#D8C8B0]">
                      <Flame className="w-3 h-3 text-[#A35C33]" />
                      {streak}
                    </span>

                    <ChevronDown className={`w-3.5 h-3.5 text-[#2D1B0F]/60 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* User Profile Dropdown Menu */}
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#F8F4EC] border-2 border-[#D8C8B0] shadow-xl p-2 z-50 animate-slide-down text-[#2D1B0F]">
                      <div className="p-3 bg-[#EFE7DA] rounded-xl border border-[#D8C8B0]/60 mb-2">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-sm text-[#2D1B0F] truncate">{displayName}</p>
                          {isAdmin ? (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-400">
                              {officerTitle}
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#A35C33] text-white">
                              Member
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#2D1B0F]/70 truncate mt-0.5">{user?.phone_number || user?.email || ''}</p>
                      </div>

                      {/* Top Highlighted Admin Portal Link for Officers */}
                      {isAdmin && (
                        <div className="mb-2 space-y-1">
                          <NavLink
                            to="/admin-portal"
                            onClick={() => setIsUserDropdownOpen(false)}
                            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-amber-950 bg-amber-200 hover:bg-amber-300 border border-amber-400 shadow-xs transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-amber-800" />
                              <span>🛡️ Admin Portal</span>
                            </div>
                            <span className="text-[9px] font-extrabold uppercase bg-amber-300 text-amber-900 px-1.5 py-0.5 rounded border border-amber-500/40">
                              Desk
                            </span>
                          </NavLink>

                          {/* Show Django Admin access ONLY for the President / Superuser */}
                          {user?.is_superuser && (
                            <a
                              href="http://localhost:8000/admin/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-semibold text-[#A35C33] hover:bg-[#EFE7DA] transition-colors"
                            >
                              <div className="flex items-center gap-1.5">
                                <ExternalLink className="w-3.5 h-3.5 text-[#C48B47]" />
                                <span>Django Admin</span>
                              </div>
                            </a>
                          )}

                          <div className="my-1 border-t border-[#D8C8B0]/60" />
                        </div>
                      )}

                      {/* Open Full Profile Page */}
                      <NavLink
                        to="/profile"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#2D1B0F] hover:bg-[#EFE7DA] transition-colors cursor-pointer"
                      >
                        <User className="w-4 h-4 text-[#A35C33]" />
                        <span>View Member Profile</span>
                      </NavLink>

                      <div className="my-1 border-t border-[#D8C8B0]/60" />

                      {/* Sign Out Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                type="button"
                className="lg:hidden p-2 rounded-xl text-[#2D1B0F] hover:bg-[#EFE7DA] transition-colors focus:outline-none focus:ring-2 focus:ring-[#A35C33]"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6 text-[#A35C33]" />
                ) : (
                  <Menu className="w-6 h-6 text-[#2D1B0F]" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tri-Tab Authentication & Student Intake Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalTab}
      />

      {/* Member Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Mobile Drawer Overlay & Content */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop Blur overlay */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-[#2D1B0F]/50 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
          />

          {/* Drawer Container */}
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-[#F8F4EC] shadow-2xl border-l-2 border-[#D8C8B0] flex flex-col justify-between p-6 z-50 transform transition-transform duration-300 animate-slide-down">
            <div className="space-y-5">
              {/* Mobile Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b-2 border-[#D8C8B0]">
                <NavLink to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center">
                  <img src="/logo.png" alt="Chapters and Chats" className="h-8 w-auto object-contain" />
                </NavLink>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-[#2D1B0F]/70 hover:bg-[#EFE7DA] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Banner or Guest Info */}
              {user ? (
                <div className="p-3.5 rounded-2xl bg-[#EFE7DA] border-2 border-[#D8C8B0] space-y-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-[#C48B47] bg-[#A35C33]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-[#2D1B0F] truncate">{displayName}</h4>
                        {isAdmin && (
                          <span className="text-[9px] font-extrabold uppercase bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded border border-amber-400">
                            {officerTitle}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#2D1B0F]/70 truncate">{user?.phone_number || user?.email || ''}</p>
                    </div>
                  </div>
                  <div className="pt-1 flex items-center justify-between text-xs font-bold border-t border-[#D8C8B0]/60">
                    <span className="flex items-center gap-1 text-[#A35C33]">
                      <Flame className="w-3.5 h-3.5 fill-[#A35C33]" />
                      {streak} Meeting Streak
                    </span>
                    <span className="text-[#2D1B0F]/80">{user?.total_xp ?? 0} XP</span>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-[#EFE7DA] border-2 border-[#D8C8B0] text-[#2D1B0F] flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-[#A35C33] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#A35C33]">Guest Visitor</h4>
                    <p className="text-xs font-medium text-[#2D1B0F] mt-0.5">Tuesday Reviews @ 12:30 PM</p>
                    <p className="text-[10px] text-[#2D1B0F]/70 mt-1">
                      Sign in or apply for membership to track your reading.
                    </p>
                  </div>
                </div>
              )}

              {/* Mobile Navigation Links */}
              <nav className="space-y-1.5">
                {mobileNavLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                          isActive
                            ? 'bg-[#2D1B0F] text-[#FFF8EE] shadow-inner font-bold'
                            : 'text-[#2D1B0F] hover:bg-[#EFE7DA]'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-3">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-[#C48B47]' : 'text-[#A35C33]'}`} />
                            <span>{link.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {link.badge && (
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                link.badge === 'Admin'
                                  ? 'bg-amber-200 text-amber-900 border-amber-400'
                                  : 'bg-[#EFE7DA] text-[#A35C33] border-[#D8C8B0]'
                              }`}>
                                {link.badge}
                              </span>
                            )}
                            <ChevronRight className={`w-4 h-4 ${isActive ? 'text-[#C48B47]' : 'text-[#2D1B0F]/40'}`} />
                          </div>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Mobile Footer CTAs */}
            <div className="pt-4 border-t-2 border-[#D8C8B0] space-y-2.5">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenCheckIn();
                }}
                type="button"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#A35C33] text-white font-bold text-xs sm:text-sm shadow-md hover:bg-[#8B4C28] transition-all duration-200 border border-[#6E3618]"
              >
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>Perform Tuesday Check-In</span>
              </button>

              {!user ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openAuth('member')}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border-2 border-[#D8C8B0] text-[#2D1B0F] font-bold text-xs hover:bg-[#EFE7DA] transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5 text-[#A35C33]" />
                    <span>Sign In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openAuth('register')}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#2D1B0F] text-[#C48B47] border border-[#C48B47]/50 font-bold text-xs hover:bg-[#1A0E06] transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C48B47]" />
                    <span>Join Club</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {isAdmin && (
                    <NavLink
                      to="/admin-portal"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-200 border border-amber-400 text-amber-900 font-bold text-xs shadow-xs"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-800" />
                      <span>Executive Hub Desk</span>
                    </NavLink>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <NavLink
                      to="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border-2 border-[#D8C8B0] text-[#2D1B0F] font-bold text-xs hover:bg-[#EFE7DA]"
                    >
                      <User className="w-3.5 h-3.5 text-[#A35C33]" />
                      <span>Profile</span>
                    </NavLink>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        logout();
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border-2 border-rose-200 bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

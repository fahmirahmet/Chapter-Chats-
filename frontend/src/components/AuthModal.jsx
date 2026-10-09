import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  User, 
  Shield, 
  Lock, 
  Eye,
  EyeOff,
  Phone, 
  GraduationCap, 
  Building2, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  ExternalLink,
  Send,
  LogIn,
  KeyRound,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { cleanPhoneDigits, formatE164Phone } from '../utils/phone';

export default function AuthModal({ isOpen, onClose, initialTab = 'member' }) {
  const navigate = useNavigate();
  const { 
    user,
    login, 
    verifyCode, 
    sendVerificationCode, 
    resetPasswordRequest, 
    resetPasswordConfirm, 
    refreshProfile, 
    updateUser 
  } = useAuth();

  const [activeTab, setActiveTab] = useState(initialTab); // 'member' | 'login' | 'admin' | 'register' | 'forgot' | 'verify'
  const [showPassword, setShowPassword] = useState(false);

  // Member Login Form State
  const [memberForm, setMemberForm] = useState({ phone: '', password: '' });
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState(null);

  // Admin Login Form State
  const [adminForm, setAdminForm] = useState({ phone: '', password: '' });
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState(null);

  // Apply / Registration Form State
  const [applyForm, setApplyForm] = useState({
    full_name: '',
    year_of_study: '2nd Year (Sophomore)',
    phone_number: '',
    department: '',
    favorite_book: 'Ethiopian Literature',
    password: '',
    confirm_password: '',
    policy_agreed: false
  });
  const [showApplyPassword, setShowApplyPassword] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState(null);
  const [applySuccess, setApplySuccess] = useState(false);

  // Telegram Verification State
  const [verifyPhone, setVerifyPhone] = useState('');
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState(null);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState(null);
  const [telegramDetails, setTelegramDetails] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);

  // Forgot Password State
  const [forgotStep, setForgotStep] = useState('phone'); // 'phone' | 'verify' | 'done'
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotTelegram, setForgotTelegram] = useState(null);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(null);
  const [forgotError, setForgotError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setShowPassword(false);
      setShowApplyPassword(false);
      setMemberError(null);
      setAdminError(null);
      setApplyError(null);
      setForgotError(null);
      setForgotSuccess(null);
      setForgotStep('phone');
      setVerifyError(null);
      setVerifySuccess(false);
      setVerifyMessage(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Handle Member Login
  const handleMemberLogin = async (e) => {
    e.preventDefault();
    const cleanDigits = cleanPhoneDigits(memberForm.phone);
    if (!cleanDigits) {
      setMemberError('Please enter your 9-digit registered phone number.');
      return;
    }
    if (cleanDigits.length !== 9) {
      setMemberError('Please enter a valid 9-digit Ethiopian phone number (e.g., 9XXXXXXXX).');
      return;
    }
    if (!memberForm.password) {
      setMemberError('Please enter your account password.');
      return;
    }

    setMemberLoading(true);
    setMemberError(null);

    const formattedPhone = `+251${cleanDigits}`;
    const result = await login(formattedPhone, memberForm.password, false);
    setMemberLoading(false);

    if (result?.success) {
      onClose();
    } else {
      setMemberError(result?.error || 'Invalid credentials. Please verify your phone number and password.');
    }
  };

  // Handle Admin Portal Login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    const cleanDigits = cleanPhoneDigits(adminForm.phone);
    if (!cleanDigits) {
      setAdminError('Please enter your 9-digit registered phone number.');
      return;
    }
    if (cleanDigits.length !== 9) {
      setAdminError('Please enter a valid 9-digit Ethiopian phone number (e.g., 9XXXXXXXX).');
      return;
    }
    if (!adminForm.password) {
      setAdminError('Please enter your officer password.');
      return;
    }

    setAdminLoading(true);
    setAdminError(null);

    const formattedPhone = `+251${cleanDigits}`;
    const result = await login(formattedPhone, adminForm.password, true);
    setAdminLoading(false);

    if (result?.success) {
      onClose();
      navigate('/admin-portal');
    } else {
      setAdminError(result?.error || 'Access restricted to executive officers.');
    }
  };

  // Handle Student Membership Application / Registration
  const handleApplySubmit = async (e) => {
    e.preventDefault();
    const cleanDigits = cleanPhoneDigits(applyForm.phone_number);
    if (!applyForm.full_name.trim() || !cleanDigits) {
      setApplyError('Please fill in all required fields (Full Name and Phone Number).');
      return;
    }
    if (cleanDigits.length !== 9) {
      setApplyError('Please enter a valid 9-digit Ethiopian phone number (e.g., 9XXXXXXXX).');
      return;
    }

    if (!applyForm.password || applyForm.password.length < 6) {
      setApplyError('Password must be at least 6 characters long.');
      return;
    }

    if (applyForm.password !== applyForm.confirm_password) {
      setApplyError('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (!applyForm.policy_agreed) {
      setApplyError('You must read and agree to the Member Code of Conduct to submit your application.');
      return;
    }

    setApplyLoading(true);
    setApplyError(null);

    try {
      const formattedPhone = `+251${cleanDigits}`;
      const payload = {
        full_name: applyForm.full_name.trim(),
        phone_number: formattedPhone,
        year_of_study: applyForm.year_of_study,
        department: applyForm.department.trim(),
        favorite_book: applyForm.favorite_book.trim(),
        password: applyForm.password,
        policy_agreed: true
      };

      const res = await apiClient.post('/accounts/apply/', payload);
      if (res.data) {
        setVerifyPhone(formattedPhone);
        setTelegramDetails(res.data.telegram || null);

        // Store tokens if provided
        if (res.data.access) {
          localStorage.setItem('access_token', res.data.access);
          if (res.data.refresh) localStorage.setItem('refresh_token', res.data.refresh);
          if (res.data.user) {
            localStorage.setItem('user', JSON.stringify(res.data.user));
            if (updateUser) updateUser(res.data.user);
          }
        }

        if (res.data.user?.is_verified) {
          if (refreshProfile) await refreshProfile();
          setApplySuccess(true);
        } else {
          // Switch to Telegram verification step
          setActiveTab('verify');
        }
      }
    } catch (err) {
      console.error('Membership apply error:', err);
      const errorMsg = err.response?.data?.detail ||
        (typeof err.response?.data === 'object' ? Object.values(err.response.data).flat().join(' ') : null) ||
        'Failed to submit membership application. Please check your information and try again.';
      setApplyError(errorMsg);
    } finally {
      setApplyLoading(false);
    }
  };

  // Handle Telegram Verification Code Submit
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    const cleanCode = verifyCodeInput.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setVerifyError('Please enter the 6-digit verification code received on Telegram.');
      return;
    }

    setVerifyLoading(true);
    setVerifyError(null);

    const result = await verifyCode(verifyPhone, cleanCode);
    setVerifyLoading(false);

    if (result.success) {
      setVerifySuccess(true);
      if (refreshProfile) await refreshProfile();
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setVerifyError(result.error || 'Invalid or expired verification code.');
    }
  };

  // Re-dispatch Telegram Code
  const handleResendCode = async () => {
    if (!verifyPhone) return;
    setResendLoading(true);
    setVerifyError(null);
    setVerifyMessage(null);

    const result = await sendVerificationCode(verifyPhone);
    setResendLoading(false);

    if (result.success) {
      setTelegramDetails(result.data?.telegram || null);
      setVerifyMessage('New 6-digit verification code dispatched via Telegram!');
    } else {
      setVerifyError(result.error || 'Failed to dispatch new Telegram code.');
    }
  };

  // Forgot Password: Request Code
  const handleForgotRequest = async (e) => {
    e.preventDefault();
    const cleanDigits = cleanPhoneDigits(forgotPhone);
    if (!cleanDigits) {
      setForgotError('Please enter your 9-digit registered phone number.');
      return;
    }
    if (cleanDigits.length !== 9) {
      setForgotError('Please enter a valid 9-digit Ethiopian phone number (e.g., 9XXXXXXXX).');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);

    const formattedPhone = `+251${cleanDigits}`;
    const result = await resetPasswordRequest(formattedPhone);
    setForgotLoading(false);

    if (result.success) {
      setForgotTelegram(result.data?.telegram || null);
      setForgotStep('verify');
    } else {
      setForgotError(result.error || 'Unable to dispatch Telegram reset code.');
    }
  };

  // Forgot Password: Confirm Code & Reset Password
  const handleForgotConfirm = async (e) => {
    e.preventDefault();
    const cleanCode = forgotCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setForgotError('Please enter the 6-digit verification code received on Telegram.');
      return;
    }

    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setForgotError('Password must be at least 6 characters long.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match. Please re-enter.');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);

    const formattedPhone = formatE164Phone(forgotPhone);
    const result = await resetPasswordConfirm(formattedPhone, cleanCode, forgotNewPassword);
    setForgotLoading(false);

    if (result.success) {
      setForgotStep('done');
      setForgotSuccess(result.message || 'Password updated successfully!');
    } else {
      setForgotError(result.error || 'Failed to reset password. Check your verification code.');
    }
  };

  const modalContent = (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
    >
      {/* Modal Card */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#F8F4EC] rounded-2xl shadow-2xl border-2 border-[#D8C8B0] overflow-hidden z-10 flex flex-col my-auto max-h-[92vh] animate-slide-down"
      >
        
        {/* Header with Navigation Tabs */}
        <div className="bg-[#2D1B0F] text-[#F8F4EC] p-5 sm:p-6 border-b-2 border-[#C48B47]/40 relative">
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-4 p-2 rounded-full text-[#EFE7DA]/70 hover:text-white hover:bg-[#422817] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#A35C33] flex items-center justify-center border border-[#C48B47]/50 shadow-sm shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-white">
                Chapters <span className="text-[#C48B47]">&amp;</span> Chats
              </h2>
              <p className="text-xs text-[#EFE7DA]/70">
                Literary Community • Reading Sprints • In-Person Reviews
              </p>
            </div>
          </div>

          {/* Tri-Tab Selectors */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#1A0E06]/80 rounded-2xl border border-[#D8C8B0]/20">
            <button
              type="button"
              onClick={() => { setActiveTab('member'); setApplySuccess(false); setForgotError(null); setForgotSuccess(null); }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'member' || activeTab === 'login' || activeTab === 'forgot' || activeTab === 'verify'
                  ? 'bg-[#A35C33] text-white shadow-md'
                  : 'text-[#EFE7DA]/80 hover:text-white hover:bg-[#342013]'
              }`}
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {activeTab === 'forgot' ? 'Recovery' : activeTab === 'verify' ? 'Verification' : 'Member Sign In'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('admin'); setApplySuccess(false); }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-[#C48B47] text-[#2D1B0F] shadow-md'
                  : 'text-[#EFE7DA]/80 hover:text-white hover:bg-[#342013]'
              }`}
            >
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Admin Portal</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('register'); setApplySuccess(false); }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-[#5C3B1E] text-white shadow-md'
                  : 'text-[#EFE7DA]/80 hover:text-white hover:bg-[#342013]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#C48B47]" />
              <span className="truncate">Apply to Join</span>
            </button>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1">
          
          {/* TAB 1: MEMBER SIGN IN */}
          {(activeTab === 'member' || activeTab === 'login') && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-xl text-[#2D1B0F]">
                  Welcome Back, Reader
                </h3>
                <p className="text-xs text-[#2D1B0F]/70">
                  Sign in with your registered phone number to log reading progress and check in.
                </p>
              </div>

              {memberError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{memberError}</span>
                </div>
              )}

              <form onSubmit={handleMemberLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1.5">
                    Phone Number
                  </label>
                  <div className="flex rounded-xl border-2 border-[#D8C8B0] bg-white overflow-hidden focus-within:border-[#A35C33] transition-colors">
                    <span className="inline-flex items-center px-3.5 py-2.5 bg-[#EFE7DA] text-[#2D1B0F] font-bold text-xs sm:text-sm border-r-2 border-[#D8C8B0] select-none tracking-wider">
                      +251
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={9}
                      required
                      autoComplete="tel"
                      value={memberForm.phone}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, phone: cleanPhoneDigits(e.target.value) }))}
                      placeholder="9XXXXXXXX"
                      className="w-full px-3.5 py-2.5 bg-transparent text-xs sm:text-sm text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:outline-none font-medium tracking-wide"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#A35C33] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={memberForm.password}
                      onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-3 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs sm:text-sm text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:border-[#A35C33] focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C6D53] hover:text-[#2D1B0F] transition-colors p-1 cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPhone(cleanPhoneDigits(memberForm.phone || ''));
                      setForgotError(null);
                      setForgotSuccess(null);
                      setForgotStep('phone');
                      setActiveTab('forgot');
                    }}
                    className="text-[#A35C33] hover:text-[#8B4C28] font-bold transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="text-xs font-bold text-[#A35C33] hover:underline cursor-pointer order-2 sm:order-1"
                  >
                    Not a member yet? Apply to join
                  </button>

                  <button
                    type="submit"
                    disabled={memberLoading}
                    className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#A35C33] hover:bg-[#8B4C28] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 order-1 sm:order-2"
                  >
                    {memberLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Sign In as Member</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: TELEGRAM VERIFICATION CODE */}
          {activeTab === 'verify' && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#EFE7DA] border border-[#D8C8B0] flex items-center justify-center mx-auto text-[#A35C33] shadow-xs">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-xl text-[#2D1B0F]">
                  Verify Your Phone via Telegram
                </h3>
                <p className="text-xs text-[#2D1B0F]/70 max-w-sm mx-auto">
                  A 6-digit activation code was dispatched to <strong>{verifyPhone}</strong> via Telegram.
                </p>
              </div>

              {/* Telegram Instructions & Bot Link */}
              <div className="p-4 rounded-2xl bg-[#EFE7DA] border border-[#D8C8B0] space-y-2.5 text-xs text-[#5C3B1E]">
                <p className="font-semibold text-[#2D1B0F]">
                  1. Start a quick chat with our Telegram verification bot:
                </p>
                <a
                  href={telegramDetails?.bot_url || telegramDetails?.bot_link || `https://t.me/chapter_and_chats_bot?start=${encodeURIComponent(verifyPhone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2D1B0F] text-[#FFF8EE] font-bold text-xs hover:bg-[#A35C33] transition-colors"
                >
                  <span>Open Telegram Bot</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#C48B47]" />
                </a>
                <p className="text-[11px] text-[#A35C33] font-medium">
                  Tap 'Start' in Telegram to receive your 6-digit code instantly.
                </p>
                {telegramDetails?.dev_code && (
                  <div className="text-[11px] font-mono text-[#A35C33] bg-white/70 px-2.5 py-1 rounded-lg border border-[#D8C8B0]">
                    Local Development Code: <strong>{telegramDetails.dev_code}</strong>
                  </div>
                )}
              </div>

              {verifyMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{verifyMessage}</span>
                </div>
              )}

              {verifyError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}

              {verifySuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="font-serif font-bold text-base">Account Verified Successfully!</h4>
                  <p className="text-xs text-emerald-800">Welcome to Chapter &amp; Chats. Opening your reading lounge...</p>
                </div>
              ) : (
                <form onSubmit={handleVerifySubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#2D1B0F] mb-1.5 text-center">
                      Enter 6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={verifyCodeInput}
                      onChange={(e) => setVerifyCodeInput(e.target.value)}
                      placeholder="123456"
                      className="w-full text-center tracking-widest text-2xl font-mono py-3.5 bg-white border-2 border-[#D8C8B0] rounded-xl text-[#2D1B0F] focus:border-[#A35C33] focus:outline-none font-bold"
                    />
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={resendLoading}
                      className="text-xs font-bold text-[#A35C33] hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {resendLoading ? 'Re-sending...' : 'Resend Code via Telegram'}
                    </button>

                    <button
                      type="submit"
                      disabled={verifyLoading}
                      className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#A35C33] hover:bg-[#8B4C28] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {verifyLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Activating Account...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Verify &amp; Enter Lounge</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB: FORGOT PASSWORD */}
          {activeTab === 'forgot' && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A35C33]/15 text-[#A35C33] text-[10px] font-extrabold uppercase tracking-wider border border-[#A35C33]/30 mb-1">
                  <KeyRound className="w-3.5 h-3.5 text-[#A35C33]" />
                  Telegram Account Recovery
                </div>
                <h3 className="font-serif font-bold text-xl text-[#2D1B0F]">
                  Reset Your Password
                </h3>
                <p className="text-xs text-[#2D1B0F]/70">
                  {forgotStep === 'phone' && 'Enter your phone number to receive a 6-digit Telegram recovery code.'}
                  {forgotStep === 'verify' && 'Enter the 6-digit code and set your new password.'}
                  {forgotStep === 'done' && 'Your credentials have been securely updated!'}
                </p>
              </div>

              {forgotError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{forgotError}</span>
                </div>
              )}

              {/* Forgot Step 1: Phone */}
              {forgotStep === 'phone' && (
                <form onSubmit={handleForgotRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#2D1B0F] mb-1.5">
                      Registered Phone Number
                    </label>
                    <div className="flex rounded-xl border-2 border-[#D8C8B0] bg-white overflow-hidden focus-within:border-[#A35C33] transition-colors">
                      <span className="inline-flex items-center px-3.5 py-2.5 bg-[#EFE7DA] text-[#2D1B0F] font-bold text-xs sm:text-sm border-r-2 border-[#D8C8B0] select-none tracking-wider">
                        +251
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={9}
                        required
                        value={forgotPhone}
                        onChange={(e) => setForgotPhone(cleanPhoneDigits(e.target.value))}
                        placeholder="9XXXXXXXX"
                        className="w-full px-3.5 py-2.5 bg-transparent text-xs sm:text-sm text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:outline-none font-medium tracking-wide"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('member')}
                      className="text-xs font-bold text-[#A35C33] hover:underline cursor-pointer order-2 sm:order-1"
                    >
                      ← Back to Sign In
                    </button>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#A35C33] hover:bg-[#8B4C28] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 order-1 sm:order-2"
                    >
                      {forgotLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#C48B47]" />
                          <span>Sending Code...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Telegram Code</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Forgot Step 2: 6-Digit Code & New Password */}
              {forgotStep === 'verify' && (
                <form onSubmit={handleForgotConfirm} className="space-y-4" autoComplete="off">
                  <div className="p-3.5 rounded-2xl bg-[#EFE7DA] border border-[#D8C8B0] space-y-2 text-xs text-[#5C3B1E]">
                    <div className="flex items-center gap-2 font-bold text-[#2D1B0F]">
                      <MessageSquare className="w-4 h-4 text-[#A35C33]" />
                      <span>Code Dispatched via Telegram</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Sent to <strong>{formatE164Phone(forgotPhone)}</strong>. If you haven't yet, start a chat with our bot:
                    </p>
                    <a
                      href={forgotTelegram?.bot_url || forgotTelegram?.bot_link || `https://t.me/chapter_and_chats_bot?start=${encodeURIComponent(formatE164Phone(forgotPhone))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2D1B0F] text-[#FFF8EE] text-[11px] font-bold hover:bg-[#A35C33] transition-colors"
                    >
                      <span>Open Telegram Bot</span>
                      <ExternalLink className="w-3 h-3 text-[#C48B47]" />
                    </a>
                    <p className="text-[11px] text-[#A35C33] font-medium">
                      Tap 'Start' in Telegram to receive your 6-digit code instantly.
                    </p>
                    {forgotTelegram?.dev_code && (
                      <div className="text-[11px] font-mono text-[#A35C33] bg-white/70 px-2 py-0.5 rounded border border-[#D8C8B0]">
                        Local Dev Code: <strong>{forgotTelegram.dev_code}</strong>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                      6-Digit Telegram Code *
                    </label>
                    <input
                      id="forgot-code-input"
                      name="telegram_recovery_code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="one-time-code"
                      maxLength={6}
                      required
                      value={forgotCode}
                      onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      className="w-full text-center tracking-widest text-lg font-mono py-2.5 bg-white border-2 border-[#D8C8B0] rounded-xl text-[#2D1B0F] focus:border-[#A35C33] focus:outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                      New Password *
                    </label>
                    <input
                      id="forgot-new-password"
                      name="new_password"
                      autoComplete="new-password"
                      type="password"
                      required
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full px-3.5 py-2.5 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs sm:text-sm text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:border-[#A35C33] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                      Confirm New Password *
                    </label>
                    <input
                      id="forgot-confirm-password"
                      name="confirm_new_password"
                      autoComplete="new-password"
                      type="password"
                      required
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full px-3.5 py-2.5 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs sm:text-sm text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:border-[#A35C33] focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setForgotStep('phone')}
                      className="text-xs font-bold text-[#A35C33] hover:underline cursor-pointer order-2 sm:order-1"
                    >
                      ← Change Phone
                    </button>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#A35C33] hover:bg-[#8B4C28] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 order-1 sm:order-2"
                    >
                      {forgotLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#C48B47]" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Update Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Forgot Step 3: Done */}
              {forgotStep === 'done' && (
                <div className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-center space-y-4">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-serif font-bold text-lg text-emerald-950">Password Successfully Updated!</h4>
                  <p className="text-xs text-emerald-800">You can now sign in with your new password.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('member')}
                    className="w-full py-3 rounded-xl bg-[#2D1B0F] text-[#FFF8EE] font-bold text-xs hover:bg-[#1A0E06] transition-colors"
                  >
                    Proceed to Member Sign In
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADMIN PORTAL */}
          {activeTab === 'admin' && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C48B47]/20 text-[#A35C33] text-[10px] font-extrabold uppercase tracking-wider border border-[#C48B47]/40 mb-1">
                  <Shield className="w-3.5 h-3.5 text-[#C48B47]" />
                  Executive &amp; Staff Sign In
                </div>
                <h3 className="font-serif font-bold text-xl text-[#2D1B0F]">
                  Club Administration &amp; Operations
                </h3>
                <p className="text-xs text-[#2D1B0F]/70">
                  Authenticate with authorized administrative phone number or username to manage cycles and member rosters.
                </p>
              </div>

              {adminError && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1.5">
                    Phone Number
                  </label>
                  <div className="flex rounded-xl border-2 border-[#D8C8B0] bg-white overflow-hidden focus-within:border-[#C48B47] transition-colors">
                    <span className="inline-flex items-center px-3.5 py-2.5 bg-[#EFE7DA] text-[#2D1B0F] font-bold text-xs sm:text-sm border-r-2 border-[#D8C8B0] select-none tracking-wider">
                      +251
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={9}
                      required
                      autoComplete="tel"
                      value={adminForm.phone}
                      onChange={(e) => setAdminForm(prev => ({ ...prev, phone: cleanPhoneDigits(e.target.value) }))}
                      placeholder="9XXXXXXXX"
                      className="w-full px-3.5 py-2.5 bg-transparent text-xs sm:text-sm text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:outline-none font-medium tracking-wide"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1.5">
                    Admin Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#C48B47] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-3 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs sm:text-sm text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:border-[#C48B47] focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C6D53] hover:text-[#2D1B0F] transition-colors p-1 cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPhone(cleanPhoneDigits(adminForm.phone || ''));
                      setForgotError(null);
                      setForgotSuccess(null);
                      setForgotStep('phone');
                      setActiveTab('forgot');
                    }}
                    className="text-[#C48B47] hover:text-[#A35C33] font-bold transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  {/* Show Django Admin access ONLY for the President / Superuser */}
                  {user?.is_superuser && (
                    <a
                      href="http://localhost:8000/admin/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[#A35C33] hover:underline flex items-center gap-1 cursor-pointer order-2 sm:order-1"
                    >
                      <span>Django Admin</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    type="submit"
                    disabled={adminLoading}
                    className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#2D1B0F] hover:bg-[#1A0E06] text-[#C48B47] border border-[#C48B47] font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 order-1 sm:order-2 sm:ml-auto"
                  >
                    {adminLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#C48B47]" />
                        <span>Verifying Admin...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 text-[#C48B47]" />
                        <span>Authenticate Officer</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: APPLY / REGISTER TO JOIN */}
          {activeTab === 'register' && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-xl text-[#2D1B0F]">
                  Apply for Chapter &amp; Chats Membership
                </h3>
                <p className="text-xs text-[#2D1B0F]/70">
                  Join our active reading cohort, participate in Tuesday meetups, and unlock digital sprints.
                </p>
              </div>

              {applySuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 space-y-4 text-center animate-fade-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto text-emerald-700">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-serif font-bold text-lg text-emerald-900">
                      Application Received!
                    </h4>
                    <p className="text-xs font-medium text-emerald-800 leading-relaxed max-w-md mx-auto">
                      Application received! An executive officer will review your application before the next Tuesday meetup.
                    </p>
                  </div>
                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setApplySuccess(false)}
                      className="px-5 py-2.5 rounded-xl border border-emerald-400 bg-white text-emerald-800 font-bold text-xs hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      Submit Another
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2.5 rounded-xl bg-emerald-800 text-white font-bold text-xs hover:bg-emerald-900 transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} className="space-y-4">
                  {applyError && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 animate-shake">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{applyError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={applyForm.full_name}
                        onChange={(e) => setApplyForm({ ...applyForm, full_name: e.target.value })}
                        placeholder="e.g. Amina Bekele"
                        className="w-full px-3.5 py-2.5 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:border-[#A35C33] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
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
                          value={applyForm.phone_number}
                          onChange={(e) => setApplyForm(prev => ({ ...prev, phone_number: cleanPhoneDigits(e.target.value) }))}
                          placeholder="9XXXXXXXX"
                          className="w-full px-3 py-2 bg-transparent text-xs text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:outline-none font-medium tracking-wide"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                        Year of Study *
                      </label>
                      <select
                        value={applyForm.year_of_study}
                        onChange={(e) => setApplyForm({ ...applyForm, year_of_study: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:border-[#A35C33] focus:outline-none cursor-pointer"
                      >
                        <option value="1st Year (Freshman)">1st Year (Freshman)</option>
                        <option value="2nd Year (Sophomore)">2nd Year (Sophomore)</option>
                        <option value="3rd Year (Junior)">3rd Year (Junior)</option>
                        <option value="4th Year (Senior)">4th Year (Senior)</option>
                        <option value="5th Year / Grad / Alumni">5th Year / Grad / Alumni</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                        Academic Department
                      </label>
                      <input
                        type="text"
                        value={applyForm.department}
                        onChange={(e) => setApplyForm({ ...applyForm, department: e.target.value })}
                        placeholder="e.g. Software Engineering"
                        className="w-full px-3.5 py-2.5 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:border-[#A35C33] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                      Favorite Book / Genre
                    </label>
                    <input
                      type="text"
                      value={applyForm.favorite_book}
                      onChange={(e) => setApplyForm({ ...applyForm, favorite_book: e.target.value })}
                      placeholder="e.g. Fikir Eske Mekabir"
                      className="w-full px-3.5 py-2.5 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:border-[#A35C33] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                        Create Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showApplyPassword ? "text" : "password"}
                          required
                          value={applyForm.password}
                          onChange={(e) => setApplyForm({ ...applyForm, password: e.target.value })}
                          placeholder="Min. 6 characters"
                          className="w-full pl-3.5 pr-10 py-2.5 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:border-[#A35C33] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApplyPassword(prev => !prev)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C6D53] hover:text-[#2D1B0F] transition-colors p-1 cursor-pointer"
                          aria-label={showApplyPassword ? "Hide password" : "Show password"}
                        >
                          {showApplyPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showApplyPassword ? "text" : "password"}
                          required
                          value={applyForm.confirm_password}
                          onChange={(e) => setApplyForm({ ...applyForm, confirm_password: e.target.value })}
                          placeholder="Repeat password"
                          className="w-full pl-3.5 pr-10 py-2.5 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:border-[#A35C33] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Member Code of Conduct Agreement Checkbox */}
                  <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50/60 border-2 border-[#D8C8B0] text-xs text-[#2D1B0F] cursor-pointer hover:border-[#A35C33] transition-colors">
                    <input
                      type="checkbox"
                      required
                      checked={applyForm.policy_agreed}
                      onChange={(e) => setApplyForm({ ...applyForm, policy_agreed: e.target.checked })}
                      className="mt-0.5 rounded border-[#D8C8B0] text-[#A35C33] focus:ring-[#A35C33] cursor-pointer shrink-0"
                    />
                    <span className="leading-relaxed text-[11px] sm:text-xs">
                      I have read and agree to the <strong>Chapter &amp; Chats Member Code of Conduct</strong> (respectful dialogue, spoiler tag enforcement, active reading participation, and zero tolerance for harassment).
                    </span>
                  </label>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveTab('member')}
                      className="text-xs font-bold text-[#A35C33] hover:underline cursor-pointer"
                    >
                      Already a member? Sign in
                    </button>

                    <button
                      type="submit"
                      disabled={applyLoading}
                      className="px-7 py-3 rounded-xl bg-[#A35C33] hover:bg-[#8B4C28] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {applyLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 text-[#C48B47]" />
                          <span>Submit &amp; Verify</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

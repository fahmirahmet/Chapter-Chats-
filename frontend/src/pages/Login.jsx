import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  Phone, 
  Lock, 
  LogIn, 
  ArrowRight, 
  BookOpen, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  Shield, 
  ArrowLeft, 
  KeyRound, 
  CheckCircle2,
  Send,
  Eye,
  EyeOff,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cleanPhoneDigits, formatE164Phone, isValidEthiopianDigits } from '../utils/phone';

export default function Login() {
  const { login, resetPasswordRequest, resetPasswordConfirm } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Phone-based sign in state
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Recovery / Forgot state: 'phone' | 'verify' | 'done'
  const initialMode = searchParams.get('tab') === 'forgot' ? 'forgot' : 'login';
  const [activeTab, setActiveTab] = useState(initialMode);
  const [showForgot, setShowForgot] = useState(initialMode === 'forgot');
  const [forgotStep, setForgotStep] = useState('phone'); // 'phone' | 'verify' | 'done'
  const [forgotPhone, setForgotPhone] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [telegramInfo, setTelegramInfo] = useState(null);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(null);
  const [forgotError, setForgotError] = useState(null);

  const from = location.state?.from?.pathname || (isAdminLogin ? '/admin-portal' : '/');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanDigits = cleanPhoneDigits(phone);
    if (!cleanDigits) {
      setError('Please enter your 9-digit registered phone number.');
      return;
    }
    if (cleanDigits.length !== 9) {
      setError('Please enter a valid 9-digit Ethiopian phone number (e.g., 9XXXXXXXX).');
      return;
    }
    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setIsLoading(true);
    try {
      const formattedPhone = `+251${cleanDigits}`;
      const result = await login(formattedPhone, password, isAdminLogin);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.error || 'Invalid credentials. Please verify your phone number and password.');
      }
    } catch (err) {
      setError('An unexpected error occurred during sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetCode = async (e) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

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
    try {
      const formattedPhone = `+251${cleanDigits}`;
      const result = await resetPasswordRequest(formattedPhone);
      if (result.success) {
        setTelegramInfo(result.data?.telegram || null);
        setForgotStep('verify');
      } else {
        setForgotError(result.error || 'Unable to dispatch Telegram reset code. Please check your phone number.');
      }
    } catch (err) {
      setForgotError('An unexpected error occurred. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setForgotError(null);

    const cleanCode = resetCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setForgotError('Please enter the 6-digit verification code received on Telegram.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match. Please re-enter.');
      return;
    }

    setForgotLoading(true);
    try {
      const formattedPhone = formatE164Phone(forgotPhone);
      const result = await resetPasswordConfirm(formattedPhone, cleanCode, newPassword);
      if (result.success) {
        setForgotStep('done');
        setForgotSuccess(result.message || 'Your password has been successfully updated.');
      } else {
        setForgotError(result.error || 'Failed to reset password. Please check your verification code.');
      }
    } catch (err) {
      setForgotError('An error occurred during password reset. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const resetForgotState = () => {
    setActiveTab('login');
    setShowForgot(false);
    setForgotStep('phone');
    setForgotPhone('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setTelegramInfo(null);
    setForgotError(null);
    setForgotSuccess(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-md w-full space-y-8">
        {/* Brand Card Header */}
        <div className="text-center space-y-3">
          <NavLink 
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#A35C33] hover:text-[#2D1B0F] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </NavLink>

          <div className="w-16 h-16 rounded-2xl bg-[#EFE7DA] border-2 border-[#D8C8B0] flex items-center justify-center mx-auto text-[#A35C33] shadow-warm-sm">
            <BookOpen className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-[#EFE7DA] text-[#A35C33] border border-[#D8C8B0] px-3 py-0.5 rounded-full shadow-2xs">
              <Sparkles className="w-3 h-3 text-[#C48B47]" />
              Chapter &amp; Chats Readers Circle
            </span>
            <h1 className="font-serif font-bold text-3xl text-[#2D1B0F] tracking-tight">
              {isAdminLogin ? 'Executive Portal Access' : 'Sign in to your Account'}
            </h1>
            <p className="text-xs sm:text-sm text-[#2D1B0F]/70">
              {isAdminLogin 
                ? 'Officers & administrators sign in with your phone number or staff username.' 
                : 'Enter your registered phone number to access the reading lounge.'}
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white p-7 sm:p-9 rounded-3xl border-2 border-[#D8C8B0] shadow-warm-md space-y-6">
          {(activeTab === 'forgot' || showForgot) ? (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A35C33]/15 text-[#A35C33] text-[10px] font-extrabold uppercase tracking-wider border border-[#A35C33]/30 mb-1">
                  <KeyRound className="w-3.5 h-3.5 text-[#A35C33]" />
                  Telegram Account Recovery
                </div>
                <h2 className="font-serif font-bold text-xl text-[#2D1B0F]">
                  Reset Your Password
                </h2>
                <p className="text-xs text-[#2D1B0F]/70">
                  {forgotStep === 'phone' && 'Enter your phone number to receive a 6-digit Telegram code.'}
                  {forgotStep === 'verify' && 'Enter the 6-digit code received on Telegram and your new password.'}
                  {forgotStep === 'done' && 'Password updated successfully! You can now sign in.'}
                </p>
              </div>

              {forgotError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{forgotError}</span>
                </div>
              )}

              {/* STEP 1: ENTER PHONE NUMBER */}
              {forgotStep === 'phone' && (
                <form onSubmit={handleSendResetCode} className="space-y-4">
                  <div className="space-y-1.5">
                    <label 
                      htmlFor="forgot-phone" 
                      className="block text-xs font-bold text-[#2D1B0F]"
                    >
                      Registered Phone Number
                    </label>
                    <div className="flex rounded-2xl border border-[#D8C8B0] bg-[#F8F4EC] overflow-hidden focus-within:bg-white focus-within:border-[#A35C33] focus-within:ring-2 focus-within:ring-[#A35C33]/20 transition-all">
                      <span className="inline-flex items-center px-3.5 py-3 bg-[#EFE7DA] text-[#2D1B0F] font-bold text-xs sm:text-sm border-r border-[#D8C8B0] select-none tracking-wider">
                        +251
                      </span>
                      <input
                        id="forgot-phone"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={9}
                        required
                        value={forgotPhone}
                        onChange={(e) => setForgotPhone(cleanPhoneDigits(e.target.value))}
                        placeholder="9XXXXXXXX"
                        className="w-full px-3.5 py-3 bg-transparent text-xs sm:text-sm text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:outline-none font-medium tracking-wide"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={resetForgotState}
                      className="text-xs font-bold text-[#A35C33] hover:underline cursor-pointer order-2 sm:order-1"
                    >
                      ← Back to Sign In
                    </button>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#A35C33] hover:bg-[#8B4C28] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 order-1 sm:order-2"
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

              {/* STEP 2: VERIFY CODE & SET NEW PASSWORD */}
              {forgotStep === 'verify' && (
                <form onSubmit={handleConfirmReset} className="space-y-4" autoComplete="off">
                  {/* Telegram Helper Banner */}
                  <div className="p-3.5 rounded-2xl bg-[#EFE7DA] border border-[#D8C8B0] space-y-2 text-xs text-[#5C3B1E]">
                    <div className="flex items-center gap-2 font-bold text-[#2D1B0F]">
                      <MessageSquare className="w-4 h-4 text-[#A35C33]" />
                      <span>Check Your Telegram</span>
                    </div>
                    <p className="leading-relaxed text-[11px]">
                      A 6-digit recovery code was dispatched for <strong>{formatE164Phone(forgotPhone)}</strong>.
                      Make sure you have started a chat with our bot:
                    </p>
                    <a
                      href={telegramInfo?.bot_url || telegramInfo?.bot_link || `https://t.me/chapter_and_chats_bot?start=${encodeURIComponent(formatE164Phone(forgotPhone))}`}
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
                    {telegramInfo?.dev_code && (
                      <div className="mt-1 text-[11px] font-mono text-[#A35C33] bg-white/70 px-2.5 py-1 rounded-lg border border-[#D8C8B0]">
                        Local Dev Code: <strong>{telegramInfo.dev_code}</strong>
                      </div>
                    )}
                  </div>

                  {/* 6-Digit Code Field */}
                  <div className="space-y-1.5">
                    <label 
                      htmlFor="reset-code" 
                      className="block text-xs font-bold text-[#2D1B0F]"
                    >
                      6-Digit Telegram Code *
                    </label>
                    <input
                      id="reset-code"
                      name="telegram_reset_code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="one-time-code"
                      maxLength={6}
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      className="w-full text-center tracking-widest text-lg font-mono py-3 bg-[#F8F4EC] border-2 border-[#D8C8B0] rounded-2xl text-[#2D1B0F] focus:bg-white focus:border-[#A35C33] focus:outline-none transition-all font-bold"
                    />
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label 
                      htmlFor="reset-new-password" 
                      className="block text-xs font-bold text-[#2D1B0F]"
                    >
                      New Password *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#2D1B0F]/40">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="reset-new-password"
                        name="new-password"
                        autoComplete="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        className="w-full pl-10 pr-10 py-3 bg-[#F8F4EC] border border-[#D8C8B0] rounded-2xl text-xs sm:text-sm text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:bg-white focus:border-[#A35C33] focus:outline-none transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#2D1B0F]/40 hover:text-[#2D1B0F] cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label 
                      htmlFor="reset-confirm-password" 
                      className="block text-xs font-bold text-[#2D1B0F]"
                    >
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#2D1B0F]/40">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="reset-confirm-password"
                        name="confirm-password"
                        autoComplete="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full pl-10 pr-4 py-3 bg-[#F8F4EC] border border-[#D8C8B0] rounded-2xl text-xs sm:text-sm text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:bg-white focus:border-[#A35C33] focus:outline-none transition-all font-medium"
                      />
                    </div>
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
                      className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#A35C33] hover:bg-[#8B4C28] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 order-1 sm:order-2"
                    >
                      {forgotLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#C48B47]" />
                          <span>Updating Password...</span>
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

              {/* STEP 3: DONE */}
              {forgotStep === 'done' && (
                <div className="space-y-4 text-center animate-fade-in">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-300">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif font-bold text-lg text-[#2D1B0F]">
                      Password Updated!
                    </h3>
                    <p className="text-xs text-[#2D1B0F]/70">
                      {forgotSuccess || 'Your password has been securely reset. You can now sign in.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetForgotState}
                    className="w-full py-3.5 px-5 rounded-2xl bg-[#2D1B0F] hover:bg-[#1E110A] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 text-[#C48B47]" />
                    <span>Proceed to Sign In</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Member / Admin Mode Pill Toggle */}
              <div className="p-1 bg-[#F8F4EC] rounded-2xl border border-[#D8C8B0] flex items-center">
                <button
                  type="button"
                  onClick={() => { setIsAdminLogin(false); setError(null); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    !isAdminLogin
                      ? 'bg-[#2D1B0F] text-[#FFF8EE] shadow-sm'
                      : 'text-[#2D1B0F]/60 hover:text-[#2D1B0F]'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Reader Login</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setIsAdminLogin(true); setError(null); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isAdminLogin
                      ? 'bg-[#A35C33] text-white shadow-sm'
                      : 'text-[#2D1B0F]/60 hover:text-[#2D1B0F]'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Officer Portal</span>
                </button>
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Phone Number Field */}
                <div className="space-y-1.5">
                  <label 
                    htmlFor="login-phone" 
                    className="block text-xs font-bold text-[#2D1B0F]"
                  >
                    Phone Number
                  </label>
                  <div className="flex rounded-2xl border border-[#D8C8B0] bg-[#F8F4EC] overflow-hidden focus-within:bg-white focus-within:border-[#A35C33] focus-within:ring-2 focus-within:ring-[#A35C33]/20 transition-all">
                    <span className="inline-flex items-center px-3.5 py-3 bg-[#EFE7DA] text-[#2D1B0F] font-bold text-xs sm:text-sm border-r border-[#D8C8B0] select-none tracking-wider">
                      +251
                    </span>
                    <input
                      id="login-phone"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={9}
                      required
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(cleanPhoneDigits(e.target.value))}
                      placeholder="9XXXXXXXX"
                      className="w-full px-3.5 py-3 bg-transparent text-xs sm:text-sm text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:outline-none font-medium tracking-wide"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label 
                      htmlFor="login-password" 
                      className="block text-xs font-bold text-[#2D1B0F]"
                    >
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#2D1B0F]/40">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 bg-[#F8F4EC] border border-[#D8C8B0] rounded-2xl text-xs sm:text-sm text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:bg-white focus:border-[#A35C33] focus:ring-2 focus:ring-[#A35C33]/20 focus:outline-none transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#2D1B0F]/40 hover:text-[#2D1B0F] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('forgot');
                      setShowForgot(true);
                      setForgotPhone(phone || '');
                      setForgotError(null);
                      setForgotSuccess(null);
                      setForgotStep('phone');
                    }}
                    className="text-xs font-bold text-[#A35C33] hover:text-[#8B4C28] transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3.5 px-5 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
                    isAdminLogin 
                      ? 'bg-[#A35C33] hover:bg-[#8B4C28] border border-[#6E3618]'
                      : 'bg-[#2D1B0F] hover:bg-[#1E110A] border border-[#C48B47]/40'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#C48B47]" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4 text-[#C48B47]" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Membership / Registration Prompt */}
          <div className="pt-4 border-t border-[#D8C8B0]/60 text-center space-y-2">
            <p className="text-xs text-[#2D1B0F]/70">
              Not a member of Chapter &amp; Chats yet?
            </p>
            <NavLink
              to="/about#apply"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A35C33] hover:text-[#2D1B0F] transition-colors"
            >
              <span>Submit a Membership Intake Application</span>
              <ArrowRight className="w-3 h-3" />
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}

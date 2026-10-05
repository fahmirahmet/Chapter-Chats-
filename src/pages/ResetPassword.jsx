import React, { useState } from 'react';
import { useSearchParams, useNavigate, NavLink } from 'react-router-dom';
import { 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowLeft, 
  BookOpen, 
  Sparkles, 
  ShieldCheck,
  Phone,
  MessageSquare,
  ExternalLink,
  Send
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { cleanPhoneDigits, formatE164Phone } from '../utils/phone';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPasswordRequest, resetPasswordConfirm } = useAuth();

  const uidb64 = searchParams.get('uidb64');
  const token = searchParams.get('token');
  const initialPhone = cleanPhoneDigits(searchParams.get('phone') || searchParams.get('phone_number') || '');
  const initialCode = (searchParams.get('code') || '').replace(/\D/g, '').slice(0, 6);

  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState(initialCode);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [requestCodeLoading, setRequestCodeLoading] = useState(false);
  const [requestCodeSuccess, setRequestCodeSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [telegramInfo, setTelegramInfo] = useState(null);

  const hasLegacyToken = Boolean(uidb64 && token);

  const handleRequestCode = async () => {
    const cleanDigits = cleanPhoneDigits(phone);
    if (!cleanDigits) {
      setErrorMessage('Please enter your 9-digit registered phone number.');
      return;
    }
    if (cleanDigits.length !== 9) {
      setErrorMessage('Please enter a valid 9-digit Ethiopian phone number (e.g., 9XXXXXXXX).');
      return;
    }
    setRequestCodeLoading(true);
    setErrorMessage(null);
    setRequestCodeSuccess(null);

    const formattedPhone = `+251${cleanDigits}`;
    const result = await resetPasswordRequest(formattedPhone);
    setRequestCodeLoading(false);

    if (result.success) {
      setTelegramInfo(result.data?.telegram || null);
      setRequestCodeSuccess('6-digit reset code dispatched to your Telegram account!');
    } else {
      setErrorMessage(result.error || 'Failed to dispatch Telegram reset code.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your new password.');
      return;
    }

    // Flow 1: Legacy token reset
    if (hasLegacyToken) {
      setIsLoading(true);
      try {
        const res = await apiClient.post('/accounts/password-reset/confirm/', {
          uidb64,
          token,
          new_password: password
        });
        if (res.data) setIsSuccess(true);
      } catch (err) {
        setErrorMessage(err.response?.data?.detail || err.response?.data?.error || 'Failed to reset password. Link may have expired.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Flow 2: Telegram 6-digit code reset
    const cleanDigits = cleanPhoneDigits(phone);
    if (!cleanDigits) {
      setErrorMessage('Please enter your registered phone number.');
      return;
    }
    if (cleanDigits.length !== 9) {
      setErrorMessage('Please enter a valid 9-digit Ethiopian phone number.');
      return;
    }
    if (!code.trim() || code.trim().length < 6) {
      setErrorMessage('Please enter the 6-digit verification code received on Telegram.');
      return;
    }

    setIsLoading(true);
    const formattedPhone = `+251${cleanDigits}`;
    const result = await resetPasswordConfirm(formattedPhone, code.trim(), password);
    setIsLoading(false);

    if (result.success) {
      setIsSuccess(true);
    } else {
      setErrorMessage(result.error || 'Failed to reset password. Please check your verification code.');
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="w-full max-w-md bg-[#F8F4EC] rounded-3xl shadow-2xl border-2 border-[#D8C8B0] overflow-hidden">
        
        {/* Literary Header Ribbon */}
        <div className="bg-[#2D1B0F] text-[#F8F4EC] p-6 text-center border-b-2 border-[#C48B47]/40 relative">
          <div className="w-14 h-14 rounded-2xl bg-[#C48B47] text-[#2D1B0F] flex items-center justify-center mx-auto mb-3 shadow-md">
            <KeyRound className="w-7 h-7 text-[#2D1B0F]" />
          </div>
          <h1 className="font-serif font-bold text-2xl text-white">
            Choose New Password
          </h1>
          <p className="text-xs text-[#EFE7DA]/75 mt-1">
            Chapter &amp; Chats • Telegram Recovery Portal
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {isSuccess ? (
            <div className="text-center space-y-5 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              
              <div className="space-y-1.5">
                <h2 className="font-serif font-bold text-xl text-[#2D1B0F]">
                  Password Reset Successfully!
                </h2>
                <p className="text-xs text-[#2D1B0F]/70 leading-relaxed">
                  Your credentials have been securely updated. You can now sign in with your phone number and new password.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#EFE7DA] border border-[#D8C8B0] text-xs font-semibold text-[#5C3B1E] flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-[#A35C33]" />
                <span>Ready to dive back into Chapter &amp; Chats</span>
              </div>

              <NavLink
                to="/login"
                className="w-full py-3.5 px-4 rounded-xl bg-[#2D1B0F] hover:bg-[#1A0E06] text-[#C48B47] hover:text-[#D49E5B] font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Proceed to Sign In</span>
              </NavLink>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {requestCodeSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{requestCodeSuccess}</span>
                </div>
              )}

              {/* If using Telegram phone code recovery */}
              {!hasLegacyToken && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#2D1B0F]">
                      Registered Phone Number *
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 flex rounded-xl border-2 border-[#D8C8B0] bg-white overflow-hidden focus-within:border-[#A35C33] transition-colors">
                        <span className="inline-flex items-center px-3.5 py-2.5 bg-[#EFE7DA] text-[#2D1B0F] font-bold text-xs sm:text-sm border-r-2 border-[#D8C8B0] select-none tracking-wider">
                          +251
                        </span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={9}
                          required
                          value={phone}
                          onChange={(e) => setPhone(cleanPhoneDigits(e.target.value))}
                          placeholder="9XXXXXXXX"
                          className="w-full px-3.5 py-2.5 bg-transparent text-xs sm:text-sm text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:outline-none font-medium tracking-wide"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRequestCode}
                        disabled={requestCodeLoading}
                        className="px-3.5 py-2.5 rounded-xl bg-[#A35C33] hover:bg-[#8B4C28] text-white font-bold text-xs shrink-0 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {requestCodeLoading ? 'Sending...' : 'Get Code'}
                      </button>
                    </div>
                  </div>

                  {telegramInfo && (
                    <div className="p-3 rounded-xl bg-[#EFE7DA] border border-[#D8C8B0] text-xs space-y-1 text-[#5C3B1E]">
                      <div className="flex items-center gap-1.5 font-bold text-[#2D1B0F]">
                        <MessageSquare className="w-3.5 h-3.5 text-[#A35C33]" />
                        <span>Telegram Bot Dispatched</span>
                      </div>
                      <a
                        href={telegramInfo?.bot_url || telegramInfo?.bot_link || `https://t.me/chapter_and_chats_bot?start=${encodeURIComponent(formatE164Phone(phone))}`}
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
                      {telegramInfo.dev_code && (
                        <div className="text-[11px] font-mono text-[#A35C33]">
                          Local Dev Code: <strong>{telegramInfo.dev_code}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#2D1B0F]">
                      6-Digit Telegram Code *
                    </label>
                    <input
                      id="reset-code-input"
                      name="recovery_code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="one-time-code"
                      maxLength={6}
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      className="w-full text-center tracking-widest text-lg font-mono py-2.5 bg-white border-2 border-[#D8C8B0] rounded-xl text-[#2D1B0F] focus:border-[#A35C33] focus:outline-none font-bold"
                    />
                  </div>
                </>
              )}

              {/* Password Fields */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#2D1B0F]">
                  New Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#2D1B0F]/40">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="new-password"
                    name="new-password"
                    autoComplete="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full pl-10 pr-10 py-3 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:border-[#A35C33] focus:outline-none transition-colors"
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

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#2D1B0F]">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#2D1B0F]/40">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <input
                    id="confirm-new-password"
                    name="confirm-new-password"
                    autoComplete="new-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full pl-10 pr-10 py-3 bg-white border-2 border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] placeholder-[#2D1B0F]/40 focus:border-[#A35C33] focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#2D1B0F]/40 hover:text-[#2D1B0F] cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-[#2D1B0F] hover:bg-[#1A0E06] text-[#C48B47] hover:text-[#D49E5B] font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#C48B47]" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Update Password &amp; Continue</span>
                )}
              </button>

              <div className="text-center pt-2">
                <NavLink
                  to="/login"
                  className="text-xs text-[#2D1B0F]/70 hover:text-[#A35C33] font-bold inline-flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </NavLink>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  Lock,
  UserCheck,
  AlertCircle,
  LogOut,
  Eye,
  EyeOff,
  User as UserIcon,
  CheckCircle2,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { useQuizStore } from '@/store/useQuizStore';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

// Official Google Multi-color 'G' Logo SVG
const GoogleLogoSvg: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

type AuthViewMode = 'login' | 'register' | 'reset';

/**
 * Authentication and Sync Modal with Firebase SDK Integration
 */
export const AuthModal: React.FC = () => {
  const isAuthOpen = useQuizStore((s) => s.isAuthOpen);
  const closeAuth = useQuizStore((s) => s.closeAuth);
  const { t } = useTranslation();

  const {
    user,
    userEmail,
    authLoading,
    authError,
    clearError,
    signIn,
    signUp,
    signInWithGooglePopup,
    signInGuest,
    signOut,
    sendReset,
  } = useFirebaseAuth();

  const [mode, setMode] = useState<AuthViewMode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  if (!isAuthOpen) return null;

  const currentError = localError || authError;

  const resetFormState = () => {
    setLocalError(null);
    clearError();
    setResetSuccessMessage(null);
  };

  const handleSwitchMode = (newMode: AuthViewMode) => {
    resetFormState();
    setMode(newMode);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!email || !email.includes('@')) {
      setLocalError(t('auth.invalid_credentials'));
      return;
    }

    if (mode === 'reset') {
      try {
        await sendReset(email);
        setResetSuccessMessage(t('auth.reset_success'));
      } catch {
        // error handled in hook
      }
      return;
    }

    if (password.length < 6) {
      setLocalError(t('auth.invalid_credentials'));
      return;
    }

    try {
      if (mode === 'register') {
        await signUp(email, password, displayName.trim() || undefined);
      } else {
        await signIn(email, password);
      }
      closeAuth();
    } catch {
      // error handled in hook
    }
  };

  const handleGoogleSignIn = async () => {
    resetFormState();
    try {
      const res = await signInWithGooglePopup();
      if (res) {
        closeAuth();
      }
    } catch {
      // error handled in hook
    }
  };

  const handleGuestSignIn = async () => {
    resetFormState();
    try {
      await signInGuest();
      closeAuth();
    } catch {
      // error handled in hook
    }
  };

  const handleSignOut = async () => {
    resetFormState();
    await signOut();
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          className="w-full max-w-sm sm:max-w-md bg-white dark:bg-[#1E2D34] rounded-3xl border-2 border-[#E5E5E5] dark:border-[#37464F] p-6 text-center space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={closeAuth}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-[#AFAFAF] hover:text-[#3C3C3C] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors z-10"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Viking Avatar Header */}
          <div className="flex justify-center pt-1">
            <div className="relative">
              <img
                src="/ic_launcher_viking.png"
                alt="Wikingo"
                className="w-18 h-18 sm:w-20 sm:h-20 object-contain drop-shadow-md select-none"
              />
            </div>
          </div>

          {/* Signed-in profile view */}
          {user ? (
            <div className="space-y-4 py-2">
              <div className="relative w-16 h-16 mx-auto">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-16 h-16 rounded-full border-2 border-[#58CC02] object-cover shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#D7FFB8] dark:bg-[#14532D] flex items-center justify-center text-[#2A7000] dark:text-[#86EFAC] text-xl font-black">
                    {user.isAnonymous ? (
                      <Compass className="w-8 h-8" />
                    ) : (
                      user.displayName?.charAt(0).toUpperCase() || <UserCheck className="w-8 h-8" />
                    )}
                  </div>
                )}
                {!user.isAnonymous && (
                  <span className="absolute bottom-0 right-0 p-1 bg-[#58CC02] rounded-full text-white border-2 border-white dark:border-[#1E2D34]" title="Verificato">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-[#3C3C3C] dark:text-white">
                  {user.displayName || (user.isAnonymous ? 'Ospite' : t('auth.logged_in_as'))}
                </h3>
                <p className="text-sm font-extrabold text-[#58CC02] break-all">
                  {user.email || (user.isAnonymous ? 'Accesso Anonimo' : userEmail)}
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F0FDF4] dark:bg-[#064E3B]/40 text-[#15803D] dark:text-[#86EFAC] border border-[#BBF7D0] dark:border-[#059669]/40 mt-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    {user.isAnonymous ? t('auth.guest_badge') : t('auth.sync_badge')}
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#777777] dark:text-[#9CA3AF] px-2">
                I tuoi progressi, le vite e le voci salvate sono collegati a questo account.
              </p>

              <div className="space-y-2 pt-2">
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={handleSignOut}
                  disabled={authLoading}
                  className="flex items-center justify-center gap-2 text-[#FF4B4B] hover:bg-[#FFF1F2] dark:hover:bg-[#4C0519]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('auth.sign_out')}</span>
                </Button>
                <Button variant="green" size="md" fullWidth onClick={closeAuth}>
                  {t('common.continue')}
                </Button>
              </div>
            </div>
          ) : (
            /* Unauthenticated View: Form + Google + Guest */
            <div className="space-y-4">
              {/* Header Title & Subtitle */}
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-[#3C3C3C] dark:text-white">
                  {mode === 'login'
                    ? t('auth.login_title')
                    : mode === 'register'
                    ? t('auth.register_title')
                    : t('auth.reset_title')}
                </h3>
                <p className="text-xs text-[#777777] dark:text-[#9CA3AF]">
                  {mode === 'reset' ? t('auth.reset_hint') : t('auth.subtitle')}
                </p>
              </div>

              {/* Mode Switch Tabs (Accedi / Registrati) */}
              {mode !== 'reset' && (
                <div className="grid grid-cols-2 p-1 bg-[#F0F2F5] dark:bg-[#131F24] rounded-2xl border border-[#E5E5E5] dark:border-[#37464F]">
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('login')}
                    className={`py-2 text-xs font-black rounded-xl transition-all ${
                      mode === 'login'
                        ? 'bg-white dark:bg-[#1E2D34] text-[#1CB0F6] shadow-xs'
                        : 'text-[#777777] dark:text-[#9CA3AF] hover:text-[#3C3C3C] dark:hover:text-white'
                    }`}
                  >
                    {t('auth.login_action')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('register')}
                    className={`py-2 text-xs font-black rounded-xl transition-all ${
                      mode === 'register'
                        ? 'bg-white dark:bg-[#1E2D34] text-[#58CC02] shadow-xs'
                        : 'text-[#777777] dark:text-[#9CA3AF] hover:text-[#3C3C3C] dark:hover:text-white'
                    }`}
                  >
                    {t('auth.register_action')}
                  </button>
                </div>
              )}

              {/* Google Sign In Button */}
              {mode !== 'reset' && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={authLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-[#F7F7F7] active:bg-[#EEEEEE] text-[#3C3C3C] font-extrabold text-sm rounded-2xl border-2 border-b-4 border-[#E5E5E5] hover:border-[#D5D5D5] active:border-b-2 active:translate-y-[2px] transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <GoogleLogoSvg className="w-5 h-5 shrink-0" />
                    <span>{t('auth.google_action')}</span>
                  </button>

                  {/* Divider */}
                  <div className="relative flex items-center justify-center py-1">
                    <div className="border-t border-[#E5E5E5] dark:border-[#37464F] w-full" />
                    <span className="bg-white dark:bg-[#1E2D34] px-3 text-[10px] font-black uppercase text-[#AFAFAF] dark:text-[#777777] absolute">
                      {t('auth.or_divider')}
                    </span>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3 text-left">
                {/* Optional Display Name (only in register mode) */}
                {mode === 'register' && (
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-[#777777] dark:text-[#9CA3AF] mb-1">
                      {t('auth.name')}
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="es. Mario Rossi"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-[#E5E5E5] dark:border-[#37464F] bg-white dark:bg-[#131F24] text-sm font-bold text-[#3C3C3C] dark:text-white focus:outline-none focus:border-[#58CC02]"
                      />
                    </div>
                  </div>
                )}

                {/* Email Input */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#777777] dark:text-[#9CA3AF] mb-1">
                    {t('auth.email')}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      required
                      onChange={(e) => {
                        setEmail(e.target.value);
                        resetFormState();
                      }}
                      placeholder="es. nome@email.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-[#E5E5E5] dark:border-[#37464F] bg-white dark:bg-[#131F24] text-sm font-bold text-[#3C3C3C] dark:text-white focus:outline-none focus:border-[#1CB0F6]"
                    />
                  </div>
                </div>

                {/* Password Input (only in login & register modes) */}
                {mode !== 'reset' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-black uppercase tracking-wider text-[#777777] dark:text-[#9CA3AF]">
                        {t('auth.password')}
                      </label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => handleSwitchMode('reset')}
                          className="text-[11px] font-extrabold text-[#1CB0F6] hover:underline"
                        >
                          {t('auth.forgot_password')}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        required
                        onChange={(e) => {
                          setPassword(e.target.value);
                          resetFormState();
                        }}
                        placeholder="Almeno 6 caratteri"
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl border-2 border-[#E5E5E5] dark:border-[#37464F] bg-white dark:bg-[#131F24] text-sm font-bold text-[#3C3C3C] dark:text-white focus:outline-none focus:border-[#1CB0F6]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {currentError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 text-xs font-bold text-[#FF4B4B] bg-[#FFF1F2] dark:bg-[#4C0519]/40 p-2.5 rounded-xl border border-[#FFDFE0] dark:border-[#881337] text-left"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{currentError}</span>
                  </motion.div>
                )}

                {/* Password Reset Success Banner */}
                {resetSuccessMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 text-xs font-bold text-[#15803D] bg-[#F0FDF4] dark:bg-[#064E3B]/40 p-2.5 rounded-xl border border-[#BBF7D0] dark:border-[#059669]/40 text-left"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{resetSuccessMessage}</span>
                  </motion.div>
                )}

                {/* Primary Submit Button */}
                <Button
                  variant={mode === 'register' ? 'green' : 'blue'}
                  size="lg"
                  fullWidth
                  type="submit"
                  disabled={authLoading}
                  className="mt-2"
                >
                  {authLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : mode === 'register' ? (
                    t('auth.register_action')
                  ) : mode === 'reset' ? (
                    t('auth.reset_action')
                  ) : (
                    t('auth.login_action')
                  )}
                </Button>

                {/* Reset Mode: Back to Login link */}
                {mode === 'reset' && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('login')}
                      className="text-xs font-bold text-[#1CB0F6] hover:underline"
                    >
                      ← {t('auth.back_to_login')}
                    </button>
                  </div>
                )}
              </form>

              {/* Guest Login Option */}
              {mode !== 'reset' && (
                <div className="pt-2 border-t border-[#E5E5E5] dark:border-[#37464F]">
                  <button
                    type="button"
                    onClick={handleGuestSignIn}
                    disabled={authLoading}
                    className="text-xs font-black text-[#777777] dark:text-[#9CA3AF] hover:text-[#3C3C3C] dark:hover:text-white transition-colors py-1 flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>{t('auth.guest_action')}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import { useEffect, useState, useCallback } from 'react';
import { useQuizStore } from '@/store/useQuizStore';
import {
  onAuthChanged,
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  loginAsGuest,
  logoutUser,
  resetUserPassword,
  formatFirebaseAuthError,
} from '@/lib/firebase';
import type { User } from 'firebase/auth';

export function useFirebaseAuth() {
  const setUser = useQuizStore((s) => s.setUser);
  const user = useQuizStore((s) => s.user);
  const isAuthenticated = useQuizStore((s) => s.isAuthenticated);
  const userEmail = useQuizStore((s) => s.userEmail);
  const language = useQuizStore((s) => s.language);

  const [isInitializing, setIsInitializing] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync Firebase Auth with store
  useEffect(() => {
    const unsubscribe = onAuthChanged((firebaseUser: User | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName:
            firebaseUser.displayName ||
            firebaseUser.email?.split('@')[0] ||
            (firebaseUser.isAnonymous ? 'Ospite' : 'Utente'),
          email: firebaseUser.email,
          isAnonymous: firebaseUser.isAnonymous,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
      }
      setIsInitializing(false);
    });

    return () => unsubscribe();
  }, [setUser]);

  const signIn = useCallback(
    async (email: string, pass: string) => {
      setAuthLoading(true);
      setAuthError(null);
      try {
        const u = await loginWithEmail(email, pass);
        return u;
      } catch (err: any) {
        const message = formatFirebaseAuthError(err?.code || '', language);
        setAuthError(message);
        throw new Error(message);
      } finally {
        setAuthLoading(false);
      }
    },
    [language]
  );

  const signUp = useCallback(
    async (email: string, pass: string, displayName?: string) => {
      setAuthLoading(true);
      setAuthError(null);
      try {
        const u = await registerWithEmail(email, pass, displayName);
        return u;
      } catch (err: any) {
        const message = formatFirebaseAuthError(err?.code || '', language);
        setAuthError(message);
        throw new Error(message);
      } finally {
        setAuthLoading(false);
      }
    },
    [language]
  );

  const signInWithGooglePopup = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const u = await loginWithGoogle();
      return u;
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        setAuthError(null); // Cancelled by user, ignore
        return null;
      }
      const message = formatFirebaseAuthError(err?.code || '', language);
      setAuthError(message);
      throw new Error(message);
    } finally {
      setAuthLoading(false);
    }
  }, [language]);

  const signInGuest = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const u = await loginAsGuest();
      return u;
    } catch (err: any) {
      const message = formatFirebaseAuthError(err?.code || '', language);
      setAuthError(message);
      throw new Error(message);
    } finally {
      setAuthLoading(false);
    }
  }, [language]);

  const signOut = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await logoutUser();
      setUser(null);
    } catch (err: any) {
      const message = formatFirebaseAuthError(err?.code || '', language);
      setAuthError(message);
      throw new Error(message);
    } finally {
      setAuthLoading(false);
    }
  }, [language, setUser]);

  const sendReset = useCallback(
    async (email: string) => {
      setAuthLoading(true);
      setAuthError(null);
      try {
        await resetUserPassword(email);
      } catch (err: any) {
        const message = formatFirebaseAuthError(err?.code || '', language);
        setAuthError(message);
        throw new Error(message);
      } finally {
        setAuthLoading(false);
      }
    },
    [language]
  );

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  return {
    user,
    isAuthenticated,
    userEmail,
    isInitializing,
    authLoading,
    authError,
    clearError,
    signIn,
    signUp,
    signInWithGooglePopup,
    signInGuest,
    signOut,
    sendReset,
  };
}

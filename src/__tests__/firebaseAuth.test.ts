/*
  This file is part of Wikingo
  <https://github.com/aresthebellator/HackathonMessina2026-WebApp>.
  Copyright (c) 2026 aresthebellator (exertia group).

  SPDX-License-Identifier: MIT
  Licensed under the MIT License. See the LICENSE file in the project root
  for the full license text.
*/

import { describe, it, expect, beforeEach } from 'vitest';
import { firebaseConfig, formatFirebaseAuthError } from '@/lib/firebase';
import { useQuizStore } from '@/store/useQuizStore';

describe('Firebase Auth Integration & Store', () => {
  beforeEach(() => {
    useQuizStore.setState({
      user: null,
      userEmail: null,
      isAuthenticated: false,
      isAuthOpen: false,
    });
  });

  it('contains the exact user-specified Firebase configuration', () => {
    expect(firebaseConfig.projectId).toBe('wikingo-auth');
    expect(firebaseConfig.authDomain).toBe('wikingo-auth.firebaseapp.com');
    expect(firebaseConfig.databaseURL).toBe('https://wikingo-auth-default-rtdb.europe-west1.firebasedatabase.app');
    expect(firebaseConfig.storageBucket).toBe('wikingo-auth.firebasestorage.app');
    expect(firebaseConfig.messagingSenderId).toBe('226310225271');
    expect(firebaseConfig.appId).toBe('1:226310225271:web:531801f183acd93d8bb572');
    expect(firebaseConfig.measurementId).toBe('G-W87FMHCNY6');
    expect(firebaseConfig.apiKey).toBe('AIzaSyBmpQK-J9ybGcRg5_zBol6jYo89AZz-bnE');
  });

  it('translates Firebase Auth error codes into localized messages', () => {
    // Italian errors
    expect(formatFirebaseAuthError('auth/wrong-password', 'it')).toContain('Credenziali non valide');
    expect(formatFirebaseAuthError('auth/user-not-found', 'it')).toContain('Credenziali non valide');
    expect(formatFirebaseAuthError('auth/email-already-in-use', 'it')).toContain('già associata a un account esistente');
    expect(formatFirebaseAuthError('auth/weak-password', 'it')).toContain('almeno 6 caratteri');
    expect(formatFirebaseAuthError('auth/popup-closed-by-user', 'it')).toContain('annullato');
    expect(formatFirebaseAuthError('auth/configuration-not-found', 'it')).toContain('Firebase Authentication non è configurato');

    // English errors
    expect(formatFirebaseAuthError('auth/wrong-password', 'en')).toContain('Invalid credentials');
    expect(formatFirebaseAuthError('auth/email-already-in-use', 'en')).toContain('already registered');
    expect(formatFirebaseAuthError('auth/weak-password', 'en')).toContain('at least 6 characters');
    expect(formatFirebaseAuthError('auth/configuration-not-found', 'en')).toContain('Firebase Authentication is not configured');
  });

  it('manages authenticated user state in useQuizStore', () => {
    expect(useQuizStore.getState().isAuthenticated).toBe(false);
    expect(useQuizStore.getState().user).toBeNull();

    // Authenticate with a regular user
    useQuizStore.getState().setUser({
      uid: 'firebase-user-123',
      displayName: 'Wikipediano',
      email: 'user@example.com',
      isAnonymous: false,
      photoURL: 'https://example.com/avatar.jpg',
    });

    expect(useQuizStore.getState().isAuthenticated).toBe(true);
    expect(useQuizStore.getState().userEmail).toBe('user@example.com');
    expect(useQuizStore.getState().user?.displayName).toBe('Wikipediano');
    expect(useQuizStore.getState().user?.photoURL).toBe('https://example.com/avatar.jpg');

    // Sign out
    useQuizStore.getState().setUser(null);
    expect(useQuizStore.getState().isAuthenticated).toBe(false);
    expect(useQuizStore.getState().userEmail).toBeNull();
    expect(useQuizStore.getState().user).toBeNull();
  });

  it('handles guest anonymous users appropriately', () => {
    useQuizStore.getState().setUser({
      uid: 'anon-123',
      displayName: 'Ospite',
      email: null,
      isAnonymous: true,
    });

    // Anonymous is not fully authenticated with an email account
    expect(useQuizStore.getState().isAuthenticated).toBe(false);
    expect(useQuizStore.getState().user?.isAnonymous).toBe(true);
    expect(useQuizStore.getState().user?.displayName).toBe('Ospite');
  });

  it('toggles auth modal visibility', () => {
    expect(useQuizStore.getState().isAuthOpen).toBe(false);

    useQuizStore.getState().openAuth();
    expect(useQuizStore.getState().isAuthOpen).toBe(true);

    useQuizStore.getState().closeAuth();
    expect(useQuizStore.getState().isAuthOpen).toBe(false);
  });
});

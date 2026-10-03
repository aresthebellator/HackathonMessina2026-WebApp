import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBmpQK-J9ybGcRg5_zBol6jYo89AZz-bnE",
  authDomain: "wikingo-auth.firebaseapp.com",
  databaseURL: "https://wikingo-auth-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "wikingo-auth",
  storageBucket: "wikingo-auth.firebasestorage.app",
  messagingSenderId: "226310225271",
  appId: "1:226310225271:web:531801f183acd93d8bb572",
  measurementId: "G-W87FMHCNY6"
};

// Initialize Firebase (singleton pattern safe for HMR and testing)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Analytics conditionally (only in supported browser environments)
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      try {
        analytics = getAnalytics(app);
      } catch (e) {
        console.warn('Firebase analytics not initialized:', e);
      }
    }
  });
}

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Sign in with email and password
 */
export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return userCredential.user;
}

/**
 * Register a new user with email and password
 */
export async function registerWithEmail(email: string, pass: string, displayName?: string): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (displayName && userCredential.user) {
    try {
      await updateProfile(userCredential.user, { displayName });
    } catch {
      // Non-critical profile update failure
    }
  }
  return userCredential.user;
}

/**
 * Sign in with Google Popup
 */
export async function loginWithGoogle(): Promise<User> {
  const userCredential = await signInWithPopup(auth, googleProvider);
  return userCredential.user;
}

/**
 * Sign in anonymously (Guest Mode)
 */
export async function loginAsGuest(): Promise<User> {
  const userCredential = await signInAnonymously(auth);
  return userCredential.user;
}

/**
 * Send password reset email
 */
export async function resetUserPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Listen for authentication state changes
 */
export function onAuthChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Human-friendly error translation for Firebase Auth error codes
 */
export function formatFirebaseAuthError(errorCode: string, lang: 'it' | 'en' = 'it'): string {
  const isIt = lang === 'it';
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return isIt
        ? 'Credenziali non valide. Verifica email e password o registrati.'
        : 'Invalid credentials. Please check your email and password or register.';
    case 'auth/email-already-in-use':
      return isIt
        ? 'Questa email è già associata a un account esistente. Prova ad accedere.'
        : 'This email is already registered. Please sign in instead.';
    case 'auth/weak-password':
      return isIt
        ? 'La password è troppo debole. Deve contenere almeno 6 caratteri.'
        : 'Password is too weak. Must be at least 6 characters.';
    case 'auth/invalid-email':
      return isIt
        ? 'Indirizzo email non valido.'
        : 'Invalid email address.';
    case 'auth/popup-closed-by-user':
      return isIt
        ? 'Accesso con Google annullato.'
        : 'Google sign-in cancelled.';
    case 'auth/popup-blocked':
      return isIt
        ? 'Il popup di accesso è stato bloccato dal browser. Consenti i popup e riprova.'
        : 'Popup was blocked by the browser. Please allow popups and retry.';
    case 'auth/too-many-requests':
      return isIt
        ? 'Troppi tentativi falliti. Riprova più tardi per motivi di sicurezza.'
        : 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return isIt
        ? 'Errore di rete. Controlla la connessione a Internet.'
        : 'Network error. Please check your internet connection.';
    case 'auth/operation-not-allowed':
      return isIt
        ? 'Metodo di autenticazione non abilitato nella console Firebase.'
        : 'Authentication provider is not enabled in Firebase Console.';
    case 'auth/configuration-not-found':
      return isIt
        ? 'Firebase Authentication non è configurato per questo progetto. Attivalo nella Console Firebase e abilita il metodo di accesso scelto.'
        : 'Firebase Authentication is not configured for this project. Set it up in the Firebase Console and enable the selected sign-in method.';
    default:
      return isIt
        ? 'Si è verificato un errore durante l\'autenticazione. Riprova.'
        : 'An error occurred during authentication. Please try again.';
  }
}

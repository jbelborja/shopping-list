import { useState } from 'react';
import { Platform } from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './firebase';
import { setDoc, userDoc } from './firestore';
import { User } from '@/types';

export function formatAuthError(err: unknown): string {
  if (!(err instanceof Error)) {
    return 'An unexpected authentication error occurred.';
  }
  const code = (err as any)?.code || '';
  if (code === 'auth/configuration-not-found') {
    return 'Authentication is not activated in your Firebase project yet.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'This sign-in method is disabled in your Firebase console.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'This email address is already registered. Please sign in instead.';
  }
  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found'
  ) {
    return 'Invalid email or password.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'Unauthorized domain: Ensure the domain is authorized in Firebase Console > Authentication > Settings.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Sign in was cancelled.';
  }
  return err.message.replace(/^Firebase:\s*(Error\s*)?/, '').replace(/\s*\(auth\/[^)]+\)\.?$/, '');
}

export async function syncUserDocument(user: FirebaseUser, displayName?: string): Promise<User> {
  const name = displayName || user.displayName || user.email?.split('@')[0] || 'Shopping Planner';
  const userData: User = {
    uid: user.uid,
    displayName: name,
    email: (user.email || '').trim().toLowerCase(),
    photoURL: user.photoURL || undefined,
    createdAt: Date.now(),
  };

  try {
    const ref = userDoc(user.uid);
    await setDoc(ref, userData, { merge: true });
  } catch (err) {
    console.warn('Firestore profile sync note:', err);
  }
  return userData;
}

export async function signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    return credential.user;
  } catch (err) {
    throw new Error(formatAuthError(err));
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<FirebaseUser> {
  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password
    );
    if (displayName) {
      await updateProfile(credential.user, { displayName: displayName.trim() });
    }
    await syncUserDocument(credential.user, displayName.trim());
    return credential.user;
  } catch (err) {
    throw new Error(formatAuthError(err));
  }
}

export async function logOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setError(null);
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await signInWithPopup(auth, provider);
        await syncUserDocument(result.user);
        return result.user;
      } else {
        throw new Error('Google Sign-In on native requires native Google Play services configuration.');
      }
    } catch (err: unknown) {
      const code = (err as any)?.code;
      if (code === 'auth/popup-closed-by-user') {
        return null;
      }
      const msg = formatAuthError(err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    signIn,
    loading,
    error,
    isConfigured: true,
  };
}

import { GoogleAuthProvider, signInWithPopup, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';

export async function promptGoogleSignIn(): Promise<FirebaseUser | null> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export function isGoogleCancellation(err: unknown): boolean {
  if (!err) return false;
  const code = (err as any)?.code;
  return code === 'auth/popup-closed-by-user';
}

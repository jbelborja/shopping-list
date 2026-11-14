import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';

let configured = false;

function ensureConfigured() {
  if (!configured) {
    const webClientId =
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
      '168502063525-uu17f8mqq7mv9h6b9scpqu0h00i9glmq.apps.googleusercontent.com';

    GoogleSignin.configure({
      webClientId,
      scopes: ['profile', 'email'],
    });
    configured = true;
  }
}

export async function promptGoogleSignIn(): Promise<FirebaseUser | null> {
  ensureConfigured();

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();

  if (response.type === 'cancelled') {
    return null;
  }

  const idToken = response.data?.idToken ?? (response as any).idToken;
  if (!idToken) {
    throw new Error('Google Sign-In failed: No ID token returned from Google Play services.');
  }

  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

export function isGoogleCancellation(err: unknown): boolean {
  if (!err) return false;
  const code = (err as any)?.code;
  return (
    code === statusCodes.SIGN_IN_CANCELLED ||
    code === statusCodes.IN_PROGRESS ||
    code === '12501' ||
    code === 'auth/popup-closed-by-user' ||
    (err as any)?.type === 'cancelled'
  );
}

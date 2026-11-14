import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
// @ts-ignore - getReactNativePersistence is provided by React Native bundle of firebase/auth
import { initializeAuth, getReactNativePersistence, getAuth, Auth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBeT_60firNCQeiB4hA1-Xnc21bqNN9KFg',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'secret-santa-2026-4f5f6.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'secret-santa-2026-4f5f6',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'secret-santa-2026-4f5f6.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '553006398541',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:553006398541:web:e4cc49b49085f101a53004',
};

let app: FirebaseApp;
if (getApps().length > 0) {
  app = getApps()[0];
} else {
  app = initializeApp(firebaseConfig);
}

let auth: Auth;
if (Platform.OS === 'web') {
  try {
    auth = getAuth(app);
  } catch (err) {
    console.warn('Web auth init warning:', err);
    auth = {} as Auth;
  }
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    try {
      auth = getAuth(app);
    } catch (err) {
      console.warn('Native auth init warning:', err);
      auth = {} as Auth;
    }
  }
}

let db: Firestore;
try {
  if (Platform.OS === 'web') {
    db = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    });
  } else {
    db = getFirestore(app);
  }
} catch {
  db = getFirestore(app);
}

const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage };

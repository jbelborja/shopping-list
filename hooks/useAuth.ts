import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { onSnapshot } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { userDoc } from '@/lib/firestore';
import { syncUserDocument } from '@/lib/auth';
import { User } from '@/types';

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeAuth: (() => void) | undefined;
    let unsubscribeUserDoc: (() => void) | undefined;

    try {
      if (auth && (auth as any).app) {
        unsubscribeAuth = onAuthStateChanged(
          auth,
          async (fbUser) => {
            setFirebaseUser(fbUser);

            if (fbUser) {
              try {
                const docRef = userDoc(fbUser.uid);
                unsubscribeUserDoc = onSnapshot(
                  docRef,
                  (snap) => {
                    if (snap.exists()) {
                      setUser(snap.data() as User);
                    } else {
                      syncUserDocument(fbUser).then((created) => {
                        setUser(created);
                      });
                    }
                    setLoading(false);
                  },
                  (error) => {
                    console.warn('Error listening to user doc:', error);
                    setLoading(false);
                  }
                );
              } catch (err) {
                console.warn('Error setting up user doc listener:', err);
                setLoading(false);
              }
            } else {
              if (unsubscribeUserDoc) {
                unsubscribeUserDoc();
              }
              setUser(null);
              setLoading(false);
            }
          },
          (error) => {
            console.warn('Auth state error:', error);
            setLoading(false);
          }
        );
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.warn('Auth initialization error:', err);
      setLoading(false);
    }

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []);

  return {
    user,
    firebaseUser,
    loading,
    isAuthenticated: Boolean(firebaseUser),
  };
}

export default useAuth;

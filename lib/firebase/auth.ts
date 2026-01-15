import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { User, UserRole } from '../../types';

const googleProvider = new GoogleAuthProvider();

// Admin emails
const ADMIN_EMAILS = ['ggamsire@gmail.com'];

export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  const result = await signInWithPopup(auth, googleProvider);

  const userRef = doc(db, 'users', result.user.uid);
  const userSnap = await getDoc(userRef);

  // Check if user email should be admin
  const isAdminEmail = ADMIN_EMAILS.includes(result.user.email || '');

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
      role: isAdminEmail ? 'admin' : 'user' as UserRole,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      isActive: true,
      likedArts: [],
      downloadedArts: [],
      viewedArts: []
    });
  } else {
    // If existing user is an admin email, ensure they have admin role
    const updateData: Record<string, unknown> = { lastLoginAt: serverTimestamp() };
    if (isAdminEmail && userSnap.data()?.role !== 'admin') {
      updateData.role = 'admin';
    }
    await setDoc(userRef, updateData, { merge: true });
  }

  return result.user;
};

export const logOut = (): Promise<void> => signOut(auth);

export const getCurrentUser = (): FirebaseUser | null => auth.currentUser;

export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const getUserData = async (uid: string): Promise<User | null> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as User;
  }
  return null;
};

export const isAdmin = async (uid: string): Promise<boolean> => {
  const userData = await getUserData(uid);
  return userData?.role === 'admin' || userData?.role === 'superadmin';
};

import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import { User, UserRole } from '../types';

interface AuthState {
  firebaseUser: FirebaseUser | null;
  userData: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;

  setFirebaseUser: (user: FirebaseUser | null) => void;
  setUserData: (data: User | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  userData: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,

  setFirebaseUser: (user) =>
    set({
      firebaseUser: user,
      isAuthenticated: !!user
    }),

  setUserData: (data) =>
    set({
      userData: data,
      isAdmin: data?.role === 'admin' || data?.role === 'superadmin'
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  reset: () =>
    set({
      firebaseUser: null,
      userData: null,
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false
    })
}));

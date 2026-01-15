import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { onAuthChange, getUserData, signInWithGoogle, logOut } from '../lib/firebase/auth';

export const useAuth = () => {
  const {
    firebaseUser,
    userData,
    isLoading,
    isAuthenticated,
    isAdmin,
    setFirebaseUser,
    setUserData,
    setLoading,
    reset
  } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setFirebaseUser(user);

      if (user) {
        const data = await getUserData(user.uid);
        setUserData(data);
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logOut();
      reset();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return {
    user: firebaseUser,
    userData,
    isLoading,
    isAuthenticated,
    isAdmin,
    login,
    logout
  };
};

import { useAuthStore } from '../store/authStore';
import { signInWithGoogle, logOut } from '../lib/firebase/auth';

export const useAuth = () => {
  const {
    firebaseUser,
    userData,
    isLoading,
    isAuthenticated,
    isAdmin,
    setLoading,
    reset
  } = useAuthStore();

  const login = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
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

import { useAuthStore } from '@/store/authStore';
import { registerWithPassword, loginWithPassword } from '@/lib/auth/password';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { user, token, isGuest, isLoading, error, _hasHydrated, setUser, setToken, setGuest, setLoading, setError, logout } = useAuthStore();
  const router = useRouter();

  const register = async (username, password, confirmPassword) => {
    setLoading(true);
    setError(null);
    try {
      const result = await registerWithPassword(username, password, confirmPassword);
      setUser({ username, id: result.userId });
      setToken(result.token);
      router.push('/onboarding');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const result = await loginWithPassword(username, password);
      setUser({ username, id: result.userId });
      setToken(result.token);
      router.push('/lobby/create');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const enterGuestMode = () => {
    setGuest();
    router.push('/onboarding');
  };

  return {
    user,
    token,
    isGuest,
    isLoading,
    error,
    register,
    login,
    enterGuestMode,
    logout,
    isAuthenticated: !!(user && token) || isGuest,
    hasHydrated: _hasHydrated, // Expose hydration state
  };
}

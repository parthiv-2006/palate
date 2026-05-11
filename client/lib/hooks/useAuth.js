import { useAuthStore } from '@/store/authStore';
import { registerWithPassword, loginWithPassword } from '@/lib/auth/password';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { user, token, isLoading, error, _hasHydrated, setUser, setToken, setLoading, setError, logout } = useAuthStore();
  const router = useRouter();


  const register1 = async (username, password, confirmPassword) => {
    setLoading(true);
    setError(null);
    try {
      const result = await registerWithPassword(username, password, confirmPassword);
      setUser({ username, id: result.userId, userId: result.userId });
      setToken(result.token);
      router.push('/onboarding');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const register2 = async (username, tokenFromServer, userId) => {
    setLoading(true);
    setError(null);
    try {
      setUser({ username, id: userId, userId: userId });
      setToken(tokenFromServer);
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
      setUser({ username, id: result.userId, userId: result.userId });
      setToken(result.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loginWithToken = (username, tokenFromServer, userId) => {
    setUser({ username, id: userId, userId: userId });
    setToken(tokenFromServer);
    router.push('/lobby/create');
  };

  const clearError = () => setError(null);

  return {
    user,
    token,
    isLoading,
    error,
    register1,
    register2,
    login,
    loginWithToken,
    logout,
    clearError,
    isAuthenticated: !!(user && token),
    hasHydrated: _hasHydrated,
  };
}

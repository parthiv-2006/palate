import { useAuthStore } from '@/store/authStore';
import { registerWithPassword, loginWithPassword } from '@/lib/auth/password';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { user, token, isLoading, error, _hasHydrated, setUser, setToken, setLoading, setError, logout } = useAuthStore();
  const router = useRouter();

  /*
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
  */

  const register = async (username, tokenFromServer) => {
    setLoading(true);
    setError(null);
    try {
      setUser({ username, id: username }); // hackathon scuffed, you can get id from server later
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
      setUser({ username, id: result.userId });
      setToken(result.token);
      router.push('/lobby/create');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loginWithToken = (username, tokenFromServer) => {
    setUser({ username, id: username });
    setToken(tokenFromServer);
    router.push('/lobby/create');
  };

  return {
    user,
    token,
    isLoading,
    error,
    register,
    login,
    loginWithToken,
    logout,
    isAuthenticated: !!(user && token),
    hasHydrated: _hasHydrated, // Expose hydration state
  };
}

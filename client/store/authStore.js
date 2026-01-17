import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isGuest: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, isGuest: false }),
      setToken: (token) => set({ token }),
      setGuest: () => {
        // Generate guest ID only on client side to avoid hydration mismatches
        const guestId = typeof window !== 'undefined' ? `guest_${Date.now()}` : 'guest_temp';
        set({ isGuest: true, user: { id: guestId, name: 'Guest' } });
      },
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      logout: () => set({ user: null, token: null, isGuest: false, error: null }),
    }),
    { name: 'auth-storage' }
  )
);

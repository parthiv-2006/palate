import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      _hasHydrated: false, // Track if state has been rehydrated

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      logout: () => set({ user: null, token: null, error: null }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist credentials — never persist transient UI state like error/isLoading
      partialize: (state) => ({ user: state.user, token: state.token }),
      // Only pull user+token from stored data; discard any other stale fields (e.g. old error)
      merge: (persistedState, currentState) => ({
        ...currentState,
        user: persistedState?.user ?? null,
        token: persistedState?.token ?? null,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

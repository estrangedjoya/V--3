import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // Auth state
      user: null,
      token: null,

      // UI state
      isLoading: false,
      error: null,

      // Auth actions
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),

      // Helper to get auth headers
      getAuthHeaders: () => {
        const token = get().token;
        return token ? { Authorization: `Bearer ${token}` } : {};
      },

      // UI actions
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'v-tilde-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);

export default useStore;

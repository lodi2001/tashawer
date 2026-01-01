import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserProfile } from '@/types';
import { getProfile, logout as logoutApi } from '@/lib/auth';
import { clearTokens, getAccessToken } from '@/lib/api';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  fetchProfile: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,
      error: null,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setProfile: (profile) => set({ profile }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      fetchProfile: async () => {
        const token = getAccessToken();
        if (!token) {
          set({ user: null, profile: null, isAuthenticated: false });
          return;
        }

        try {
          set({ isLoading: true, error: null });
          const profile = await getProfile();
          // The profile API may return either:
          // 1. UserProfile with nested user object (profile.user)
          // 2. User data directly (when API returns flat user object)
          // Check for nested user first, fallback to treating profile as user
          const userData = 'user' in profile && profile.user ? profile.user : profile as unknown as User;
          set({
            user: userData,
            profile,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'Failed to fetch profile',
          });
        }
      },

      logout: async () => {
        try {
          await logoutApi();
        } catch {
          // Ignore errors
        } finally {
          clearTokens();
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      checkAuth: () => {
        const token = getAccessToken();
        if (!token) {
          set({ user: null, profile: null, isAuthenticated: false });
          return false;
        }
        return get().isAuthenticated;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: 'customer' | 'admin';
  email_verified: boolean;
  created_at: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User, token: string) => void;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,

      get isAdmin() {
        return get().user?.role === 'admin';
      },
      get isAuthenticated() {
        return !!get().user && !!get().token;
      },

      setUser: (user, token) => {
        set({ user, token });
        if (typeof window !== 'undefined') {
          localStorage.setItem('antar_token', token);
          localStorage.setItem('antar_user', JSON.stringify(user));
        }
      },

      login: async (email, password) => {
        set({ loading: true });
        try {
          const { data } = await authApi.login(email, password);
          get().setUser(data.data.user, data.data.token);
        } finally {
          set({ loading: false });
        }
      },

      logout: () => {
        set({ user: null, token: null });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('antar_token');
          localStorage.removeItem('antar_user');
        }
      },

      refreshUser: async () => {
        try {
          const { data } = await authApi.me();
          set({ user: data.data });
        } catch {
          get().logout();
        }
      },
    }),
    { name: 'antar-auth', partialize: state => ({ user: state.user, token: state.token }) }
  )
);

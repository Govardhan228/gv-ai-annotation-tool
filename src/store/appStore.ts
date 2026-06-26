import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';

interface AppState {
  darkMode: boolean;
  toggleDark: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  loadSeedData: () => void;

  // Auth
  user: { id: string; email: string; name: string; avatar: string } | null;
  session: any | null;
  isLoading: boolean;
  setUser: (user: any) => void;
  setSession: (session: any) => void;
  setIsLoading: (loading: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  darkMode: true,
  toggleDark: () => set((s) => ({ darkMode: !s.darkMode })),
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  loadSeedData: () => {},

  user: null,
  session: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setIsLoading: (isLoading) => set({ isLoading }),

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      const name = data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User';
      set({
        user: { id: data.user.id, email: data.user.email!, name, avatar: name.slice(0, 2).toUpperCase() },
        session: data.session,
      });
    }
    return { error: null };
  },

  signUp: async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return { error: error.message };
    if (data.user) {
      set({
        user: { id: data.user.id, email: data.user.email!, name, avatar: name.slice(0, 2).toUpperCase() },
        session: data.session,
      });
    }
    return { error: null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  checkAuth: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const name = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
      set({
        user: { id: session.user.id, email: session.user.email!, name, avatar: name.slice(0, 2).toUpperCase() },
        session,
      });
    }
    set({ isLoading: false });
  },
}));

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
  resetPassword: (email: string) => Promise<{ error: string | null; success: boolean }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
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
    try {
      console.log('Attempting sign in for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Sign in error:', error);
        return { error: error.message };
      }
      if (data.user) {
        console.log('Sign in successful for user:', data.user.id);
        const name = data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User';
        set({
          user: { id: data.user.id, email: data.user.email!, name, avatar: name.slice(0, 2).toUpperCase() },
          session: data.session,
        });
      }
      return { error: null };
    } catch (err) {
      console.error('Sign in exception:', err);
      return { error: 'An unexpected error occurred during sign in' };
    }
  },

  signUp: async (email, password, name) => {
    try {
      console.log('Attempting sign up for:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) {
        console.error('Sign up error:', error);
        return { error: error.message };
      }
      if (data.user) {
        console.log('Sign up successful for user:', data.user.id);
        set({
          user: { id: data.user.id, email: data.user.email!, name, avatar: name.slice(0, 2).toUpperCase() },
          session: data.session,
        });
      }
      return { error: null };
    } catch (err) {
      console.error('Sign up exception:', err);
      return { error: 'An unexpected error occurred during sign up' };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  checkAuth: async () => {
    try {
      console.log('Checking auth session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Session check error:', error);
      }
      if (session?.user) {
        console.log('Found existing session for user:', session.user.id);
        const name = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
        set({
          user: { id: session.user.id, email: session.user.email!, name, avatar: name.slice(0, 2).toUpperCase() },
          session,
        });
      } else {
        console.log('No existing session found');
      }
    } catch (err) {
      console.error('checkAuth exception:', err);
    }
    set({ isLoading: false });
  },

  resetPassword: async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}`,
      });
      if (error) {
        console.error('Reset password error:', error);
        return { error: error.message, success: false };
      }
      console.log('Password reset email sent successfully to:', email);
      return { error: null, success: true };
    } catch (err) {
      console.error('Reset password exception:', err);
      return { error: 'Failed to send reset email', success: false };
    }
  },

  updatePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: error.message };
    return { error: null };
  },
}));

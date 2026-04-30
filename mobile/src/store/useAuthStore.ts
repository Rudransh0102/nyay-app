import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  created_at: string;
}

interface AuthState {
  session:         Session | null;
  user:            User | null;
  profile:         Profile | null;
  roles:           string[];
  isAuthenticated: boolean;
  isLoading:       boolean;

  setSession:  (session: Session | null) => void;
  setProfile:  (profile: Profile | null, roles: string[]) => void;
  setLoading:  (loading: boolean) => void;
  logout:      () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session:         null,
  user:            null,
  profile:         null,
  roles:           [],
  isAuthenticated: false,
  isLoading:       true,

  setSession(session) {
    set({
      session,
      user:            session?.user ?? null,
      isAuthenticated: !!session,
      isLoading:       false,
    });
  },
  setProfile(profile, roles) {
    set({ profile, roles });
  },
  setLoading(loading) {
    set({ isLoading: loading });
  },
  logout() {
    set({ 
      session: null, 
      user: null, 
      profile: null, 
      roles: [], 
      isAuthenticated: false, 
      isLoading: false 
    });
  },
}));

export const getAuthStore = () => useAuthStore.getState();

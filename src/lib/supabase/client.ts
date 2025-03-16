import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase-auth',
    storage: {
      getItem: (key) => {
        if (typeof window === 'undefined') {
          return null;
        }
        return JSON.parse(window.localStorage.getItem(key) || 'null');
      },
      setItem: (key, value) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(value));
        }
      },
      removeItem: (key) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
      },
    },
  }
});

export interface User {
  id: string;
  phone: string;
  name: string | null;
  profile_picture_url: string | null;
  city: string | null;
  created_at: string;
}

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
  friend: User;
}

export interface City {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
} 
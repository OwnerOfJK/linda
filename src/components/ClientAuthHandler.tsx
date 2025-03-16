'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function ClientAuthHandler() {
  const router = useRouter();
  
  useEffect(() => {
    // This runs only in the browser
    console.log('Supabase client initialized in ClientAuthHandler');
    
    // Check session
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Session error:', error);
      } else {
        console.log('Session check on app load:', 
          data.session ? 'Session exists' : 'No session');
          
        // If we have a session and we're on the login page, check if we should redirect
        if (data.session && window.location.pathname === '/') {
          // Check if user has completed profile
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('name, city')
            .eq('id', data.session.user.id)
            .single();
            
          if (profileError) {
            console.error('Error checking profile:', profileError);
            return;
          }
          
          if (profile && profile.name && profile.city) {
            console.log('User has profile, redirecting to map page');
            router.push('/map');
          } else {
            console.log('User needs profile, redirecting to profile page');
            router.push('/profile');
          }
        }
      }
    };
    
    checkSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session ? 'Session exists' : 'No session');
      
      // If user signs in and we're on the login page, check if we should redirect
      if (event === 'SIGNED_IN' && window.location.pathname === '/') {
        checkSession();
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [router]);
  
  // This component doesn't render anything visible
  return null;
} 
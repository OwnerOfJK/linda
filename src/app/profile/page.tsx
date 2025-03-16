'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import ProfileForm from '@/components/ProfileForm';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/');
      } else {
        // Check if user already has a complete profile
        const { data: profile } = await supabase
          .from('users')
          .select('name, city')
          .eq('id', user.id)
          .single();
        
        if (profile && profile.name && profile.city) {
          // User already has a profile, redirect to map
          router.push('/map');
        } else {
          // User needs to complete profile
          setLoading(false);
        }
      }
    };
    
    checkAuth();
  }, [router]);
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-indigo-50 to-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-indigo-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-indigo-50 to-white">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-indigo-600 mb-2">Lindu</h1>
        <p className="text-gray-600 max-w-md mx-auto">
          Complete your profile to get started
        </p>
      </div>
      
      <ProfileForm />
    </div>
  );
} 
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import MapView from '@/components/MapView';
import Link from 'next/link';

export default function MapPage() {
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
        // Check if user has a complete profile
        const { data: profile } = await supabase
          .from('users')
          .select('name, city')
          .eq('id', user.id)
          .single();
        
        if (!profile || !profile.name || !profile.city) {
          // User needs to complete profile first
          router.push('/profile');
        } else {
          setLoading(false);
        }
      }
    };
    
    checkAuth();
  }, [router]);
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-indigo-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-white shadow z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">Lindu</h1>
          
          <nav className="flex space-x-4">
            <Link href="/map" className="text-indigo-600 font-medium">
              Map
            </Link>
            <Link href="/friends" className="text-gray-600 hover:text-indigo-600">
              Friends
            </Link>
          </nav>
        </div>
      </header>
      
      {/* Map View (takes remaining height) */}
      <div className="flex-1 relative">
        <MapView />
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import PhoneNumberForm from '@/components/PhoneNumberForm';
import VerificationCodeForm from '@/components/VerificationCodeForm';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'verification'>('phone');
  const [phone, setPhone] = useState('');
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      console.log('Checking authentication on home page...');
      
      try {
        // Get the session first to check if we're authenticated
        const { data: sessionData } = await supabase.auth.getSession();

        console.log('Session data:', sessionData);
        
        // If no session exists, we're not logged in (this is normal, not an error)
        if (!sessionData.session) {
          console.log('No active session found - user needs to log in');
          return;
          }
        
        // We have a session, now get the user data
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error fetching user data:', error);
          return;
        }
        
        const { user } = data;
        console.log('Auth check result:', user ? `User found: ${user.id}` : 'No user found');
        
        if (user) {
          // Check if user has completed profile
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('name, city')
            .eq('id', user.id)
            .single();
          
          if (profileError) {
            console.error('Error fetching profile:', profileError);
            return;
          }
          
          console.log('Profile data:', profile);
          
          if (profile && profile.name && profile.city) {
            console.log('Navigating to map page - user has profile');
            router.push('/map');
          } else {
            console.log('Navigating to profile page - user needs profile');
            router.push('/profile');
          }
        }
      } catch (err) {
        // Handle unexpected errors
        console.error('Unexpected error during auth check:', err);
      }
    };
    
    checkAuth();
  }, [router]);
  
  // Listen for beforeinstallprompt event to show custom install button
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show the install button
      setShowInstallPrompt(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  // Handle phone number submission
  const handlePhoneSubmit = (phoneNumber: string) => {
    setPhone(phoneNumber);
    setStep('verification');
  };
  
  // Handle verification code submission
  const handleVerify = async (phoneNumber: string, code: string) => {
    try {
      console.log('Verifying code for phone:', phoneNumber);
      setLoading(true);
      
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phoneNumber, code }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }
      
      console.log('Verification successful:', data);
      
      // If the server returned a session, try to set it directly
      if (data.session) {
        console.log('Setting session directly from API response');
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
      }
      
      // Navigate based on whether the user needs to complete their profile
      if (data.needsProfile) {
        console.log('Navigating to profile page...');
        router.push('/profile');
      } else {
        console.log('Navigating to map page...');
        router.push('/map');
      }
    } catch (error) {
      console.error('Verification error details:', error);
      setLoading(false);
      throw error;
    }
  };
  
  // Handle back button in verification step
  const handleBack = () => {
    setStep('phone');
  };
  
  // Handle PWA installation
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    await deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    await deferredPrompt.userChoice;
    
    // We no longer need the prompt regardless of outcome
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-indigo-50 to-white">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-indigo-600 mb-2">Lindu</h1>
        <p className="text-gray-600 max-w-md mx-auto">
          Track where your friends live with privacy and simplicity
        </p>
      </div>
      
      {showInstallPrompt && (
        <div className="mb-6 p-4 bg-indigo-100 rounded-lg max-w-md w-full">
          <p className="text-indigo-800 mb-2">
            Install Lindu on your device for the best experience!
          </p>
          <button
            onClick={handleInstallClick}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Add to Home Screen
          </button>
        </div>
      )}
      
      {loading ? (
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-indigo-600 font-medium">Loading...</p>
        </div>
      ) : step === 'phone' ? (
        <PhoneNumberForm 
          type="signIn" 
          onSuccess={handlePhoneSubmit} 
        />
      ) : (
        <VerificationCodeForm 
          phone={phone} 
          onVerify={handleVerify} 
          onBack={handleBack} 
        />
      )}
    </main>
  );
}

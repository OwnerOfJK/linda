import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient();
  
  // Get the URL parameters
  const url = new URL(request.url);
  const phone = url.searchParams.get('phone') || '+1234567890';
  const action = url.searchParams.get('action') || 'check';
  
  if (action === 'check') {
    try {
      // Get Supabase configuration info
      const config = {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 5) + '...' : 'not set'
      };
      
      // Try to get session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      return NextResponse.json({
        status: 'ok',
        config,
        sessionExists: !!sessionData.session,
        user: sessionData.session?.user || null,
        error: sessionError || null
      });
    } catch (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Failed to check auth',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  if (action === 'sendotp') {
    try {
      console.log(`Test: Sending SMS OTP to phone: ${phone}`);
      
      const { data, error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          channel: 'sms'
        }
      });
      
      return NextResponse.json({
        status: 'otp_sent',
        messageData: data,
        error: error || null
      });
    } catch (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Failed to send OTP',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  return NextResponse.json({
    status: 'error',
    message: 'Invalid action. Use ?action=check or ?action=sendotp&phone=+1234567890'
  });
} 
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Sanitize phone number (ensure it has a + prefix)
    const sanitizedPhone = phone.startsWith('+') ? phone : `+${phone}`;

    // Get Supabase client and send OTP
    const supabase = createServerSupabaseClient();
    
    console.log(`Sending SMS OTP to phone: ${sanitizedPhone}`);
    
    // Send OTP through Supabase with SMS channel (default)
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: sanitizedPhone,
      options: {
        channel: 'sms'
      }
    });
    console.log('OTP data:', data);

    if (error) {
      console.error('Error sending OTP:', error);
      return NextResponse.json(
        { error: `Failed to send verification code: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('OTP sent successfully via SMS');
    
    // Check if user exists in our database
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('phone', sanitizedPhone)
      .single();

    return NextResponse.json({
      success: true,
      isNewUser: !existingUser,
      message: 'Verification code sent via SMS'
    });
  } catch (error) {
    console.error('Error in send-code route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
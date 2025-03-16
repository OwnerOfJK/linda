import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { twilioClient } from '@/lib/twilio/client';

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

    // Get current user
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get current user's details
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('id, phone, name')
      .eq('id', user.id)
      .single();

    if (currentUserError) {
      console.error('Error getting current user:', currentUserError);
      return NextResponse.json(
        { error: 'Failed to get user information' },
        { status: 500 }
      );
    }

    // Check if trying to add self
    if (currentUser.phone === sanitizedPhone) {
      return NextResponse.json(
        { error: 'You cannot add yourself as a friend' },
        { status: 400 }
      );
    }

    // Check if friend exists in the system
    const { data: friendUser, error: friendUserError } = await supabase
      .from('users')
      .select('id')
      .eq('phone', sanitizedPhone)
      .single();

    let smsSent = false;

    if (friendUserError && friendUserError.code === 'PGRST116') { // Not found
      // Friend not found, send SMS invitation
      const twilio = twilioClient();
      const inviteMessage = `${currentUser.name || 'Someone'} wants to connect with you on Lindu. Download the app to see where your friends live: https://lindu-app.com`;
      
      try {
        await twilio.client.messages.create({
          body: inviteMessage,
          to: sanitizedPhone,
          from: process.env.TWILIO_PHONE_NUMBER
        });
        smsSent = true;
      } catch (smsError) {
        console.error('Error sending SMS invitation:', smsError);
        return NextResponse.json(
          { error: 'Failed to send invitation SMS' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        smsSent,
        message: 'Invitation sent via SMS'
      });
    } else if (friendUserError) {
      console.error('Error checking for friend:', friendUserError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    // Check if friend request already exists
    const { data: existingRequest, error: existingRequestError } = await supabase
      .from('friends')
      .select('id, status')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .or(`user_id.eq.${friendUser.id},friend_id.eq.${friendUser.id}`)
      .single();

    if (existingRequestError && existingRequestError.code !== 'PGRST116') {
      console.error('Error checking existing request:', existingRequestError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (existingRequest) {
      if (existingRequest.status === 'accepted') {
        return NextResponse.json(
          { error: 'You are already friends with this user' },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: 'A friend request already exists between you and this user' },
          { status: 400 }
        );
      }
    }

    // Create friend request
    const { error: createRequestError } = await supabase
      .from('friends')
      .insert([
        {
          user_id: friendUser.id,
          friend_id: user.id,
          status: 'pending'
        }
      ]);

    if (createRequestError) {
      console.error('Error creating friend request:', createRequestError);
      return NextResponse.json(
        { error: 'Failed to send friend request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      smsSent,
      message: 'Friend request sent successfully'
    });
  } catch (error) {
    console.error('Error in add friend route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
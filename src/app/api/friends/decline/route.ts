import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { requestId } = await request.json();

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    // Get current user
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify the request belongs to the current user
    const { error: requestError } = await supabase
      .from('friends')
      .select('id, user_id')
      .eq('id', requestId)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (requestError) {
      console.error('Error getting friend request:', requestError);
      return NextResponse.json(
        { error: 'Friend request not found or not authorized' },
        { status: 404 }
      );
    }

    // Delete the friend request
    const { error: deleteError } = await supabase
      .from('friends')
      .delete()
      .eq('id', requestId);

    if (deleteError) {
      console.error('Error declining friend request:', deleteError);
      return NextResponse.json(
        { error: 'Failed to decline friend request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Friend request declined'
    });
  } catch (error) {
    console.error('Error in decline friend route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
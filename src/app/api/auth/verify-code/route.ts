import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

// Create a logger specifically for this auth endpoint
const logger = createLogger('auth:verify-code');

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  try {
    logger.info('Processing verification code request', { requestId });
    
    const { phone, code } = await request.json();

    if (!phone || !code) {
      logger.warn('Missing required fields', { requestId, phone: !!phone, code: !!code });
      return NextResponse.json(
        { error: 'Phone number and verification code are required' },
        { status: 400 }
      );
    }

    // Sanitize phone number (ensure it has a + prefix)
    const sanitizedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    logger.debug('Sanitized phone number', { requestId, sanitizedPhone: sanitizedPhone.replace(/(\d{4})$/, '****') });
    
    // Get Supabase client
    const supabase = createServerSupabaseClient();
    
    logger.info('Verifying SMS OTP', { 
      requestId, 
      phoneHash: hashPhone(sanitizedPhone), // Don't log full phone numbers in production
      codeLength: code.length 
    });
    
    // Verify the OTP using Supabase Auth
    const { data, error } = await supabase.auth.verifyOtp({
      phone: sanitizedPhone,
      token: code,
      type: 'sms'
    });
    
    if (error) {
      logger.error('OTP verification failed', error, { requestId, errorCode: error.code });
      return NextResponse.json(
        { error: `Invalid verification code: ${error.message}` },
        { status: 400 }
      );
    }
    
    if (!data.user) {
      logger.error('No user returned after OTP verification', undefined, { requestId });
      return NextResponse.json(
        { error: 'Authentication failed - no user returned' },
        { status: 500 }
      );
    }
    
    const user = data.user;
    logger.info('User authenticated successfully', { 
      requestId, 
      userId: user.id,
      hasSession: !!data.session
    });
    
    // Create a response object with the session data
    const response = NextResponse.json({
      success: true,
      userId: user.id,
      isNewUser: false,
      needsProfile: false,
      session: data.session
    });
    
    // Set auth cookies from session if available
    if (data.session) {
      // Set cookies in the response
      response.cookies.set('sb-access-token', data.session.access_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true
      });
      
      response.cookies.set('sb-refresh-token', data.session.refresh_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true
      });
      
      logger.info('Set auth session cookies in response', { 
        requestId,
        accessTokenExpiry: 60 * 60 * 24 * 7,
        refreshTokenExpiry: 60 * 60 * 24 * 30
      });
    }
    
    // First, check if a user with this phone number already exists
    const { data: existingPhoneUser } = await supabase
      .from('users')
      .select('id, name, city')
      .eq('phone', sanitizedPhone)
      .single();
      
    if (existingPhoneUser) {
      logger.info('Found existing user with matching phone', { 
        requestId, 
        existingUserId: existingPhoneUser.id,
        hasName: !!existingPhoneUser.name,
        hasCity: !!existingPhoneUser.city,
        idMismatch: existingPhoneUser.id !== user.id
      });
      
      // If the user IDs don't match, we need to update the database record
      if (existingPhoneUser.id !== user.id) {
        logger.warn('User ID mismatch between auth and database', { 
          requestId,
          authId: user.id, 
          dbId: existingPhoneUser.id 
        });
        
        // Method 1: Update the existing record with the new auth ID
        const { error: updateError } = await supabase
          .from('users')
          .update({ id: user.id })
          .eq('id', existingPhoneUser.id);
          
        if (updateError) {
          logger.error('Failed to update user ID', updateError, { 
            requestId,
            errorCode: updateError.code,
            message: updateError.message
          });
          
          // If we can't update the ID, create a new user record and migrate the data
          const { error: insertError } = await supabase
            .from('users')
            .insert([{
              id: user.id,
              phone: sanitizedPhone,
              name: existingPhoneUser.name,
              city: existingPhoneUser.city
            }]);
            
          if (insertError) {
            logger.error('Failed to create new user record', insertError, { 
              requestId,
              errorCode: insertError.code
            });
            
            return NextResponse.json(
              { error: 'Failed to update user record' },
              { status: 500 }
            );
          }
          
          logger.info('Created new user with migrated data', { 
            requestId,
            userId: user.id,
            hasName: !!existingPhoneUser.name,
            hasCity: !!existingPhoneUser.city
          });
          
          // Return success with the new user ID
          return NextResponse.json({
            success: true,
            isNewUser: false,
            userId: user.id,
            needsProfile: !existingPhoneUser.name || !existingPhoneUser.city,
            session: data.session
          });
        }
        
        logger.info('Updated user ID in database', { 
          requestId,
          oldId: existingPhoneUser.id,
          newId: user.id 
        });
        
        // Use the updated user data
        return NextResponse.json({
          success: true,
          isNewUser: false,
          userId: user.id,
          needsProfile: !existingPhoneUser.name || !existingPhoneUser.city,
          session: data.session
        });
      }
      
      // If IDs match, just return the user data
      return NextResponse.json({
        success: true,
        isNewUser: false,
        userId: existingPhoneUser.id,
        needsProfile: !existingPhoneUser.name || !existingPhoneUser.city,
        session: data.session
      });
    }
    
    // If no user with that phone exists, check if user with auth ID exists
    const { data: existingUser, error: getUserError } = await supabase
      .from('users')
      .select('name, city')
      .eq('id', user.id)
      .single();
    
    let isNewUser = false;

    // Handle user not found case (create new user)
    if (getUserError && getUserError.code === 'PGRST116') {
      isNewUser = true;
      logger.info('No existing user found, creating new user', { requestId, userId: user.id });
      
      // Create the user record in our users table
      const { error: createUserError } = await supabase
        .from('users')
        .insert([{ 
          id: user.id, 
          phone: sanitizedPhone 
        }]);

      if (createUserError) {
        logger.error('Failed to create user record', createUserError, { 
          requestId,
          errorCode: createUserError.code
        });
        
        // If we get a duplicate key error, someone else might have the same phone
        if (createUserError.code === '23505') {
          return NextResponse.json(
            { error: 'This phone number is already registered with another account' },
            { status: 409 }
          );
        }
        
        return NextResponse.json(
          { error: 'Failed to create user record' },
          { status: 500 }
        );
      }
      
      logger.info('Successfully created new user in database', { requestId, userId: user.id });
    } else if (getUserError) {
      logger.error('Error checking existing user', getUserError, { 
        requestId,
        errorCode: getUserError.code 
      });
      
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    } else {
      logger.info('Found existing user by ID', { 
        requestId,
        userId: user.id,
        hasName: !!existingUser?.name,
        hasCity: !!existingUser?.city
      });
    }

    const duration = Date.now() - startTime;
    logger.info('Auth verification completed successfully', { 
      requestId, 
      duration: `${duration}ms`,
      isNewUser,
      needsProfile: isNewUser || (!existingUser?.name || !existingUser?.city)
    });

    // Return success response with session info
    return NextResponse.json({
      success: true,
      isNewUser,
      userId: user.id,
      needsProfile: isNewUser || (!existingUser?.name || !existingUser?.city),
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_at: data.session?.expires_at,
        user: {
          id: user.id,
          phone: sanitizedPhone
        }
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Unhandled exception in verify-code route', error as Error, { 
      requestId, 
      duration: `${duration}ms` 
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Simple utility to hash phone numbers for logging
 * (in production you might want to use a more sophisticated hashing method)
 */
function hashPhone(phone: string): string {
  // Create a simple hash that doesn't expose the number but provides consistency for log analysis
  return phone.slice(-4).padStart(phone.length, '*');
}
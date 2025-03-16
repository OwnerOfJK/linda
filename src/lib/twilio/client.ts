import twilio from 'twilio';

export const twilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;
  
  if (!accountSid || !authToken) {
    throw new Error('Missing Twilio credentials');
  }
  
  const client = twilio(accountSid, authToken);
  
  return {
    client,
    verifySid,
    
    // Send verification code via SMS
    async sendVerificationCode(phoneNumber: string) {
      if (!verifySid) {
        throw new Error('Missing Twilio Verify Service SID');
      }
      
      try {
        const verification = await client.verify.v2
          .services(verifySid)
          .verifications.create({ to: phoneNumber, channel: 'sms' });
        
        return { success: true, status: verification.status };
      } catch (error) {
        console.error('Error sending verification code:', error);
        return { success: false, error };
      }
    },
    
    // Check verification code
    async checkVerificationCode(phoneNumber: string, code: string) {
      if (!verifySid) {
        throw new Error('Missing Twilio Verify Service SID');
      }
      
      try {
        const verification = await client.verify.v2
          .services(verifySid)
          .verificationChecks.create({ to: phoneNumber, code });
        
        return { 
          success: true, 
          valid: verification.status === 'approved',
          status: verification.status 
        };
      } catch (error) {
        console.error('Error checking verification code:', error);
        return { success: false, valid: false, error };
      }
    }
  };
}; 
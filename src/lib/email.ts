// Mock email sending function for development
export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log(`
      Password Reset Email Mock:
      -------------------------
      To: ${email}
      Subject: Reset Your Password
      
      Click the following link to reset your password:
      ${process.env.CLIENT_URL}/reset-password?token=${token}
      
      This link will expire in 24 hours.
    `);
    return;
  }
  
  // TODO: Implement real email sending
  throw new Error('Email sending not implemented');
}
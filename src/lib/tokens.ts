import jwt from 'jsonwebtoken';
import { config } from '../config';

export function createPasswordResetToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'password_reset' },
    config.jwt.resetTokenSecret,
    { expiresIn: '24h' }
  );
}

export function verifyPasswordResetToken(token: string): { userId: string } {
  try {
    const decoded = jwt.verify(token, config.jwt.resetTokenSecret) as { userId: string };
    return decoded;
  } catch (error) {
    throw new Error('Invalid reset token');
  }
}
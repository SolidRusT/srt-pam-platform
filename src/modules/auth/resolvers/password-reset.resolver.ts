import { prisma } from '../../../lib/prisma';
import { hashPassword } from '../../../lib/auth';
import { AuthenticationError } from '../../../lib/errors';
import jwt from 'jsonwebtoken';

const RESET_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const passwordResetResolvers = {
  Mutation: {
    requestPasswordReset: async (_: any, { email }: { email: string }) => {
      // Find user by email
      const player = await prisma.player.findUnique({
        where: { email }
      });

      // Don't reveal if user exists
      if (!player) {
        return true;
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { 
          sub: player.id,
          type: 'password_reset'
        },
        process.env.JWT_SECRET || 'dev_jwt_secret',
        { expiresIn: '24h' }
      );

      // Store reset token with expiry
      await prisma.passwordReset.create({
        data: {
          playerId: player.id,
          token: resetToken,
          expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRY),
        }
      });

      // Log token in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Password reset token for', email, ':', resetToken);
      }

      return true;
    },

    resetPassword: async (_: any, { input }: { input: { token: string; newPassword: string } }) => {
      const { token, newPassword } = input;

      // Verify token
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret') as { sub: string; type: string };
        
        if (decoded.type !== 'password_reset') {
          throw new AuthenticationError('Invalid token type');
        }

        // Find reset record
        const resetRecord = await prisma.passwordReset.findFirst({
          where: {
            token,
            expiresAt: {
              gt: new Date()
            },
            used: false
          },
          include: {
            player: true
          }
        });

        if (!resetRecord) {
          throw new AuthenticationError('Invalid or expired reset token');
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update password and mark token as used
        await prisma.$transaction([
          prisma.player.update({
            where: { id: resetRecord.playerId },
            data: { password: hashedPassword }
          }),
          prisma.passwordReset.update({
            where: { id: resetRecord.id },
            data: { used: true }
          })
        ]);

        return {
          success: true,
          message: 'Password reset successful'
        };
      } catch (error) {
        console.error('Password reset error:', error);
        throw new AuthenticationError('Invalid or expired reset token');
      }
    }
  },

  Query: {
    verifyResetToken: async (_: any, { token }: { token: string }) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret') as { sub: string; type: string };
        
        if (decoded.type !== 'password_reset') {
          return { valid: false };
        }

        const resetRecord = await prisma.passwordReset.findFirst({
          where: {
            token,
            expiresAt: {
              gt: new Date()
            },
            used: false
          },
          include: {
            player: true
          }
        });

        if (!resetRecord) {
          return { valid: false };
        }

        return {
          valid: true,
          email: resetRecord.player.email
        };
      } catch (error) {
        return { valid: false };
      }
    }
  }
};
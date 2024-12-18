import { AuthService } from '../services/auth.service';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { redisService } from '../../../shared/services/redis.service';

const prisma = new PrismaClient();
const authService = new AuthService();

export const authResolvers = {
  Query: {
    me: async (_, __, { req }) => {
      try {
        // Get token from header
        const authHeader = req.headers.authorization;
        console.log('Auth header:', authHeader);

        if (!authHeader?.startsWith('Bearer ')) {
          console.log('No Bearer token found');
          throw new Error('Not authenticated');
        }

        const token = authHeader.split(' ')[1];
        console.log('Token:', token.substring(0, 20) + '...');

        // Check if token is blacklisted
        const isBlacklisted = await redisService.isTokenBlacklisted(token);
        if (isBlacklisted) {
          console.log('Token is blacklisted');
          throw new Error('Not authenticated');
        }

        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret') as { sub: string; type: string };
          console.log('Decoded token:', { ...decoded, sub: decoded.sub.substring(0, 8) + '...' });

          if (decoded.type !== 'access') {
            console.log('Invalid token type:', decoded.type);
            throw new Error('Invalid token type');
          }

          // Get player
          const player = await prisma.player.findUnique({
            where: { id: decoded.sub },
            include: { profile: true },
          });

          if (!player) {
            console.log('Player not found for ID:', decoded.sub.substring(0, 8) + '...');
            throw new Error('Player not found');
          }

          return player;
        } catch (jwtError) {
          console.error('JWT verification error:', jwtError);
          throw new Error('Invalid token');
        }
      } catch (error) {
        console.error('Authentication error:', error);
        throw error;
      }
    },

    activeSessions: async (_, __, { req }) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
          throw new Error('Not authenticated');
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret') as { sub: string };

        return authService.getActiveSessions(decoded.sub);
      } catch (error) {
        throw new Error('Not authenticated');
      }
    },
  },

  Mutation: {
    register: async (_, { input }, { req }) => {
      try {
        console.log('Registration attempt for email:', input.email);
        
        const clientInfo = {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
        };
        
        const result = await authService.register({
          email: input.email,
          password: input.password,
          username: input.username,
        });
        
        console.log('Registration successful for:', input.email);
        return result;
      } catch (error) {
        console.error('Registration error:', error);
        throw error instanceof Error ? error : new Error('Registration failed');
      }
    },

    login: async (_, { input }, { req }) => {
      try {
        console.log('Login attempt for email:', input.email);
        
        const clientInfo = {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
        };
        
        const result = await authService.login(input, clientInfo);
        console.log('Login successful for:', input.email);
        return result;
      } catch (error) {
        console.error('Login error:', error);
        throw error instanceof Error ? error : new Error('Login failed');
      }
    },

    logout: async (_, { refreshToken }, { req }) => {
      try {
        console.log('Logout attempt - checking authentication...');
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
          console.log('No Bearer token found in headers');
          throw new Error('Not authenticated');
        }

        const accessToken = authHeader.split(' ')[1];
        console.log('Access token found, verifying...');
        
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET || 'dev_jwt_secret') as { sub: string, type: string };
        console.log('Access token verified for player:', decoded.sub);

        if (decoded.type !== 'access') {
          console.log('Invalid token type:', decoded.type);
          throw new Error('Invalid token type');
        }

        try {
          console.log('Verifying refresh token...');
          const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_SECRET || 'dev_jwt_secret') as { sub: string, type: string };
          
          if (decodedRefresh.sub !== decoded.sub) {
            console.log('Token mismatch - refresh token belongs to different user');
            throw new Error('Invalid refresh token');
          }

          // Calculate remaining time until token expires
          const expiryTime = redisService.getTokenExpiryTime(accessToken);
          
          // Blacklist the access token
          await redisService.blacklistToken(accessToken, expiryTime);
          console.log('Access token blacklisted');

          console.log('Refresh token verified, revoking session...');
          const result = await authService.logout(refreshToken);
          console.log('Session revoked successfully');
          return result;
        } catch (refreshError) {
          console.error('Refresh token verification failed:', refreshError);
          throw new Error('Invalid refresh token');
        }
      } catch (error) {
        console.error('Logout error:', error);
        throw error instanceof Error ? error : new Error('Unable to logout');
      }
    },

    refreshToken: async (_, { token }) => {
      try {
        return await authService.refreshToken(token);
      } catch (error) {
        throw new Error('Unable to refresh token');
      }
    },

    revokeSession: async (_, { sessionId }, { req }) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
          throw new Error('Not authenticated');
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret') as { sub: string };

        const session = await prisma.session.findFirst({
          where: {
            id: sessionId,
            playerId: decoded.sub,
          },
        });

        if (!session) {
          throw new Error('Session not found');
        }

        await authService.revokeSession(session.token);
        return true;
      } catch (error) {
        throw new Error('Not authenticated');
      }
    },

    revokeAllSessions: async (_, { exceptCurrentSession }, { req }) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
          throw new Error('Not authenticated');
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret') as { sub: string };

        let currentSessionId;
        if (exceptCurrentSession) {
          const session = await prisma.session.findFirst({
            where: {
              playerId: decoded.sub,
              token: this.hashToken(token),
            },
          });
          currentSessionId = session?.id;
        }

        return authService.revokeAllSessions(decoded.sub, currentSessionId);
      } catch (error) {
        throw new Error('Not authenticated');
      }
    },
  },
};
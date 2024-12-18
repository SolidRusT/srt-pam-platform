import { AuthService } from '../services/auth.service';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const authService = new AuthService();

export const authResolvers = {
  Query: {
    me: async (_, __, { req }) => {
      try {
        // Get token from header
        const authHeader = req.headers.authorization;
        console.log('Auth header:', authHeader); // Debug log

        if (!authHeader?.startsWith('Bearer ')) {
          console.log('No Bearer token found'); // Debug log
          throw new Error('Not authenticated');
        }

        const token = authHeader.split(' ')[1];
        console.log('Token:', token.substring(0, 20) + '...'); // Debug log - only show start of token

        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret') as { sub: string; type: string };
          console.log('Decoded token:', { ...decoded, sub: decoded.sub.substring(0, 8) + '...' }); // Debug log

          if (decoded.type !== 'access') {
            console.log('Invalid token type:', decoded.type); // Debug log
            throw new Error('Invalid token type');
          }

          // Get player
          const player = await prisma.player.findUnique({
            where: { id: decoded.sub },
            include: { profile: true },
          });

          if (!player) {
            console.log('Player not found for ID:', decoded.sub.substring(0, 8) + '...'); // Debug log
            throw new Error('Player not found');
          }

          return player;
        } catch (jwtError) {
          console.error('JWT verification error:', jwtError); // Debug log
          throw new Error('Invalid token');
        }
      } catch (error) {
        console.error('Authentication error:', error); // Debug log
        throw error;
      }
    },

    activeSessions: async (_, __, { req }) => {
      try {
        // Get token from header
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
      const clientInfo = {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      };
      return authService.register(input);
    },

    login: async (_, { input }, { req }) => {
      const clientInfo = {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      };
      return authService.login(input, clientInfo);
    },

    logout: async (_, { refreshToken }, { req }) => {
      try {
        // Get access token from header for authentication
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
          throw new Error('Not authenticated');
        }

        const accessToken = authHeader.split(' ')[1];
        // Verify the access token is valid
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET || 'dev_jwt_secret') as { sub: string };

        // Use the refresh token to invalidate the session
        const result = await authService.logout(refreshToken);
        return result;
      } catch (error) {
        console.error('Logout error:', error);
        throw new Error('Unable to logout');
      }
    },

    refreshToken: async (_, { token }) => {
      return authService.refreshToken(token);
    },

    revokeSession: async (_, { sessionId }, { req }) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
          throw new Error('Not authenticated');
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret') as { sub: string };

        // Verify session belongs to player
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
              token: token, // This will need to be hashed in production
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
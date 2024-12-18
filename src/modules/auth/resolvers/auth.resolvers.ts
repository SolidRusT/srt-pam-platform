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
        if (!authHeader?.startsWith('Bearer ')) {
          throw new Error('Not authenticated');
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret') as { sub: string; type: string };

        if (decoded.type !== 'access') {
          throw new Error('Invalid token type');
        }

        // Get player
        const player = await prisma.player.findUnique({
          where: { id: decoded.sub },
          include: { profile: true },
        });

        if (!player) {
          throw new Error('Player not found');
        }

        return player;
      } catch (error) {
        throw new Error('Not authenticated');
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

    logout: async (_, __, { req }) => {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        throw new Error('Not authenticated');
      }

      const token = authHeader.split(' ')[1];
      return authService.logout(token);
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
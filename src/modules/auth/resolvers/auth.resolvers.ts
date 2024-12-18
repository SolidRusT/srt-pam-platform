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
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret') as { sub: string };

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
  },

  Mutation: {
    register: async (_, { input }) => {
      return authService.register(input);
    },

    login: async (_, { input }) => {
      return authService.login(input);
    },

    logout: async (_, __, { req }) => {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        throw new Error('Not authenticated');
      }

      const token = authHeader.split(' ')[1];
      return authService.logout(token);
    },
  },
};
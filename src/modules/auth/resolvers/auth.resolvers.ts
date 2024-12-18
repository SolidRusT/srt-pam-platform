import { AuthService } from '../services/auth.service';

export const authResolvers = {
  Query: {
    me: (_, __, { player }) => {
      if (!player) {
        throw new Error('Not authenticated');
      }
      return player;
    },
  },

  Mutation: {
    register: async (_, { input }, { authService }: { authService: AuthService }) => {
      return authService.register(input);
    },

    login: async (_, { input }, { authService }: { authService: AuthService }) => {
      return authService.login(input);
    },

    logout: async (_, __, { authService, refreshToken }: { authService: AuthService; refreshToken?: string }) => {
      if (!refreshToken) {
        throw new Error('No refresh token provided');
      }
      return authService.logout(refreshToken);
    },
  },
};
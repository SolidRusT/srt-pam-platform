import { Resolvers } from '../../types/graphql';
import { version } from '../../../package.json';

export const resolvers: Resolvers = {
  Query: {
    serverInfo: async () => {
      return {
        status: 'operational',
        version: version,
        timestamp: new Date().toISOString()
      };
    }
  }
};

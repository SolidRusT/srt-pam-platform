import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AuthService } from './modules/auth/services/auth.service';
import { authResolvers } from './modules/auth/resolvers/auth.resolvers';
import * as jwt from 'jsonwebtoken';

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize services
const authService = new AuthService(prisma);

// Read schema
const typeDefs = readFileSync(
  join(__dirname, 'graphql', 'schema.graphql'),
  'utf-8'
);

// Combine resolvers
const resolvers = {
  Query: {
    ...authResolvers.Query,
    serverInfo: () => ({
      status: 'operational',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    })
  },
  Mutation: {
    ...authResolvers.Mutation
  }
};

// Context function to handle authentication
const context = async ({ req }) => {
  const context = {
    prisma,
    authService,
  };

  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      const player = await prisma.player.findUnique({
        where: { id: decoded.sub },
      });
      return { ...context, player };
    } catch (error) {
      // Token verification failed
      return context;
    }
  }

  return context;
};

async function startServer() {
  const app = express();
  
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context,
  });

  await server.start();
  server.applyMiddleware({ app });

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`
    🚀 PAM Platform Server Ready:
    - GraphQL API:    http://localhost:${port}${server.graphqlPath}
    - Database UI:    http://localhost:5050
    - Redis Monitor:  http://localhost:8081
    `);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
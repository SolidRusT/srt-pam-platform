import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { PrismaClient } from '@prisma/client';
import { makeExecutableSchema } from '@graphql-tools/schema';

// Basic type definitions - we'll move these to separate files later
const typeDefs = `
  type Query {
    health: String!
  }
`;

// Basic resolvers - we'll move these to separate files later
const resolvers = {
  Query: {
    health: () => 'PAM Platform is running!',
  },
};

async function startServer() {
  const app = express();
  const prisma = new PrismaClient();

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const server = new ApolloServer({
    schema,
    context: ({ req }) => ({
      prisma,
      req,
    }),
  });

  await server.start();
  server.applyMiddleware({ app });

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
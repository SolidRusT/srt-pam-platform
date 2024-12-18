import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { authResolvers } from './modules/auth/resolvers/auth.resolvers';
import { resolvers as statusResolvers } from './modules/status';
import { getAuthContext } from './modules/auth/middleware/auth.middleware';

async function startServer() {
  const app = express();
  
  // Read schema
  const typeDefs = readFileSync(
    resolve(__dirname, './graphql/schema.graphql'),
    'utf-8'
  );

  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers: {
      Query: {
        ...authResolvers.Query,
        ...statusResolvers.Query,
      },
      Mutation: {
        ...authResolvers.Mutation,
      },
    },
    context: ({ req }) => ({
      ...getAuthContext(req),
      req,
    }),
  });

  await server.start();
  
  // Apply middleware
  server.applyMiddleware({ app });

  // Start server
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
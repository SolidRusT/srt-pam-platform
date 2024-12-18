import express from 'express';
import { ApolloServer } from 'apollo-server-express';

// Basic schema for testing the setup
const typeDefs = `
  type Query {
    hello: String
    serverInfo: ServerInfo
  }

  type ServerInfo {
    status: String!
    version: String!
    timestamp: String!
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Welcome to SolidRusT PAM Platform',
    serverInfo: () => ({
      status: 'operational',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    })
  }
};

async function startServer() {
  const app = express();
  
  const server = new ApolloServer({
    typeDefs,
    resolvers,
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
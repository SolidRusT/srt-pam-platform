import { PrismaClient } from '@prisma/client';

// Instantiate Prisma client
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Export default instance
export default prisma;
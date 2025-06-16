import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configure Prisma client with proper options
export const prisma = globalForPrisma.prisma ?? 
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Handle shutdown gracefully to close connections
if (process.env.NODE_ENV !== 'production') {
  process.on('beforeExit', () => {
    prisma.$disconnect();
  });
} 
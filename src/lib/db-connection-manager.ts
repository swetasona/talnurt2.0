import { PrismaClient } from '@prisma/client';

// Create a singleton instance of PrismaClient with proper connection handling
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configure Prisma client with connection management
export const prisma = globalForPrisma.prisma ?? 
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: ['error', 'warn'],
  });

// In development, save the instance to the global object to prevent multiple instances
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Track active connections for debugging purposes
let activeConnections = 0;
const MAX_CONNECTIONS = 10;

// Function to get a connection - now just returns the singleton instance
export async function getConnection() {
  activeConnections++;
  console.log(`Connection acquired. Active connections: ${activeConnections}`);
  return prisma;
}

// Function to release a connection - now just decrements the counter
export function releaseConnection() {
  if (activeConnections > 0) {
    activeConnections--;
  }
  console.log(`Connection released. Active connections: ${activeConnections}`);
}

// Handle shutdown gracefully to close connections
process.on('beforeExit', async () => {
  console.log('Disconnecting from database...');
  await prisma.$disconnect();
  console.log('Disconnected from database.');
});

// Handle termination signals to ensure connections are closed properly
let isShuttingDown = false;
['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, async () => {
    if (isShuttingDown) {
      // If we're already shutting down, just exit immediately
      process.exit(0);
      return;
    }
    
    isShuttingDown = true;
    console.log(`${signal} received, closing database connections...`);
    
    try {
      await prisma.$disconnect();
      console.log('Database connections closed.');
    } catch (err) {
      console.error('Error during database disconnect:', err);
    }
    
    // Exit with a small delay to ensure logs are flushed
    setTimeout(() => {
      process.exit(0);
    }, 100);
  });
});

// Export the standard prisma client for backward compatibility
export default prisma; 
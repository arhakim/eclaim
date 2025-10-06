import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

// Create a singleton Prisma client with Accelerate extension
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof PrismaClient.prototype.$extends> | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient().$extends(withAccelerate())

// Cache the Prisma client in development to prevent multiple instances
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}

export default prisma

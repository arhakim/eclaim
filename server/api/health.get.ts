import prisma from '../utils/prisma'

export default defineEventHandler(async () => {
  try {
    // Simple health check - execute a basic query
    const result = await prisma.$queryRaw`SELECT 1 as test`

    return {
      status: 'success',
      message: 'Database connection established with Prisma Accelerate',
      timestamp: new Date().toISOString(),
      test: result
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Database connection failed',
      data: error
    })
  }
})

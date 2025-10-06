import jwt from 'jsonwebtoken'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Get token from cookie
    const token = getCookie(event, 'auth-token')

    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No authentication token'
      })
    }

    // Verify token
    const config = useRuntimeConfig()
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        departmentId: true,
        managerId: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'User not found'
      })
    }

    return user
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token'
      })
    }

    throw error
  }
})

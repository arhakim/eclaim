import jwt from 'jsonwebtoken'
import prisma from '../../../lib/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Get token from cookie and verify user
    const token = getCookie(event, 'auth-token')
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No authentication token'
      })
    }

    const config = useRuntimeConfig()
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string }

    // Mark all notifications as read for the user
    await prisma.notification.updateMany({
      where: {
        userId: decoded.userId,
        isRead: false
      },
      data: {
        isRead: true,
        updatedAt: new Date()
      }
    })

    return {
      success: true,
      message: 'All notifications marked as read'
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to mark all notifications as read'
    })
  }
})

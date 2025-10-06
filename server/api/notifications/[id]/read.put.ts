import jwt from 'jsonwebtoken'
import prisma from '../../../../lib/prisma'

export default defineEventHandler(async (event) => {
  try {
    const notificationId = getRouterParam(event, 'id')

    if (!notificationId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Notification ID is required'
      })
    }

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

    // Update notification as read
    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: decoded.userId // Ensure user can only update their own notifications
      },
      data: {
        isRead: true,
        updatedAt: new Date()
      }
    })

    if (notification.count === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Notification not found'
      })
    }

    return {
      success: true,
      message: 'Notification marked as read'
    }
  } catch (error) {
    console.error('Error marking notification as read:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to mark notification as read'
    })
  }
})

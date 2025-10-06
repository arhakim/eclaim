import jwt from 'jsonwebtoken'
import prisma from '../../lib/prisma'

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

    // Get user from database to verify they exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'User not found'
      })
    }

    // Check if notification model is available (Prisma client might not be fully updated)
    if (!prisma.notification) {
      console.warn('Notification model not available in Prisma client, returning empty results')
      return {
        data: [],
        unreadCount: 0
      }
    }

    // Get notifications for the user
    const notifications = await prisma.notification.findMany({
      where: {
        userId: decoded.userId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        claim: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to 50 notifications
    })

    // Count unread notifications
    const unreadCount = await prisma.notification.count({
      where: {
        userId: decoded.userId,
        isRead: false
      }
    })

    // Transform notifications to match the expected format
    const transformedNotifications = notifications.map((notification: any) => ({
      ...notification,
      unread: !notification.isRead,
      body: notification.message, // For backward compatibility
      date: notification.createdAt.toISOString() // For backward compatibility
    }))

    return {
      data: transformedNotifications,
      unreadCount
    }
  } catch (error) {
    console.error('Error fetching notifications:', error)

    // If it's a Prisma-related error, return empty data for now
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as Error).message
      if (errorMessage.includes('notification') || errorMessage.includes('Unknown arg')) {
        console.warn('Prisma client not updated with notification model, returning empty results')
        return {
          data: [],
          unreadCount: 0
        }
      }
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch notifications'
    })
  }
})

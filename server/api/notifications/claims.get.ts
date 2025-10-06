import prisma from '../../../lib/prisma'

export default defineEventHandler(async (event) => {
  try {
    // This is a placeholder for getting the current user
    // You should implement proper authentication middleware
    const userId = event.context.user?.id

    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    // Get recent claim approval notifications for the user
    const notifications = await prisma.expenseClaim.findMany({
      where: {
        userId,
        status: {
          in: ['APPROVED', 'REJECTED']
        },
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 20
    })

    // Transform to notification format
    const claimNotifications = notifications.map((claim) => {
      const latestApproval = claim.approvals[0]
      const isApproved = claim.status === 'APPROVED'

      return {
        id: `claim-${claim.id}`,
        type: 'claim_approval',
        title: `Claim ${isApproved ? 'Approved' : 'Rejected'}`,
        message: `Your claim "${claim.title}" has been ${isApproved ? 'approved' : 'rejected'}${latestApproval?.approver ? ` by ${latestApproval.approver.name}` : ''}.`,
        claimId: claim.id,
        claimTitle: claim.title,
        status: claim.status,
        approver: latestApproval?.approver,
        comments: latestApproval?.comments,
        date: claim.updatedAt,
        unread: true // You can track read status in a separate table if needed
      }
    })

    return {
      data: claimNotifications,
      count: claimNotifications.length
    }
  } catch (error) {
    console.error('Error fetching claim notifications:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch notifications'
    })
  }
})

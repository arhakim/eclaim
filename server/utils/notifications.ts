import prisma from '../../lib/prisma'
import type { NotificationData } from '../../app/types'

export async function sendApprovalNotification(data: NotificationData) {
  try {
    // Create the notification message
    const title = `Claim ${data.type === 'APPROVED' ? 'Approved' : 'Rejected'}`
    const message = data.type === 'APPROVED'
      ? `Your expense claim "${data.claimTitle}" has been approved by ${data.approverName}.`
      : `Your expense claim "${data.claimTitle}" has been rejected by ${data.approverName}.${data.comments ? ` Reason: ${data.comments}` : ''}`

    // Determine notification type
    const notificationType = data.type === 'APPROVED' ? 'CLAIM_APPROVED' : 'CLAIM_REJECTED'

    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: notificationType,
        userId: data.recipientId,
        claimId: data.claimId,
        senderId: data.approverId,
        data: {
          claimTitle: data.claimTitle,
          approverName: data.approverName,
          comments: data.comments,
          status: data.type
        }
      }
    })

    console.log(`📧 Notification created: Claim "${data.claimTitle}" has been ${data.type.toLowerCase()} by ${data.approverName}`)

    if (data.comments) {
      console.log(`💭 Comments: ${data.comments}`)
    }

    return {
      success: true,
      message: 'Notification sent',
      notificationId: notification.id
    }
  } catch (error) {
    console.error('Error creating notification:', error)
    return {
      success: false,
      message: 'Failed to send notification',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

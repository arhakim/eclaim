import cron from 'node-cron'
import prisma from '../../lib/prisma'
import type { NotificationOptions } from '../../app/types'

/**
 * Create a notification for a user
 */
async function createNotification(options: NotificationOptions) {
  try {
    const notification = await prisma.notification.create({
      data: {
        title: options.title,
        message: options.message,
        type: options.type,
        userId: options.userId,
        claimId: options.claimId,
        senderId: options.senderId,
        data: options.data
      }
    })

    console.log(`📧 Notification created for user ${options.userId}: ${options.title}`)
    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

/**
 * Find claims that are in review and need manager attention
 */
async function findClaimsNeedingReview() {
  try {
    const claimsInReview = await prisma.expenseClaim.findMany({
      where: {
        status: 'IN_REVIEW'
      },
      include: {
        user: {
          include: {
            manager: true,
            department: true
          }
        },
        items: true
      },
      orderBy: {
        submittedAt: 'asc' // Oldest first
      }
    })

    return claimsInReview
  } catch (error) {
    console.error('Error finding claims needing review:', error)
    throw error
  }
}

/**
 * Group claims by manager and send reminder notifications
 */
async function sendManagerReminders() {
  try {
    console.log('🔔 Starting daily manager reminder process...')

    const claimsInReview = await findClaimsNeedingReview()

    if (claimsInReview.length === 0) {
      console.log('✅ No claims pending review. No reminders needed.')
      return
    }

    // Group claims by manager
    const claimsByManager = new Map<string, typeof claimsInReview>()

    for (const claim of claimsInReview) {
      const managerId = claim.user.managerId

      if (!managerId) {
        console.warn(`⚠️  Claim ${claim.id} has no assigned manager`)
        continue
      }

      if (!claimsByManager.has(managerId)) {
        claimsByManager.set(managerId, [])
      }

      claimsByManager.get(managerId)!.push(claim)
    }

    // Send notifications to each manager
    for (const [managerId, claims] of claimsByManager.entries()) {
      const claimCount = claims.length
      const totalAmount = claims.reduce((sum, claim) => sum + Number(claim.totalAmount), 0)

      // Find the oldest claim to show urgency
      const oldestClaim = claims[0] // Already sorted by submittedAt asc
      const daysPending = oldestClaim.submittedAt
        ? Math.floor((Date.now() - new Date(oldestClaim.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0

      const title = `${claimCount} Expense Claim${claimCount > 1 ? 's' : ''} Pending Review`

      let message = `You have ${claimCount} expense claim${claimCount > 1 ? 's' : ''} waiting for your review with a total amount of ${new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(totalAmount)}.`

      if (daysPending > 0) {
        message += ` The oldest claim has been pending for ${daysPending} day${daysPending > 1 ? 's' : ''}.`
      }

      message += ' Please review and approve or reject these claims.'

      // Create notification for the manager
      await createNotification({
        title,
        message,
        type: 'WARNING',
        userId: managerId,
        data: {
          claimCount,
          totalAmount,
          daysPending,
          claimIds: claims.map(c => c.id),
          reminderType: 'DAILY_CLAIM_REVIEW'
        }
      })

      console.log(`📨 Reminder sent to manager ${managerId}: ${claimCount} claims pending`)
    }

    console.log(`✅ Daily reminder process completed. Notified ${claimsByManager.size} manager(s) about ${claimsInReview.length} pending claim(s).`)
  } catch (error) {
    console.error('❌ Error in daily manager reminder process:', error)
  }
}

/**
 * Initialize the scheduler
 */
export function initializeScheduler() {
  console.log('🚀 Initializing claim reminder scheduler...')

  // Schedule daily reminders at 7:00 AM
  // Cron pattern: '0 7 * * *' = At 7:00 AM every day
  const timezone = (useRuntimeConfig().public.schedulerTimezone || 'Asia/Jakarta') as string
  cron.schedule('0 7 * * *', async () => {
    console.log(`⏰ Daily reminder scheduler triggered at 7:00 AM (${timezone})`)
    await sendManagerReminders()
  }, {
    timezone
  })

  console.log(`✅ Scheduler initialized. Daily reminders will run at 7:00 AM (${timezone}).`)

  // Uncomment the line below to test immediately
  // sendManagerReminders()
}

/**
 * Manual trigger for testing purposes
 */
export async function triggerManagerReminders() {
  console.log('🧪 Manually triggering manager reminders for testing...')
  await sendManagerReminders()
}

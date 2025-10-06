import { triggerManagerReminders } from '../../utils/scheduler'

export default defineEventHandler(async (event) => {
  try {
    // Check if user is admin (you might want to add proper auth check)
    const method = getMethod(event)

    if (method !== 'POST') {
      throw createError({
        statusCode: 405,
        statusMessage: 'Method not allowed'
      })
    }

    // Trigger the manager reminders manually
    await triggerManagerReminders()

    return {
      success: true,
      message: 'Manager reminders triggered successfully',
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error triggering manager reminders:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to trigger manager reminders'
    })
  }
})

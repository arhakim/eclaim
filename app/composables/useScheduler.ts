export const useScheduler = () => {
  /**
   * Manually trigger manager reminders (for testing/admin purposes)
   */
  const triggerReminders = async () => {
    try {
      const response = await $fetch('/api/admin/trigger-reminders', {
        method: 'POST'
      })

      useToast().add({
        title: 'Success',
        description: 'Manager reminders triggered successfully',
        color: 'success'
      })

      return response
    } catch (error) {
      console.error('Error triggering reminders:', error)
      useToast().add({
        title: 'Error',
        description: 'Failed to trigger manager reminders',
        color: 'error'
      })
      throw error
    }
  }

  return {
    triggerReminders
  }
}

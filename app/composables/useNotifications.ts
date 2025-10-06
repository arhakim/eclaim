import type { Notification } from '~/types'

export const useNotifications = () => {
  const notifications = ref<Notification[]>([])
  const loading = ref(false)
  const unreadCount = ref(0)

  /**
   * Fetch notifications for the current user
   */
  const fetchNotifications = async () => {
    try {
      loading.value = true
      const response = await $fetch<{
        data: Notification[]
        unreadCount: number
      }>('/api/notifications')

      notifications.value = response.data || []
      unreadCount.value = response.unreadCount || 0
    } catch (error) {
      console.error('Error fetching notifications:', error)
      useToast().add({
        title: 'Error',
        description: 'Failed to fetch notifications',
        color: 'error'
      })
    } finally {
      loading.value = false
    }
  }

  /**
   * Mark a notification as read
   */
  const markAsRead = async (notificationId: string) => {
    try {
      await $fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      } as any)

      // Update local state
      const notification = notifications.value.find(n => n.id === notificationId)
      if (notification && (notification.unread || !notification.isRead)) {
        notification.unread = false
        notification.isRead = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      useToast().add({
        title: 'Error',
        description: 'Failed to mark notification as read',
        color: 'error'
      })
    }
  }

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = async () => {
    try {
      await $fetch('/api/notifications/mark-all-read', {
        method: 'PUT'
      } as any)

      // Update local state
      notifications.value.forEach(notification => {
        notification.unread = false
        notification.isRead = true
      })
      unreadCount.value = 0

      useToast().add({
        title: 'Success',
        description: 'All notifications marked as read',
        color: 'success'
      })
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      useToast().add({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        color: 'error'
      })
    }
  }

  /**
   * Delete a notification
   */
  const deleteNotification = async (notificationId: string) => {
    try {
      await $fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      } as any)

      // Remove from local state
      const index = notifications.value.findIndex(n => n.id === notificationId)
      if (index > -1) {
        const notification = notifications.value[index]
        if (notification && (notification.unread || !notification.isRead)) {
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        }
        notifications.value.splice(index, 1)
      }

      useToast().add({
        title: 'Success',
        description: 'Notification deleted',
        color: 'success'
      })
    } catch (error) {
      console.error('Error deleting notification:', error)
      useToast().add({
        title: 'Error',
        description: 'Failed to delete notification',
        color: 'error'
      })
    }
  }

  /**
   * Get notification type color for UI
   */
  const getNotificationTypeColor = (type: string) => {
    const colors = {
      INFO: 'neutral',
      SUCCESS: 'success',
      WARNING: 'warning',
      ERROR: 'error',
      CLAIM_APPROVED: 'success',
      CLAIM_REJECTED: 'error',
      CLAIM_SUBMITTED: 'warning'
    }
    return colors[type as keyof typeof colors] || 'neutral'
  }

  /**
   * Get notification type icon
   */
  const getNotificationTypeIcon = (type: string) => {
    const icons = {
      INFO: 'i-lucide-info',
      SUCCESS: 'i-lucide-check-circle',
      WARNING: 'i-lucide-alert-triangle',
      ERROR: 'i-lucide-x-circle',
      CLAIM_APPROVED: 'i-lucide-check-circle',
      CLAIM_REJECTED: 'i-lucide-x-circle',
      CLAIM_SUBMITTED: 'i-lucide-send'
    }
    return icons[type as keyof typeof icons] || 'i-lucide-bell'
  }

  return {
    // State
    notifications: readonly(notifications),
    loading: readonly(loading),
    unreadCount: readonly(unreadCount),

    // Actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,

    // Helpers
    getNotificationTypeColor,
    getNotificationTypeIcon
  }
}

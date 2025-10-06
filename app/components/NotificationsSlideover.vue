<script setup lang="ts">
import { formatTimeAgo } from '@vueuse/core'

const { isNotificationsSlideoverOpen } = _useDashboard()
const {
  notifications,
  loading,
  unreadCount,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationTypeColor,
  getNotificationTypeIcon
} = useNotifications()

// Fetch notifications when component mounts
onMounted(() => {
  fetchNotifications()
})

// Handle notification click
const handleNotificationClick = async (notification: Record<string, any>) => {
  // Mark as read if unread
  if (notification.unread || !notification.isRead) {
    await markAsRead(notification.id)
  }

  // Navigate based on notification type
  if (notification.claimId) {
    // For claim-related notifications, navigate to claims page with the specific claim
    await navigateTo(`/claims?highlight=${notification.claimId}`)
  }

  // Close the slideover
  isNotificationsSlideoverOpen.value = false
}
</script>

<template>
  <USlideover
    v-model:open="isNotificationsSlideoverOpen"
    title="Notifications"
    desciption="view your recent notifications"
    :ui="{
      header: { base: 'flex items-center justify-between' },
      body: { base: 'flex-1 overflow-y-auto' }
    }"
  >
    <!-- <template #header>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-2">
          <h2 class="text-lg font-semibold text-highlighted">
            Notifications
          </h2>
          <UBadge
            v-if="unreadCount > 0"
            :label="unreadCount.toString()"
            color="primary"
            variant="solid"
            size="xs"
          />
        </div>
        <UButton
          v-if="unreadCount > 0"
          variant="ghost"
          size="xs"
          label="Mark all as read"
          @click="markAllAsRead"
        />
      </div>
    </template> -->

    <template #body>
      <div v-if="loading" class="flex items-center justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="animate-spin" />
      </div>

      <div v-else-if="notifications.length === 0" class="text-center py-8 text-muted">
        <UIcon name="i-lucide-bell-off" class="mx-auto mb-3" size="lg" />
        <p>No notifications yet</p>
      </div>

      <div v-else class="space-y-1">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="px-3 py-3 rounded-md hover:bg-elevated/50 cursor-pointer relative -mx-3"
          :class="{ 'bg-primary/5': notification.unread || !notification.isRead }"
          @click="handleNotificationClick(notification)"
        >
          <div class="flex items-start gap-3">
            <!-- Notification Icon -->
            <div class="flex-shrink-0 mt-0.5">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center"
                :class="`bg-${getNotificationTypeColor(notification.type)}-100 text-${getNotificationTypeColor(notification.type)}-600`"
              >
                <UIcon
                  :name="getNotificationTypeIcon(notification.type)"
                  class="w-4 h-4"
                />
              </div>
            </div>

            <!-- Notification Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between mb-1">
                <h4 class="text-sm font-medium text-highlighted truncate">
                  {{ notification.title }}
                </h4>
                <div class="flex items-center gap-2 ml-2 flex-shrink-0">
                  <UChip
                    v-if="notification.unread || !notification.isRead"
                    color="primary"
                    size="sm"
                  />
                  <time
                    :datetime="notification.createdAt.toString()"
                    class="text-muted text-xs"
                    v-text="formatTimeAgo(new Date(notification.createdAt))"
                  />
                </div>
              </div>

              <p class="text-sm text-dimmed line-clamp-2 mb-2">
                {{ notification.message }}
              </p>

              <!-- Sender info (if available) -->
              <div v-if="notification.sender" class="flex items-center gap-2">
                <UAvatar
                  :src="typeof notification.sender.avatar === 'string' ? notification.sender.avatar : notification.sender.avatar?.src"
                  :alt="notification.sender.name"
                  size="xs"
                />
                <span class="text-xs text-muted">{{ notification.sender.name }}</span>
              </div>

              <!-- Claim info (if available) -->
              <div v-if="notification.claim" class="mt-2 text-xs text-muted">
                <span class="inline-flex items-center gap-1">
                  <UIcon name="i-lucide-receipt" class="w-3 h-3" />
                  {{ notification.claim.title }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </USlideover>
</template>

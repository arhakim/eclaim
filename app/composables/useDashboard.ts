import { createSharedComposable } from '@vueuse/core'
import type { DashboardData } from '~/types'

export const useDashboard = () => {
  // Dashboard data management
  const summaries = ref<DashboardData | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const fetchDashboard = async () => {
    try {
      loading.value = true
      const data = await $fetch<DashboardData>(`/api/dashboard`)
      summaries.value = data
      return data
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    // Dashboard data
    summaries,
    loading,
    error,
    fetchDashboard
  }
}

const _useDashboardNotifications = () => {
  const route = useRoute()
  const router = useRouter()

  const isNotificationsSlideoverOpen = ref(false)

  defineShortcuts({
    'g-h': () => router.push('/'),
    'g-i': () => router.push('/inbox'),
    'g-c': () => router.push('/users'),
    'g-s': () => router.push('/settings'),
    'n': () => isNotificationsSlideoverOpen.value = !isNotificationsSlideoverOpen.value
  })

  watch(() => route.fullPath, () => {
    isNotificationsSlideoverOpen.value = false
  })

  return {
    isNotificationsSlideoverOpen
  }
}
export const _useDashboard = createSharedComposable(_useDashboardNotifications)

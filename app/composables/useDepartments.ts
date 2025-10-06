import type { Department } from '~/types'

export const useDepartments = () => {
  const departments = ref<Department[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchDepartments = async () => {
    loading.value = true
    error.value = null

    try {
      const data = await $fetch<Department[]>('/api/departments')
      departments.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch departments'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Computed properties for easier access
  const departmentOptions = computed(() =>
    departments.value.map(dept => ({
      label: dept.name,
      value: dept.id
    }))
  )

  return {
    // State
    departments: readonly(departments),
    loading: readonly(loading),
    error: readonly(error),

    // Actions
    fetchDepartments,

    // Computed
    departmentOptions
  }
}

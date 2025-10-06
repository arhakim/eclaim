import type { User } from '~/types'

export const useUsers = () => {
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchUsers = async () => {
    loading.value = true
    error.value = null

    try {
      const data = await $fetch<User[]>('/api/users')
      users.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch users'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createUser = async (userData: {
    name: string
    email: string
    password: string
    role: string
    departmentId?: string | null
  }) => {
    loading.value = true
    error.value = null

    const newUser = await $fetch<User>('/api/users', {
      method: 'POST',
      body: userData
    })

    // Refresh the users list after creation
    await fetchUsers()
    return newUser
  }

  const updateUser = async (userId: string, userData: {
    name?: string
    email?: string
    password?: string
    role?: string
    departmentId?: string | null
  }) => {
    const updatedUser = await $fetch<User>(`/api/users/${userId}`, {
      method: 'PUT',
      body: userData
    })

    // Refresh the users list after update
    await fetchUsers()
    return updatedUser
  }

  const deleteUser = async (userId: string) => {
    await $fetch(`/api/users/${userId}`, {
      method: 'DELETE'
    })

    // Refresh the users list after deletion
    await fetchUsers()
  }

  const deleteUsers = async (userIds: string[]) => {
    await Promise.all(userIds.map(id => deleteUser(id)))
  }

  return {
    users: readonly(users),
    loading: readonly(loading),
    error: readonly(error),
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    deleteUsers
  }
}

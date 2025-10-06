export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()

  // Initialize user from token on app start
  if (import.meta.client) {
    const token = useCookie('auth-token')
    const userCookie = useCookie('auth-user')

    if (token.value && !authStore.currentUser) {
      try {
        await authStore.fetchUser()
      } catch {
        // Token is invalid, clear it
        token.value = null
        userCookie.value = null
      }
    }
  }
})

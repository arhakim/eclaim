export default defineNuxtRouteMiddleware(() => {
  if (import.meta.client) {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      return navigateTo('/')
    }
  } else {
    // Check if user has auth token
    const token = useCookie('auth-token')

    // If no token, redirect to login
    if (!token.value) {
      return navigateTo('/')
    }
  }
})

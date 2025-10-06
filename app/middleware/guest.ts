export default defineNuxtRouteMiddleware(() => {
  if (import.meta.client) {
    const authStore = useAuthStore()
    if (authStore.isAuthenticated) {
      return navigateTo('/dashboard')
    }
  } else {
    // Check if user has auth token
    const token = useCookie('auth-token')

    // If user has a token, they're likely authenticated, redirect to dashboard
    if (token.value) {
      return navigateTo('/dashboard')
    }
  }
})

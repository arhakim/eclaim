import { defineStore } from 'pinia'
import type { User } from '@prisma/client'

interface LoginCredentials {
  email: string
  password: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => {
    // Initialize user from cookie during SSR
    const userCookie = useCookie<User | null>('auth-user', { default: () => null })

    return {
      user: userCookie.value,
      isLoading: false,
      error: null
    }
  },

  getters: {
    isAuthenticated: (state) => {
      return !!state.user
    },
    currentUser: state => state.user,
    isManager: state => state.user?.role === 'MANAGER' || state.user?.role === 'ADMIN',
    isAdmin: state => state.user?.role === 'ADMIN'
  },

  actions: {
    async login(credentials: LoginCredentials) {
      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<{ user: User, token: string }>('/api/auth/login', {
          method: 'POST',
          body: credentials
        })

        this.user = response.user

        // Store token in cookie for server-side authentication
        const tokenCookie = useCookie('auth-token', {
          default: () => '',
          maxAge: 60 * 60 * 24 * 14 // 14 days
        })

        const userCookie = useCookie<User | null>('auth-user', {
          default: () => null,
          maxAge: 60 * 60 * 24 * 14 // 14 days
        })
        tokenCookie.value = response.token
        userCookie.value = response.user

        return { success: true }
      } catch (error: unknown) {
        const errorMessage = (error as { data?: { message?: string } })?.data?.message || 'Login failed'
        this.error = errorMessage
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      try {
        await $fetch('/api/auth/logout', {
          method: 'POST'
        })
      } catch (error) {
        console.error('Logout API error:', error)
        // Continue with local logout even if API fails
      }

      // Clear user state
      this.user = null

      // Clear auth cookies
      try {
        const tokenCookie = useCookie('auth-token')
        const userCookie = useCookie('auth-user')
        tokenCookie.value = null
        userCookie.value = null
      } catch (error) {
        console.error('Error clearing cookies:', error)
      }

      // Force a full page reload to ensure clean state
      if (import.meta.client) {
        window.location.href = '/'
      } else {
        await navigateTo('/')
      }
    },

    async fetchUser() {
      try {
        const user = await $fetch<User>('/api/auth/me')
        this.user = user

        // Update user cookie
        const userCookie = useCookie<User | null>('auth-user', {
          default: () => null,
          maxAge: 60 * 60 * 24 * 14 // 14 days
        })
        userCookie.value = user
      } catch {
        this.user = null
        const tokenCookie = useCookie('auth-token')
        const userCookie = useCookie('auth-user')
        tokenCookie.value = null
        userCookie.value = null
      }
    },

    clearError() {
      this.error = null
    }
  }
})

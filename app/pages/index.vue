<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  middleware: 'guest',
  layout: false
})

const toast = useToast()
const authStore = useAuthStore()

const fields = [{
  name: 'email',
  type: 'email' as const,
  label: 'Email',
  placeholder: 'Enter your email',
  required: true
}, {
  name: 'password',
  label: 'Password',
  type: 'password' as const,
  placeholder: 'Enter your password',
  required: true
}, {
  name: 'remember',
  label: 'Remember me',
  type: 'checkbox' as const
}]

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required')
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  try {
    authStore.clearError()
    await authStore.login(payload.data)
    // await navigateTo('/dashboard')
    location.href = '/dashboard'
  } catch {
    toast.add({
      title: 'Error',
      description: authStore.error || 'Login failed',
      color: 'error'
    })
  }
}

// Clear any existing errors when component mounts
onMounted(() => {
  authStore.clearError()
})
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4 min-h-screen">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="schema"
        title="Login to eClaim"
        description="Enter your credentials to access your account."
        icon="i-lucide-user"
        :fields="fields"
        :loading="authStore.isLoading"
        @submit="onSubmit"
      >
        <template #footer>
          <div class="text-center text-sm text-gray-600">
            Test credentials: admin@example.com / password123
          </div>
        </template>
      </UAuthForm>
      <template #fallback>
        <div class="flex items-center justify-center p-8">
          <div class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p class="text-sm text-gray-600">
              Loading...
            </p>
          </div>
        </div>
      </template>
    </UPageCard>
  </div>
</template>

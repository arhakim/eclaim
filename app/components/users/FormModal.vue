<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { User } from '~/types'
import { createUserSchema, updateUserSchema, type CreateUserSchema, type UpdateUserSchema } from '@/utils/schema'

interface Props {
  user?: User | null
  open?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  user: null,
  open: false
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'close': []
}>()

const internalOpen = ref(props.open || false)
const isSubmitting = ref(false)

// Watch for external open prop changes
watch(() => props.open, (newValue) => {
  internalOpen.value = newValue || false
})

// Emit changes when internal open changes
watch(internalOpen, (newValue) => {
  emit('update:open', newValue)
  if (!newValue) {
    emit('close')
  }
})

// Computed to determine if we're in edit mode
const isEditMode = computed(() => props.user !== null)

const schema = computed(() => isEditMode.value ? updateUserSchema : createUserSchema)

type Schema = CreateUserSchema | UpdateUserSchema

const state = reactive<Partial<Schema>>({
  name: props.user?.name || undefined,
  email: props.user?.email || undefined,
  role: props.user?.role || 'EMPLOYEE',
  password: undefined,
  departmentId: props.user?.departmentId || undefined
})

// Watch for user prop changes to update form state
watch(() => props.user, (newUser) => {
  if (newUser) {
    Object.assign(state, {
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      password: undefined,
      departmentId: newUser.departmentId || undefined
    })
  }
}, { deep: true })

const roleOptions = [
  { label: 'Employee', value: 'EMPLOYEE' },
  { label: 'Manager', value: 'MANAGER' },
  { label: 'Admin', value: 'ADMIN' }
]

// Fetch departments using composable
const { departmentOptions, fetchDepartments } = useDepartments()

// Initialize departments on component mount
onMounted(async () => {
  await fetchDepartments()
})

const toast = useToast()
const loading = ref(false)
const { createUser, updateUser } = useUsers()

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true

  try {
    isSubmitting.value = true

    if (!isEditMode.value) {
      if (!event.data.password) {
        throw new Error('Password is required for user creation')
      }
      await createUser({
        name: event.data.name,
        email: event.data.email,
        password: event.data.password,
        role: event.data.role,
        departmentId: event.data.departmentId
      })
      toast.add({
        title: 'Success',
        description: `User ${event.data.name} created successfully`,
        color: 'success'
      })
    } else if (props.user?.id) {
      await updateUser(props.user.id, {
        name: event.data.name,
        email: event.data.email,
        ...(event.data.password && { password: event.data.password }),
        role: event.data.role,
        departmentId: event.data.departmentId
      })
      toast.add({
        title: 'Success',
        description: `User ${event.data.name} updated successfully`,
        color: 'success'
      })
    }

    internalOpen.value = false

    // Reset form for create mode
    Object.assign(state, {
      name: undefined,
      email: undefined,
      role: 'EMPLOYEE',
      password: undefined,
      departmentId: undefined
    })
  } catch (error: unknown) {
    console.error('Error submitting form:', error)
    const errorMessage = error && typeof error === 'object' && 'data' in error
      ? (error as { data?: { message?: string } }).data?.message || `Failed to ${isEditMode.value ? 'update' : 'create'} user`
      : `Failed to ${isEditMode.value ? 'update' : 'create'} user`
    toast.add({
      title: 'Error',
      description: errorMessage,
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UModal v-model:open="internalOpen" :title="isEditMode ? 'Edit User' : 'Add User'">
    <UButton
      v-if="!isEditMode"
      label="Add User"
      icon="i-lucide-plus"
      @click="internalOpen = true"
    />

    <template #description>
      <p class="text-sm text-gray-500">
        {{ isEditMode ? 'Update the user information below.' : 'Fill in the details to create a new user.' }}
      </p>
    </template>

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Name" name="name" required>
          <UInput v-model="state.name" class="w-full" />
        </UFormField>

        <UFormField
          label="Email"
          name="email"
          type="email"
          required
        >
          <UInput v-model="state.email" class="w-full" />
        </UFormField>
        <UFormField
          :label="!isEditMode ? 'Password' : 'Password (leave empty to keep current)'"
          :placeholder="!isEditMode ? 'Enter password' : 'Enter new password'"
          name="password"
        >
          <UInput v-model="state.password" type="password" class="w-full" />
        </UFormField>
        <UFormField label="Role" name="role">
          <USelect
            v-model="state.role"
            :items="roleOptions"
            placeholder="Select role"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Department" name="departmentId">
          <USelect
            v-model="state.departmentId"
            :items="departmentOptions"
            placeholder="Select department (optional)"
            clearable
            class="w-full"
          />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            :disabled="isSubmitting"
            @click="internalOpen = false"
          />
          <UButton
            :label="isEditMode ? 'Update User' : 'Create User'"
            color="primary"
            variant="solid"
            type="submit"
            :loading="isSubmitting"
            :disabled="isSubmitting"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

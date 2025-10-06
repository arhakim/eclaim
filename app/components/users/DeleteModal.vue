<script setup lang="ts">
const props = withDefaults(defineProps<{
  id?: string[]
  open?: boolean
}>(), {
  id: () => [],
  open: false
})

const emit = defineEmits<{
  'close': []
  'update:open': [value: boolean]
}>()

const { deleteUsers } = useUsers()
const toast = useToast()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const count = computed(() => props.id?.length || 0)

async function onSubmit() {
  if (!props.id || props.id.length === 0) return

  try {
    await deleteUsers(props.id)
    toast.add({
      title: 'Success',
      description: `${count.value} user${count.value > 1 ? 's' : ''} deleted successfully`
    })
    isOpen.value = false
    emit('close')
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to delete user(s)',
      color: 'error'
    })
    console.error('Error deleting users:', error)
  }
}

function onCancel() {
  isOpen.value = false
  emit('close')
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="`Delete ${count} user${count > 1 ? 's' : ''}`"
    :description="`Are you sure you want to delete ${count} user${count > 1 ? 's' : ''}? This action cannot be undone.`"
  >
    <slot />

    <template #body>
      <div class="flex justify-end gap-2">
        <UButton
          label="Cancel"
          color="neutral"
          variant="subtle"
          @click="onCancel"
        />
        <UButton
          label="Delete"
          color="error"
          variant="solid"
          loading-auto
          @click="onSubmit"
        />
      </div>
    </template>
  </UModal>
</template>

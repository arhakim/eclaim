<script setup lang="ts">
import type { ExpenseClaim } from '~/types'

const props = withDefaults(defineProps<{
  claim?: ExpenseClaim | null
  open?: boolean
}>(), {
  claim: null,
  open: false
})

const emit = defineEmits<{
  'close': []
  'update:open': [value: boolean]
  'deleted': []
}>()

const { deleteClaim } = useClaims()
const toast = useToast()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const loading = ref(false)

async function onConfirm() {
  if (!props.claim) return

  loading.value = true
  try {
    await deleteClaim(props.claim.id)
    toast.add({
      title: 'Success',
      description: 'Claim deleted successfully'
    })
    isOpen.value = false
    emit('deleted')
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to delete claim',
      color: 'error'
    })
    console.error('Error deleting claim:', error)
  } finally {
    loading.value = false
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
    title="Delete Expense Claim"
    :description="`Are you sure you want to delete the claim '${claim?.title}'? This action cannot be undone.`"
  >
    <template #body>
      <div v-if="claim" class="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 class="font-medium text-gray-900 dark:text-white">
          {{ claim.title }}
        </h4>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {{ claim.description || 'No description' }}
        </p>
        <div class="flex items-center gap-4 mt-2 text-sm text-gray-500">
          <span>${{ Number(claim.totalAmount).toFixed(2) }}</span>
          <span>{{ new Date(claim.expenseDate).toLocaleDateString() }}</span>
          <span>{{ claim.items?.length || 0 }} item(s)</span>
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <UButton
          label="Cancel"
          color="gray"
          variant="solid"
          :disabled="loading"
          @click="onCancel"
        />
        <UButton
          label="Delete"
          color="red"
          variant="solid"
          :loading="loading"
          @click="onConfirm"
        />
      </div>
    </template>
  </UModal>
</template>

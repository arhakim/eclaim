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
}>()

const { submitClaim } = useClaims()
const toast = useToast()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const isSubmitting = ref(false)

async function onSubmit() {
  if (!props.claim) return

  isSubmitting.value = true
  try {
    await submitClaim(props.claim.id)
    toast.add({
      title: 'Success',
      description: 'Your expense claim has been submitted for approval'
    })
    isOpen.value = false
    emit('close')
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to submit claim',
      color: 'error'
    })
    console.error('Error submitting claim:', error)
  } finally {
    isSubmitting.value = false
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
    title="Submit Expense Claim"
    :description="`Are you sure you want to submit the claim '${claim?.title}'? Once submitted, you won't be able to edit it.`"
  >
    <slot />

    <template #body>
      <div class="flex justify-end gap-2">
        <UButton
          label="Cancel"
          color="neutral"
          variant="subtle"
          :disabled="isSubmitting"
          @click="onCancel"
        />
        <UButton
          label="Submit Claim"
          color="primary"
          variant="solid"
          :loading="isSubmitting"
          @click="onSubmit"
        />
      </div>
    </template>
  </UModal>
</template>

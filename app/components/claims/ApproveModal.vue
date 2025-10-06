<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { ExpenseClaim } from '~/types'

const props = defineProps<{
  open: boolean
  claim: ExpenseClaim | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'approved': []
  'close': []
}>()

const authStore = useAuthStore()

const internalOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const schema = z.object({
  comments: z.string().optional()
})

type Schema = z.output<typeof schema>

const state = reactive({
  comments: ''
})

const loading = ref(false)
const { approveClaim } = useApprovals()

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!props.claim || !authStore.user?.id) return

  loading.value = true
  try {
    const success = await approveClaim(props.claim.id, authStore.user.id, event.data.comments)

    if (success) {
      emit('approved')
      onClose()
    }
  } finally {
    loading.value = false
  }
}

function onClose() {
  state.comments = ''
  emit('close')
}

function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount)
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function openReceipt(fileUrl: string) {
  if (typeof window !== 'undefined') {
    window.open(fileUrl, '_blank')
  }
}
</script>

<template>
  <UModal
    v-model:open="internalOpen"
    title="Approve Expense Claim"
    description="Review the details and approve the expense claim"
    :ui="{
      content: 'max-w-4xl'
    }"
  >
    <template #body>
      <UCard
        :ui="{
          ring: '',
          divide: 'divide-y divide-default'
        }"
      >
        <div v-if="claim" class="space-y-4">
          <!-- Claim Summary -->
          <div class="bg-muted p-4 rounded-lg">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <h4 class="font-medium text-highlighted">
                  {{ claim.title }}
                </h4>
                <p class="text-sm text-muted mt-1">
                  {{ claim.description || 'No description' }}
                </p>
                <p class="text-sm text-muted mt-1">
                  By {{ claim.user.name }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-lg font-semibold text-highlighted">
                  {{ formatCurrency(Number(claim.totalAmount), claim.currency) }}
                </p>
                <p class="text-sm text-muted">
                  {{ formatDate(claim.expenseDate) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Items Summary -->
          <div v-if="claim.items && claim.items.length > 0">
            <h5 class="font-medium text-highlighted mb-2">
              Expense Items
            </h5>
            <div class="space-y-2">
              <div
                v-for="item in claim.items"
                :key="item.id"
                class="flex justify-between items-center p-2 bg-muted rounded"
              >
                <div>
                  <p class="text-sm font-medium">
                    {{ item.description }}
                  </p>
                  <p class="text-xs text-muted capitalize">
                    {{ item.category.toLowerCase().replace('_', ' ') }}
                  </p>
                </div>
                <p class="text-sm font-medium">
                  {{ formatCurrency(Number(item.amount), claim.currency) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Receipts -->
          <div v-if="claim.receipts && claim.receipts.length > 0">
            <h5 class="font-medium text-highlighted mb-2">
              Receipts
            </h5>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="receipt in claim.receipts"
                :key="receipt.id"
                variant="subtle"
                color="primary"
                class="cursor-pointer hover:bg-primary-100 transition-colors"
                @click="openReceipt(receipt.fileUrl)"
              >
                {{ receipt.filename }}
              </UBadge>
            </div>
          </div>

          <!-- Approval Form -->
          <UForm
            :schema="schema"
            :state="state"
            class="space-y-4"
            @submit="onSubmit"
          >
            <UFormField
              label="Approval Comments (Optional)"
              name="comments"
            >
              <UTextarea
                v-model="state.comments"
                placeholder="Add any comments for the approval..."
                :rows="3"
                class="w-full"
              />
            </UFormField>

            <div class="flex justify-end gap-3 pt-4">
              <UButton
                type="button"
                color="neutral"
                variant="ghost"
                @click="onClose"
              >
                Cancel
              </UButton>
              <UButton
                type="submit"
                color="primary"
                icon="i-lucide-check"
                :loading="loading"
              >
                Approve Claim
              </UButton>
            </div>
          </UForm>
        </div>
      </UCard>
    </template>
  </UModal>
</template>

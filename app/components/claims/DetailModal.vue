<script setup lang="ts">
import type { ExpenseClaim, Receipt } from '~/types'

interface Props {
  open: boolean
  claim?: ExpenseClaim | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'close': []
}>()

const internalOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

// Helper functions
function getStatusColor(status: ExpenseClaim['status']) {
  const colors = {
    DRAFT: 'neutral',
    IN_REVIEW: 'warning',
    APPROVED: 'success',
    REJECTED: 'error'
  }
  return colors[status] || 'neutral'
}

function formatStatus(status: ExpenseClaim['status']) {
  return status.toLowerCase().replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount)
}

function formatCategory(category: string) {
  return category.toLowerCase().replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function formatFileSize(bytes: number) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

function openReceipt(receipt: Receipt) {
  window.open(receipt.fileUrl, '_blank')
}
</script>

<template>
  <UModal
    v-if="claim"
    v-model:open="internalOpen"
    :title="claim.title"
    :ui="{
      content: 'max-w-4xl'
    }"
  >
    <template #description>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Claim ID: {{ claim.id.slice(0, 8) }}...
          </p>
          <UBadge
            :color="getStatusColor(claim.status)"
            variant="subtle"
            size="sm"
          >
            {{ formatStatus(claim.status) }}
          </UBadge>
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Claim Overview -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Amount
            </dt>
            <dd class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
              {{ formatCurrency(Number(claim.totalAmount), claim.currency) }}
            </dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Expense Date
            </dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">
              {{ formatDate(claim.expenseDate) }}
            </dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Created By
            </dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">
              {{ claim.user.name }} ({{ claim.user.email }})
              <span v-if="claim.user.department" class="text-gray-500 dark:text-gray-400">
                · {{ claim.user.department.name }}
              </span>
            </dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Created Date
            </dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">
              {{ formatDate(claim.createdAt) }}
            </dd>
          </div>
          <div v-if="claim.submittedAt" class="sm:col-span-2">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Submitted Date
            </dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">
              {{ formatDateTime(claim.submittedAt) }}
            </dd>
          </div>
        </div>

        <!-- Description -->
        <div v-if="claim.description">
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
            Description
          </dt>
          <dd class="mt-1 text-sm text-gray-900 dark:text-white">
            {{ claim.description }}
          </dd>
        </div>

        <!-- Expense Items -->
        <div v-if="claim.items?.length > 0">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Expense Items ({{ claim.items.length }})
          </h4>
          <div class="space-y-3">
            <div
              v-for="item in claim.items"
              :key="item.id"
              class="rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ item.description }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ formatCategory(item.category) }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ formatCurrency(Number(item.amount), claim.currency) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Receipts -->
        <div v-if="claim.receipts?.length > 0">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Receipts ({{ claim.receipts.length }})
          </h4>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div
              v-for="receipt in claim.receipts"
              :key="receipt.id"
              class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              @click="openReceipt(receipt)"
            >
              <div class="flex items-center gap-3">
                <div class="flex-shrink-0">
                  <UIcon
                    name="i-lucide-file-image"
                    class="h-8 w-8 text-gray-400"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ receipt.filename }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ formatFileSize(receipt.fileSize) }} · {{ receipt.mimeType }}
                  </p>
                </div>
                <div class="flex-shrink-0">
                  <UIcon
                    name="i-lucide-external-link"
                    class="h-4 w-4 text-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Approvals -->
        <div v-if="claim.approvals?.length > 0">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Approval History ({{ claim.approvals.length }})
          </h4>
          <div class="space-y-3">
            <div
              v-for="approval in claim.approvals"
              :key="approval.id"
              class="rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <UBadge
                      :color="approval.status === 'APPROVED' ? 'green' : approval.status === 'REJECTED' ? 'red' : 'yellow'"
                      variant="subtle"
                      size="sm"
                    >
                      {{ approval.status.toLowerCase() }}
                    </UBadge>
                    <span class="text-sm text-gray-900 dark:text-white">
                      {{ approval.approver.name }}
                    </span>
                  </div>
                  <p v-if="approval.comments" class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {{ approval.comments }}
                  </p>
                  <p class="text-xs text-gray-400">
                    {{ approval.approvedAt ? formatDateTime(approval.approvedAt) : formatDateTime(approval.createdAt) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { Row } from '@tanstack/table-core'
import type { ExpenseClaim } from '~/types'

definePageMeta({
  middleware: 'auth'
})

const authStore = useAuthStore()
const userRole = computed(() => authStore.user?.role || 'user')

// Redirect non-managers
if (!['MANAGER', 'ADMIN'].includes(userRole.value)) {
  throw createError({
    statusCode: 403,
    statusMessage: 'Access denied. Manager role required.'
  })
}

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const table = useTemplateRef('table')

// Composables
const {
  pending,
  claims,
  fetchPendingClaims,
  getStatusColor,
  formatStatus,
  formatDate,
  formatCurrency,
  getDaysWaiting
} = useApprovals()

// State
const isDetailModalOpen = ref(false)
const isApproveModalOpen = ref(false)
const isRejectModalOpen = ref(false)
const selectedClaim = ref<ExpenseClaim | null>(null)
const claimToApprove = ref<ExpenseClaim | null>(null)
const claimToReject = ref<ExpenseClaim | null>(null)

const columnFilters = ref([{
  id: 'title',
  value: ''
}])

const columnVisibility = ref()
const rowSelection = ref({})

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

// Row actions
function getRowItems(row: Row<ExpenseClaim>) {
  const claim = row.original
  return [
    {
      type: 'label',
      label: 'Actions'
    },
    {
      label: 'View Details',
      icon: 'i-lucide-eye',
      onSelect() {
        viewClaim(claim)
      }
    },
    {
      label: 'Approve',
      icon: 'i-lucide-check',
      onSelect() {
        approveClaim(claim)
      }
    },
    {
      label: 'Reject',
      icon: 'i-lucide-x',
      onSelect() {
        rejectClaim(claim)
      }
    }
  ]
}

// Actions
function viewClaim(claim: ExpenseClaim) {
  selectedClaim.value = claim
  isDetailModalOpen.value = true
}

function approveClaim(claim: ExpenseClaim) {
  claimToApprove.value = claim
  isApproveModalOpen.value = true
}

function rejectClaim(claim: ExpenseClaim) {
  claimToReject.value = claim
  isRejectModalOpen.value = true
}

// Modal handlers
function onDetailModalClose() {
  isDetailModalOpen.value = false
  selectedClaim.value = null
}

function onApprovalComplete() {
  isApproveModalOpen.value = false
  isRejectModalOpen.value = false
  claimToApprove.value = null
  claimToReject.value = null
  // fetchPendingClaims is now handled automatically by the composable
}

function onApproveModalClose() {
  isApproveModalOpen.value = false
  claimToApprove.value = null
}

function onRejectModalClose() {
  isRejectModalOpen.value = false
  claimToReject.value = null
}

// Table columns
const columns: TableColumn<ExpenseClaim>[] = [
  {
    accessorKey: 'title',
    header: 'Claim Details',
    cell: ({ row }) => {
      const claim = row.original
      return h('div', { class: 'flex flex-col' }, [
        h('p', { class: 'font-medium text-highlighted' }, claim.title),
        h('p', { class: 'text-sm text-muted' }, claim.description || 'No description'),
        h('div', { class: 'flex items-center gap-2 mt-1' }, [
          h('span', { class: 'text-xs text-muted' }, `By ${claim.user.name}`),
          claim.user.department && h('span', { class: 'text-xs text-muted px-2 py-0.5 bg-muted rounded' }, claim.user.department.name)
        ])
      ])
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const color = getStatusColor(row.original.status)
      return h(UBadge, {
        class: 'capitalize',
        variant: 'subtle',
        color
      }, () => formatStatus(row.original.status))
    }
  },
  {
    accessorKey: 'totalAmount',
    header: 'Amount',
    cell: ({ row }) => {
      return h('div', { class: 'text-right font-mono' },
        formatCurrency(Number(row.original.totalAmount), row.original.currency)
      )
    }
  },
  {
    accessorKey: 'expenseDate',
    header: 'Expense Date',
    cell: ({ row }) => formatDate(row.original.expenseDate)
  },
  {
    accessorKey: 'submittedAt',
    header: 'Waiting Time',
    cell: ({ row }) => {
      const days = getDaysWaiting(row.original.submittedAt)
      const isUrgent = days.includes('3') || days.includes('4') || days.includes('5') || parseInt(days) > 2
      return h('div', {
        class: isUrgent ? 'text-orange-600 font-medium' : 'text-muted'
      }, days)
    }
  },
  {
    accessorKey: 'items',
    header: 'Items',
    cell: ({ row }) => {
      const itemCount = row.original.items?.length || 0
      return h('span', { class: 'text-sm' }, `${itemCount} item${itemCount !== 1 ? 's' : ''}`)
    }
  },
  {
    accessorKey: 'receipts',
    header: 'Receipt',
    cell: ({ row }) => {
      const hasReceipt = row.original.receipts?.length > 0
      return hasReceipt
        ? h('span', { class: 'text-green-600 text-sm' }, '✓ Attached')
        : h('span', { class: 'text-gray-400 text-sm' }, 'None')
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'flex items-center gap-2' },
        [
          h(
            UDropdownMenu,
            {
              content: {
                align: 'end'
              },
              items: getRowItems(row)
            },
            () =>
              h(UButton, {
                icon: 'i-lucide-more-horizontal',
                color: 'neutral',
                variant: 'ghost',
                size: 'xs'
              })
          )
        ]
      )
    }
  }
]

onMounted(() => {
  fetchPendingClaims()
})
</script>

<template>
  <UDashboardPanel id="approvals">
    <template #header>
      <UDashboardNavbar title="Pending Approvals">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            label="Refresh"
            color="neutral"
            variant="ghost"
            :loading="pending"
            @click="fetchPendingClaims"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5 mb-4">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold">
            Claims Awaiting Your Approval
          </h2>
          <UBadge
            :label="claims.length.toString()"
            color="orange"
            variant="subtle"
          />
        </div>

        <UInput
          :model-value="(table?.tableApi?.getColumn('title')?.getFilterValue() as string)"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search claims..."
          @update:model-value="table?.tableApi?.getColumn('title')?.setFilterValue($event)"
        />
      </div>

      <div v-if="pending" class="flex items-center justify-center py-12">
        <UButton loading disabled>
          Loading claims...
        </UButton>
      </div>

      <div v-else-if="claims.length === 0" class="text-center py-12">
        <div class="flex flex-col items-center gap-3">
          <div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Icon name="i-lucide-check-circle" class="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 class="text-lg font-semibold">
              No pending approvals
            </h3>
            <p class="text-muted-foreground">
              All claims have been processed
            </p>
          </div>
        </div>
      </div>

      <UTable
        v-else
        ref="table"
        v-model:column-filters="columnFilters"
        v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel()
        }"
        class="shrink-0"
        :data="claims"
        :columns="columns"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default'
        }"
      />

      <div v-if="claims.length > 0" class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
          {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s) selected.
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination
            :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
            :total="table?.tableApi?.getFilteredRowModel().rows.length"
            @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Detail Modal -->
  <ClaimsDetailModal
    :open="isDetailModalOpen"
    :claim="selectedClaim"
    @update:open="isDetailModalOpen = $event"
    @close="onDetailModalClose"
  />

  <!-- Approve Modal -->
  <ClaimsApproveModal
    v-if="isApproveModalOpen"
    :open="isApproveModalOpen"
    :claim="claimToApprove"
    @update:open="isApproveModalOpen = $event"
    @approved="onApprovalComplete"
    @close="onApproveModalClose"
  />

  <!-- Reject Modal -->
  <ClaimsRejectModal
    v-if="isRejectModalOpen"
    :open="isRejectModalOpen"
    :claim="claimToReject"
    @update:open="isRejectModalOpen = $event"
    @rejected="onApprovalComplete"
    @close="onRejectModalClose"
  />
</template>

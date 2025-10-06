<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import { getPaginationRowModel } from '@tanstack/table-core'
import type { Row } from '@tanstack/table-core'
import type { ExpenseClaim } from '~/types'

definePageMeta({
  middleware: 'auth'
})

const { claims, fetchClaims } = useClaims()
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const authStore = useAuthStore()
const userRole = computed(() => authStore.user?.role || 'user')

const table = useTemplateRef('table')

const columnFilters = ref([{
  id: 'title',
  value: ''
}])

const columnVisibility = ref()

// State
const isCreateModalOpen = ref(false)
const isEditModalOpen = ref(false)
const isDetailModalOpen = ref(false)
const isSubmitModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const selectedClaim = ref<ExpenseClaim | null>(null)
const claimToEdit = ref<ExpenseClaim | null>(null)
const claimToSubmit = ref<ExpenseClaim | null>(null)
const claimToDelete = ref<ExpenseClaim | null>(null)

// Status filter
const statusFilter = ref('all')
const statusOptions = [
  { label: 'All Claims', value: 'all' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'In Review', value: 'IN_REVIEW' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' }
]

// Watch for status filter changes
watch(() => statusFilter.value, (newVal) => {
  if (!table?.value?.tableApi) return

  const statusColumn = table.value.tableApi.getColumn('status')
  if (!statusColumn) return

  if (newVal === 'all') {
    statusColumn.setFilterValue(undefined)
  } else {
    statusColumn.setFilterValue(newVal)
  }
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
    month: 'short',
    day: 'numeric'
  })
}

function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount)
}

// Row actions
function getRowItems(row: Row<ExpenseClaim>) {
  const claim = row.original
  const items = [
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
    }
  ]

  if (['ADMIN', 'EMPLOYEE'].includes(userRole.value) && claim.status === 'DRAFT') {
    items.push({
      label: 'Edit Claim',
      icon: 'i-lucide-edit',
      onSelect() {
        editClaim(claim)
      }
    }, {
      label: 'Submit Claim',
      icon: 'i-lucide-send',
      onSelect() {
        submitClaim(claim)
      }
    }, {
      label: 'Delete Claim',
      icon: 'i-lucide-trash',
      onSelect() {
        deleteClaim(claim)
      }
    })
  }

  return items
}

// Actions
function viewClaim(claim: ExpenseClaim) {
  selectedClaim.value = claim
  isDetailModalOpen.value = true
}

function editClaim(claim: ExpenseClaim) {
  claimToEdit.value = claim
  isEditModalOpen.value = true
}

function submitClaim(claim: ExpenseClaim) {
  claimToSubmit.value = claim
  isSubmitModalOpen.value = true
}

function deleteClaim(claim: ExpenseClaim) {
  claimToDelete.value = claim
  isDeleteModalOpen.value = true
}

function onClaimCreated() {
  isCreateModalOpen.value = false
  fetchClaims()
}

function onClaimUpdated() {
  isEditModalOpen.value = false
  claimToEdit.value = null
  fetchClaims()
}

function onEditModalClose() {
  isEditModalOpen.value = false
  claimToEdit.value = null
}

function onDetailModalClose() {
  isDetailModalOpen.value = false
  selectedClaim.value = null
}

function onSubmitModalClose() {
  isSubmitModalOpen.value = false
  claimToSubmit.value = null
  fetchClaims()
}

function onClaimDeleted() {
  isDeleteModalOpen.value = false
  claimToDelete.value = null
  fetchClaims()
}

function onDeleteModalClose() {
  isDeleteModalOpen.value = false
  claimToDelete.value = null
}

// Table columns
const columns: TableColumn<ExpenseClaim>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => {
      return h('div', { class: 'flex flex-col' }, [
        h('p', { class: 'font-medium text-highlighted' }, row.original.title),
        h('p', { class: 'text-sm text-muted' }, row.original.description || 'No description')
      ])
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    filterFn: 'equals',
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
    header: 'Date',
    cell: ({ row }) => formatDate(row.original.expenseDate)
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
        { class: 'text-right' },
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
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              class: 'ml-auto'
            })
        )
      )
    }
  }
]

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

onMounted(() => {
  fetchClaims()
})
</script>

<template>
  <UDashboardPanel id="claims">
    <template #header>
      <UDashboardNavbar title="Expense Claims">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            v-if="['ADMIN', 'EMPLOYEE'].includes(userRole)"
            icon="i-lucide-plus"
            label="New Claim"
            color="primary"
            variant="solid"
            @click="isCreateModalOpen = true"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          :model-value="(table?.tableApi?.getColumn('title')?.getFilterValue() as string)"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Filter claims..."
          @update:model-value="table?.tableApi?.getColumn('title')?.setFilterValue($event)"
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <USelect
            v-model="statusFilter"
            :items="statusOptions"
            :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
            placeholder="Filter status"
            class="min-w-32"
          />
        </div>
      </div>

      <UTable
        ref="table"
        v-model:column-filters="columnFilters"
        v-model:column-visibility="columnVisibility"
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

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
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

  <!-- Create Claim Modal -->
  <ClaimsFormModal
    :open="isCreateModalOpen"
    mode="create"
    @update:open="isCreateModalOpen = $event"
    @created="onClaimCreated"
    @close="onClaimCreated"
  />

  <!-- Edit Claim Modal -->
  <ClaimsFormModal
    :open="isEditModalOpen"
    :claim="claimToEdit"
    mode="edit"
    @update:open="isEditModalOpen = $event"
    @updated="onClaimUpdated"
    @close="onEditModalClose"
  />

  <!-- Detail Modal -->
  <ClaimsDetailModal
    :open="isDetailModalOpen"
    :claim="selectedClaim"
    @update:open="isDetailModalOpen = $event"
    @close="onDetailModalClose"
  />

  <!-- Submit Modal -->
  <ClaimsSubmitModal
    :open="isSubmitModalOpen"
    :claim="claimToSubmit"
    @update:open="isSubmitModalOpen = $event"
    @close="onSubmitModalClose"
  />

  <!-- Delete Modal -->
  <ClaimsDeleteModal
    :open="isDeleteModalOpen"
    :claim="claimToDelete"
    @update:open="isDeleteModalOpen = $event"
    @deleted="onClaimDeleted"
    @close="onDeleteModalClose"
  />
</template>

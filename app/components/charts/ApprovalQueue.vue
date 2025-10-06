<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { ApprovalQueueItem } from '~/types'

defineProps<{
  data: ApprovalQueueItem[]
}>()

const UBadge = resolveComponent('UBadge')

const formatNumber = new Intl.NumberFormat('en', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2
}).format

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const getStatusColor = (status: string) => {
  const colors = {
    PENDING: 'neutral',
    APPROVED: 'success',
    REJECTED: 'error',
    IN_REVIEW: 'warning'
  }
  return colors[status as keyof typeof colors] || 'neutral'
}

const formatStatus = (status: string) => {
  return status.toLowerCase().replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Table columns
const columns: TableColumn<ApprovalQueueItem>[] = [
  {
    accessorKey: 'title',
    header: 'Claim',
    cell: ({ row }) => {
      return h('div', { class: 'flex flex-col' }, [
        h('p', { class: 'font-medium text-gray-900 dark:text-white' }, row.original.title),
        h('p', { class: 'text-sm text-gray-500 dark:text-gray-400' }, `#${row.original.id.slice(0, 8)}`)
      ])
    }
  },
  {
    accessorKey: 'user.name',
    header: 'Employee',
    cell: ({ row }) => {
      return h('div', { class: 'flex flex-col' }, [
        h('p', { class: 'font-medium text-gray-900 dark:text-white' }, row.original.user.name),
        h('p', { class: 'text-sm text-gray-500 dark:text-gray-400' }, row.original.user.email)
      ])
    }
  },
  {
    accessorKey: 'user.department.name',
    header: 'Department',
    cell: ({ row }) => {
      return h('div', { class: 'text-sm text-gray-900 dark:text-white' },
        row.original.user.department?.name || 'N/A'
      )
    }
  },
  {
    accessorKey: 'totalAmount',
    header: 'Amount',
    cell: ({ row }) => {
      return h('div', { class: 'text-right font-mono font-medium text-gray-900 dark:text-white' },
        formatNumber(row.original.totalAmount)
      )
    }
  },
  {
    accessorKey: 'submittedAt',
    header: 'Submitted',
    cell: ({ row }) => {
      return h('div', { class: 'text-sm text-gray-900 dark:text-white' },
        formatDate(row.original.submittedAt)
      )
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
  }
]

const pagination = ref({
  pageIndex: 0,
  pageSize: 5
})
</script>

<template>
  <UCard :ui="{ root: 'overflow-visible', body: '!p-0' }">
    <template #header>
      <div>
        <p class="text-sm font-medium text-gray-900 dark:text-white">
          Manager Approval Queue
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Pending claims waiting for approval
        </p>
      </div>
    </template>

    <div v-if="data.length === 0" class="text-center py-12">
      <UIcon
        name="i-lucide-inbox"
        class="mx-auto h-12 w-12 text-gray-400"
      />
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
        No pending approvals
      </h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        All claims have been processed.
      </p>
    </div>

    <UTable
      v-else
      v-model:pagination="pagination"
      :pagination-options="{
        getPaginationRowModel: getPaginationRowModel()
      }"
      class="shrink-0"
      :data="data"
      :columns="columns"
      :ui="{
        base: 'table-fixed border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
        td: 'border-b border-default'
      }"
    />

    <div
      v-if="data.length > pagination.pageSize"
      class="flex items-center justify-center gap-1.5 border-t border-default pt-4 mt-4"
    >
      <UPagination
        :default-page="pagination.pageIndex + 1"
        :items-per-page="pagination.pageSize"
        :total="data.length"
        @update:page="(p: number) => pagination.pageIndex = p - 1"
      />
    </div>
  </UCard>
</template>

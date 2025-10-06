<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { Row } from '@tanstack/table-core'
import type { User } from '~/types'

definePageMeta({
  middleware: 'auth'
})

const UAvatar = resolveComponent('UAvatar')
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const toast = useToast()
const table = useTemplateRef('table')

const columnFilters = ref([{
  id: 'name',
  value: ''
}])
const columnVisibility = ref()
const rowSelection = ref({})

const { users: data, loading, fetchUsers } = useUsers()

const userToDelete = ref<User | null>(null)
const editModalOpen = ref(false)
const userToEdit = ref<User | undefined>()

function openEditModal(user: User) {
  userToEdit.value = user
  editModalOpen.value = true
}

function onUpdateCreateSuccess() {
  userToDelete.value = null
  editModalOpen.value = false
  userToEdit.value = undefined
  // Refresh users list
  fetchUsers().catch((error) => {
    console.error('Error fetching users after deletion:', error)
  })
}

function onDeleteSuccess() {
  userToDelete.value = null
  // Refresh users list
  fetchUsers().catch((error) => {
    console.error('Error fetching users after deletion:', error)
  })
}

function getRowItems(row: Row<User>) {
  return [
    {
      type: 'label',
      label: 'Actions'
    },
    {
      label: 'Copy user ID',
      icon: 'i-lucide-copy',
      onSelect() {
        navigator.clipboard.writeText(row.original.id)
        toast.add({
          title: 'Copied to clipboard',
          description: 'User ID copied to clipboard'
        })
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'View user details',
      icon: 'i-lucide-list'
    },
    {
      label: 'View expense claims',
      icon: 'i-lucide-receipt'
    },
    {
      type: 'separator'
    },
    {
      label: 'Edit user',
      icon: 'i-lucide-edit',
      onSelect() {
        openEditModal(row.original)
      }
    },
    {
      label: 'Delete user',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect() {
        userToDelete.value = row.original
      }
    }
  ]
}

const columns: TableColumn<User>[] = [
  {
    accessorKey: 'id',
    header: 'ID'
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const avatarProps = row.original.avatar
        ? typeof row.original.avatar === 'string'
          ? { src: row.original.avatar }
          : row.original.avatar
        : { src: `https://i.pravatar.cc/128?u=${row.original.id}` }

      return h('div', { class: 'flex items-center gap-3' }, [
        h(UAvatar, {
          ...avatarProps,
          size: 'lg'
        }),
        h('div', undefined, [
          h('p', { class: 'font-medium text-highlighted' }, row.original.name),
          h('p', { class: 'text-sm text-muted' }, row.original.email)
        ])
      ])
    }
  },
  {
    accessorKey: 'department',
    header: 'Department',
    cell: ({ row }) => row.original.department?.name || 'No Department'
  },
  {
    accessorKey: 'role',
    header: 'Role',
    filterFn: 'equals',
    cell: ({ row }) => {
      const color = {
        EMPLOYEE: 'primary' as const,
        MANAGER: 'warning' as const,
        ADMIN: 'error' as const
      }[row.original.role]

      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () =>
        row.original.role.toLowerCase()
      )
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

const roleFilter = ref('all')

watch(() => roleFilter.value, (newVal) => {
  if (!table?.value?.tableApi) return

  const roleColumn = table.value.tableApi.getColumn('role')
  if (!roleColumn) return

  if (newVal === 'all') {
    roleColumn.setFilterValue(undefined)
  } else {
    roleColumn.setFilterValue(newVal)
  }
})

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

onMounted(() => {
  // Ensure we have the latest data when the page is mounted
  fetchUsers()
})
</script>

<template>
  <UDashboardPanel id="users">
    <template #header>
      <UDashboardNavbar title="Users">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UsersFormModal />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          :model-value="(table?.tableApi?.getColumn('name')?.getFilterValue() as string)"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Filter names..."
          @update:model-value="table?.tableApi?.getColumn('name')?.setFilterValue($event)"
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <USelect
            v-model="roleFilter"
            :items="[
              { label: 'All', value: 'all' },
              { label: 'Employee', value: 'EMPLOYEE' },
              { label: 'Manager', value: 'MANAGER' },
              { label: 'Admin', value: 'ADMIN' }
            ]"
            :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
            placeholder="Filter role"
            class="min-w-28"
          />
          <UDropdownMenu
            :items="
              table?.tableApi
                ?.getAllColumns()
                .filter((column: any) => column.getCanHide())
                .map((column: any) => ({
                  label: upperFirst(column.id),
                  type: 'checkbox' as const,
                  checked: column.getIsVisible(),
                  onUpdateChecked(checked: boolean) {
                    table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
                  },
                  onSelect(e?: Event) {
                    e?.preventDefault()
                  }
                }))
            "
            :content="{ align: 'end' }"
          >
            <UButton
              label="Display"
              color="neutral"
              variant="outline"
              trailing-icon="i-lucide-settings-2"
            />
          </UDropdownMenu>
        </div>
      </div>

      <UTable
        ref="table"
        v-model:column-filters="columnFilters"
        v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel()
        }"
        class="shrink-0"
        :data="data"
        :columns="columns"
        :loading="loading"
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

  <!-- Edit User Modal -->
  <UsersFormModal
    v-if="userToEdit"
    :user="userToEdit"
    :open="editModalOpen"
    @update:open="editModalOpen = $event"
    @close="onUpdateCreateSuccess()"
  />

  <!-- Delete User Confirmation Modal -->
  <UsersDeleteModal
    v-if="userToDelete"
    :id="[userToDelete.id]"
    :open="!!userToDelete"
    @close="onDeleteSuccess()"
    @update:open="(value: boolean) => { if (!value) userToDelete = null }"
  />
</template>

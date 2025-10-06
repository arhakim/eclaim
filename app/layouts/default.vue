<script setup lang="ts">
const authStore = useAuthStore()

const open = ref(false)

const userRole = computed(() => authStore.user?.role || 'EMPLOYEE')

// Build navigation based on role
const links = computed(() => {
  const mainLinks = [{
    label: 'Home',
    icon: 'i-lucide-house',
    to: '/dashboard',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Claims',
    icon: 'i-lucide-receipt',
    to: '/claims',
    onSelect: () => {
      open.value = false
    }
  }]

  // Add approvals for managers and admins
  if (['MANAGER', 'ADMIN'].includes(userRole.value)) {
    mainLinks.push({
      label: 'Approvals',
      icon: 'i-lucide-clipboard-check',
      to: '/approvals',
      onSelect: () => {
        open.value = false
      }
    })
  }

  // Add users for admins only
  if (userRole.value === 'ADMIN') {
    mainLinks.push({
      label: 'Users',
      icon: 'i-lucide-users',
      to: '/users',
      onSelect: () => {
        open.value = false
      }
    })
  }

  return mainLinks
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <h1 class="text-lg font-semibold text-highlighted">
          <span v-if="!collapsed">{{ useRuntimeConfig().public.companyName }}</span>
          <span v-else>TEO</span>
        </h1>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links"
          orientation="vertical"
          tooltip
          popover
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>

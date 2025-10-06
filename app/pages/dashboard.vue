<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { summaries, loading, error, fetchDashboard } = useDashboard()
const { isNotificationsSlideoverOpen } = _useDashboard()

const refresh = () => {
  fetchDashboard().catch((err) => {
    console.error('Error refreshing dashboard:', err)
  })
}

onMounted(fetchDashboard)
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Expense Dashboard" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UTooltip text="Notifications" :shortcuts="['N']">
            <UButton
              color="neutral"
              variant="ghost"
              square
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip variant="ghost" inset>
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <ClientOnly>
            <div class="flex items-center gap-3">
              <UButton
                size="sm"
                variant="ghost"
                :loading="loading"
                @click="refresh()"
              >
                Refresh
              </UButton>
            </div>
          </ClientOnly>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <ClientOnly>
        <div class="space-y-6 p-6">
          <!-- Error state -->
          <div v-if="error" class="p-6">
            <UAlert
              color="red"
              variant="subtle"
              title="Error loading dashboard"
              :description="error.message"
            />
          </div>

          <!-- Loading state -->
          <div v-else-if="loading && !summaries" class="animate-pulse space-y-6">
            <div class="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div class="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          </div>

          <!-- Manager Dashboard Content -->
          <div v-else-if="summaries" class="space-y-6">
            <!-- Top row: Status chart and Category chart -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartsClaimsStatusChart :data="summaries.statusData" />
              <ChartsClaimCategoryChart :data="summaries.categoryData" />
            </div>
            <ChartsMonthlyAmountChart :data="summaries.monthlyData" />

            <!-- Bottom row: Approval queue -->
            <ChartsApprovalQueue
              :data="summaries.approvalQueue"
            />
          </div>
        </div>
      </ClientOnly>
    </template>
  </UDashboardPanel>
</template>

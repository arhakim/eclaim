<script setup lang="ts">
import { VisSingleContainer, VisDonut, VisBulletLegend } from '@unovis/vue'
import type { ClaimStatusData } from '~/types'

const props = defineProps<{
  data: ClaimStatusData[]
}>()

const getValue = (d: ClaimStatusData) => d.count
const getColor = (d: ClaimStatusData) => getStatusColor(d.status)
const legendItems = computed(() =>
  props.data.map(item => ({
    name: getStatusLabel(item.status) + ' (' + item.count + ')',
    color: getStatusColor(item.status)
  }))
)

const getStatusColor = (status: string) => {
  const colors = {
    PENDING: '#f59e0b', // amber-500
    APPROVED: '#10b981', // emerald-500
    REJECTED: '#ef4444', // red-500
    IN_REVIEW: '#8b5cf6', // violet-500
    DRAFT: '#6b7280' // gray-500
  }
  return colors[status as keyof typeof colors] || '#6b7280'
}

const getStatusLabel = (status: string) => {
  return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}

const totalClaims = computed(() =>
  props.data.reduce((sum, item) => sum + item.count, 0)
)
</script>

<template>
  <UCard ref="cardRef" :ui="{ root: 'overflow-visible', body: '!px-0 !pt-0 !pb-3' }">
    <template #header>
      <div>
        <p class="text-sm font-medium text-gray-900 dark:text-white">
          Claims by Status
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Current status distribution
        </p>
      </div>
    </template>

    <div class="px-6 pb-6">
      <div class="flex items-center gap-8">
        <!-- CSS Pie Chart -->
        <VisSingleContainer :data="data">
          <VisDonut
            :value="getValue"
            :color="getColor"
            :central-label="totalClaims"
            :central-sub-label="'Total Claims'"
            :radius="120"
            :arc-width="50"
          />
        </VisSingleContainer>
        <VisBulletLegend :items="legendItems" />
      </div>
    </div>
  </UCard>
</template>

<style scoped>
.pie-chart {
  position: relative;
}
</style>

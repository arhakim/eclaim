<script setup lang="ts">
import { VisSingleContainer, VisDonut, VisBulletLegend } from '@unovis/vue'
import type { ClaimCategoryData } from '~/types'

const props = defineProps<{
  data: ClaimCategoryData[]
}>()

const getValue = (d: ClaimCategoryData) => d.count
const getColor = (d: ClaimCategoryData) => getCategoryColor(d.category)
const legendItems = computed(() =>
  props.data.map(item => ({
    name: getCategoryLabel(item.category) + ' (' + item.count + ')',
    color: getCategoryColor(item.category)
  }))
)

const getCategoryColor = (category: string) => {
  const colors = {
    TRAVEL: '#3b82f6', // blue-500
    MEALS: '#f59e0b', // amber-500
    ACCOMMODATION: '#8b5cf6', // violet-500
    TRANSPORT: '#10b981', // emerald-500
    OFFICE_SUPPLIES: '#06b6d4', // cyan-500
    TRAINING: '#f97316', // orange-500
    MARKETING: '#ec4899', // pink-500
    OTHER: '#6b7280' // gray-500
  }
  return colors[category as keyof typeof colors] || '#6b7280'
}

const getCategoryLabel = (category: string) => {
  return category.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}

const totalItems = computed(() =>
  props.data.reduce((sum, item) => sum + item.count, 0)
)
</script>

<template>
  <UCard ref="cardRef" :ui="{ root: 'overflow-visible', body: '!px-0 !pt-0 !pb-3' }">
    <template #header>
      <div>
        <p class="text-sm font-medium text-gray-900 dark:text-white">
          Claims by Category
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Distribution by expense category
        </p>
      </div>
    </template>

    <div class="px-6 pb-6">
      <div class="flex items-center gap-8">
        <!-- Donut Chart -->
        <VisSingleContainer :data="data">
          <VisDonut
            :value="getValue"
            :color="getColor"
            :central-label="totalItems"
            :central-sub-label="'Total Items'"
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

<script setup lang="ts">
import { VisXYContainer, VisStackedBar, VisAxis } from '@unovis/vue'
import type { MonthlyData } from '~/types'

const props = defineProps<{
  data: MonthlyData[]
}>()

interface ChartDataItem extends MonthlyData {
  index: number
  monthLabel: string
}

// Transform data for better x-axis handling
const chartData = computed(() => {
  if (!props.data || props.data.length === 0) return []

  // Create indexed data to ensure proper x-axis rendering
  return props.data.map((item, index) => ({
    ...item,
    index,
    monthLabel: item.month
  }))
})

// For a stacked bar chart, we need to define the x accessor and y accessors
const x = (d: ChartDataItem) => d.index // Use index for positioning
const y = [
  (d: ChartDataItem) => d.amount
]

const hasData = computed(() => props.data && props.data.length > 0)

// Custom x-axis labels
const xAxisLabels = computed(() => props.data?.map(d => d.month) || [])

// Custom tick format for x-axis to show month names
const xTickFormat = (index: number) => {
  return xAxisLabels.value[index] || ''
}

const total = computed(() =>
  props.data.reduce((acc: number, { amount }) => acc + amount, 0)
)

const formatNumber = new Intl.NumberFormat('en', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
}).format
</script>

<template>
  <UCard :ui="{ root: 'overflow-visible', body: '!p-6' }">
    <template #header>
      <div>
        <p class="text-sm font-medium text-gray-900 dark:text-white">
          Total Amount per Month
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Current year expenses
        </p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white mt-2">
          {{ formatNumber(total) }}
        </p>
      </div>
    </template>

    <div class="space-y-6">
      <!-- Chart bars -->
      <div v-if="hasData" class="h-64 w-full">
        <VisXYContainer
          :data="chartData"
          :height="250"
        >
          <VisStackedBar
            :x="x"
            :y="y"
            :bar-padding="0.2"
            :color="['#3b82f6', '#10b981']"
          />
          <VisAxis type="x" :tick-format="xTickFormat" />
          <VisAxis type="y" :tick-format="(d: number) => formatNumber(d)" />
        </VisXYContainer>
      </div>
      <div v-else class="h-64 w-full flex items-center justify-center text-gray-500">
        No data available
      </div>
    </div>
  </UCard>
</template>

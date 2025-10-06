<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { CreateExpenseClaimData, ExpenseCategory, ExpenseClaim } from '~/types'
import { createExpenseClaimSchema, type CreateExpenseClaimInput } from '~/utils/schema/claim'

const authStore = useAuthStore()
const { createClaim, updateClaim, uploadReceipt } = useClaims()

interface Props {
  open?: boolean
  claim?: ExpenseClaim | null
  mode?: 'create' | 'edit'
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  claim: null,
  mode: 'create'
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'created': []
  'updated': []
  'close': []
}>()

const internalOpen = ref(props.open || false)

// Watch for external open prop changes
watch(() => props.open, (newValue) => {
  internalOpen.value = newValue || false
})

// Emit changes when internal open changes
watch(internalOpen, (newValue) => {
  emit('update:open', newValue)
  if (!newValue) {
    emit('close')
  }
})

// State
const loading = ref(false)
const selectedReceipt = ref<File | null>(null)
const receiptError = ref<string | null>(null)
const uploadedFiles = ref<File | File[] | null>(null)

// Form data - initialize based on mode
const initializeForm = () => {
  if (props.mode === 'edit' && props.claim) {
    return {
      title: props.claim.title,
      description: props.claim.description || '',
      expenseDate: new Date(props.claim.expenseDate),
      items: props.claim.items.map(item => ({
        description: item.description,
        amount: item.amount,
        category: item.category as ExpenseCategory
      }))
    }
  } else {
    return {
      title: '',
      description: '',
      expenseDate: new Date(),
      items: []
    }
  }
}

const form = ref<CreateExpenseClaimData>(initializeForm())

// Category options with label-value pairs for better UX
const categoryOptions = [
  { label: 'Travel', value: 'TRAVEL' },
  { label: 'Meals', value: 'MEALS' },
  { label: 'Accommodation', value: 'ACCOMMODATION' },
  { label: 'Transport', value: 'TRANSPORT' },
  { label: 'Office Supplies', value: 'OFFICE_SUPPLIES' },
  { label: 'Training', value: 'TRAINING' },
  { label: 'Marketing', value: 'MARKETING' },
  { label: 'Other', value: 'OTHER' }
]

// Computed
const totalAmount = computed(() => {
  return form.value.items.reduce((sum, item) => {
    const amount = typeof item.amount === 'string' ? parseFloat(item.amount) || 0 : (item.amount || 0)
    return sum + amount
  }, 0)
})

const formattedExpenseDate = computed({
  get() {
    const date = form.value.expenseDate
    if (date instanceof Date) {
      return date.toISOString().split('T')[0]
    }
    return date || ''
  },
  set(value: string) {
    form.value.expenseDate = new Date(value)
  }
})

const todayFormatted = computed(() => {
  return new Date().toISOString().split('T')[0]
})

// Methods
function addExpenseItem() {
  form.value.items.push({
    description: '',
    amount: 0,
    category: 'OTHER' as ExpenseCategory
  })
}

function removeExpenseItem(index: number) {
  form.value.items.splice(index, 1)
}

function removeReceipt() {
  selectedReceipt.value = null
  uploadedFiles.value = null
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function onSubmit(event: FormSubmitEvent<CreateExpenseClaimInput>) {
  loading.value = true
  receiptError.value = null

  try {
    if (props.mode === 'edit' && props.claim) {
      // Update existing claim
      const claimData = {
        ...event.data,
        userId: authStore.user?.id
      }
      const updatedClaim = await updateClaim(props.claim.id, claimData)

      // Upload new receipt if selected
      if (updatedClaim.id && selectedReceipt.value) {
        await uploadReceipt(updatedClaim.id, selectedReceipt.value)
      }

      resetForm()
      emit('updated')
    } else {
      if (!selectedReceipt.value) {
        receiptError.value = 'Receipt is required'
        return
      }

      const claimData = {
        ...event.data,
        userId: authStore.user?.id
      }
      const createdClaim = await createClaim(claimData)

      if (createdClaim.id && selectedReceipt.value) {
        await uploadReceipt(createdClaim.id, selectedReceipt.value)
      }

      resetForm()
      emit('created')
    }

  } catch (error: unknown) {
    console.error('Error saving claim:', error)
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.value = {
    title: '',
    description: '',
    expenseDate: new Date(),
    items: []
  }
  selectedReceipt.value = null
  receiptError.value = null
  uploadedFiles.value = null
}

// Watch for modal close to reset form
watch(internalOpen, (open) => {
  if (!open) {
    resetForm()
  } else {
    // Reinitialize form when modal opens
    form.value = initializeForm()
  }
})

// Watch for props changes to reinitialize form
watch(() => [props.claim, props.mode], () => {
  if (internalOpen.value) {
    form.value = initializeForm()
  }
}, { deep: true })

// Watch for uploaded files changes
watch(uploadedFiles, (newFiles) => {
  let file: File | null = null

  // Handle different possible formats from UFileUpload
  if (newFiles instanceof File) {
    // Single file object
    file = newFiles
  } else if (Array.isArray(newFiles) && newFiles.length > 0 && newFiles[0]) {
    // Array of files
    file = newFiles[0]
  }

  if (file) {
    selectedReceipt.value = file
    receiptError.value = null
  } else {
    selectedReceipt.value = null
  }
}, { deep: true, immediate: true })
</script>
<template>
  <UModal
    v-model:open="internalOpen"
    :title="mode === 'edit' ? 'Edit Expense Claim' : 'Create New Expense Claim'"
    :ui="{
      content: 'max-w-4xl'
    }"
  >
    <template #description>
      <p class="text-sm text-gray-500">
        {{ mode === 'edit' ? 'Update the expense claim details.' : 'Fill in the details to create a new expense claim.' }}
      </p>
    </template>

    <template #body>
      <UForm
        :schema="createExpenseClaimSchema"
        :state="form"
        class="space-y-6"
        @submit="onSubmit"
      >
        <!-- Basic Information -->
        <div class="space-y-4">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white">
            Basic Information
          </h4>

          <UFormField label="Title" name="title" required>
            <UInput
              v-model="form.title"
              placeholder="Enter claim title"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Description" name="description">
            <UTextarea
              v-model="form.description"
              placeholder="Optional description"
              :rows="3"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Expense Date" name="expenseDate" required>
            <UInput
              v-model="formattedExpenseDate"
              type="date"
              :max="todayFormatted"
            />
          </UFormField>
        </div>

        <!-- Expense Items -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-medium text-gray-900 dark:text-white">
              Expense Items
            </h4>
            <UButton
              size="sm"
              color="primary"
              variant="outline"
              icon="i-heroicons-plus"
              label="Add Item"
              @click="addExpenseItem"
            />
          </div>

          <div v-if="form.items.length === 0" class="text-center py-6 text-gray-500 dark:text-gray-400">
            <UIcon name="i-heroicons-receipt-percent" class="w-8 h-8 mx-auto mb-2" />
            <p class="text-sm">
              No expense items added yet
            </p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="(item, index) in form.items"
              :key="index"
              class="flex items-end gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <UFormField :name="`items.${index}.description`" label="Description" class="flex-1">
                <UInput
                  v-model="item.description"
                  placeholder="e.g., Taxi to airport"
                  class="w-full"
                />
              </UFormField>

              <UFormField :name="`items.${index}.amount`" label="Amount" class="w-32">
                <UInput
                  v-model.number="item.amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                >
                  <template #leading>
                    $
                  </template>
                </UInput>
              </UFormField>

              <UFormField :name="`items.${index}.category`" label="Category" class="w-40">
                <USelect
                  v-model="item.category"
                  :items="categoryOptions"
                  placeholder="Select category"
                />
              </UFormField>

              <UButton
                color="red"
                variant="ghost"
                icon="i-heroicons-trash"
                size="sm"
                class="mb-0.5"
                @click="removeExpenseItem(index)"
              />
            </div>
          </div>

          <div v-if="form.items.length > 0" class="flex justify-end">
            <div class="text-lg font-semibold">
              Total: ${{ Number(totalAmount).toFixed(2) }}
            </div>
          </div>
        </div>

        <!-- Receipt Upload -->
        <div class="space-y-4">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white">
            Receipt <span v-if="mode === 'create'" class="text-red-500">*</span>
            <span v-if="mode === 'edit'" class="text-sm text-gray-500">(optional - upload to replace existing)</span>
          </h4>

          <div class="flex items-center justify-center w-full">
            <UFileUpload
              v-model="uploadedFiles"
              icon="i-lucide-file-text"
              label="Drop your receipt here"
              description="Images (PNG, JPG, GIF) or PDF files (max. 5MB)"
              class="w-96 min-h-48"
              accept="image/*,.pdf,application/pdf"
              :max-size="5 * 1024 * 1024"
            />
          </div>

          <div v-if="receiptError" class="text-red-500 text-sm mt-2">
            {{ receiptError }}
          </div>

          <div v-if="selectedReceipt" class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <UIcon
              :name="selectedReceipt.type === 'application/pdf' ? 'i-heroicons-document-text' : 'i-heroicons-photo'"
              class="w-5 h-5 text-gray-400"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300 flex-1">
              {{ selectedReceipt.name }}
            </span>
            <span class="text-xs text-gray-500">
              {{ formatFileSize(selectedReceipt.size) }}
            </span>
            <UButton
              color="red"
              variant="ghost"
              icon="i-heroicons-x-mark"
              size="2xs"
              @click="removeReceipt"
            />
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <UButton
            color="gray"
            variant="solid"
            label="Cancel"
            @click="internalOpen = false"
          />
          <UButton
            type="submit"
            color="primary"
            variant="solid"
            :label="mode === 'edit' ? 'Update Claim' : 'Create Claim'"
            :loading="loading"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

import type { ExpenseClaim, CreateExpenseClaimData } from '~/types'

export const useClaims = () => {
  const claims = ref<ExpenseClaim[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchClaims = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ data: ExpenseClaim[], count: number }>('/api/claims')
      claims.value = response.data
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch claims'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createClaim = async (data: CreateExpenseClaimData) => {
    loading.value = true
    error.value = null

    try {
      const claim = await $fetch<ExpenseClaim>('/api/claims', {
        method: 'POST',
        body: {
          title: data.title,
          description: data.description,
          expenseDate: data.expenseDate,
          items: data.items,
          userId: data.userId
        }
      })

      // Add to local state
      claims.value.unshift(claim)

      return claim
    } catch (err) {
      error.value = 'Failed to create claim'
      console.error('Error creating claim:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update an existing claim
  const updateClaim = async (claimId: string, data: CreateExpenseClaimData) => {
    loading.value = true
    error.value = null

    try {
      const updatedClaim = await $fetch<ExpenseClaim>(`/api/claims/${claimId}`, {
        method: 'PUT',
        body: {
          title: data.title,
          description: data.description,
          expenseDate: data.expenseDate,
          items: data.items
        }
      })

      // Update local state
      const index = claims.value.findIndex(c => c.id === claimId)
      if (index !== -1) {
        claims.value[index] = updatedClaim
      }

      return updatedClaim
    } catch (err) {
      error.value = 'Failed to update claim'
      console.error('Error updating claim:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete a claim
  const deleteClaim = async (claimId: string) => {
    loading.value = true
    error.value = null

    try {
      await $fetch(`/api/claims/${claimId}`, {
        method: 'DELETE'
      })

      // Remove from local state
      const index = claims.value.findIndex(c => c.id === claimId)
      if (index !== -1) {
        claims.value.splice(index, 1)
      }

      return true
    } catch (err) {
      error.value = 'Failed to delete claim'
      console.error('Error deleting claim:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Submit a claim for approval
  const submitClaim = async (claimId: string) => {
    loading.value = true
    error.value = null

    try {
      const updatedClaim = await $fetch<ExpenseClaim>(`/api/claims/${claimId}/submit`, {
        method: 'PUT'
      })

      // Update local state
      const index = claims.value.findIndex(c => c.id === claimId)
      if (index !== -1) {
        claims.value[index] = updatedClaim
      }

      return updatedClaim
    } catch (err) {
      error.value = 'Failed to submit claim'
      console.error('Error submitting claim:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Upload receipt for a claim
  const uploadReceipt = async (claimId: string, file: File) => {
    loading.value = true
    error.value = null

    try {
      const formData = new FormData()
      formData.append('receipt', file)

      const receipt = await $fetch(`/api/claims/${claimId}/upload-receipt`, {
        method: 'POST',
        body: formData
      })

      // Update local claim state
      const claim = claims.value.find(c => c.id === claimId)
      if (claim) {
        claim.receipts = [receipt as any]
      }

      return receipt
    } catch (err) {
      error.value = 'Failed to upload receipt'
      console.error('Error uploading receipt:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Reset state
  const reset = () => {
    claims.value = []
    loading.value = false
    error.value = null
  }

  return {
    // State
    claims: readonly(claims),
    loading: readonly(loading),
    error: readonly(error),

    // Actions
    fetchClaims,
    createClaim,
    updateClaim,
    deleteClaim,
    submitClaim,
    uploadReceipt,

    // Utils
    reset
  }
}

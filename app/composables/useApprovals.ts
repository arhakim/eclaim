import type { ExpenseClaim } from '~/types'

export const useApprovals = () => {
  const pending = ref(false)
  const claims = ref<ExpenseClaim[]>([])

  // Fetch claims awaiting approval
  async function fetchPendingClaims() {
    try {
      pending.value = true
      const { data } = await $fetch<{ data: ExpenseClaim[] }>('/api/claims?status=IN_REVIEW')
      claims.value = data || []
    } catch (error) {
      console.error('Error fetching pending claims:', error)
      claims.value = []
    } finally {
      pending.value = false
    }
  }

  // Approve a claim
  async function approveClaim(claimId: string, userId: string, comments?: string) {
    try {
      await $fetch(`/api/claims/${claimId}/approve`, {
        method: 'PUT',
        body: { userId, comments }
      })

      useToast().add({
        title: 'Claim Approved',
        description: 'The claim has been approved successfully.',
        color: 'success'
      })

      // Refresh claims list
      await fetchPendingClaims()
      return true
    } catch (error: any) {
      console.error('Error approving claim:', error)
      useToast().add({
        title: 'Error',
        description: error.data?.message || 'Failed to approve claim',
        color: 'error'
      })
      return false
    }
  }

  // Reject a claim
  async function rejectClaim(claimId: string, userId: string, comments: string) {
    try {
      await $fetch(`/api/claims/${claimId}/reject`, {
        method: 'PUT',
        body: { userId, comments }
      })

      useToast().add({
        title: 'Claim Rejected',
        description: 'The claim has been rejected.',
        color: 'warning'
      })

      // Refresh claims list
      await fetchPendingClaims()
      return true
    } catch (error: any) {
      console.error('Error rejecting claim:', error)
      useToast().add({
        title: 'Error',
        description: error.data?.message || 'Failed to reject claim',
        color: 'error'
      })
      return false
    }
  }

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

  function getDaysWaiting(submittedAt: string | Date | undefined) {
    if (!submittedAt) return 'N/A'
    const days = Math.floor((Date.now() - new Date(submittedAt).getTime()) / (1000 * 60 * 60 * 24))
    return `${days} day${days !== 1 ? 's' : ''}`
  }

  return {
    // State
    pending: readonly(pending),
    claims: readonly(claims),

    // Actions
    fetchPendingClaims,
    approveClaim,
    rejectClaim,

    // Helpers
    getStatusColor,
    formatStatus,
    formatDate,
    formatCurrency,
    getDaysWaiting
  }
}

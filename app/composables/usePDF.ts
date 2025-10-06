import type { ExpenseClaim } from '~/types'

export const usePDF = () => {
  /**
   * Downloads a PDF report for an expense claim
   * @param claim - The expense claim to generate PDF for
   */
  const downloadClaimPDF = (claim: ExpenseClaim) => {
    // Create a temporary link element to trigger download
    const link = document.createElement('a')
    link.href = `/api/claims/${claim.id}/download-pdf`
    link.download = `expense-claim-${claim.id}.pdf`
    link.setAttribute('target', '_blank')

    // Append to body, click, and remove
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return {
    downloadClaimPDF
  }
}

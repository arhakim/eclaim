import prisma from '../../../../lib/prisma'

export default defineEventHandler(async (event) => {
  const claimId = getRouterParam(event, 'id')
  if (!claimId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Claim ID is required'
    })
  }

  try {
    // First, check if the claim exists
    const existingClaim = await prisma.expenseClaim.findUnique({
      where: { id: claimId }
    })

    if (!existingClaim) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Claim not found'
      })
    }

    // Only allow deleting claims in DRAFT status
    if (existingClaim.status !== 'DRAFT') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Only draft claims can be deleted'
      })
    }

    // Delete the claim (this will cascade delete items and receipts due to foreign key constraints)
    await prisma.expenseClaim.delete({
      where: { id: claimId }
    })

    return { success: true, message: 'Claim deleted successfully' }
  } catch (error) {
    console.error('Error deleting claim:', error)

    // Re-throw HTTP errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete claim'
    })
  }
})

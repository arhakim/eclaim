import { z } from 'zod'
import prisma from '../../../../lib/prisma'
import { updateExpenseClaimWithItemsSchema } from '../../../../app/utils/schema'

export default defineEventHandler(async (event) => {
  const claimId = getRouterParam(event, 'id')
  if (!claimId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Claim ID is required'
    })
  }

  try {
    // Parse and validate request body
    const body = await readBody(event)
    const validatedData = updateExpenseClaimWithItemsSchema.parse(body)

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

    // Only allow updating claims in DRAFT status
    if (existingClaim.status !== 'DRAFT') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Only draft claims can be updated'
      })
    }

    // Calculate total amount
    const totalAmount = validatedData.items.reduce((sum: number, item) => sum + item.amount, 0)

    // Update the claim and its items in a transaction
    const updatedClaim = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.expenseItem.deleteMany({
        where: { claimId }
      })

      // Update the claim with new data and items
      return await tx.expenseClaim.update({
        where: { id: claimId },
        data: {
          title: validatedData.title,
          description: validatedData.description,
          expenseDate: validatedData.expenseDate,
          totalAmount,
          updatedAt: new Date(),
          items: {
            create: validatedData.items.map((item) => ({
              description: item.description,
              amount: item.amount,
              category: item.category
            }))
          }
        },
        include: {
          items: true,
          receipts: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })
    })

    return updatedClaim
  } catch (error) {
    console.error('Error updating claim:', error)

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: error.issues
      })
    }

    // Re-throw HTTP errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update claim'
    })
  }
})

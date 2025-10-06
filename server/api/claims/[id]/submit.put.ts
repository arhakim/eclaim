import { z } from 'zod'
import prisma from '../../../../lib/prisma'

export default defineEventHandler(async (event) => {
  try {
    const claimId = getRouterParam(event, 'id')
    if (!claimId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Claim ID is required'
      })
    }

    const existingClaim = await prisma.expenseClaim.findFirst({
      where: {
        id: claimId
      },
      include: {
        items: true
      }
    })

    if (!existingClaim) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Draft claim not found'
      })
    }

    // Validate that claim has items
    if (existingClaim.items.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot submit claim without expense items'
      })
    }

    // Update claim status to IN_REVIEW and set submission timestamp
    const updatedClaim = await prisma.expenseClaim.update({
      where: { id: claimId },
      data: {
        status: 'IN_REVIEW',
        submittedAt: new Date()
      },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        receipts: true,
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    return updatedClaim
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation Error',
        data: error.format()
      })
    }

    console.error('Error submitting expense claim:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error'
    })
  }
})

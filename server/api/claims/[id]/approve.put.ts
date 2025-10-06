import { z } from 'zod'
import prisma from '../../../../lib/prisma'
import { sendApprovalNotification } from '../../../utils/notifications'

const approveSchema = z.object({
  userId: z.string(),
  comments: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const claimId = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!claimId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Claim ID is required'
    })
  }

  // Validate request body
  const { userId, comments } = approveSchema.parse(body)

  try {
    // Verify the user has manager role
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || !['MANAGER', 'ADMIN'].includes(user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Manager role required'
      })
    }

    // Get the claim and verify it exists and is in correct status
    const claim = await prisma.expenseClaim.findUnique({
      where: { id: claimId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!claim) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Claim not found'
      })
    }

    if (claim.status !== 'IN_REVIEW') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Claim is not in review status'
      })
    }

    // Update claim status and create approval record
    const updatedClaim = await prisma.$transaction(async (tx) => {
      // Update claim status
      const updated = await tx.expenseClaim.update({
        where: { id: claimId },
        data: { status: 'APPROVED' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          items: true,
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

      // Create approval record
      await tx.approval.create({
        data: {
          status: 'APPROVED',
          comments,
          claimId,
          approverId: userId,
          approvedAt: new Date()
        }
      })

      return updated
    })

    // Send notification to employee
    await sendApprovalNotification({
      claimId,
      claimTitle: claim.title,
      recipientId: claim.userId,
      type: 'APPROVED',
      approverName: user.name,
      approverId: userId,
      comments
    })

    return {
      success: true,
      message: 'Claim approved successfully',
      data: updatedClaim
    }
  } catch (error: unknown) {
    console.error('Error approving claim:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to approve claim'
    })
  }
})

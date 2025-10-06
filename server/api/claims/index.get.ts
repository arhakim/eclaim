import prisma from '../../../lib/prisma'
import type { ExpenseClaimStatus } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Get query parameters
    const query = getQuery(event)
    const status = query.status as ExpenseClaimStatus | undefined

    // Build where clause
    const whereClause = status ? { status } : {}

    const claims = await prisma.expenseClaim.findMany({
      where: whereClause,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return {
      data: claims,
      count: claims.length
    }
  } catch (error) {
    console.error('Error fetching expense claims:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error'
    })
  }
})

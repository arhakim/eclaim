import { z } from 'zod'
import { createExpenseClaimSchema } from '~/utils/schema/claim'
import prisma from '../../../lib/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Parse and validate request body
    const body = await readBody(event)
    const validatedData = createExpenseClaimSchema.parse(body)

    // Validate required fields
    if (!validatedData.userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    // Calculate total amount from items
    const totalAmount = validatedData.items.reduce((sum, item) => sum + item.amount, 0)

    // Create claim with items in a transaction
    const claim = await prisma.expenseClaim.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        totalAmount,
        expenseDate: validatedData.expenseDate,
        userId: validatedData.userId,
        items: {
          create: validatedData.items.map(item => ({
            description: item.description,
            amount: item.amount,
            category: item.category
          }))
        }
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

    return claim
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation Error',
        data: error.format()
      })
    }

    console.error('Error creating expense claim:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error'
    })
  }
})

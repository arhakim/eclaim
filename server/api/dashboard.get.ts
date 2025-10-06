import prisma from '../../lib/prisma'

export default defineEventHandler(async (_event) => {
  try {
    // Get query parameters
    // const query = getQuery(event)

    // Get claims by status
    const claimsByStatus = await prisma.expenseClaim.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })

    const totalClaims = claimsByStatus.reduce((sum, item) => sum + item._count.status, 0)

    const statusData = claimsByStatus.map(item => ({
      status: item.status,
      count: item._count.status,
      percentage: totalClaims > 0 ? (item._count.status / totalClaims) * 100 : 0
    }))

    // Get monthly data for current year using Prisma aggregation
    const currentYear = new Date().getFullYear()
    const startOfYear = new Date(currentYear, 0, 1)
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59)

    // Get all claims for the period first
    const yearClaims = await prisma.expenseClaim.findMany({
      where: {
        submittedAt: {
          gte: startOfYear,
          lte: endOfYear
        }
      },
      select: {
        submittedAt: true,
        totalAmount: true
      }
    })

    // Group by month manually
    const monthlyStats = new Map<string, { amount: number, count: number }>()

    yearClaims.forEach((claim) => {
      if (claim.submittedAt) {
        const monthKey = claim.submittedAt.toLocaleDateString('en-US', { month: 'short' })
        const existing = monthlyStats.get(monthKey) || { amount: 0, count: 0 }
        monthlyStats.set(monthKey, {
          amount: existing.amount + Number(claim.totalAmount),
          count: existing.count + 1
        })
      }
    })

    // Convert to array format
    const monthlyData = Array.from(monthlyStats.entries()).map(([month, stats]) => ({
      month,
      amount: stats.amount,
      count: stats.count
    }))

    // Get claims by category (based on expense items)
    const claimsByCategory = await prisma.expenseItem.groupBy({
      by: ['category'],
      _count: {
        claimId: true
      },
      _sum: {
        amount: true
      }
    })

    const categoryData = claimsByCategory.map(item => ({
      category: item.category,
      count: item._count.claimId,
      totalAmount: Number(item._sum.amount || 0)
    }))

    // Get approval queue (pending claims)
    const pendingClaims = await prisma.expenseClaim.findMany({
      where: {
        status: {
          in: ['SUBMITTED', 'IN_REVIEW']
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        submittedAt: 'asc'
      },
      take: 10 // Limit to latest 10 for dashboard
    })

    return {
      statusData,
      monthlyData,
      categoryData,
      approvalQueue: pendingClaims.map(claim => ({
        id: claim.id,
        title: claim.title,
        user: claim.user,
        totalAmount: Number(claim.totalAmount),
        submittedAt: claim.submittedAt?.toISOString() || '',
        status: claim.status
      }))
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Manager dashboard error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})

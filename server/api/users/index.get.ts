import prisma from '../../../lib/prisma'

export default eventHandler(async () => {
  try {
    const users = await prisma.user.findMany({
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            employees: true,
            claims: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return users
  } catch (error) {
    console.error('Error fetching users:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch users'
    })
  }
})

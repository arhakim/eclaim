import prisma from '../../../lib/prisma'

export default eventHandler(async () => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    return departments
  } catch (error) {
    console.error('Error fetching departments:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch departments'
    })
  }
})

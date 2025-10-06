import prisma from '../../../lib/prisma'
import bcrypt from 'bcryptjs'

export default eventHandler(async (event) => {
  try {
    const userId = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { name, email, password, role, departmentId } = body

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      })

      if (emailExists) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Email is already taken by another user'
        })
      }
    }

    // Prepare update data
    const updateData = {
      ...(name && { name }),
      ...(email && { email }),
      ...(role && { role }),
      ...(departmentId !== undefined && { departmentId: departmentId || null }),
      ...(password && { password: await bcrypt.hash(password, 12) })
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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
      }
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return userWithoutPassword
  } catch (error) {
    console.error('Error updating user:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update user'
    })
  }
})

import prisma from '../../../lib/prisma'
import bcrypt from 'bcryptjs'

export default eventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { name, email, password, role, departmentId } = body

    // Validate required fields
    if (!name || !email || !password || !role) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Name, email, password, and role are required'
      })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      throw createError({
        statusCode: 409,
        statusMessage: 'User with this email already exists'
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        departmentId: departmentId || null
      },
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
    console.error('Error creating user:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create user'
    })
  }
})

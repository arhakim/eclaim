import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding ...')

  // Create sample departments
  const departments = [
    {
      name: 'Human Resources',
      description: 'Manages employee relations, recruitment, and company policies'
    },
    {
      name: 'Finance',
      description: 'Handles financial planning, accounting, and budget management'
    },
    {
      name: 'Marketing',
      description: 'Responsible for brand promotion, advertising, and market research'
    },
    {
      name: 'Sales',
      description: 'Drives revenue through customer acquisition and relationship management'
    },
    {
      name: 'Engineering',
      description: 'Develops and maintains software products and technical infrastructure'
    },
    {
      name: 'Operations',
      description: 'Oversees daily business operations and process optimization'
    },
    {
      name: 'Legal',
      description: 'Provides legal counsel and ensures regulatory compliance'
    }
  ]

  console.log('Creating departments...')
  const createdDepartments = []

  for (const dept of departments) {
    const department = await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: {
        name: dept.name,
        description: dept.description
      }
    })
    createdDepartments.push(department)
    console.log(`Created department: ${department.name}`)
  }

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      departmentId: createdDepartments[0].id // Assign to HR department
    }
  })
  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

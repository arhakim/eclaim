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

  // Create a manager user
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      name: 'Manager User',
      password: hashedPassword,
      role: 'MANAGER',
      departmentId: createdDepartments[1].id // Assign to Finance department
    }
  })

  // Create employee users
  const employees = [
    { email: 'employee1@example.com', name: 'John Doe', departmentId: createdDepartments[1].id, managerId: managerUser.id },
    { email: 'employee2@example.com', name: 'Jane Smith', departmentId: createdDepartments[1].id, managerId: managerUser.id },
    { email: 'employee3@example.com', name: 'Bob Johnson', departmentId: createdDepartments[2].id, managerId: managerUser.id }
  ]

  const createdEmployees = []
  for (const emp of employees) {
    const employee = await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        email: emp.email,
        name: emp.name,
        password: hashedPassword,
        role: 'EMPLOYEE',
        departmentId: emp.departmentId,
        managerId: emp.managerId
      }
    })
    createdEmployees.push(employee)
  }

  // Create sample expense claims
  const currentYear = new Date().getFullYear()
  const sampleClaims = [
    {
      title: 'Business Trip to New York',
      description: 'Travel expenses for client meeting',
      totalAmount: 1250.00,
      expenseDate: new Date(currentYear, 0, 15), // January
      submittedAt: new Date(currentYear, 0, 16),
      status: 'APPROVED' as const,
      userId: createdEmployees[0].id
    },
    {
      title: 'Office Supplies',
      description: 'Printer paper and stationery',
      totalAmount: 85.50,
      expenseDate: new Date(currentYear, 1, 10), // February
      submittedAt: new Date(currentYear, 1, 11),
      status: 'SUBMITTED' as const,
      userId: createdEmployees[1].id
    },
    {
      title: 'Conference Registration',
      description: 'Tech conference registration fee',
      totalAmount: 750.00,
      expenseDate: new Date(currentYear, 2, 5), // March
      submittedAt: new Date(currentYear, 2, 6),
      status: 'SUBMITTED' as const,
      userId: createdEmployees[2].id
    },
    {
      title: 'Client Lunch',
      description: 'Business lunch with potential client',
      totalAmount: 125.00,
      expenseDate: new Date(currentYear, 3, 20), // April
      submittedAt: new Date(currentYear, 3, 21),
      status: 'REJECTED' as const,
      userId: createdEmployees[0].id
    },
    {
      title: 'Software License',
      description: 'Annual software subscription',
      totalAmount: 299.99,
      expenseDate: new Date(currentYear, 4, 1), // May
      submittedAt: new Date(currentYear, 4, 2),
      status: 'IN_REVIEW' as const,
      userId: createdEmployees[1].id
    }
  ]

  for (const claim of sampleClaims) {
    await prisma.expenseClaim.upsert({
      where: { id: `claim-${claim.title.replace(/\s+/g, '-').toLowerCase()}` },
      update: {},
      create: {
        id: `claim-${claim.title.replace(/\s+/g, '-').toLowerCase()}`,
        ...claim
      }
    })
  }

  console.log(`Created admin user with id: ${adminUser.id}`)
  console.log(`Created manager user with id: ${managerUser.id}`)
  console.log(`Created ${createdEmployees.length} employees`)
  console.log(`Created ${sampleClaims.length} sample expense claims`)
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

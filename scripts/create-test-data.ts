import prisma from '../lib/prisma'

/**
 * Create test data for scheduler testing
 * This script creates:
 * - A manager user
 * - An employee user under that manager
 * - Some expense claims in IN_REVIEW status
 */
async function createTestData() {
  try {
    console.log('🧪 Creating test data for scheduler...')

    // Create a department
    const department = await prisma.department.upsert({
      where: { name: 'Test Department' },
      update: {},
      create: {
        name: 'Test Department',
        description: 'Department for testing scheduler'
      }
    })

    // Create a manager user
    const manager = await prisma.user.upsert({
      where: { email: 'manager@test.com' },
      update: {},
      create: {
        email: 'manager@test.com',
        name: 'Test Manager',
        password: 'hashedpassword', // In real app, this should be properly hashed
        role: 'MANAGER',
        departmentId: department.id
      }
    })

    // Create an employee user under the manager
    const employee = await prisma.user.upsert({
      where: { email: 'employee@test.com' },
      update: {},
      create: {
        email: 'employee@test.com',
        name: 'Test Employee',
        password: 'hashedpassword',
        role: 'EMPLOYEE',
        departmentId: department.id,
        managerId: manager.id
      }
    })

    // Create test claims in IN_REVIEW status
    const testClaims = [
      {
        title: 'Business Travel Expenses',
        description: 'Flight and hotel for client meeting',
        totalAmount: 1250.00,
        currency: 'USD',
        status: 'IN_REVIEW' as const,
        expenseDate: new Date('2024-10-01'),
        submittedAt: new Date('2024-10-02'), // 4+ days ago
        userId: employee.id
      },
      {
        title: 'Office Supplies',
        description: 'Stationery and equipment',
        totalAmount: 350.75,
        currency: 'USD',
        status: 'IN_REVIEW' as const,
        expenseDate: new Date('2024-10-03'),
        submittedAt: new Date('2024-10-04'), // 2+ days ago
        userId: employee.id
      },
      {
        title: 'Client Lunch Meeting',
        description: 'Business meal with potential client',
        totalAmount: 125.50,
        currency: 'USD',
        status: 'IN_REVIEW' as const,
        expenseDate: new Date('2024-10-05'),
        submittedAt: new Date(), // Today
        userId: employee.id
      }
    ]

    for (const claimData of testClaims) {
      // Check if claim already exists
      const existingClaim = await prisma.expenseClaim.findFirst({
        where: {
          userId: claimData.userId,
          title: claimData.title
        }
      })

      let claim
      if (existingClaim) {
        // Update existing claim
        claim = await prisma.expenseClaim.update({
          where: { id: existingClaim.id },
          data: {
            status: claimData.status,
            submittedAt: claimData.submittedAt
          }
        })
        console.log(`✅ Updated claim: ${claim.title}`)
      } else {
        // Create new claim
        claim = await prisma.expenseClaim.create({
          data: {
            ...claimData,
            items: {
              create: [
                {
                  description: 'Sample expense item',
                  amount: claimData.totalAmount,
                  category: 'OTHER'
                }
              ]
            }
          }
        })
        console.log(`✅ Created claim: ${claim.title}`)
      }
    }

    console.log('🎉 Test data created successfully!')
    console.log('📋 Summary:')
    console.log(`- Manager: ${manager.name} (${manager.email})`)
    console.log(`- Employee: ${employee.name} (${employee.email})`)
    console.log(`- Claims in review: ${testClaims.length}`)
    console.log('- Total amount pending: $1,726.25')

    return {
      manager,
      employee,
      department,
      claimCount: testClaims.length
    }
  } catch (error) {
    console.error('❌ Error creating test data:', error)
    throw error
  }
}

/**
 * Clean up test data
 */
async function cleanupTestData() {
  try {
    console.log('🧹 Cleaning up test data...')

    // Delete test claims
    await prisma.expenseClaim.deleteMany({
      where: {
        user: {
          email: { in: ['employee@test.com', 'manager@test.com'] }
        }
      }
    })

    // Delete test users
    await prisma.user.deleteMany({
      where: {
        email: { in: ['employee@test.com', 'manager@test.com'] }
      }
    })

    // Delete test department
    await prisma.department.deleteMany({
      where: {
        name: 'Test Department'
      }
    })

    console.log('✅ Test data cleaned up successfully!')
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error)
    throw error
  }
}

// Export functions for use in tests or scripts
export { createTestData, cleanupTestData }

// If running directly, create test data
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

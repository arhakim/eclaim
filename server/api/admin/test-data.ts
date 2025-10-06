import { createTestData, cleanupTestData } from '../../../scripts/create-test-data'

export default defineEventHandler(async (event) => {
  try {
    const method = getMethod(event)

    if (method === 'POST') {
      // Create test data
      const result = await createTestData()
      return {
        success: true,
        message: 'Test data created successfully',
        data: result
      }
    } else if (method === 'DELETE') {
      // Cleanup test data
      await cleanupTestData()
      return {
        success: true,
        message: 'Test data cleaned up successfully'
      }
    } else {
      throw createError({
        statusCode: 405,
        statusMessage: 'Method not allowed'
      })
    }
  } catch (error) {
    console.error('Error managing test data:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to manage test data'
    })
  }
})

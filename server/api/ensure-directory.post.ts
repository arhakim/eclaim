import { mkdir } from 'fs/promises'
import { existsSync } from 'fs'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!body || !body.path) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Directory path is required'
      })
    }

    const { path } = body

    // Check if directory already exists
    if (existsSync(path)) {
      return { success: true, message: 'Directory already exists' }
    }

    // Create directory recursively
    await mkdir(path, { recursive: true })

    return { success: true, message: 'Directory created successfully' }
  } catch (error) {
    console.error('Error creating directory:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create directory'
    })
  }
})

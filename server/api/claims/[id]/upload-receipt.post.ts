import { writeFile } from 'fs/promises'
import { join } from 'path'
import { createHash } from 'crypto'
import prisma from '../../../../lib/prisma'

export default defineEventHandler(async (event) => {
  try {
    const claimId = getRouterParam(event, 'id')
    if (!claimId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Claim ID is required'
      })
    }

    // Verify claim belongs to user
    const existingClaim = await prisma.expenseClaim.findFirst({
      where: {
        id: claimId
      }
    })

    if (!existingClaim) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Claim not found'
      })
    }

    // Parse form data
    const form = await readMultipartFormData(event)
    if (!form || form.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file uploaded'
      })
    }

    const fileField = form.find(field => field.name === 'receipt')
    if (!fileField || !fileField.data || !fileField.filename) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Receipt file is required'
      })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(fileField.type || '')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Only image files (JPEG, PNG, WebP) and PDF files are allowed'
      })
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (fileField.data.length > maxSize) {
      throw createError({
        statusCode: 400,
        statusMessage: 'File size too large (max 5MB)'
      })
    }

    // Generate unique filename
    const hash = createHash('md5').update(fileField.data).digest('hex')
    const extension = fileField.filename.split('.').pop()
    const filename = `${hash}.${extension}`

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'receipts')
    await $fetch('/api/ensure-directory', { method: 'POST', body: { path: uploadsDir } }).catch(() => {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create uploads directory'
      })
    })

    // Save file
    const filePath = join(uploadsDir, filename)
    const fileUrl = `/uploads/receipts/${filename}`

    await writeFile(filePath, fileField.data)

    // Remove existing receipt for this claim (since we only allow one)
    await prisma.receipt.deleteMany({
      where: { claimId }
    })

    // Save receipt info to database
    const receipt = await prisma.receipt.create({
      data: {
        filename: fileField.filename,
        fileUrl,
        fileSize: fileField.data.length,
        mimeType: fileField.type || 'application/octet-stream',
        claimId
      }
    })

    return receipt
  } catch (error) {
    console.error('Error uploading receipt:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error'
    })
  }
})

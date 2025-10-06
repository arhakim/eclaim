import { jsPDF } from 'jspdf'
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

    // Get claim details from database
    const claim = await prisma.expenseClaim.findUnique({
      where: { id: claimId },
      include: {
        user: {
          include: {
            department: true
          }
        },
        items: true,
        receipts: true,
        approvals: {
          include: {
            approver: true
          }
        }
      }
    })

    if (!claim) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Claim not found'
      })
    }

    // Only allow PDF download for approved claims
    if (claim.status !== 'APPROVED') {
      throw createError({
        statusCode: 403,
        statusMessage: 'PDF download is only available for approved claims'
      })
    }

    // Create PDF document
    const doc = new jsPDF()

    // Set font
    doc.setFont('helvetica')

    // Header
    doc.setFontSize(20)
    doc.text('Expense Claim Report', 20, 30)

    // Claim basic info
    doc.setFontSize(12)
    doc.text(`Claim ID: ${claim.id}`, 20, 50)
    doc.text(`Title: ${claim.title}`, 20, 60)
    doc.text(`Description: ${claim.description || 'N/A'}`, 20, 70)
    doc.text(`Status: ${claim.status}`, 20, 80)
    doc.text(`Total Amount: ${new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: claim.currency
    }).format(Number(claim.totalAmount))}`, 20, 90)
    doc.text(`Expense Date: ${new Date(claim.expenseDate).toLocaleDateString()}`, 20, 100)

    // Employee info
    doc.text(`Employee: ${claim.user.name}`, 20, 120)
    doc.text(`Email: ${claim.user.email}`, 20, 130)
    doc.text(`Department: ${claim.user.department?.name || 'N/A'}`, 20, 140)

    let yPos = 150

    // Items section
    if (claim.items.length > 0) {
      doc.setFontSize(14)
      doc.text('Expense Items:', 20, yPos)
      yPos += 15

      doc.setFontSize(10)

      // Table headers
      doc.text('Description', 20, yPos)
      doc.text('Category', 90, yPos)
      doc.text('Amount', 150, yPos)
      yPos += 10

      // Draw line under headers
      doc.line(20, yPos - 5, 180, yPos - 5)

      // Items
      claim.items.forEach((item: any) => {
        doc.text(item.description, 20, yPos)
        doc.text(item.category.replace('_', ' '), 90, yPos)
        doc.text(new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: claim.currency
        }).format(Number(item.amount)), 150, yPos)
        yPos += 10
      })
      yPos += 10
    }

    // Approval info
    if (claim.approvals.length > 0) {
      const approval = claim.approvals.find((a: any) => a.status === 'APPROVED')
      if (approval) {
        doc.setFontSize(12)
        doc.text('Approval Details:', 20, yPos)
        doc.text(`Approved by: ${approval.approver.name}`, 20, yPos + 15)
        doc.text(`Approved on: ${approval.approvedAt ? new Date(approval.approvedAt).toLocaleDateString() : 'N/A'}`, 20, yPos + 25)
        if (approval.comments) {
          doc.text(`Comments: ${approval.comments}`, 20, yPos + 35)
        }
      }
    }

    // Footer
    doc.setFontSize(8)
    doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, 280)

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer')

    // Set response headers
    setHeader(event, 'Content-Type', 'application/pdf')
    setHeader(event, 'Content-Disposition', `attachment; filename="expense-claim-${claim.id}.pdf"`)
    setHeader(event, 'Content-Length', pdfBuffer.byteLength)

    return new Uint8Array(pdfBuffer)
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate PDF'
    })
  }
})

import { z } from 'zod'

// Expense category enum for validation
export const expenseCategorySchema = z.enum([
  'TRAVEL',
  'MEALS',
  'ACCOMMODATION',
  'TRANSPORT',
  'OFFICE_SUPPLIES',
  'TRAINING',
  'MARKETING',
  'OTHER'
])

// Expense item validation schema
export const expenseItemSchema = z.object({
  description: z.string().min(1, 'Description is required').max(255, 'Description too long'),
  amount: z.union([z.string(), z.number()])
    .transform(val => typeof val === 'string' ? parseFloat(val) : val)
    .refine(val => !isNaN(val), 'Amount must be a valid number')
    .refine(val => val > 0, 'Amount must be positive')
    .refine(val => val <= 99999.99, 'Amount too large'),
  category: expenseCategorySchema
})

// Create expense claim validation schema
export const createExpenseClaimSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  expenseDate: z.string().or(z.date()).transform(val => new Date(val)),
  items: z.array(expenseItemSchema).min(1, 'At least one expense item is required').max(20, 'Too many items'),
  userId: z.string().cuid('Invalid user ID').optional()
})

// Update expense claim validation schema
export const updateExpenseClaimSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  expenseDate: z.string().or(z.date()).transform(val => new Date(val)).optional()
})

// Update expense claim with items validation schema
export const updateExpenseClaimWithItemsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  expenseDate: z.string().transform(str => new Date(str)),
  items: z.array(z.object({
    description: z.string().min(1, 'Item description is required'),
    amount: z.number().min(0, 'Amount must be positive'),
    category: z.enum(['TRAVEL', 'MEALS', 'ACCOMMODATION', 'TRANSPORT', 'OFFICE_SUPPLIES', 'TRAINING', 'MARKETING', 'OTHER'])
  })).min(1, 'At least one expense item is required')
})

// Add expense item to existing claim
export const addExpenseItemSchema = z.object({
  claimId: z.string().cuid('Invalid claim ID'),
  ...expenseItemSchema.shape
})

// Submit claim validation
export const submitClaimSchema = z.object({
  claimId: z.string().cuid('Invalid claim ID')
})

// File upload validation
export const receiptUploadSchema = z.object({
  claimId: z.string().cuid('Invalid claim ID'),
  file: z.object({
    name: z.string(),
    type: z.string().refine(
      type => type.startsWith('image/') || type === 'application/pdf',
      'Only image files (PNG, JPG, GIF) and PDF files are allowed'
    ),
    size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB')
  })
})

export type ExpenseItemInput = z.infer<typeof expenseItemSchema>
export type CreateExpenseClaimInput = z.infer<typeof createExpenseClaimSchema>
export type UpdateExpenseClaimInput = z.infer<typeof updateExpenseClaimSchema>
export type UpdateExpenseClaimWithItemsInput = z.infer<typeof updateExpenseClaimWithItemsSchema>
export type AddExpenseItemInput = z.infer<typeof addExpenseItemSchema>
export type SubmitClaimInput = z.infer<typeof submitClaimSchema>
export type ReceiptUploadInput = z.infer<typeof receiptUploadSchema>

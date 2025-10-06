import * as z from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Invalid email'),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN']),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  departmentId: z.string().nullish()
})

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Invalid email'),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN']),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  departmentId: z.string().nullish()
})

export type CreateUserSchema = z.output<typeof createUserSchema>
export type UpdateUserSchema = z.output<typeof updateUserSchema>

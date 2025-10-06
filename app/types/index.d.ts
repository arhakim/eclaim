import type { AvatarProps } from '@nuxt/ui'

export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN'

// Expense Claim Types
export type ExpenseClaimStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED'
export type ExpenseCategory = 'TRAVEL' | 'MEALS' | 'ACCOMMODATION' | 'TRANSPORT' | 'OFFICE_SUPPLIES' | 'TRAINING' | 'MARKETING' | 'OTHER'
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Department {
  id: string
  name: string
  description?: string
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: AvatarProps | string
  role: UserRole
  departmentId?: string
  department?: Department
  managerId?: string
  manager?: {
    id: string
    name: string
    email: string
  }
  _count?: {
    employees: number
    claims: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CLAIM_APPROVED' | 'CLAIM_REJECTED' | 'CLAIM_SUBMITTED'
  isRead: boolean
  unread?: boolean // For backward compatibility
  userId: string
  user?: User
  claimId?: string
  claim?: ExpenseClaim
  senderId?: string
  sender?: User
  data?: any
  body?: string // For backward compatibility
  date?: string // For backward compatibility
  createdAt: Date
  updatedAt: Date
}

export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}

// Expense Item Interface
export interface ExpenseItem {
  id: string
  description: string
  amount: number
  category: ExpenseCategory
  claimId: string
  createdAt: Date
  updatedAt: Date
}

// Receipt Interface
export interface Receipt {
  id: string
  filename: string
  fileUrl: string
  fileSize: number
  mimeType: string
  claimId: string
  createdAt: Date
}

// Approval Interface
export interface Approval {
  id: string
  status: ApprovalStatus
  comments?: string
  claimId: string
  approverId: string
  approver: {
    id: string
    name: string
    email: string
  }
  approvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

// Main Expense Claim Interface
export interface ExpenseClaim {
  id: string
  title: string
  description?: string
  totalAmount: number
  currency: string
  status: ExpenseClaimStatus
  expenseDate: Date
  submittedAt?: Date
  userId: string
  user: {
    id: string
    name: string
    email: string
    department?: Department
  }
  items: ExpenseItem[]
  receipts: Receipt[]
  approvals: Approval[]
  createdAt: Date
  updatedAt: Date
}

// Form Data Interfaces for Creation
export interface CreateExpenseClaimData {
  title: string
  description?: string
  expenseDate: Date
  items: CreateExpenseItemData[]
  receipt?: File
  user?: User
  userId?: string
}

export interface CreateExpenseItemData {
  description: string
  amount: number
  category: ExpenseCategory
}

export interface DashboardData {
  statusData: Array<{ status: string, count: number, percentage: number }>
  monthlyData: Array<{ month: string, amount: number, count: number }>
  categoryData: Array<{ category: string, count: number, totalAmount: number }>
  approvalQueue: Array<{
    id: string
    title: string
    user: { name: string, email: string, department?: { name: string } }
    totalAmount: number
    submittedAt: string
    status: string
  }>
}

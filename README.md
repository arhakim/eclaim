# eClaim - Expense Management System

[![Nuxt UI](https://img.shields.io/badge/Made%20with-Nuxt%20UI-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?logo=Prisma&logoColor=white)](https://prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)](https://postgresql.org/)

A comprehensive expense management system built with Nuxt 4, featuring claim submission, approval workflows, and automated notifications. Designed for organizations to streamline expense reporting and approvals with role-based access control.

## ✨ Features

### 🎯 Core Functionality
- **Expense Claim Management**: Create, edit, submit and track expense claims with detailed items and receipt attachments
- **Multi-level Approval Workflow**: Managers can approve or reject claims with comments and approval tracking
- **Role-based Access Control**: Three user roles (Employee, Manager, Admin) with appropriate permissions
- **Real-time Notifications**: In-app notifications for claim status updates and approval requests

### 📊 Dashboard & Analytics
- **Interactive Dashboard**: Real-time overview of claims, amounts, and approval queues
- **Visual Charts**: Status distribution, monthly trends, and category breakdowns using Unovis
- **Approval Queue**: Prioritized list of pending claims for managers
- **Search & Filtering**: Advanced filtering by status, date range, and categories

### 📋 Expense Categories
- Travel expenses
- Meals & Entertainment
- Accommodation
- Transportation
- Office Supplies
- Training & Development
- Marketing
- Other miscellaneous expenses

### 🔔 Automated Notifications
- **Daily Reminders**: Automated notifications to managers for pending approvals
- **Status Updates**: Real-time notifications when claims are approved/rejected
- **Escalation Alerts**: Notifications for overdue approvals
- **Configurable Scheduler**: Timezone-aware notification scheduling

### 💼 User Management (Admin)
- User creation and management
- Department assignment
- Manager hierarchy setup
- Role assignment and permissions

### 📄 Export & Reporting
- PDF generation for approved claims
- Receipt management and storage
- Expense reporting and analytics

## 🖥️ Server Requirements

### System Requirements
- **Node.js**: 18.x or higher
- **Package Manager**: pnpm (recommended), npm, or yarn
- **Database**: PostgreSQL 13+ 
- **Memory**: Minimum 512MB RAM (1GB+ recommended for production)
- **Storage**: At least 1GB for application and file uploads

### Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/eclaim"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"

# File Upload Configuration
MAX_FILE_SIZE=5242880  # 5MB in bytes
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/gif,application/pdf"

# Application Configuration
APP_URL="http://localhost:3000"
COMPANY_NAME="Your Company Name"

# Scheduler Configuration (Optional)
SCHEDULER_TIMEZONE="Asia/Jakarta"  # Default timezone for notifications
```

### Database Setup
eClaim uses PostgreSQL as the primary database. Ensure you have:
- PostgreSQL server running and accessible
- A database created for the application
- Proper user permissions for database operations

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd eclaim
```

### 2. Install Dependencies
Make sure to install the dependencies using pnpm (recommended):

```bash
pnpm install
```

Or using npm:
```bash
npm install
```

### 3. Environment Setup
1. Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```

2. Update the environment variables in `.env` with your configuration:
   - Set your PostgreSQL database connection string
   - Generate a secure JWT secret (minimum 32 characters)
   - Configure file upload settings and company information

### 4. Database Migration
Run Prisma migrations to set up the database schema:

```bash
# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev
```

### 5. Database Seeding
Populate the database with initial data including sample departments, users, and test claims:

```bash
# Run the database seeder
pnpm prisma db seed
```

The seeder will create:
- **Sample Departments**: HR, Finance, Marketing, Sales, Engineering, Operations, Legal
- **Admin User**: admin@company.com (password: admin123)
- **Manager Users**: Various department managers
- **Employee Users**: Regular employees under different managers
- **Sample Claims**: Test expense claims in different statuses

### 6. File Upload Directory
Ensure the uploads directory exists and has proper permissions:

```bash
# Create uploads directory
mkdir -p public/uploads/receipts

# Set permissions (Linux/macOS)
chmod 755 public/uploads/receipts
```

## 🏃‍♂️ Running the Application

### Development Server
Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

### Default Login Credentials
After seeding, you can login with these accounts:

**Admin Account:**
- Email: `admin@company.com`
- Password: `admin123`

### Production

Build the application for production:

```bash
pnpm build
```

Start the production server:

```bash
pnpm start
```

Locally preview production build:

```bash
pnpm preview
```

## ⏰ Running the Scheduler

The eClaim system includes an automated scheduler for sending reminder notifications to managers about pending approvals.

### Automatic Scheduler
The scheduler is automatically initialized when the server starts and runs:
- **Daily at 7:00 AM** (configurable timezone)
- Checks for claims in `IN_REVIEW` status
- Groups claims by manager
- Sends notification reminders to managers
- Includes claim count, total amounts, and urgency indicators

### Manual Scheduler Trigger
For testing purposes, you can manually trigger the scheduler:

#### Via API Endpoint
```bash
curl -X POST http://localhost:3000/api/admin/trigger-reminders
```

#### Via Dashboard (Admin only)
- Login as an admin user
- Go to the Dashboard
- Click "Trigger Reminders" button in the admin section

### Scheduler Configuration
Configure the scheduler in your `.env` file:

```env
# Set the timezone for scheduled notifications
SCHEDULER_TIMEZONE="Asia/Jakarta"  # Default: Asia/Jakarta
```

### Creating Test Data for Scheduler
To test the scheduler functionality, run the test data creation script:

```bash
pnpm tsx scripts/create-test-data.ts
```

This creates:
- A manager and employee relationship
- Several expense claims in `IN_REVIEW` status
- Perfect for testing the reminder notifications

### Scheduler Logs
The scheduler provides detailed logging:
- Startup confirmation with timezone
- Daily execution logs with timestamp
- Manager notification details
- Error handling and reporting

Monitor scheduler activity in your application logs when running in production.

## 📚 Additional Documentation

For more information about deployment and advanced configuration, check out:
- [Nuxt Deployment Documentation](https://nuxt.com/docs/getting-started/deployment)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🔧 Development Tools

This project includes several development tools:

- **ESLint**: Code linting and formatting
- **TypeScript**: Type safety and better developer experience  
- **Prisma Studio**: Database GUI for development
- **Hot Module Replacement**: Fast development with instant updates

### Useful Commands

```bash
# Run linting
pnpm lint

# Type checking
pnpm typecheck  

# Open Prisma Studio
pnpm prisma studio

# Reset database (⚠️ Development only!)
pnpm prisma migrate reset

# View database in browser
pnpm prisma studio
```

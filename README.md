Alpha Cloud-based HRMS Solution
================================

Alpha is a modern, multi-tenant **Human Resource Management System (HRMS)** built with **Laravel 12**, **Inertia.js**, and a **React** frontend. It is designed for SaaS-style deployments where a single platform hosts multiple tenant companies, each with its own isolated employee data, HR workflows, and payroll.

This document explains the architecture, features, tech stack, and how to run and deploy the project.

---

## Table of Contents

- **Overview**
- **Key Features**
- **Architecture & Tech Stack**
- **Core Domains & Roles**
- **Local Development Setup**
- **Database & Multi-tenancy**
- **Running the Application**
- **Testing**
- **Deployment Notes (Railway)**
- **Security & Best Practices**

---

## Overview

Alpha HRMS provides an end-to-end HR and payroll platform for organizations, with support for:

- Centralized **Super Admin** control over tenants and subscription plans.
- Per-tenant databases for **data isolation** and easier scaling.
- Role-based dashboards for **HR**, **Finance**, **Department Managers**, and **Employees**.
- Attendance, leave management, performance reviews, and payroll processing.

The platform is suitable for production SaaS deployments and can be hosted on services like **Railway**, **VPS**, or other cloud providers that support PHP and MySQL.

---

## Key Features

- **Multi-Tenant Architecture**
  - Central ("main") database for platform users, tenants, and subscriptions.
  - Separate tenant databases for each company to keep HR data isolated.
  - Middleware-based tenant resolution and database switching.

- **Role-Based Dashboards**
  - **Super Admin**
    - Manage tenants (create, update, delete).
    - Manage subscription plans.
    - View and manage platform-level users.
  - **Company Admin**
    - Manage employees, departments, and roles.
    - Configure leave and attendance policies.
  - **HR Manager**
    - Manage employees and leave requests.
    - View and manage attendance logs.
  - **Finance Manager**
    - Run monthly payroll for all active employees.
    - Manage payroll adjustments and view audit reports.
  - **Department Manager**
    - View department team, leave requests, attendance summaries.
    - Submit and manage performance reviews.
  - **Employee**
    - Submit leave requests.
    - View payslips.
    - Check in / check out attendance with optional biometric and visual confirmation.

- **Attendance & Leave Management**
  - Attendance policies: work times, grace periods, Wi-Fi restrictions, biometric/visual confirmation requirements.
  - Leave policies: leave types, annual entitlements, paid/unpaid, approval requirements.
  - Attendance logs with metadata including IP, Wi-Fi verification, and biometric/visual checks.

- **Payroll Engine**
  - Monthly payroll runs per tenant.
  - Processes all active employees with gross pay, adjustments, deductions, and tax.
  - Exposes detailed breakdowns for Finance dashboard and CSV export.

- **Performance Reviews**
  - Department Manager reviews with KPI summaries and star ratings.
  - Detailed review modal with structured feedback and rating breakdown.

- **Modern Frontend**
  - React + Inertia.js SPA-style UX.
  - Tailwind CSS for UI styling.
  - Reusable pagination and search components for large table-based views.

---

## Architecture & Tech Stack

- **Backend**
  - Laravel 12 (PHP ^8.2)
  - Inertia.js Laravel adapter
  - Sanctum for auth/session handling
  - Multi-database configuration (`config/database.php`) with a central connection and a dynamic `Tenant` connection.

- **Frontend**
  - React 18
  - Inertia.js React adapter
  - Vite 6 for bundling and dev server
  - Tailwind CSS 3
  - UI libraries: Headless UI, Heroicons, Lucide, React Icons, Framer Motion (for animations)

- **Other Components**
  - Database migrations under `database/migrations` and `database/migrations/tenant` for central and tenant schemas.
  - Role-based routing and middleware in `routes/web.php` and `app/Http/Middleware`.
  - Queue workers (optional) via Laravel's queue system.

---

## Core Domains & Roles

### Super Admin

Responsible for platform configuration and management:

- Manages tenants and their lifecycle.
- Configures subscription plans.
- Manages platform-level users.

### Company Admin

Manages tenant-level configuration:

- Employee records.
- Departments and department managers.
- Leave and attendance policies.
- Role-based access control within the tenant.

### HR Manager

- Employee onboarding/offboarding.
- Leave requests approval/rejection.
- Attendance log overview and corrections (where permitted).

### Finance Manager

- Monthly payroll generation across all active employees.
- Manages payroll adjustments and deductions.
- Reviews audit reports and can export CSV for finance systems.

### Department Manager

- Views team members scoped to their department.
- Reviews team attendance and leave requests.
- Submits performance reviews with KPI scoring and star ratings.

### Employee

- Checks in/out attendance.
- Requests leave and views leave status.
- Views payslips and payroll details.

---

## Local Development Setup

### Prerequisites

- PHP ^8.2
- Composer
- Node.js (LTS) and npm
- MySQL / MariaDB

### 1. Clone the Repository

```bash
git clone <your-repo-url> HRMS
cd HRMS
```

### 2. Install PHP Dependencies

```bash
composer install
```

### 3. Install Node Dependencies

```bash
npm install
```

### 4. Environment Configuration

Copy `.env.example` to `.env` and adjust values as needed:

```bash
cp .env.example .env
php artisan key:generate
```

Set up your **central database** in `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=hrms_main
DB_USERNAME=root
DB_PASSWORD=secret
```

Tenant databases are handled programmatically per-tenant; ensure your MySQL instance allows creating and connecting to multiple databases.

### 5. Run Migrations

```bash
php artisan migrate
```

Tenant migrations are typically run when a tenant is created (e.g., in tenant onboarding logic). Ensure tenant provisioning logic runs the migrations for each new tenant database.

---

## Running the Application

### Backend + Frontend (Development)

There is a convenience Composer script defined for multi-process dev (PHP server, queue, logs, Vite):

```bash
composer dev
```

Alternatively, you can run services manually:

```bash
php artisan serve
php artisan queue:listen
npm run dev
```

Then visit the host/port shown in the terminal (usually `http://127.0.0.1:8000`).

---

## Database & Multi-tenancy

The project's `config/database.php` defines:

- A default connection (usually MySQL in production).
- A dynamic `Tenant` connection using the same host/port/credentials as the central DB, but with the database name set at runtime per tenant.

Tenant selection and DB switching is handled by middleware such as `SwitchTenantDatabase`, which:

- Identifies the current tenant from the authenticated user/session.
- Switches the `Tenant` connection to the appropriate database.

All tenant-scoped models and controllers use the `Tenant` connection for data isolation.

---

## Testing

The project uses Laravel's testing tools (PHPUnit) with the following script:

```bash
composer test
```

You can write feature and unit tests under the `tests/` directory. Ensure that any tests that rely on tenant data either:

- Use an in-memory / ephemeral database, or
- Create and migrate tenant databases as part of the test setup.

---

## Deployment Notes (Railway)

Alpha HRMS can be deployed to **Railway** or any similar platform that supports PHP and MySQL.

### PHP Extensions

Ensure the following extensions are enabled (for example via `RAILPACK_PHP_EXTENSIONS` or similar env):

- `pdo_mysql`
- `mysqli`

### Database Configuration (MySQL)

Map Railway's MySQL service variables to Laravel's expected environment variables:

```env
DB_CONNECTION=mysql
DB_HOST=<mysql-host-from-railway>
DB_PORT=<mysql-port-from-railway>
DB_DATABASE=<mysql-database-name>
DB_USERNAME=<mysql-username>
DB_PASSWORD=<mysql-password>
```

If Railway exposes a single connection URL (e.g. `MYSQL_URL` or `DATABASE_URL`), you can also use:

```env
DB_CONNECTION=mysql
DB_URL=<mysql-url-from-railway>
```

After updating environment variables, **redeploy** the service to apply changes.

---

## Security & Best Practices

- Never commit real `.env` files or secrets.
- Use HTTPS in production and configure trusted proxies if behind a load balancer.
- Keep dependencies up to date (both Composer and npm).
- Regularly back up both central and tenant databases.
- Restrict direct database access to trusted hosts/networks.

---



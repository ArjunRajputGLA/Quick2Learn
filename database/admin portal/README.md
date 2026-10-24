# 🎓 Quick2Learn — Admin Portal Database Toolkit

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B%20%7C%2017-316192?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Windows 1-Click](https://img.shields.io/badge/Windows-1--Click%20Batches-0078D6?style=flat-square&logo=windows&logoColor=white)](#-1-click-windows-quick-actions)
[![License](https://img.shields.io/badge/License-Proprietary-blueviolet?style=flat-square)](#)

> Production-grade, zero-dependency SQL and Node.js automation suite to **create**, **seed**, **inspect**, and **safely wipe** the entire PostgreSQL database domain for the Quick2Learn Admin Portal.

---

## ⚡ 1-Click Windows Quick Actions

For developers on Windows, double-clickable `.bat` files are pre-configured in this directory:

| Action | Executable | What It Does |
| :--- | :--- | :--- |
| **🚀 Build & Seed Database** | [`run-make-database.bat`](run-make-database.bat) | Creates all DDL tables, enums, sequences, and seeds all live batches, timetable slots, study materials, and tests. |
| **🗑️ Wipe Admin Data** | [`run-delete.bat`](run-delete.bat) | Prompts for confirmation and cleanly wipes all Admin Portal data using cascade truncation. |

---

## 🗺️ Entity Architecture & Data Flow

The diagram below shows how the Admin Portal entities relate to each other in PostgreSQL:

```mermaid
erDiagram
    USER ||--o{ PROFILES : "has"
    USER ||--o{ FACULTY : "linked_to"
    USER ||--o{ ENROLLMENTS : "enrolled"
    USER ||--o{ PAYMENTS : "pays"
    
    SUBJECTS ||--o{ CHAPTERS : "contains"
    SUBJECTS ||--o{ BATCHES : "teaches"
    FACULTY ||--o{ BATCHES : "instructs"
    
    BATCHES ||--o{ BATCH_TIMETABLE_SLOTS : "schedules"
    BATCHES ||--o{ BATCH_FEE_PLANS : "offers"
    BATCHES ||--o{ ENROLLMENTS : "has_students"
    BATCHES ||--o{ LIVE_SESSIONS : "hosts"
    BATCHES ||--o{ CONTENT_ITEMS : "publishes"
    
    CHAPTERS ||--o{ CONTENT_ITEMS : "organizes"
    CHAPTERS ||--o{ RESOURCES : "provides"
    CHAPTERS ||--o{ QUESTIONS : "categorizes"
    
    BATCH_FEE_PLANS ||--o{ ENROLLMENTS : "selects"
    ENROLLMENTS ||--o{ PAYMENTS : "receipts"
    
    QUESTIONS ||--o{ TEST_QUESTIONS : "curated_in"
    TESTS ||--o{ TEST_QUESTIONS : "comprises"
    TESTS ||--o{ TEST_ATTEMPTS : "records"
    
    BATCHES ||--o{ ATTENDANCE_RECORDS : "logs"
    BATCHES ||--o{ ANNOUNCEMENTS : "broadcasts"
```

---

## 📁 Toolkit Manifest

This folder contains everything needed to manage the Admin Portal schema and data lifecycle:

```text
database/admin portal/
├── 📄 README.md                        # Comprehensive architecture and setup guide
├── 🚀 make-admin-portal-database.js    # Node.js runner: builds schema + seeds all data
├── ⚡ run-make-database.bat            # 1-Click Windows Batch to build & seed
├── 🗑️ delete-admin-portal-data.js      # Node.js runner: interactive or force wipe
├── ⚡ run-delete.bat                    # 1-Click Windows Batch to delete data
├── 🏛️ create-admin-portal-schema.sql   # Pure PostgreSQL DDL (enums, tables, constraints)
├── 🌱 seed-admin-portal-data.sql       # Pure PostgreSQL DML (rich seed dataset)
├── 📦 admin-portal-seed-data.json      # Offline portable JSON data export
└── 🧹 delete-admin-portal-data.sql     # Pure PostgreSQL idempotent truncate script
```

---

## 📋 Prerequisites

Before running the scripts, ensure you have:

1. **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/)). Verify with:
   ```bash
   node -v
   ```
2. **PostgreSQL**: v14.0 or higher running locally or in Docker. Verify connection:
   ```bash
   # If using PostgreSQL CLI
   psql -U postgres -h localhost -p 5432 -d quick2learn
   ```
3. **Node Dependencies**: The scripts automatically leverage the workspace's `pg` driver (located in `website/node_modules/pg` or root). If running standalone in a new environment, install `pg`:
   ```bash
   npm install pg dotenv
   ```

---

## 🛠️ Step-by-Step Setup Guide

### Step 1: Start PostgreSQL

#### Option A: Using Docker Compose (Fastest)
From the root of the project directory, run:
```bash
docker compose up -d postgres
```
This spins up PostgreSQL 17 on `localhost:5432` with username `postgres`, password `postgres`, and database `quick2learn`.

#### Option B: Using Local Native PostgreSQL Service
If using Windows Services, make sure the `postgresql-x64-XX` service is running:
```powershell
Get-Service postgresql* | Start-Service
```
Ensure the target database exists:
```sql
CREATE DATABASE quick2learn;
```

---

### Step 2: Configure Environment Variables

The Node.js runners automatically search and auto-detect your database credentials from:
1. `process.env.DATABASE_URL` or `process.env.DATABASE_URL_DIRECT`
2. `website/.env.local`
3. `website/.env`
4. Default local fallback: `postgresql://postgres:postgres@localhost:5432/quick2learn`

To override the connection string manually:

#### Windows PowerShell:
```powershell
$env:DATABASE_URL = "postgresql://postgres:yourpassword@localhost:5432/quick2learn"
node "database/admin portal/make-admin-portal-database.js"
```

#### Windows Command Prompt (cmd.exe):
```cmd
set DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/quick2learn
node "database\admin portal\make-admin-portal-database.js"
```

#### macOS / Linux Bash:
```bash
export DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/quick2learn"
node "database/admin portal/make-admin-portal-database.js"
```

---

### Step 3: Build & Seed the Admin Portal Database

#### Method 1: Using the Node.js Runner (Recommended)
From the repository root:
```bash
node "database/admin portal/make-admin-portal-database.js"
```

**Expected terminal output:**
```text
======================================================
🚀  Quick2Learn - Admin Portal Database Builder
📡 Target Database: postgresql://postgres:****@localhost:5432/quick2learn
======================================================

⏳ Connecting to PostgreSQL...
✓ Connected successfully.

🔨 Step 1: Applying Admin Portal Schema (tables, enums, indexes)...
  ✓ Schema applied successfully.

🌱 Step 2: Seeding Admin Portal Data (batches, materials, tests, questions)...
  ✓ Seed data populated successfully.

📊 Step 3: Verifying Database Records...
------------------------------------------------------
  ✓ Batches                    : 4 rows
  ✓ Timetable Slots            : 6 rows
  ✓ Lectures & Videos          : 4 rows
  ✓ Study Resources & PDFs     : 5 rows
  ✓ Question Bank              : 3 rows
  ✓ Tests & Exams              : 2 rows
  ✓ Live Masterclasses         : 2 rows
  ✓ Attendance Records         : 3 rows
  ✓ Announcements              : 2 rows
  ✓ Student Enquiries          : 2 rows
  ✓ Join Requests              : 3 rows
  ✓ Active Enrollments         : 2 rows
  ✓ Payment Receipts           : 2 rows
------------------------------------------------------

🎉 SUCCESS: Admin Portal database created and seeded successfully!
======================================================
```

#### Method 2: 1-Click Windows Executable
Double-click [`run-make-database.bat`](run-make-database.bat) in File Explorer or run in terminal:
```cmd
"database\admin portal\run-make-database.bat"
```

#### Method 3: Direct PostgreSQL CLI (`psql`)
If you prefer running pure SQL without Node:
```bash
# 1. Apply DDL Schema
psql -h localhost -U postgres -d quick2learn -f "database/admin portal/create-admin-portal-schema.sql"

# 2. Populate Seed Dataset
psql -h localhost -U postgres -d quick2learn -f "database/admin portal/seed-admin-portal-data.sql"
```

> [!NOTE]
> All SQL statements use `ON CONFLICT DO NOTHING` or `ON CONFLICT DO UPDATE`. Running the seed script multiple times is completely idempotent and safe.

---

## 🗑️ Safe Deletion & Reset Workflows

To wipe all dummy data from every single section and page in the Admin Portal (batches, students directory, questions, tests, materials, lectures, payments, dues, live classes, attendance, announcements, enquiries, doubts, and mock results) while preserving the real administrator account (`dinesh@quick2learn.in`), official subjects, and syllabus chapters:

### Method 1: Interactive Node.js Runner
Prompts for confirmation before wiping data:
```bash
node "database/admin portal/delete-admin-portal-data.js"
```

### Method 2: Non-Interactive Force Mode (For CI/CD or Scripts)
Bypasses the confirmation prompt:
```bash
node "database/admin portal/delete-admin-portal-data.js" --force
```

### Method 3: 1-Click Windows Batch
Double-click [`run-delete.bat`](run-delete.bat).

### Method 4: Pure SQL in pgAdmin / DBeaver / psql
Open and execute [`delete-admin-portal-data.sql`](delete-admin-portal-data.sql) in any SQL editor.

> [!CAUTION]
> The delete script executes `TRUNCATE TABLE ... CASCADE` on all operational Admin Portal tables and deletes dummy student records. It leaves the real administrator account completely untouched and clean.

---

## 📦 What Data Is Seeded?

The seed script creates a complete, real-world educational environment centered on Dinesh Sir's academy:

| Domain | Details & Sample Entities |
| :--- | :--- |
| **Academic Batches** | • **IX ICSE (2026-27)**: Comprehensive Selina Maths & Science (`iiwbpg`)<br>• **Class X CBSE**: Board Excellence 100/100 Target (`M10CBS`)<br>• **Class XI CBSE**: Foundation & Coordinate Geometry (`M11CBS`)<br>• **Class XII CBSE**: Calculus & Vectors Masterclass (`M12MTH`) |
| **Weekly Timetables** | 6 recurring weekly timetable slots mapped to Monday, Tuesday, Wednesday, Thursday slots for Dinesh Sir & Namita Ma'am. |
| **Recorded Lectures** | • Selina Solutions: Chemistry Exercise 2(C)<br>• Selina Solutions: Mathematics Exercise 4(A) Expansions<br>• Class 10: Quadratic Equations Nature of Roots<br>• Class 12: Definite Integrals Properties |
| **Study Resources** | • Exercise 2(C) Complete Handwritten Solutions PDF<br>• Cell Structure & Life Cycle Biology Notes<br>• Class 12 Relations & Functions Complete Chapter Notes<br>• DPP 01: Daily Practice Problems<br>• Calculus Master Formula Cheat Sheet |
| **Question Bank & Tests** | • Equal roots of quadratic equations ($k = \pm 8$)<br>• Polynomial zeros calculation ($k = -10$)<br>• Equivalence relations verification<br>• Scheduled 60-min and 45-min timed exams with negative marking |
| **Live Masterclasses** | • Zoom Live: Definite Integrals Masterclass with Dinesh Sir<br>• YouTube Live: Chemical Reactions Balancing with Namita Ma'am |
| **Attendance & Notices** | • Daily marked attendance for students Aarav, Arjun, and Ananya<br>• Pinned welcome announcements & Sunday special doubt clinic notices |
| **Enrollments & Fees** | • Annual Full Year and Board Booster fee plans ($₹16,000$ and $₹18,000$)<br>• Verified student enrollments with recorded UPI and Cash receipts |

---

## ❓ Frequently Asked Questions & Troubleshooting

### 1. `ECONNREFUSED 127.0.0.1:5432`
- **Cause**: PostgreSQL is not currently running.
- **Solution**: Start PostgreSQL via Docker (`docker compose up -d postgres`) or start the local Windows PostgreSQL service in `services.msc`.

### 2. `password authentication failed for user "postgres"`
- **Cause**: Your local PostgreSQL password differs from the default (`postgres`).
- **Solution**: Export your password via `DATABASE_URL`:
  ```powershell
  $env:DATABASE_URL = "postgresql://postgres:YOUR_PASSWORD@localhost:5432/quick2learn"
  node "database/admin portal/make-admin-portal-database.js"
  ```

### 3. `database "quick2learn" does not exist`
- **Cause**: The PostgreSQL instance is running, but the database has not been initialized.
- **Solution**: Create it in `psql` or Command Prompt:
  ```bash
  psql -U postgres -c "CREATE DATABASE quick2learn;"
  ```

### 4. `Cannot find module 'pg'`
- **Cause**: The script was executed outside a directory with Node modules.
- **Solution**: The script automatically resolves `website/node_modules/pg`. If running standalone, simply execute `npm install pg` in this folder.

---

> [!TIP]
> After running the make script, run `pnpm dev` in the `website` folder and visit `http://localhost:3000/admin` to explore all populated batches, timetable slots, question banks, and live sessions!

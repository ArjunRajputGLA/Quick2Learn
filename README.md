# 🎓 Quick2Learn — Educational Platform & Learning Ecosystem

[![Next.js 15](https://img.shields.io/badge/Next.js-15.0%2B-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Expo](https://img.shields.io/badge/Expo-58.0%2B-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.78-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8%20Strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-EF4444?style=flat-square&logo=turborepo&logoColor=white)](https://turbo.build/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-316192?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-0.40-C5F74F?style=flat-square&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

> Official full-stack monorepo for **Quick2Learn Coaching Institute** (founded by Mr. Dinesh Singh Rajput & Mrs. Namita Singh Rajput, Mathura, UP), providing premier mathematics and science education for **Classes IX–XII (CBSE & ICSE/ISC)**.

---

## 🗺️ Monorepo Architecture

Quick2Learn is built as a high-performance Turborepo monorepo sharing domain types, database schemas, and validation rules across web, mobile, and database toolkits.

```mermaid
graph TD
    subgraph Apps ["Applications (apps/)"]
        Web["🌐 apps/web<br/>Next.js 15 App Router<br/>(Marketing, Student, Parent & Admin Portal)"]
        Mobile["📱 apps/mobile<br/>Expo & React Native<br/>(Student Learning App & Chats)"]
    end

    subgraph Packages ["Shared Packages (packages/)"]
        Shared["📦 packages/shared<br/>(Zod Schemas, Domain Types, Paise Utils)"]
        DB["🗄️ packages/db<br/>(PostgreSQL 17 + Drizzle ORM + Migrations)"]
    end

    subgraph DatabaseTools ["Database Toolkit (database/)"]
        AdminDB["🛠️ database/admin portal/<br/>(DDL Schema, Seeders, 1-Click Batch Tools)"]
    end

    subgraph Infrastructure ["Infrastructure (Docker)"]
        PG[(PostgreSQL 17)]
        MinIO[(MinIO S3 Storage)]
        Mailpit[(Mailpit SMTP)]
    end

    Web --> Shared
    Web --> DB
    Mobile --> Shared
    DB --> Infrastructure
    AdminDB --> Infrastructure
```

---

## 📁 Repository Structure

```text
Quick2Learn/
├── 🌐 apps/
│   ├── web/                    # Next.js 15 web application (App Router, React 19, Tailwind CSS v4)
│   │   ├── src/app/            # App routes: (marketing), (auth), (student), admin
│   │   ├── src/components/     # UI primitives, marketing sections, admin components
│   │   └── src/server/         # Server actions, data-access layer, storage & auth
│   └── mobile/                 # React Native / Expo 58 native mobile application
│       ├── app/                # Expo Router screens: tabs (attendance, batches, chats, doubts, fees)
│       └── src/                # Mobile stores, navigation, components, and offline downloads
├── 📦 packages/
│   ├── db/                     # Drizzle ORM schema, migrations, node-postgres client & seeds
│   └── shared/                 # Shared TypeScript interfaces, Zod validation schemas, integer paise math
├── 🛠️ database/
│   └── admin portal/           # Zero-dependency SQL DDL, seed data, and 1-Click Windows execution scripts
├── 🐳 docker-compose.yml       # Local development services: PostgreSQL 17, MinIO S3, Mailpit
├── 📜 scripts/                 # Database initialization, token builders, and role management scripts
└── ⚙️ turbo.json               # Turborepo task pipelines
```

---

## 🌟 Core Features

### 💻 Web Platform (`apps/web`)
- **Marketing & Admission Discovery**: Course catalog, batch schedules, faculty credentials, and instant lead submission.
- **Student Learning Portal**: Chapter video lecture player synced with YouTube, exercise-wise PDF solution reader (Selina ICSE & NCERT CBSE), daily practice problem (DPP) downloads.
- **Parent Portal**: Real-time student attendance monitoring, fee receipt ledger, and direct teacher communication.
- **Institute Admin Control Panel (`/admin`)**:
  - **Dashboard**: Live KPI cards (active students, collections, pending dues, admissions leads).
  - **Batches**: Complete batch lifecycle management, weekly timetable slot configuration, and join code generator (`M10CBS`, `M12MTH`).
  - **Question Bank**: Rich question creator with LaTeX equations, difficulty tiers, and step-by-step solutions.
  - **Timed Tests**: Scheduled chapter and unit assessments with automatic ranking, negative marks, and immediate answer reviews.
  - **Attendance & Live Classes**: Daily classroom attendance logging and Zoom / YouTube Live class broadcasting.
  - **Fees & Collections**: Razorpay online checkout, offline Cash & UPI receipt recording, and installment schedules.

### 📱 Mobile Learning App (`apps/mobile`)
- **Curved Bottom Navigation**: Smooth floating tab bar with automatic hide on active chats and video player.
- **Real-Time Student Chats**: WhatsApp-inspired messaging interface with right-aligned sent bubbles and left-aligned received messages.
- **Doubt Solving Engine**: Instant doubt submission with camera capture, photo attachments, and teacher reply threads.
- **Offline Material Locker**: Download PDFs, formula sheets, and past question papers for offline revision.

### 🗄️ Database & Automation (`database/admin portal/`)
- Pure SQL and Node.js automation suite to build, seed, and safely wipe all Admin Portal operational data with **1-Click Windows Batch executables** ([`run-make-database.bat`](database/admin%20portal/run-make-database.bat) and [`run-delete.bat`](database/admin%20portal/run-delete.bat)).
- Learn more in the [**Admin Portal Database Documentation**](database/admin%20portal/README.md).

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **pnpm**: v9.0.0 or higher (`npm install -g pnpm`)
- **Docker**: Docker Desktop running locally (for PostgreSQL, MinIO, Mailpit)

---

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/ArjunRajputGLA/Quick2Learn.git
cd Quick2Learn
pnpm install
```

---

### 3. Spin Up Local Services (Docker)
Start PostgreSQL 17, MinIO Object Storage, and Mailpit SMTP with one command:
```bash
docker compose up -d
```

| Service | Port | Local Dashboard URL | Default Credentials |
| :--- | :--- | :--- | :--- |
| **PostgreSQL 17** | `5432` | `localhost:5432` | `postgres` / `postgres` (DB: `quick2learn`) |
| **MinIO S3** | `9000` / `9001` | [http://localhost:9001](http://localhost:9001) | `minioadmin` / `minioadmin` |
| **Mailpit (Email)** | `1025` / `8025` | [http://localhost:8025](http://localhost:8025) | No authentication required |

---

### 4. Configure Environment Variables
Copy the example environment file in the web app:
```bash
cp apps/web/.env.example apps/web/.env.local
```
Ensure your database connection string is configured in `apps/web/.env.local`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/quick2learn"
DATABASE_URL_DIRECT="postgresql://postgres:postgres@localhost:5432/quick2learn"
BETTER_AUTH_SECRET="your-development-secret-key-32-chars-min"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

### 5. Initialize & Seed Database
Apply migrations and populate initial institute data:
```bash
# Apply schema and initial subjects & chapters
pnpm db:migrate

# Optional: Seed complete Admin Portal operational data (batches, materials, tests)
node "database/admin portal/make-admin-portal-database.js"
```

---

### 6. Start Development Servers

#### Run All Applications (Web + Mobile + Packages)
```bash
pnpm dev
```

#### Run Web Application Only (`http://localhost:3000`)
```bash
pnpm --filter web dev
```

#### Run Mobile Application (Expo / Android / iOS)
```bash
pnpm mobile:start
```
To run directly on an Android device or emulator:
```bash
pnpm mobile:android
```

---

## 🛠️ Monorepo Scripts Matrix

| Command | Action |
| :--- | :--- |
| **`pnpm dev`** | Runs Turborepo development pipeline for all workspaces. |
| **`pnpm build`** | Builds production bundles for all apps and packages. |
| **`pnpm typecheck`** | Performs strict TypeScript checks across the monorepo (`tsc --noEmit`). |
| **`pnpm lint`** | Runs ESLint analysis across all packages. |
| **`pnpm test`** | Executes unit and integration tests using Vitest. |
| **`pnpm test:e2e`** | Runs Playwright end-to-end browser tests. |
| **`pnpm db:migrate`** | Applies pending Drizzle ORM schema migrations. |
| **`pnpm db:studio`** | Opens Drizzle Studio GUI on `http://local.drizzle.studio`. |
| **`pnpm mobile:start`**| Starts Expo development server with Metro bundler. |
| **`pnpm mobile:clean`**| Clears Metro cache and starts the Expo bundler. |

---

## 🗄️ Database Management & Admin Toolkit

All database automation scripts are self-contained in [`database/admin portal/`](database/admin%20portal/):

- **Build & Seed Database**: Run `run-make-database.bat` or `node "database/admin portal/make-admin-portal-database.js"`
- **Wipe Admin Data**: Run `run-delete.bat` or `node "database/admin portal/delete-admin-portal-data.js" --force`
- **Schema DDL**: [`create-admin-portal-schema.sql`](database/admin%20portal/create-admin-portal-schema.sql)
- **Seed Script**: [`seed-admin-portal-data.sql`](database/admin%20portal/seed-admin-portal-data.sql)

Detailed instructions and architecture flow diagrams are available in the [**Admin Database Documentation**](database/admin%20portal/README.md).

---

## 🛡️ Security, Architecture & Guidelines

- **Strict Currency Arithmetic**: All fees, dues, and payments are stored and calculated as **integer paise** (e.g. $₹1,500$ is `150000`). Display conversions use `formatINR()`.
- **Timezone Fidelity**: Timestamps are stored as `timestamptz` in UTC and formatted for display in `Asia/Kolkata` (IST).
- **Application-Layer Authorization**: Access policies are strictly enforced in `apps/web/src/server/authz.ts` and `apps/web/src/server/data/`, verifying roles (`admin`, `teacher`, `student`, `parent`).
- **Object Storage**: S3 keys are stored in the database instead of public URLs, allowing presigned uploads and secure asset protection.

---

## 👨‍🏫 Institute Leadership

- **Dinesh Singh Rajput**: Founder & Head of Mathematics (25+ years experience, mentor to multiple 100/100 CBSE & ICSE board scorers).
- **Namita Singh Rajput**: Senior Faculty, ICSE Chemistry & Biology.
- **Campus**: Highway Plaza, Mathura, Uttar Pradesh, India.
- **YouTube Channel**: [@Quick2Learn](https://www.youtube.com/@Quick2Learn)

---

## 📄 License

Proprietary software developed for Quick2Learn Coaching Institute. All rights reserved.

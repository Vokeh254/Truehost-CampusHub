# Truehost CampusHub

**Ambassador Management, Activity Tracking & Community Growth Platform**

Truehost CampusHub is the official management platform for the **Truehost Cloud Campus Builders** initiative — Kenya's nationwide student developer and cloud ambassador programme operating across universities and TVET colleges.

The platform gives Truehost's Community Manager a single dashboard to manage every aspect of the initiative: ambassador performance, chapter activity, media outreach, event pipeline, certificate issuance, and national leaderboards.

---

## Features

### Ambassador & Chapter Management
- Register and manage ambassadors across 16+ Kenyan institutions
- Create and configure university and TVET chapters
- Assign and track Campus Leads and Deputy Leads with full history
- Transfer ambassadors between chapters while preserving membership records
- Set per-chapter targets (ambassadors, referrals, workshops, projects)

### Activity Tracking & Points Engine
- 17 configurable activity types (workshops, hackathons, referrals, media appearances, etc.)
- Fully configurable point values and monthly caps per activity type
- Activity submission workflow with evidence upload: Draft → Pending → Approved/Rejected
- Duplicate referral detection using SHA-256 hashing
- Points ledger with double-entry integrity — every point is traceable to an approved activity
- Monthly point cap enforcement per activity category

### Milestone & Certificate System
- Three achievement tiers: **Campus Ambassador** → **Chapter Lead Achievement** → **National Cloud Fellow**
- Automatic milestone evaluation on every activity approval
- PDF certificate generation with QR code and verification URL
- Public certificate verification at `/verify/[code]` — no login required
- Certificate revocation and reissuance

### Media & Industry Visibility CRM
- Track outreach to Kenyan podcasts (TechTrendsKE, My Tech Story Africa, Admin Access, etc.)
- Full opportunity pipeline: Identified → Pitched → Accepted → Published → Completed
- Log every organiser interaction (email, LinkedIn, call, meeting)
- Automated follow-up reminders with overdue flagging
- Media dashboard with conversion rate and total estimated reach

### Events & Opportunities Pipeline
- Track technology conferences, hackathons, career fairs, university workshops
- Full status pipeline with speaker / sponsor / exhibition opportunity flags
- Register team members for events with participation roles
- Record attendance outcomes and contacts made

### WhatsApp Community Tracking
- Monthly community metrics submitted by Campus Leads
- National and chapter-level group growth tracking
- Growth charts and community size leaderboards
- Admin verification of submitted metrics

### National Leaderboards
- Top ambassadors by verified points
- Best performing chapters (adjusted for chapter size and participation rate)
- Highest community growth this month
- Most workshops organised

### Notifications & Reporting
- In-app notifications for approvals, milestones, certificates, and announcements
- CSV export for ambassadors, activities, workshops, and referrals
- Activity trend charts (6-month area chart)
- Role-scoped reporting for Campus Leads and Super Admin

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 · TypeScript · Tailwind CSS v4 · Recharts |
| **API** | tRPC v11 (type-safe end-to-end) |
| **Database ORM** | Prisma 7 with `@prisma/adapter-pg` |
| **Database** | PostgreSQL 16 |
| **Authentication** | NextAuth v5 (JWT strategy, credentials provider) |
| **Background Jobs** | BullMQ + Redis |
| **PDF Generation** | Puppeteer Core + Chromium |
| **QR Codes** | `qrcode` library |
| **Email** | Nodemailer (SMTP) |
| **Deployment** | Docker + Docker Compose + Nginx reverse proxy |

---

## User Roles

| Role | Access |
|---|---|
| **Super Admin** | Full system access — manage all chapters, ambassadors, activities, media, certificates, settings |
| **Campus Lead** | Chapter-scoped — review activities, manage chapter ambassadors, submit community reports |
| **Ambassador** | Submit activities, track points, view certificates and leaderboard position |
| **Public** | Verify certificates at `/verify/[code]` — no account required |

---

## Project Structure

```
campus-tracking/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Login, register, password reset
│   │   ├── (dashboard)/
│   │   │   ├── admin/           # Super Admin pages
│   │   │   ├── lead/            # Campus Lead pages
│   │   │   └── ambassador/      # Ambassador pages
│   │   ├── api/
│   │   │   ├── trpc/            # tRPC API handler
│   │   │   ├── auth/            # NextAuth handler
│   │   │   └── upload/          # File upload endpoint
│   │   └── verify/[code]/       # Public certificate verification
│   ├── components/
│   │   ├── dashboard/           # Sidebar, shell, stat card, page primitives
│   │   └── ui/                  # Button, input, badge, card, table, select
│   ├── server/
│   │   ├── auth/                # NextAuth config + permissions matrix
│   │   ├── jobs/                # BullMQ certificate PDF job
│   │   ├── routers/             # tRPC routers (11 routers)
│   │   ├── services/            # Points, milestones, certificates, email, audit
│   │   ├── db.ts                # Prisma client singleton
│   │   ├── trpc.ts              # tRPC initialisation + procedure types
│   │   └── root.ts              # Root tRPC router
│   ├── lib/
│   │   ├── trpc.ts              # Client-side tRPC
│   │   ├── trpc-provider.tsx    # React Query + tRPC provider
│   │   ├── utils.ts             # Formatting helpers
│   │   └── validations/         # Zod schemas
│   └── types/
│       └── next-auth.d.ts       # Session type extensions
├── prisma/
│   ├── schema.prisma            # 35-model database schema
│   ├── seed.ts                  # Kenyan institutions + demo accounts
│   └── migrations/              # SQL migrations
├── workers/
│   └── index.ts                 # BullMQ worker entry point
├── nginx/
│   └── nginx.conf               # Reverse proxy + SSL config
├── docs/
│   └── deployment.md            # Full Truehost VPS deployment guide
├── Dockerfile
├── Dockerfile.worker
├── docker-compose.yml
├── .env.example
└── prisma.config.ts
```

---

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL 16
- Redis 7

### 1. Clone the repository

```bash
git clone https://github.com/Vokeh254/Truehost-CampusHub.git
cd Truehost-CampusHub
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```env
DATABASE_URL="postgresql://campususer:yourpassword@localhost:5432/campus_tracking"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
REDIS_URL="redis://localhost:6379"
SMTP_HOST="mail.yourdomain.co.ke"
SMTP_USER="noreply@yourdomain.co.ke"
SMTP_PASS="your-smtp-password"
```

### 4. Set up the database

Create a PostgreSQL user and database:

```sql
CREATE USER campususer WITH PASSWORD 'yourpassword';
CREATE DATABASE campus_tracking OWNER campususer;
GRANT ALL PRIVILEGES ON DATABASE campus_tracking TO campususer;
```

Run migrations:

```bash
npx prisma migrate deploy
```

Seed with Kenyan institutions and demo accounts:

```bash
npm run db:seed
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo Accounts

After seeding, the following accounts are available:

| Role | Email | Password |
|---|---|---|
| Super Admin | `admin@truehost.cloud` | `Admin@TruehostCB2024!` |
| Campus Lead (JKUAT) | `lead.jkuat@truehost.cloud` | `Lead@JKUAT2024!` |
| Ambassador (UoN) | `amb.uon@truehost.cloud` | `Amb@UoN2024!` |
| Demo Ambassador | `wanjiru@demo.truehost.cloud` | `Demo@2024!` |

**Change all passwords immediately in any non-development environment.**

---

## Production Deployment (Truehost VPS)

A full step-by-step guide is in [`docs/deployment.md`](docs/deployment.md), covering:

- Server setup and Docker installation
- SSL certificate with Let's Encrypt
- Nginx reverse proxy configuration
- Database migration and seeding
- Automatic certificate renewal
- Daily backup script

### Quick start with Docker Compose

```bash
# Copy and configure environment
cp .env.example .env
nano .env

# Build and start all services
docker compose build
docker compose up -d

# Run migrations and seed
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run db:seed
```

Services started:
- `app` — Next.js application on port 3000
- `worker` — BullMQ background worker (PDF generation)
- `postgres` — PostgreSQL 16
- `redis` — Redis 7
- `nginx` — Reverse proxy on ports 80 and 443

---

## Database Schema

The schema (`prisma/schema.prisma`) contains 35 models. Key relationships:

```
Institution ──< Chapter ──< CampusLeadAssignment >── User
                       ──< ChapterMembership >── AmbassadorProfile
                       ──< ActivitySubmission ──< ActivityEvidence
                                             ──> PointsTransaction
AmbassadorProfile ──< TierAchievement ──> Milestone ──> CertificateTemplate
                  ──> Certificate ──< CertificateVerification
Event ──< OrganiserInteraction
MediaOpportunity ──< OrganiserInteraction
CommunityGroup ──< CommunityMetric
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:migrate:dev` | Create and apply a new migration |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Seed database with institutions and demo data |
| `npm run db:studio` | Open Prisma Studio |

---

## Security

- Passwords hashed with bcrypt (cost factor 12)
- JWT sessions — no server-side session storage
- Role-based access control enforced at tRPC procedure level
- Middleware JWT guards on all dashboard routes (Edge Runtime compatible)
- Input validation with Zod on every API endpoint
- File upload validation (type and size) on the upload endpoint
- Audit log on all sensitive operations
- `.env` excluded from version control

---

## Supported Kenyan Institutions

The seed data includes 16 institutions:

University of Nairobi · Kenyatta University · JKUAT · Strathmore University · Moi University · Maseno University · Egerton University · Multimedia University of Kenya · Technical University of Kenya · Dedan Kimathi University of Technology · Pwani University · Masinde Muliro University of Science · Nairobi Institute of Technology · Kenya Technical Trainers College · Kisumu National Polytechnic · Eldoret National Polytechnic

Additional institutions can be added through the **Admin → Chapters → Institutions** page.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes with a descriptive message
4. Push to your fork and open a pull request against `main`

Please keep pull requests focused on a single change. Update the README if you add new environment variables or change the deployment process.

---

## Licence

This project is proprietary software developed for **Truehost Cloud Kenya**.  
All rights reserved. © 2024 Truehost Cloud Kenya.

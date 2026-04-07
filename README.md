# ✝ Warsaw Ethiopian Christian Fellowship — Full Stack Web App

A complete church management system built with **Next.js 14**, **PostgreSQL**, **Prisma**, **NextAuth**, and **Nodemailer**. Includes a public website and a full member management portal.

---

## 📋 Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Quick Start (Local)](#quick-start-local)
6. [Environment Variables](#environment-variables)
7. [Default Accounts](#default-accounts)
8. [Deployment (Vercel + Railway)](#deployment-vercel--railway)
9. [Email Setup](#email-setup)
10. [API Reference](#api-reference)

---

## ✨ Features

### Public Website
- 🏠 **Homepage** — Hero, verse of the day (NIV, rotates daily), upcoming events, programs
- 📖 **About** — Mission, values, leadership
- 🎵 **Programs** — Bible Study, Worship Night, Sermon, Literature Night, BUS Meetings
- 📅 **Events** — Upcoming & past events with type-color coding
- 📍 **Visit Us** — Location, service times, Google Maps embed
- 📝 **Register** — Public account creation with welcome email

### Member System
- 🔐 **Authentication** — NextAuth email/password with JWT sessions
- 👤 **Roles** — Member, BUS Leader, Guardian (Admin)
- 📊 **Member Dashboard** — Verse of day, announcements, events, BUS group info

### Attendance System
- ✅ BUS Leaders/Guardians record weekly attendance
- 📧 **Automatic email** sent to BUS leader when member is absent
- 📈 Members view their own attendance history with rate tracking

### BUS Group System
- 👥 Admin-assigned groups with named leaders
- Leaders view their members and attendance
- Guardians manage all groups

### E-Library
- 📚 Members browse books (search, filter by category)
- 📖 Reserve books for Saturday service collection
- ⏰ **Automated email reminders** before due dates (Vercel Cron)
- 🔄 Admin marks books as returned, tracks overdue

### Admin Dashboard (Guardian)
- 👥 Manage all members (roles, BUS group assignment, active/inactive)
- 🏘️ Create/delete BUS groups, assign leaders
- 📅 Create/delete events (public or members-only)
- 📢 Publish announcements (pin, set expiry, public/private)
- 📚 Add/remove library books, manage rentals

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18 |
| Styling | TailwindCSS, custom design tokens |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth v4 (credentials + JWT) |
| Email | Nodemailer |
| Hosting | Vercel (app) + Railway (database) |
| Language | TypeScript |

---

## 📁 Project Structure

```
wecf/
├── prisma/
│   ├── schema.prisma          # Full database schema
│   └── seed.ts                # Seed data (books, events, users)
│
├── src/
│   ├── app/
│   │   ├── (public)/          # Public website route group
│   │   │   ├── page.tsx       # Homepage
│   │   │   ├── about/
│   │   │   ├── programs/
│   │   │   ├── events/
│   │   │   ├── visit/
│   │   │   └── register/
│   │   │
│   │   ├── login/             # Auth pages
│   │   ├── dashboard/         # Protected member area
│   │   │   ├── page.tsx       # Member dashboard
│   │   │   ├── library/       # E-Library
│   │   │   ├── attendance/    # Attendance (record/view)
│   │   │   ├── bus-groups/    # BUS group view
│   │   │   └── admin/         # Guardian-only pages
│   │   │       ├── members/
│   │   │       ├── bus-groups/
│   │   │       ├── events/
│   │   │       ├── announcements/
│   │   │       └── books/
│   │   │
│   │   └── api/               # API routes
│   │       ├── auth/          # NextAuth + register
│   │       ├── verse/         # Daily verse (NIV)
│   │       ├── events/
│   │       ├── announcements/
│   │       ├── members/
│   │       ├── bus-groups/
│   │       ├── attendance/    # With auto email on absence
│   │       └── books/
│   │           └── rentals/   # Reserve + return + reminder cron
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── PublicHeader.tsx
│   │   │   ├── PublicFooter.tsx
│   │   │   ├── DashboardSidebar.tsx
│   │   │   └── Providers.tsx
│   │   └── ui/
│   │       └── index.tsx      # Button, Card, Badge, Input, etc.
│   │
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── auth.ts            # NextAuth config
│   │   ├── email.ts           # Nodemailer + email templates
│   │   └── utils.ts           # Helpers (cn, formatDate, etc.)
│   │
│   └── types/
│       └── next-auth.d.ts     # Session type extensions
│
├── .env.example
├── vercel.json                # Cron job config
└── README.md
```

---

## 🗄 Database Schema

```
User          — id, name, email, password, role, phone, busGroupId, isActive
Account       — NextAuth OAuth accounts
Session       — NextAuth sessions
BUSGroup      — id, name, description, leaderId
Attendance    — userId, busGroupId, date, status (PRESENT/ABSENT/EXCUSED)
Book          — title, author, description, totalQuantity, availableQty, category
BookRental    — userId, bookId, status (ACTIVE/RETURNED/OVERDUE), dueDate
Event         — title, type, startDate, endDate, location, isPublic
Announcement  — title, content, isPublic, isPinned, expiresAt
```

---

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js 18+
- PostgreSQL (local or cloud)
- Git

### 1. Clone & install

```bash
git clone <your-repo-url> wecf
cd wecf
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values (see [Environment Variables](#environment-variables)).

### 3. Set up database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🔑 Environment Variables

```env
# Database — get from Railway or your local Postgres
DATABASE_URL="postgresql://user:password@host:5432/wecf_db"

# NextAuth — generate a secret with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-32-char-minimum-string"

# Email — Gmail example (use App Password, not your real password)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-gmail@gmail.com"
EMAIL_SERVER_PASSWORD="your-16-char-app-password"
EMAIL_FROM="Warsaw Ethiopian Christian Fellowship <noreply@wecf.org>"
```

---



---

## 🌐 Deployment (Vercel + Railway)

This is the recommended zero-ops stack. Both have generous free tiers.

### Step 1 — Database on Railway

1. Go to [railway.app](https://railway.app) → New Project → **PostgreSQL**
2. Click on the Postgres service → **Variables** tab
3. Copy the `DATABASE_URL` connection string

### Step 2 — Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Add environment variables:
   - `DATABASE_URL` — from Railway
   - `NEXTAUTH_URL` — your Vercel URL (e.g. `https://wecf.vercel.app`)
   - `NEXTAUTH_SECRET` — run `openssl rand -base64 32`
   - `EMAIL_SERVER_*` — your email credentials
4. Click **Deploy**

### Step 3 — Run database migrations on production

After deploy, run from your local machine:

```bash
# Point to production database temporarily
DATABASE_URL="your-railway-url" npm run db:push
DATABASE_URL="your-railway-url" npm run db:seed
```

Or use Railway's built-in shell to run the seed.

### Step 4 — Cron Job (book reminders)

The `vercel.json` file already configures a daily cron at 8:00 AM UTC:

```json
{
  "crons": [{ "path": "/api/books/rentals", "schedule": "0 8 * * *" }]
}
```

This requires a **Vercel Pro** plan. For free tier, use an external cron service like [cron-job.org](https://cron-job.org) to hit:

```
PUT https://your-app.vercel.app/api/books/rentals
Authorization: Bearer YOUR_NEXTAUTH_SECRET
```

---

## 📧 Email Setup

### Gmail (Recommended for getting started)

1. Enable 2FA on your Google account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Create an App Password for "Mail"
4. Use that 16-character password as `EMAIL_SERVER_PASSWORD`

### Production (Recommended)

For production, use a transactional email service:
- **[Resend](https://resend.com)** — 3,000 emails/month free, excellent DX
- **[SendGrid](https://sendgrid.com)** — 100 emails/day free
- **[Mailgun](https://mailgun.com)** — 1,000 emails/month free

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/verse` | Public | Daily NIV verse |
| POST | `/api/auth/register` | Public | Register new user |
| GET | `/api/events` | Public/Member | List events |
| POST | `/api/events` | Guardian | Create event |
| GET | `/api/announcements` | Public/Member | List announcements |
| POST | `/api/announcements` | Guardian | Create announcement |
| GET | `/api/members` | Leader+ | List members |
| PATCH | `/api/members?id=` | Guardian | Update member |
| GET | `/api/bus-groups` | Member+ | List groups |
| POST | `/api/bus-groups` | Guardian | Create group |
| PATCH | `/api/bus-groups?id=` | Guardian | Update / assign members |
| GET | `/api/attendance` | Member+ | Get attendance records |
| POST | `/api/attendance` | Leader+ | Record attendance + send emails |
| GET | `/api/books` | Public | List library books |
| POST | `/api/books` | Guardian | Add book |
| GET | `/api/books/rentals` | Member+ | Get rentals |
| POST | `/api/books/rentals` | Member | Reserve book |
| PATCH | `/api/books/rentals?id=` | Guardian | Return book |
| PUT | `/api/books/rentals` | Cron secret | Send reminders + mark overdue |

---

## 🎨 Design System

- **Colors**: Ethiopian flag-inspired (forest green, gold, crimson)
- **Typography**: Playfair Display (display/scripture) + Lato (body)
- **Accent**: `--accent: 43 96% 56%` (Ethiopian gold)
- **Primary**: `--primary: 150 73% 23%` (deep forest green)

---

## 🤝 Contributing

This project is built for the Warsaw Ethiopian Christian Fellowship. For questions or contributions, contact the fellowship administration.

---

*Built with ❤️ and prayer for the glory of God.*
*"Not giving up meeting together, but encouraging one another" — Hebrews 10:25*

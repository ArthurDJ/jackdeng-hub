# Jack Deng's Personal Hub (jackdeng.cc)

Welcome to the ultimate personal digital hub, combining a highly optimized public-facing frontend with a secure, headless CMS backend. This project serves as a portfolio, a blog, and a centralized dashboard for internal and external web tools.

## 🎯 Objectives
- Build a modern, lightning-fast digital business card.
- Provide a secure, self-hosted management interface (Admin Dashboard) accessible anywhere.
- Establish a "Tools Engine" to dynamically expose Serverless functions or internal scripts to the public or just the admin.
- Achieve 100% data sovereignty while maintaining zero-maintenance infrastructure.

## 💡 Core Requirements
1. **Public Site (Frontend):** Read-only, highly optimized Next.js frontend with Tailwind CSS. Includes Home, About, Blogs, Projects, and Tools directories.
2. **Private Backend (Admin):** Secure dashboard hidden from crawlers (e.g., `/admin`). Requires secure login.
3. **Dynamic Tools Sandbox:** A specialized database collection allowing the admin to toggle the visibility and permissions of embedded web tools or backend API routes.

## 🛠 Tech Stack
- **Framework:** Next.js (App Router)
- **CMS / Admin:** Payload CMS 3.0
- **Database:** PostgreSQL (hosted on Supabase)
- **ORM:** Drizzle ORM (embedded within Payload)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel (Production) & Cloudflare Pages/Tunnels (Edge Routing)

## 🚀 How to Deploy & Configure

### Prerequisites
- Node.js 18.x or newer
- A Supabase account (with an active PostgreSQL database)

### 1. Environment Setup
Create a `.env` file at the root of the project:
```env
# Supabase Postgres Connection String (Pooler / IPv4 compatible)
DATABASE_URI="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Payload Encryption Secret
PAYLOAD_SECRET="your-secure-random-string"
```

### 2. Install & Run Locally
```bash
# Install dependencies
npm install

# Run development server (will automatically apply database migrations)
npm run dev
```

### 3. Production Deployment
This repository is pre-configured for Vercel. 
1. Push this repository to GitHub.
2. Import the repository in Vercel.
3. Add the `.env` variables to Vercel's Environment Variables panel.
4. Click Deploy. Vercel will automatically build the Next.js/Payload bundle.

# AI Agent Automated Deployment & Operation Guide

## 🤖 Context for AI Assistants
This document is strictly formatted for AI coding agents (OpenClaw, Cursor, Claude, etc.) that need to interface with, deploy, or extend this project.

### Project Architecture
- **Type:** Full-stack Next.js Application (App Router) integrating Payload CMS 3.0.
- **Database:** Supabase (PostgreSQL 16+). Drizzle ORM is natively handled by Payload. Do not install Prisma or other ORMs.
- **Pathing Context:** `/src/app/(payload)` handles CMS routing. `/src/collections/` defines database schemas.

## ⚡️ One-Click / Zero-Touch Deployment Flow

When commanded to deploy or setup this project from scratch, execute the following shell chain:

```bash
# 1. Install dependencies
cd jackdeng-hub
npm install

# 2. Ensure environment variables exist
# Required: DATABASE_URI (must point to Supabase port 6543 pooler)
# Required: PAYLOAD_SECRET
if [ ! -f .env ]; then
  echo "DATABASE_URI=\"$SUPABASE_URI\"" > .env
  echo "PAYLOAD_SECRET=\"$(openssl rand -hex 32)\"" >> .env
fi

# 3. Synchronize database schema (Payload Drizzle Migrations)
# This command bypasses interactive prompts and applies schema changes to Supabase
npx payload migrate

# 4. Build Production Assets
npm run build

# 5. Start Production Server (Background)
nohup npm run start > payload_prod.log 2>&1 &
```

## 🛠 Extending the Tools Engine (Instructions for Agents)
When the user asks to "add a new tool":
1. Add the tool's frontend UI inside `/src/app/(app)/tools/[slug]/page.tsx`.
2. Add any backend secure logic in Next.js Serverless API routes: `/src/app/api/tools/[slug]/route.ts`.
3. The visibility of the tool is strictly controlled by querying the `Tools` collection in Payload via Local API. Do not expose unauthenticated API routes without checking the `status` and `permission` fields in the `Tools` collection.

## 🚨 Troubleshooting Guidelines
- **500 Errors on `/admin` during Local Dev (Cloudflare Tunnel):** Check `next.config.mjs`. Payload strictly enforces CORS and origin checks. Ensure `allowedDevOrigins` includes the active Cloudflare Tunnel hostname.
- **Database Connection Failures:** Ensure `DATABASE_URI` uses IPv4 pooling (`aws-1...pooler.supabase.com:6543`) with `?pgbouncer=true`. Native IPv6 (`db.xxx.supabase.co:5432`) will silently fail on local machines without IPv6 ISP support.

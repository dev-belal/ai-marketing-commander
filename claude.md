# AI Marketing Command Center

SaaS platform built exclusively for SEO & Marketing Agencies.
Agencies log in, manage multiple clients, run AI-powered marketing
audits, generate on-brand content, and deliver white-label PDF reports.

## ICP
SEO and marketing agencies — 2 to 25 person teams, managing 5 to 50
clients on monthly retainers. Core value: replaces 6 tools, cuts
client reporting time by 70%, white-labels everything.

## Tech Stack
- Next.js 15 App Router — server components by default
- TypeScript strict mode — never use `any`
- Supabase — auth, postgres, storage
- Stripe — subscriptions and billing
- Anthropic API — Claude Sonnet for all AI features
- Tailwind CSS + shadcn/ui — all UI components
- Resend — transactional email
- Vercel — deployment target

## Folder Structure
src/app/(auth)/          → public pages: login, signup, onboarding
src/app/(dashboard)/     → all protected routes, require valid session
src/app/api/             → API routes and webhooks
src/lib/supabase/        → ALL database queries live here only
src/lib/anthropic/       → ALL AI/Claude API calls live here only
src/lib/stripe/          → ALL billing logic lives here only
src/components/ui/       → shadcn components only, never modify
src/components/app/      → custom app-specific components
src/types/               → all shared TypeScript interfaces

## Architecture Rules
- NEVER query the database directly inside components
- NEVER call Anthropic API directly inside components or pages
- ALWAYS use server components unless interactivity is required
- ALWAYS add 'use client' only when strictly necessary
- NEVER use default exports except for Next.js page files
- ALWAYS handle loading state, error state, and empty state in every component
- ALWAYS validate API route inputs with Zod before processing
- ALWAYS check auth session at the layout or route level, never component level

## Multi-Tenant Data Model
Every row in every table belongs to an agency via agency_id.
A user belongs to one agency. Clients belong to an agency.
Brand context belongs to a client. All queries must filter by agency_id.
RLS must be enabled on every single table — no exceptions.

Key tables:
- agencies (id, name, logo_url, stripe_customer_id, plan)
- users (id, agency_id, email, role)
- clients (id, agency_id, name, website_url, industry)
- brand_context (id, client_id, agency_id, voice, icp, services, competitors, keywords, goals)
- audit_runs (id, client_id, agency_id, type, status)
- audit_results (id, audit_run_id, dimension, score, findings, recommendations)
- generated_content (id, client_id, agency_id, type, output, tokens_used)
- report_exports (id, client_id, agency_id, pdf_url, delivered_at)
- subscriptions (id, agency_id, stripe_subscription_id, plan, status)

## AI Agent Pattern
All AI calls go through src/lib/anthropic/run-agent.ts
Every agent reads brand_context for the client before generating anything
Always stream responses — never wait for full completion
Log token usage per client_id for billing tracking
Parallel agents use Promise.all() — never run sequentially

## Error Handling Pattern
Use Result pattern: return { data, error } not try/catch throws
API routes return { success: true, data } or { success: false, error: string }
Never expose raw error messages to the client

## Current Build Phase
PHASE 1 — MVP (build in this order):
[ ] 1. Supabase project setup + full DB schema with RLS
[ ] 2. Auth flow — signup creates agency + user, login, forgot password
[ ] 3. Onboarding wizard — 4 steps after first signup
[ ] 4. Client workspace — create and manage clients
[ ] 5. Brand Context form — multi-step, saves to brand_context table
[ ] 6. Marketing Audit — 5 parallel agents, streams results
[ ] 7. White-label PDF report — Puppeteer, saved to Supabase Storage
[ ] 8. Stripe billing — 4 plans, webhooks, feature gating

## Commands
Dev server:      npm run dev
Build:           npm run build
Supabase push:   npx supabase db push
Generate types:  npx supabase gen types typescript --local > src/types/supabase.ts
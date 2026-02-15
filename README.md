# operatic

A minimal black-and-white blog built with Next.js (App Router), TypeScript, Tailwind CSS, Clerk (auth), and Supabase (Postgres). Only admins (allowlisted by email) can create, edit, and delete posts.

## Tech stack

- **Next.js 14** (App Router) + TypeScript + React
- **Tailwind CSS** — monochrome, thin typography (Inter 300)
- **Clerk** — managed auth, cookie-based sessions, no custom user/password handling
- **Supabase** — Postgres for blog posts
- **Zod** — validation for API payloads
- **react-markdown** — safe markdown rendering

## Prerequisites

- Node.js 18+
- npm (or yarn/pnpm)
- A [Clerk](https://clerk.com) account
- A [Supabase](https://supabase.com) project

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Clerk

1. Create an application at [dashboard.clerk.com](https://dashboard.clerk.com).
2. In the app, open **API Keys** and copy:
   - **Publishable key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret key** → `CLERK_SECRET_KEY`
3. Under **Paths**, set Sign-in and Sign-up to your app paths (e.g. `/sign-in`, `/sign-up`) and set the application URL to your domain (e.g. `https://www.operatic.net`) so redirects go to your site, not Clerk’s hosted domain.
4. In **Environment variables** (or `.env`), set `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` (and optionally `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`) so Clerk uses your app’s sign-in/sign-up pages instead of the hosted Account Portal.

### 3. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the dashboard: **Project Settings → API**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role** (secret) → `SUPABASE_SERVICE_ROLE_KEY` (never expose this in the client)
3. Create the `posts` table. In the SQL Editor, run the migration:

```sql
-- From supabase/migrations/001_create_posts.sql
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  published_at timestamptz not null default now(),
  excerpt text not null default '',
  content text not null default '',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_slug_idx on public.posts (slug);
create index if not exists posts_published_at_idx on public.posts (published_at desc);
create index if not exists posts_published_idx on public.posts (published) where published = true;
```

### 4. Environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` and set:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` — use your app’s sign-in page so redirects stay on your domain (e.g. `yoursite.com/sign-in`), not Clerk’s hosted URL
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAILS` — comma-separated emails that can access `/admin` and manage posts, e.g. `me@domain.com,other@domain.com`

**Newsletter (optional):** To enable the newsletter feature (signup, send from admin, scheduled sends):

- `RESEND_API_KEY` — API key from [Resend](https://resend.com) (used to send emails).
- `RESEND_FROM` — Sender address, e.g. `Blog <newsletter@yourdomain.com>`. Resend requires a verified domain in production; for testing you can use `onboarding@resend.dev`.
- `NEXT_PUBLIC_SITE_URL` — Full site URL (e.g. `https://yourblog.com`) used for post links in newsletters. If unset, Vercel deployments use `VERCEL_URL` automatically.
- `CRON_SECRET` — Shared secret to protect the cron endpoint. Set a random string and pass it when invoking the cron (e.g. `Authorization: Bearer <CRON_SECRET>` or `?secret=<CRON_SECRET>`).

### 5. Seed (optional)

Create two example posts:

```bash
npm run seed
```

(Requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`.)

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with an email that is in `ADMIN_EMAILS` to see the **Admin** link and manage posts.

## Project structure

```
app/
  layout.tsx          # Root layout, ClerkProvider, Header
  page.tsx            # Home
  globals.css
  posts/
    page.tsx          # List of posts (published only for non-admins)
    [slug]/page.tsx   # Single post (markdown rendered)
  about/page.tsx
  admin/
    layout.tsx        # Protects admin: redirects non-admins
    page.tsx          # Admin dashboard (list posts)
    new/page.tsx      # Create post
    edit/[id]/page.tsx
  api/
    posts/
      route.ts        # GET (list), POST (create, admin only)
      [id]/route.ts   # GET, PUT, DELETE (admin only for write)
      by-slug/[slug]/route.ts  # GET by slug
components/
  Header.tsx          # Nav + Sign in / UserButton
  MarkdownContent.tsx # Safe markdown renderer
  PostForm.tsx        # Create/edit form (client)
lib/
  supabase.ts         # Supabase admin client
  auth.ts             # isAdmin(email)
  clerk.ts            # getCurrentUserEmail()
  validations.ts      # Zod schemas for posts
types/
  database.ts         # Post type, Supabase Database type
middleware.ts         # Clerk; protects /admin
supabase/migrations/
  001_create_posts.sql
scripts/
  seed.ts
```

## Auth and security

- **Clerk** handles sign-in, sign-up, and sessions (cookie-based; no tokens in `localStorage`).
- **Middleware** protects `/admin*`: only signed-in users can reach it; the admin layout then redirects non-admins.
- **Admin** is determined by `ADMIN_EMAILS`; the server resolves the current user’s email via Clerk and checks it on every admin API call (create/update/delete). All write operations are protected server-side.

## API

- `GET /api/posts` — List posts. Query `?admin=true` returns all posts when the user is an admin; otherwise only published.
- `POST /api/posts` — Create post (admin only). Body: `title`, `slug`, `excerpt`, `content`, `published`, optional `published_at`.
- `GET /api/posts/:id` — Single post by id (404 if draft and not admin).
- `PUT /api/posts/:id` — Update post (admin only).
- `DELETE /api/posts/:id` — Delete post (admin only).
- `GET /api/posts/by-slug/:slug` — Single post by slug.

Validation for create/update is done with Zod in the route handlers.

### Newsletter API

- `POST /api/newsletter/subscribe` — Public. Body: `{ "email": "..." }`. Validates and stores the email (no double opt-in by default).
- `GET /api/newsletter/subscribers` — Admin only. Returns list of subscribers.
- `POST /api/newsletter/send` — Admin only. Body: `type` ("post" | "custom"), optional `post_id`, optional `subject`/`body`/`body_is_markdown`, optional `scheduled_at`. Sends now or creates a scheduled send.
- `GET /api/newsletter/scheduled` — Admin only. Returns list of scheduled and sent newsletters.
- `GET /api/newsletter/cron` or `POST /api/newsletter/cron` — Cron-only. Query `newsletter_sends` where `scheduled_at <= now()` and `sent_at is null`, sends each and sets `sent_at`. Secured by `CRON_SECRET` (header `Authorization: Bearer <secret>` or `x-cron-secret`, or query `?secret=`).

**Cron (scheduled sends):** Call the cron endpoint on a schedule (e.g. every 5 minutes). On Vercel, add to `vercel.json`:

```json
{
  "crons": [{ "path": "/api/newsletter/cron", "schedule": "*/5 * * * *" }]
}
```

Vercel will send requests with a special header; you can also validate `CRON_SECRET` in the route (the route checks `Authorization`, `x-cron-secret`, or `?secret=`).

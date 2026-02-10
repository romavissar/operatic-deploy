# Prompt: Add newsletter feature to the blog

**Context:** This is a Next.js 14 (App Router) blog with Supabase, Clerk, and Tailwind. Admin lives under `app/(blog)/admin` with a layout at `app/(blog)/admin/layout.tsx` (nav: Dashboard, New post, Pages, Tags). Auth is via `lib/auth.ts` (`isAdmin(email)`), and data access uses `getSupabaseAdmin()` from `lib/supabase.ts`. DB types live in `types/database.ts` and migrations in `supabase/migrations/`.

**Goal:** Implement a full newsletter flow: public signup by email, and in the admin panel the ability to send newsletters (either by picking a post to send or writing a custom message) and to schedule sends.

**Requirements:**

1. **Newsletter signup (public)**  
   - Add a way for visitors to subscribe with their email (e.g. a form in the footer or a dedicated `/newsletter` page).  
   - Store emails in Supabase (new table).  
   - Validate and normalize email; avoid duplicate signups.  
   - Optional: double opt-in (send a confirmation link; only mark as subscribed after they click).  
   - Optional: show a success/error message or toast after submit.

2. **Admin: Newsletter section**  
   - In `app/(blog)/admin/layout.tsx`, add a “Newsletter” link in the nav (same style as “Pages”, “Tags”).  
   - Under admin, add a Newsletter area that includes:  
     - **Subscribers:** list of subscribed emails (and optionally signup date, status if using double opt-in).  
     - **Send newsletter:**  
       - **Option A – Send a post:** choose a published post (e.g. dropdown or list); the newsletter is sent with that post’s title, excerpt, and link to the post (e.g. `{siteUrl}/posts/{slug}`).  
       - **Option B – Custom message:** subject line + body (plain text or markdown; if markdown, send HTML rendered from it).  
     - **Schedule:** when sending (or when creating a scheduled send), allow “Send now” or “Schedule for” (date/time). Store scheduled sends in Supabase and process them with a cron job or similar.

3. **Data model (Supabase)**  
   - **newsletter_subscribers:** e.g. `id`, `email` (unique), `created_at`, optional `confirmed_at` (null = unconfirmed if using double opt-in).  
   - **newsletter_sends** (or similar): e.g. `id`, `subject`, `body_html` or `body_text`, optional `post_id` (if send was “from a post”), `scheduled_at`, `sent_at` (null until sent), `created_at`.  
   - Add migrations and update `types/database.ts` to match.

4. **Sending emails**  
   - Use a transactional email provider (e.g. Resend, SendGrid, Postmark).  
   - API key in env (e.g. `RESEND_API_KEY` or `SENDGRID_API_KEY`).  
   - Implement a server-side “send” function that: takes subscriber emails (or a send id and looks up subscribers), builds the email (post-based or custom), and calls the provider.  
   - When “Send now” is used, call this send function from an API route (admin-only, protected by `isAdmin`).  
   - When “Schedule” is used, only insert a row in `newsletter_sends` with `scheduled_at` and `sent_at = null`; do not send immediately.

5. **Processing scheduled sends**  
   - Create an API route that is invoked by a cron (e.g. Vercel Cron “every 5 minutes” or similar).  
   - The route should: query `newsletter_sends` where `scheduled_at <= now()` and `sent_at is null`, then for each run the same send logic, set `sent_at = now()`, and handle errors (e.g. log and still set `sent_at` to avoid retries, or retry logic if you prefer).  
   - Secure the cron route (e.g. with a shared secret in the request header or Vercel’s cron auth) so only the scheduler can call it.

6. **APIs**  
   - **POST /api/newsletter/subscribe** (public): body `{ email }`, validate, insert into `newsletter_subscribers` (or send opt-in email first). Return JSON success/error.  
   - **GET /api/newsletter/subscribers** (admin): return list of subscribers (protected by Clerk + `isAdmin`).  
   - **POST /api/newsletter/send** (admin): body includes type (“post” | “custom”), optional `post_id`, optional `subject`/`body`, and `scheduled_at` (optional). If `scheduled_at` is missing or in the past, send immediately; otherwise create a scheduled send.  
   - **GET /api/newsletter/scheduled** (admin): return list of upcoming/past scheduled sends.  
   - **GET (or POST) /api/newsletter/cron** (cron-only): process due scheduled sends and send emails.

7. **UI consistency**  
   - Reuse existing patterns: forms and buttons like in `PostForm.tsx` and `PageForm.tsx`, rounded inputs/buttons, same Tailwind and layout conventions.  
   - Admin newsletter pages should live under `app/(blog)/admin/newsletter/` (e.g. `page.tsx` for the main view, optional sub-routes for “compose” or “schedule” if you split them).

8. **Edge cases**  
   - If sending “from a post”, resolve the post’s canonical URL using the same base URL as the rest of the site (e.g. env `NEXT_PUBLIC_SITE_URL` or `VERCEL_URL`).  
   - When sending, only include subscribers that are confirmed (if using double opt-in).  
   - Rate limits or batching: if the list is large, send in batches to respect provider limits and avoid timeouts.

**Deliverables:**  
- New Supabase migrations for `newsletter_subscribers` and `newsletter_sends`.  
- Updated `types/database.ts`.  
- Public signup UI (form + optional confirmation flow).  
- Admin newsletter UI: subscribers list, compose/send (post or custom), schedule option, and list of scheduled sends.  
- API routes above.  
- Cron endpoint + instructions (e.g. in README) for wiring the cron in Vercel (or elsewhere).  
- README or env example update for the email provider API key and, if used, `NEXT_PUBLIC_SITE_URL` and cron secret.

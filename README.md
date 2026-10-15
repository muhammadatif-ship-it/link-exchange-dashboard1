# Link Exchange Hub — starter project

A private link-exchange tracker for managing multiple partners, communities, and email-based collaborations in one place.

## Included
- Email/password sign-in via Supabase Auth
- Admin vs partner role
- Link URL, direction (sent / received), status (pending / live / rejected), notes, date
- Partner-facing dashboard is intended to show only that partner's records
- Admin-only status management
- PostgreSQL Row Level Security (RLS) policies in `supabase/schema.sql`
- Ready to deploy as a Next.js app on Vercel

## Important behavior / design
- **Admin:** can see all partner records, add links under a partner, change statuses.
- **Partner:** can add their own link records and see only their own collaboration rows. They cannot change statuses or access admin controls.
- For separate communities or email identities, create separate partner accounts/profiles. Keep the actual person's records connected to the right partner account.
- This is an MVP starter. Test with two separate test accounts before using real collaboration data. For more advanced collaboration groups, add a `workspaces`/`collaborations` table and map each partner to a collaboration.

## 1. Create Supabase project
1. Create a project at https://supabase.com.
2. Open **SQL Editor** and run all of `supabase/schema.sql`.
3. Go to **Authentication → Users** and create/invite your admin user and each partner user.
4. Copy each user's UUID from Authentication → Users.
5. In SQL Editor, create profiles. Example:
   ```sql
   insert into public.profiles (id, email, full_name, role)
   values
   ('YOUR_ADMIN_AUTH_UUID', 'you@example.com', 'Muhammad Atif', 'admin'),
   ('PARTNER_AUTH_UUID', 'partner@example.com', 'Partner One', 'partner');
   ```
   Repeat for each account. Do not let a partner choose their own role.
6. In **Authentication → Providers**, ensure Email is enabled. Disable public sign-ups if you want invite-only access.

## 2. Run locally
1. Install Node.js 20+.
2. Extract this zip and run:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local`.
4. In Supabase **Project Settings → API**, copy the Project URL and anon/public key into `.env.local`.
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```
5. Start:
   ```bash
   npm run dev
   ```
6. Open http://localhost:3000 and sign in.

## 3. Push to GitHub and deploy to Vercel
1. Create a new private GitHub repository.
2. Upload/extract these project files into the repository and commit them.
3. In Vercel, **Add New → Project**, import the GitHub repository.
4. Add the same two environment variables in Vercel → Project Settings → Environment Variables.
5. Deploy. Re-deploy whenever you change environment variables.

## Security checklist
- Keep the GitHub repo private if the code contains private business logic.
- Only the Supabase **anon/public** key goes in `NEXT_PUBLIC_*`. Never put the `service_role` key in frontend code or GitHub.
- Database RLS policies are essential; do not remove them.
- Create partner users yourself and assign `role='partner'` from the admin/Supabase side.
- Test with a partner account: it should not see other partners' rows, update statuses, delete rows, or read other profiles.
- Before production, consider adding email invitations, password reset UI, audit logs, CSV export, filters, pagination, and a proper workspace model.

## Current MVP limitation
The admin can attach a link record to a selected partner. A partner's rows are isolated by `partner_user_id`. This starter does not yet include a full invitation manager or a dedicated collaboration/workspace entity. Those are sensible next steps if the same partner has several community/email identities.

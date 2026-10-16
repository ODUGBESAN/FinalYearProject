# Connect the MITC portal to a new Supabase project

## 1. Create the project

Create a fresh project in the Supabase dashboard. In **Project Settings → API**, copy the **Project URL** and the **publishable key**. Put them in a local `.env.local` file beside `package.json`:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

`.env.local` is ignored by Git. Never put a service-role or secret key in a `VITE_` variable or React code.

## 2. Create the tables and policies

In the new project, open **SQL Editor**, paste and run the migration at `supabase/migrations/202610160001_mitc_learning_portal.sql`. It creates the six MITC departments, profiles, lessons, the new-user profile trigger, and row-level security policies.

## 3. Create the first administrator

In **Authentication → Users**, add the administrator’s email and password. Use the same email in the SQL below to grant the administrator role:

```sql
update public.profiles
set role = 'admin'
where email = 'YOUR_ADMIN_EMAIL';
```

The profile is created automatically by the migration’s Auth trigger. Only run this role update for the trusted school administrator.

## 4. Deploy student account creation

The admin dashboard cannot safely create Auth users directly from the browser. Deploy the protected `create-student` Edge Function so it can verify the caller is an admin and create student accounts with the server-only Supabase key.

With the Supabase CLI installed and authenticated, run from the repository:

```text
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase functions deploy create-student
```

The function reads Supabase’s server-side project URL, anon key, and service-role key. Keep the service-role key in Edge Function secrets only; never place it in `.env.local` or the browser.

## 5. Start the React app

Restart Vite after changing `.env.local`:

```text
npm run dev
```

Sign in with the administrator account created in step 3. The administrator can create students, add departments, and publish lessons. Students sign in with the account created for them and see lessons for their assigned department.

## Add 100 and 200 Levels to an existing project

If the first migration has already been run, open `supabase/migrations/202610160002_add_academic_levels.sql` and run its contents in the Supabase SQL Editor. This adds student levels, lesson targeting, and row-level access rules. Then deploy the updated student creation function from the project folder:

```powershell
npx supabase functions deploy create-student
```

New student accounts can then be assigned to 100 or 200 Level. Lessons can target one level or all levels. Existing student profiles have no level until assigned; existing lessons remain available to all students in their department.

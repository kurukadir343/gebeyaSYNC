# GebeyaSync

Mobile-first stock, sales and customer-credit manager for Ethiopian retail shops.
Next.js 15 (App Router) · TypeScript · Tailwind CSS 3 · Supabase (Postgres + Auth).

## Setup

### 1. Create the Supabase project
1. Go to https://supabase.com → **New project**. Save the database password.
2. Open **SQL Editor → New query**, paste the whole of `supabase/schema.sql`, and click **Run**.
   This creates the tables, Row Level Security policies, the sign-up trigger and the `record_sale` function.
3. Open **Project Settings → API** and copy the **Project URL** and the **anon / publishable key**.

### 2. Configure Auth
In **Authentication → URL Configuration**:
- **Site URL**: `http://localhost:3000` (change to your production URL after deploying)
- **Redirect URLs**: add `http://localhost:3000/auth/callback` and `https://YOUR-DOMAIN/auth/callback`

In **Authentication → Providers → Email**:
- Leave **Confirm email** on for production.
- For quick local testing you can switch it off so sign-up logs the user in immediately.

### 3. Run locally
```bash
npm install
cp .env.example .env.local     # then fill in the two Supabase values
npm run dev
```
Open http://localhost:3000, create an account, add a product, record a sale.

### 4. Deploy (Vercel)
1. Push the project to GitHub and import it in Vercel.
2. Add the environment variables from `.env.example` in Vercel project settings.
3. Add your Vercel domain to Supabase **Site URL** and **Redirect URLs** (step 2).

## Environment variables
| Name | Purpose |
|------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon / publishable key (safe in the browser because RLS protects every table) |
| `NEXT_PUBLIC_SITE_URL` | Optional. Fallback origin for the email-confirmation link |

Never put the `service_role` key in this app. It is not needed.

## How tenant isolation works (three layers)
1. **Database (RLS)**: every table has `store_id`; policies allow a row only when
   `store_id = current_store_id()`, which is looked up from `auth.uid()`.
2. **Database (composite foreign keys)**: `(customer_id, store_id)`, `(product_id, store_id)`
   and `(sale_id, store_id)` make it impossible for a row to reference another shop's data.
3. **Application**: every page and action calls `requireStore()` (`src/lib/store.ts`) and
   adds `.eq("store_id", storeId)` to each query.

Sales are written only by the `record_sale()` database function. It runs in one transaction,
reads prices from the products table (not from the browser), refuses to take stock below zero,
and creates the credit entry for credit sales. Sales and sale items cannot be edited or deleted by the client.

### Check isolation yourself
Create two accounts in two browsers. Add products and customers in each, then confirm each
account sees only its own data. You can also run this in the SQL editor to confirm every
table has RLS on:
```sql
select tablename, rowsecurity from pg_tables where schemaname = 'public';
```

## Project structure
```
supabase/schema.sql          tables, RLS, trigger, record_sale()
src/middleware.ts            session refresh and route protection
src/lib/store.ts             requireStore(): user + store id for every request
src/lib/supabase/            server and middleware Supabase clients
src/app/(auth)/              login, signup, server actions
src/app/(app)/page.tsx       dashboard
src/app/(app)/inventory/     product list, add, edit
src/app/(app)/sales/         sale logger + recent sales
src/app/(app)/credit/        customers, balances, mark as paid
src/components/              BottomNav, SaleForm, shared UI
```

## Notes
- Money is shown in ETB. "Today" on the dashboard starts at midnight in Ethiopia (UTC+3).
- Product and customer names can be in Amharic (Noto Sans Ethiopic is loaded as a fallback font).
- Credit is tracked per entry; a customer's balance is the sum of their unpaid entries.

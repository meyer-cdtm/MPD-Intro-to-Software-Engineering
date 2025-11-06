# 🚀 Quick Start - Authentication Setup

## Step 1: Create Supabase Project

1. Visit [https://supabase.com](https://supabase.com) and create a free account
2. Click **"New Project"**
3. Choose your organization and fill in:
   - **Project Name**: `loader-live`
   - **Database Password**: (save this somewhere safe)
   - **Region**: Choose the closest to you
4. Click **"Create new project"** and wait ~2 minutes

## Step 2: Get Your API Keys

1. In your Supabase dashboard, go to **Settings** (⚙️) → **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

## Step 3: Configure Your App

Create a file named `.env.local` in the `my-app/` directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace `your-project-id` and `your-anon-key-here` with the values from Step 2.

## Step 4: (Optional) Disable Email Confirmation

For easier testing during development:

1. In Supabase dashboard: **Authentication** → **Providers**
2. Click on **Email**
3. **Disable** "Confirm email"
4. Save

## Step 5: Run Your App

```bash
cd my-app
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) - you'll be redirected to the login page!

## Test Authentication

1. Click **"Create a new account"**
2. Enter an email and password (min 6 characters)
3. You should be automatically logged in and see the dashboard!
4. Click on your email in the sidebar to see the logout option

---

**Need more details?** See [AUTHENTICATION_SETUP.md](./AUTHENTICATION_SETUP.md) for a comprehensive guide.


# Supabase Setup Guide

Follow these steps to set up Supabase for Excel file uploads and downloads.

## Step 1: Create a New Project (if you don't have one)

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click **"New Project"** (or use an existing project)
3. Fill in:
   - **Name**: e.g., "loader-trajectory" (any name you want)
   - **Database Password**: Create a strong password (save it somewhere safe)
   - **Region**: Choose the closest region to you
4. Click **"Create new project"**
5. Wait 2-3 minutes for the project to be created

## Step 2: Get Your Project Credentials

1. In your Supabase project dashboard, click on **"Settings"** (gear icon in the left sidebar)
2. Click on **"API"** in the settings menu
3. You'll see two important values:
   - **Project URL**: Copy this (looks like `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key**: Copy this (long string starting with `eyJ...`)

## Step 3: Create a Storage Bucket

1. In the left sidebar, click on **"Storage"**
2. Click **"New bucket"** button
3. Fill in:
   - **Name**: `trajectory-data` (must match exactly, or update your `.env.local`)
   - **Public bucket**: ✅ **Check this box** (makes it easier to access files)
4. Click **"Create bucket"**

## Step 4: Set Up Bucket Policies (Important!)

Even if the bucket is public, you need to set up policies to allow uploads:

1. Click on your `trajectory-data` bucket
2. Click on the **"Policies"** tab
3. Click **"New Policy"**
4. Select **"Create a policy from scratch"** or use a template

### Policy 1: Allow Uploads (INSERT)
- **Policy name**: `Allow uploads`
- **Allowed operation**: `INSERT`
- **Policy definition**: Use this SQL:
```sql
(bucket_id = 'trajectory-data'::text) AND (auth.role() = 'authenticated'::text OR auth.role() = 'anon'::text)
```

### Policy 2: Allow Downloads (SELECT)
- **Policy name**: `Allow downloads`
- **Allowed operation**: `SELECT`
- **Policy definition**: Use this SQL:
```sql
(bucket_id = 'trajectory-data'::text) AND (auth.role() = 'authenticated'::text OR auth.role() = 'anon'::text)
```

### Policy 3: Allow Updates (UPDATE) - for overwriting files
- **Policy name**: `Allow updates`
- **Allowed operation**: `UPDATE`
- **Policy definition**: Use this SQL:
```sql
(bucket_id = 'trajectory-data'::text) AND (auth.role() = 'authenticated'::text OR auth.role() = 'anon'::text)
```

**OR** use the simpler approach: Click "New Policy" → "For full customization" → Paste this for all operations:

```sql
-- This allows anyone (including anonymous users) to upload, download, and update files
(bucket_id = 'trajectory-data'::text)
```

## Step 5: Create Your `.env.local` File

1. In your project, go to the `my-app/` folder
2. Create a file named `.env.local` (it starts with a dot!)
3. Add these lines (replace with YOUR values from Step 2):

```env
NEXT_PUBLIC_SUPABASE_URL="https://YOUR-PROJECT-ID.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR-ANON-KEY-HERE"
NEXT_PUBLIC_SUPABASE_BUCKET="trajectory-data"
```

**Example** (don't use these, use your own!):
```env
NEXT_PUBLIC_SUPABASE_URL="https://abcdefghijklmnop.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzMDAwMDAwMCwiZXhwIjoxOTQ1NTc2MDAwfQ.example"
NEXT_PUBLIC_SUPABASE_BUCKET="trajectory-data"
```

## Step 6: Restart Your Development Server

1. Stop your dev server (Ctrl+C in terminal)
2. Start it again: `pnpm dev`
3. The environment variables will be loaded

## Step 7: Upload Your Excel File

**Upload via Supabase Dashboard:**
1. Go to your Supabase project dashboard
2. Click **"Storage"** in the left sidebar
3. Click on the **"trajectory-data"** bucket
4. Click **"Upload file"** button
5. Select your Excel file (`.xlsx` or `.xls`) from your laptop
6. **Important**: Name it `trajectory.xlsx` (the app looks for this exact filename)
7. Click **"Upload"**

## Step 8: Test Download in Your App

1. Open your app in the browser
2. Click the **"Todo 2"** button (orange button with "DEBUG" badge)
3. The file will download from Supabase Storage to your computer

**Note**: The app always looks for a file named `trajectory.xlsx` in the bucket. Make sure your uploaded file has this exact name.

## Troubleshooting

### "Missing Supabase env vars" warning
- Make sure `.env.local` is in the `my-app/` folder (not the root)
- Make sure the file name starts with a dot: `.env.local`
- Restart your dev server after creating/editing `.env.local`

### "new row violates row-level security policy" error
- Go back to Step 4 and make sure your bucket policies are set up correctly
- Make sure the policy allows `anon` role

### "Bucket not found" error
- Make sure the bucket name in `.env.local` matches exactly (case-sensitive)
- Go to Supabase Storage and verify the bucket exists

### File uploads but download doesn't work
- Check that the SELECT policy is set up
- Try making the bucket public (Step 3)

## Quick Reference: Where to Find Things in Supabase

- **Project URL & API Key**: Settings → API
- **Storage Buckets**: Storage (left sidebar)
- **Bucket Policies**: Storage → [Your Bucket] → Policies tab
- **Project Settings**: Settings (gear icon)


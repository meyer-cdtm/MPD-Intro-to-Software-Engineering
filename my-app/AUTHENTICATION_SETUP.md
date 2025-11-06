# Supabase Authentication Setup Guide

This project now uses Supabase Authentication to protect the dashboard. Follow these steps to complete the setup:

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Fill in your project details:
   - Project name: `loader-live` (or any name you prefer)
   - Database password: (create a strong password)
   - Region: Choose the closest region to your users
4. Wait for the project to be created (this takes ~2 minutes)

## 2. Get Your Project Credentials

1. Once your project is ready, go to **Settings** (gear icon in sidebar)
2. Click on **API** in the settings menu
3. You'll see two important values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (a long string starting with `eyJ...`)

## 3. Configure Environment Variables

1. Open the `.env.local` file in your project root
2. Replace the placeholder values with your actual credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

**Important**: Never commit `.env.local` to version control! It's already in `.gitignore`.

## 4. Configure Email Authentication (Optional)

By default, Supabase requires email confirmation. For development, you might want to disable this:

1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Click on **Email** provider
3. Toggle off "Confirm email" (for development only)
4. Save changes

## 5. Test the Authentication

1. Start your development server:
```bash
npm run dev
# or
pnpm dev
```

2. Navigate to `http://localhost:3000`
3. You should be redirected to `/auth/login`
4. Click "Create a new account" to sign up
5. After signing up, you should be able to access the dashboard

## Features Implemented

✅ **User Registration** - Users can create accounts with email/password  
✅ **User Login** - Secure authentication flow  
✅ **Protected Routes** - Dashboard is only accessible to authenticated users  
✅ **Session Management** - Automatic session handling with middleware  
✅ **Logout** - Users can sign out from the sidebar  
✅ **Redirect Logic** - Authenticated users can't access auth pages  

## Authentication Flow

1. **Unauthenticated Access**: User tries to access `/` → Redirected to `/auth/login`
2. **Sign Up**: User creates account → Redirected to dashboard
3. **Sign In**: User logs in → Redirected to dashboard
4. **Protected Pages**: All pages except `/auth/*` require authentication
5. **Sign Out**: User clicks logout → Redirected to login page

## File Structure

```
my-app/
├── lib/
│   └── supabase/
│       ├── client.ts          # Browser client
│       ├── server.ts          # Server client
│       └── middleware.ts      # Session management
├── app/
│   ├── auth/
│   │   ├── actions.ts         # Server actions for auth
│   │   ├── login/
│   │   │   └── page.tsx       # Login page
│   │   └── signup/
│   │       └── page.tsx       # Signup page
│   ├── components/
│   │   └── DashboardClient.tsx # Client component with user state
│   └── page.tsx               # Protected home page
├── middleware.ts              # Route protection
└── .env.local                 # Environment variables (not committed)
```

## Troubleshooting

### "Invalid API key" error
- Double-check that you've copied the correct `anon/public` key from Supabase
- Make sure there are no extra spaces or quotes in your `.env.local`

### Can't sign up
- Check if email confirmation is enabled in Supabase dashboard
- Look at the browser console for specific error messages
- Verify your Supabase project URL is correct

### Session not persisting
- Clear browser cookies and try again
- Make sure middleware.ts is in the root of your project
- Check that cookies are enabled in your browser

### "Project URL not found"
- Restart your development server after adding environment variables
- Verify the URL format: `https://xxxxx.supabase.co`

## Next Steps

Now that authentication is implemented, you can:

1. **Add user profiles**: Store additional user data in Supabase tables
2. **Implement password reset**: Add forgot password functionality
3. **Add OAuth providers**: Enable Google, GitHub, etc. sign-in
4. **Role-based access**: Implement different user roles and permissions
5. **User management**: Create an admin panel to manage users

## Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)


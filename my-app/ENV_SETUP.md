# Environment setup for Supabase

Create a `.env.local` file in `my-app/` with:

```
NEXT_PUBLIC_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR-ANON-KEY"
NEXT_PUBLIC_SUPABASE_BUCKET="trajectory-data"
```

- Create a Storage bucket named `trajectory-data` in your Supabase project (Public or Private).
- If private, signed URL downloads will still work with the anon key via the client SDK.


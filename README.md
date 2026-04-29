# SailCircle Functional MVP

A social sailing platform prototype for discovering sailors, planning trips, requesting to join trips, and discussing sailing topics.

## What works now

- Interactive sailor map
- Trip creation saved to Supabase
- Trip detail view
- Request-to-join form saved to Supabase
- Forum topic creation
- Forum detail view
- Forum comments saved to Supabase
- Working buttons for Explore sailors, Post trip, Create trip, Request to join, Open forum topic, and New topic

## Setup

```bash
npm install
npm run dev
```

## Supabase

Run the original `supabase/schema.sql` first. Then run:

```txt
supabase/upgrade.sql
```

This adds:

- trip detail columns
- `trip_requests`
- `forum_comments`
- insert policies for forum posts and comments

## Vercel

Add environment variables:

```env
VITE_SUPABASE_URL=your Supabase URL
VITE_SUPABASE_ANON_KEY=your Supabase publishable key
```

Then redeploy.

## Note

This is still an MVP. Before making it public for real users, add authentication, moderation, spam protection, and privacy settings for exact location.

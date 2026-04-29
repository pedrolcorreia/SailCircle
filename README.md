# SailCircle — Sailing Social Platform MVP

This is a ready-to-upload MVP for a sailing community website.

It includes:

- React frontend
- Interactive OpenStreetMap map using Leaflet
- Supabase backend schema
- Sailor profiles
- Trip planning and trip creation
- Forum post data model
- Demo mode if Supabase is not connected

---

## 1. Run locally

Install Node.js first.

```bash
npm install
npm run dev
```

Open the local URL shown in your terminal.

---

## 2. Create the backend with Supabase

1. Go to Supabase and create a free project.
2. Open **SQL Editor**.
3. Copy everything from:

```bash
supabase/schema.sql
```

4. Paste it into Supabase SQL Editor.
5. Click **Run**.

This creates:

- `sailors`
- `trips`
- `forum_posts`

It also inserts sample data.

---

## 3. Connect the frontend to Supabase

1. In Supabase, go to:

```text
Project Settings > API
```

2. Copy:

- Project URL
- anon public key

3. Create a `.env` file in the project root:

```bash
cp .env.example .env
```

4. Paste your values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

5. Restart the app:

```bash
npm run dev
```

---

## 4. Deploy for free on Vercel

1. Upload this project to GitHub.
2. Go to Vercel.
3. Import the GitHub repository.
4. Add environment variables in Vercel:

```env
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

5. Click Deploy.

---

## 5. Important security note

This MVP allows public reading of sailors, trips, and forum posts.
It also allows public trip creation.

For a real product, you should add:

- User authentication
- Profile ownership
- Moderation
- Report/block users
- Private exact location settings
- Safer Row Level Security policies

---

## 6. Suggested next features

- Login/signup
- User profile editing
- Create sailor profile
- Trip join requests
- Messaging
- Reviews and verification
- Forum comments
- Map filters
- Privacy: approximate location instead of exact coordinates

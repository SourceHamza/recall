# Recall

Save links, videos and social posts ("bits") into projects. Next.js 15 + Supabase.

## Setup (about 10 minutes)

1. **Create a Supabase project** at supabase.com.
2. **Run the schema:** Supabase → SQL Editor → paste `supabase/schema.sql` → Run.
3. **Easier first login:** Authentication → Providers → Email → turn off "Confirm email" (turn it back on before you share the app).
4. **Add your keys:** copy `.env.example` to `.env.local`, then fill in the Project URL and anon (publishable) key from Project Settings → API.
5. **Install and run:**
   ```bash
   npm install
   npm run dev
   ```
6. Open http://localhost:3000, create an account, then add a project with the + next to "Projects".
7. *(Optional)* Run `supabase/seed.sql` in the SQL Editor to load demo data matching the design.

## How it's organised

| Path | What it does |
| --- | --- |
| `supabase/schema.sql` | Tables, row level security, triggers, semantic-search function |
| `app/(app)/layout.tsx` | Loads projects + profile, renders the sticky sidebar |
| `app/(app)/p/[id]/page.tsx` | One project: search bar, counts, scrolling list of bits |
| `components/Sidebar.tsx` | Pinned / Projects, new project, pin toggle, add bit, profile |
| `components/AddBitDialog.tsx` | Add a bit: link, heading, description, type, project, tags |
| `app/api/metadata/route.ts` | Reads a pasted link's title, description and image |
| `lib/search.ts` | The single place bits are listed and searched |

## Adding semantic search later

The `bits` table already has `content`, `embedding vector(1536)` and `embedded_at`, plus a `match_bits()` SQL function.

1. When a bit is saved, build text from title + description + `content`, embed it, and write the vector to `bits.embedding`.
2. In `lib/search.ts`, when `q` is set: embed `q`, call `supabase.rpc('match_bits', { query_embedding, filter_project })`, then load those ids with the same select.
3. If your embedding model isn't 1536 dimensions, change the number in `schema.sql` before you run it.

Chat with bookmarks can reuse the same embeddings.

## Not built yet

Editing or deleting bits and projects (use the Supabase Table Editor for now), chat, and a mobile layout beyond a basic stacked fallback.

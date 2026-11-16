# Homework Board

## Local development

Run `npm install`, then `npm run dev`.

The Supabase client is initialized in [src/client.js](./src/client.js).
Copy [.env.example](./.env.example) to `.env.local` and fill in your project values.
Only use a publishable browser key, never a service-role key.

## Database

This draft uses only `homeworkPosts` and `comments`. Keep the other project's tables unchanged.
It expects the columns discussed during setup, including `author_id` on both tables.
The application supplies a persistent browser ID because the schema requires it. This version
does not restrict editing by author; authentication and ownership controls are future features.
Your current database access settings must permit reading, inserting, updating and deleting
posts, and reading/inserting comments. No RLS policies are changed by this app.

Ensure `comments.post_id` references `homeworkPosts.id` with ON DELETE CASCADE so
deleting a post removes its comments. A repost reference should use ON DELETE SET NULL.
If you have not yet run the relationship SQL in Supabase, run it once:

```sql
ALTER TABLE public.comments
ADD CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id)
REFERENCES public."homeworkPosts"(id) ON DELETE CASCADE;

ALTER TABLE public."homeworkPosts"
ADD CONSTRAINT homework_posts_reference_fkey FOREIGN KEY (referenced_post_id)
REFERENCES public."homeworkPosts"(id) ON DELETE SET NULL;
```

Importance votes use the existing `upvotes` column. A conditional update retries if another
visitor votes simultaneously. Votes can be repeated without a per-user limit.

## Render deployment

Create a **Static Site** connected to this repository. If this app is a subfolder of your
repository, set the root directory to that subfolder.

- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Required environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

Environment variables are baked in at build time; rebuild after changing them.
Navigation uses hash URLs such as `/#/posts/<id>`, so refreshing a post page does not
need a server routing rewrite.

## Manual acceptance checks

1. Create a title-only post. Verify it opens on its own page and persists after refresh.
2. Reject a blank/space-only title. Create another post with details and a direct image URL.
3. Verify the feed shows only titles, times, and importance counts. Search by title,
   including mixed case, and verify newest/most-important sorting.
4. Open a post and add a comment. Refresh and verify it persists. Reject blank comments.
5. Mark a post important repeatedly; verify the count rises each time and persists.
6. Edit title, content, and image URL. Verify changes after refresh, including clearing
   optional fields. Try a broken image URL and check the fallback message.
7. Cancel deletion, then confirm deletion. Verify the post disappears and its comments
   are removed by the database cascade.
8. Check browser back/forward navigation, direct post URLs, and a narrow mobile viewport.

## Later extensions

[src/data.js](./src/data.js) contains the database operations; UI pages are in
[src/App.jsx](./src/App.jsx). Optional homework and stretch columns are left intact.
Reposts, flags, video, local uploads, customization, and ownership controls can be added
without replacing the required post/comment workflows.
